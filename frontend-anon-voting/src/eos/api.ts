import { Api } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { rpc } from './networks';

// this key would always be leaked to allow anonymous submission
// it is linkauthed to the countvote action, so no security issues for contract
const RELAY_KEY = `5JcAtFTBhdWPu5Ejtz5NyTxQVyNRXZUjATQCiStrKTrtMKeaXvB`

// these would come from a wallet, hard-code some keys for hackathon
const VOTER_1_KEY = `5JvwL42tBumC6S73hUdCcgo6mKL9TR9iFoPHodYMw5AykNMumoF`
const VOTER_2_KEY = `5JNs2NymBcn2bjU7biJC9NVsHiVdHB5o6wD51SaxhxGSBBUZZfn`
let keys = [RELAY_KEY, VOTER_1_KEY, VOTER_2_KEY]

const signatureProvider = new JsSignatureProvider(keys)

const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder() as any,
    textEncoder: new TextEncoder(),
})

export {
    api,
}