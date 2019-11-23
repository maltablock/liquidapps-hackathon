import "mocha";
require("babel-core/register");
require("babel-polyfill");
const { assert } = require("chai"); // Using Assert style
const {
  getNetwork,
  getCreateKeys,
  getCreateAccount,
  getEos
} = require("../extensions/tools/eos/utils");
var Eos = require("eosjs");
const getDefaultArgs = require("../extensions/helpers/getDefaultArgs");

const artifacts = require("../extensions/tools/eos/artifacts");
const deployer = require("../extensions/tools/eos/deployer");
const {
  genAllocateDAPPTokens,
  readVRAMData
} = require("../extensions/tools/eos/dapp-services");
const { getTestContract } = require("../extensions/tools/eos/utils");
const {
  blindMessage,
  unblindSignature,
  blindSignatureVerify
} = require("./utils-crypto");
const {
  addRelayPermission,
  createDeterministicAccount,
} = require("./utils");
const BlindSignature = require("blind-signatures");
const BigInteger = require("jsbn").BigInteger;

var contractCode = "crypconsumer";
var serviceName = "cryp";
var ctrt = artifacts.require(`./${contractCode}/`);
const delay = ms => new Promise(res => setTimeout(res, ms));
const util = require("util");

const account = "anonvoting";
describe(`${contractCode} Contract`, () => {
  var testcontract;

  // const getTestAccountName = num => {
  //   var fivenum = num.toString(5).split("");
  //   for (var i = 0; i < fivenum.length; i++) {
  //     fivenum[i] = String.fromCharCode(fivenum[i].charCodeAt(0) + 1);
  //   }
  //   fivenum = fivenum.join("");
  //   var s = "111111111111" + fivenum;
  //   var prefix = "test";
  //   s = prefix + s.substr(s.length - (12 - prefix.length));
  //   return s;
  // };

  before(done => {
    (async () => {
      try {
        var deployedContract = await deployer.deploy(ctrt, account);
        await genAllocateDAPPTokens(
          deployedContract,
          serviceName,
          "pprovider1",
          "default"
        );
        // await genAllocateDAPPTokens(deployedContract, serviceName, "pprovider2", "foobar");
        testcontract = await getTestContract(account);
        await addRelayPermission(account, `relay`, `countvote`)

        done();
      } catch (e) {
        done(e);
      }
    })();
  });

  it("votes anonymously", done => {
    (async () => {
      try {
        const voter1 = `voter1`
        const voter2 = `voter2`
        const voter1AccountKeys = await createDeterministicAccount(voter1);
        const voter2AccountKeys = await createDeterministicAccount(voter2);
        console.log(`voter1 (${voter1}) with active key ${voter1AccountKeys.active.privateKey} created`)
        console.log(`voter2 (${voter2}) with active key ${voter2AccountKeys.active.privateKey} created`)

        /**
         *  STEP 0: Create RSA keys and set them on contract and distribute secret key to DSP
         */
        console.log(`Step 0 - Set RSA`);
        // contract creator creates keys and sets RSA params
        // encrypts secret key to DSP's public key
        const key = BlindSignature.keyGeneration({ b: 1024 });
        // binary encoded
        const keyEncoded = key.exportKey(`pkcs1-private-der`);
        // TODO: would now encrypt the key to the DSP's private key
        // so only the trusted DSP (and contract owner) can create signatures
        const keyEncryptedToDsp = keyEncoded;
        const keyEncryptedToDspHex = Buffer.from(
          new Uint8Array(keyEncryptedToDsp)
        ).toString(`hex`);
        const N = key.keyPair.n;
        const e = key.keyPair.e;
        const N_hex = Buffer.from(new Uint8Array(N.toByteArray())).toString(
          `hex`
        );

        let tx = await testcontract.setrsaparams(
          {
            N: N_hex,
            e: e,
            secret_key_encrypted_to_dsp: keyEncryptedToDspHex
          },
          {
            authorization: `${account}@active`,
            broadcast: true,
            sign: true
          }
        );

        let table = await testcontract.api.getTableRows({
          json: true,
          scope: account,
          code: account,
          table: "rsaparams",
          limit: 1
        });

        const rsaEntry = table.rows[0];
        assert.ok(Boolean(rsaEntry), "no RSA params rsaEntry");
        assert.equal(
          N.toString(),
          new BigInteger(Buffer.from(rsaEntry.N, `hex`)).toString(),
          "wrong N"
        );
        assert.equal(e, rsaEntry.e, "wrong e");

        /**
         *  STEP 0.5: Create poll
         */
        console.log(`Step 0.5 - Create poll`);
        await testcontract.createpoll(
          {
            poll_name: `hackathon`,
            options: [`LiquidCrypto by MaltaBlock`, `Monte Carlo by VigorDAC`, `Rekt Land by Gnoll`],
            eligible_voters: [voter1]
          },
          {
            authorization: `${account}@active`,
            broadcast: true,
            sign: true
          }
        );
        table = await testcontract.api.getTableRows({
          json: true,
          scope: `hackathon`,
          code: account,
          table: "votes",
          limit: 100
        });
        assert.ok(table.rows.length > 0, "voting options not created")

        /**
         *  STEP 1: user blinds his message and gets blinded signature
         */
        console.log(`Step 1 - Get Blind Signature`);
        const message = `hackathon-0-${Math.random().toString(36).slice(2)}`;
        const { blindedMessage, blindFactor } = blindMessage(
          message,
          rsaEntry.N,
          rsaEntry.e
        );
        const blindedMessageHex = Buffer.from(
          new Uint8Array(blindedMessage.toByteArray())
        ).toString(`hex`);
        await testcontract.requestvote(
          {
            user: voter1,
            for_poll_name: `hackathon`,
            blinded_message: blindedMessageHex
          },
          {
            authorization: `${voter1}@active`,
            broadcast: true,
            sign: true,
            keyProvider: [voter1AccountKeys.active.privateKey]
          }
        );

        table = await testcontract.api.getTableRows({
          json: true,
          scope: account,
          code: account,
          table: "bsign",
          limit: 100
        });
        let bSignEntry = table.rows.find(row => row.request_id === voter1);
        assert.ok(Boolean(bSignEntry), "no bSignEntry found");

        const blindSignatureHex = bSignEntry.blind_signature;
        const signature = unblindSignature(
          blindSignatureHex,
          rsaEntry.N,
          blindFactor
        );
        assert.ok(
          blindSignatureVerify(
            rsaEntry.N,
            Number.parseInt(rsaEntry.e),
            message,
            signature
          ),
          "signature is not valid"
        );

        /**
         *  STEP 2: user submits his original vote message and unblinded signature to count the vote
         * user uses a relay account to hide his anonymity
         * or special permission on vote_contract linkauth'd to countvote + leaked key can be used
         */
        console.log(`Step 2 - Submit vote anonymously`);
        const signatureHex = Buffer.from(
          new Uint8Array(signature.toByteArray())
        ).toString(`hex`);
        await testcontract.countvote(
          {
            vote_message: message,
            signature: signatureHex,
          },
          {
            authorization: `${account}@active`,
            broadcast: true,
            sign: true
          }
        );

        table = await testcontract.api.getTableRows({
          json: true,
          scope: `hackathon`,
          code: account,
          table: "votes",
          limit: 100
        });
        console.log(`votes`, table.rows);
        let voteEntry = table.rows[0];
        assert.ok(Boolean(voteEntry), "no voteEntry found");
        assert.equal(voteEntry.num_votes, 1, "vote not counted");
        done();
      } catch (e) {
        done(e);
      }
    })();
  });
});
