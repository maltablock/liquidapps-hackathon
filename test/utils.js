import { TextDecoder, TextEncoder } from "text-encoding";
const { BigNumber } = require("bignumber.js");
const getDefaultArgs = require("../extensions/helpers/getDefaultArgs");
const fetch = require("node-fetch");
const ecc = require("eosjs-ecc");
let { PrivateKey, PublicKey } = require("eosjs-ecc");
const eosjs2 = require("eosjs");
const { JsonRpc, Api, Serialize } = eosjs2;
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig");
const {
  getUrl,
  getLocalDSPEos,
  getCreateKeys,
  getCreateAccount,
} = require("../extensions/tools/eos/utils");
const { encodeName } = require("../services/dapp-services-node/common");

async function createDeterministicKey(seed) {
  var key = await PrivateKey.fromSeed(seed);
  return {
    privateKey: key.toWif(),
    publicKey: key.toPublic().toString()
  };
}
async function createDeterministicAccount(account) {
  const accountKeys = await getCreateAccount(account);

  // now change the keys
  const newKey = await createDeterministicKey(account);
  const dspeos = await getLocalDSPEos(account);
  const eosioContract = await dspeos.contract(`eosio`);

  const parent = `owner`;
  await eosioContract.updateauth(
    {
      account: account,
      permission: `active`,
      parent,
      auth: {
        threshold: 1,
        keys: [{ key: newKey.publicKey, weight: 1 }],
        accounts: [],
        waits: []
      }
    },
    {
      authorization: `${account}@${parent}`,
      keyProvider: [accountKeys[parent].privateKey],
      broadcast: true,
      sign: true,
    }
  );

  accountKeys.active = newKey
  return accountKeys
}

const addRelayPermission = async (code, permissionName, actionName) => {
  const dspeos = await getLocalDSPEos(code);
  const eosioContract = await dspeos.contract(`eosio`);
  var keys = await getCreateKeys(code);
  const newKey = await createDeterministicKey(`relay`);

  const parent = `active`;
  await eosioContract.updateauth(
    {
      account: code,
      permission: permissionName,
      parent,
      auth: {
        threshold: 1,
        keys: [{ key: newKey.publicKey, weight: 1 }],
        accounts: [],
        waits: []
      }
    },
    {
      authorization: `${code}@${parent}`,
      keyProvider: [keys[parent].privateKey],
      broadcast: true,
      sign: true
    }
  );
  await eosioContract.linkauth(
    {
      account: code,
      code: code,
      type: actionName,
      requirement: permissionName
    },
    {
      authorization: `${code}@${parent}`,
      keyProvider: [keys[parent].privateKey],
      broadcast: true,
      sign: true
    }
  );

  console.log(`${code}@${permissionName} created with key ${newKey.privateKey}`)
};

module.exports = {
  addRelayPermission,
  createDeterministicKey,
  createDeterministicAccount,
};
