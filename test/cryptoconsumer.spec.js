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
const BlindSignature = require('blind-signatures');
const BigInteger = require('jsbn').BigInteger;

var contractCode = "crypconsumer";
var serviceName = "cryp";
var ctrt = artifacts.require(`./${contractCode}/`);
const delay = ms => new Promise(res => setTimeout(res, ms));
const util = require("util");

const account = "crypconsumer";
describe(`${contractCode} Contract`, () => {
  var testcontract;

  const getTestAccountName = num => {
    var fivenum = num.toString(5).split("");
    for (var i = 0; i < fivenum.length; i++) {
      fivenum[i] = String.fromCharCode(fivenum[i].charCodeAt(0) + 1);
    }
    fivenum = fivenum.join("");
    var s = "111111111111" + fivenum;
    var prefix = "test";
    s = prefix + s.substr(s.length - (12 - prefix.length));
    console.log(s);
    return s;
  };
  before(done => {
    (async () => {
      try {
        console.log(`TEST: running before`);
        var deployedContract = await deployer.deploy(ctrt, account);
        await genAllocateDAPPTokens(
          deployedContract,
          serviceName,
          "pprovider1",
          "default"
        );
        // await genAllocateDAPPTokens(deployedContract, serviceName, "pprovider2", "foobar");
        testcontract = await getTestContract(account);

        console.log(`TEST: before done`);
        done();
      } catch (e) {
        done(e);
      }
    })();
  });

  it("votes anonymously", done => {
    (async () => {
      try {
        var owner = getTestAccountName(10);
        var testAccountKeys = await getCreateAccount(owner);

        // contract creator creates keys and sets RSA params
        // encrypts secret key to DSP's public key
        const key = BlindSignature.keyGeneration({ b: 1024 })
        // binary encoded
        const keyEncoded = key.exportKey(`pkcs1-private-der`)
        // TODO: would now encrypt the key to the DSP's private key
        // so only the trusted DSP (and contract owner) can create signatures
        const keyEncryptedToDsp = keyEncoded
        const keyEncryptedToDspHex = Buffer.from(new Uint8Array(keyEncryptedToDsp)).toString(`hex`)
        const N = key.keyPair.n
        const e = key.keyPair.e
        const N_hex = Buffer.from(new Uint8Array(N.toByteArray())).toString(`hex`)

        let tx = await testcontract.setrsaparams(
          {
            N: N_hex,
            e: e,
            secret_key_encrypted_to_dsp: keyEncryptedToDspHex,
          },
          {
            authorization: `${owner}@active`,
            broadcast: true,
            sign: true,
            keyProvider: [testAccountKeys.active.privateKey]
          }
        );

        let table = await testcontract.api.getTableRows({
            json: true,
            scope: account,
            code: account,
            table: "rsaparams",
            limit: 1,
          });

        let entry = table.rows[0];
        console.log(entry);
        assert.ok(Boolean(entry), "no RSA params entry");
        assert.equal(
          N.toString(),
          new BigInteger(Buffer.from(entry.N, `hex`)).toString(),
          "wrong N"
        );
        assert.equal(
          e,
          entry.e,
          "wrong e"
        );


        // await testcontract.testfn(
        //   {
        //     user: owner
        //   },
        //   {
        //     authorization: `${owner}@active`,
        //     broadcast: true,
        //     sign: true,
        //     keyProvider: [testAccountKeys.active.privateKey]
        //   }
        // );

        // let table = await testcontract.api.getTableRows({
        //   json: true,
        //   scope: account,
        //   code: account,
        //   table: "eccbsign",
        //   limit: 100
        // });
        // let entry = table.rows[0];
        // console.log(entry);
        // assert.ok(Boolean(entry), "no entry");
        // assert.equal(
        //   entry.R,
        //   `024da2d9f62160dc0cac970507520618475b2fae27f9fd90ad3b5a49c42cbb728b`,
        //   "wrong entry"
        // );

        // const messageVote = `1`;
        // const blindedMessage = eccBlindSignatureCreateBlindedMessage(`hello`, entry.R, messageVote);
        // console.log(`blindedM`, blindedMessage)
        // const blindSignature = eccBlindSignatureCreateSignature(`hello`, blindedMessage)
        // console.log(`blindSignature`, blindSignature)
        // const signature = eccBlindSignatureUnblind(`hello`, entry.R, messageVote, blindSignature);
        // console.log(`signature`, signature)
        // eccBlindSignatureVerify(`hello`, messageVote, signature)
        done();
      } catch (e) {
        done(e);
      }
    })();
  });
});
