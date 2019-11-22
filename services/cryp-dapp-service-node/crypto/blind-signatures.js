const BlindSignature = require('blind-signatures');
const BigInteger = require('jsbn').BigInteger;
const NodeRSA = require('node-rsa');

const { createSerialBuffer, arrayToHex } = require(`./helpers`);

const blindSignatureGetSignature = (payload) => {
  const bufPayload = new Uint8Array(Buffer.from(payload, `hex`))

  // decode bsign_get_signature_input
  const buf = createSerialBuffer(bufPayload);
  const request_id = buf.getName()
  const secret_key_encrypted_arr = buf.getBytes()
  const blinded_message_arr = buf.getBytes()

  // console.log(`requestId = ${request_id}`)
  // console.log(`secret_key_encrypted_arr = ${secret_key_encrypted_arr.toString(`hex`)}`)
  // console.log(`blinded_message_arr = ${blinded_message_arr.toString(`hex`)}`)
  
  // TODO: decryption with DSP's private key would happen here now
  const secret_key_decrypted = secret_key_encrypted_arr
  
  const secret_key = new NodeRSA();
  secret_key.importKey(Buffer.from(secret_key_decrypted), `pkcs1-private-der`);
  // console.log(`secret_key = `, secret_key)
  
  const blindedMessage = new BigInteger(Buffer.from(blinded_message_arr))
  const blindSignature = BlindSignature.sign({
    blinded: blindedMessage,
    key: secret_key,
  });

  const blindSignatureBytes = Buffer.from(new Uint8Array(blindSignature.toByteArray()))
  const encodeBuffer = createSerialBuffer()
  encodeBuffer.pushBytes(blindSignatureBytes)
  return arrayToHex(encodeBuffer.asUint8Array());
};

const blindSignatureVerify = (payload) => {
  const bufPayload = new Uint8Array(Buffer.from(payload, `hex`))

  // decode bsign_get_signature_input
  const buf = createSerialBuffer(bufPayload);
  const N_arr = buf.getBytes()
  const e = buf.getUint64AsNumber()
  const message = buf.getString()
  const signatureArr = buf.getBytes()

  const N = new BigInteger(Buffer.from(N_arr))
  const signature = new BigInteger(Buffer.from(signatureArr))

  const isValid = BlindSignature.verify({
    unblinded: signature,
    N: N,
    E: e,
    message: message,
  });

  const encodeBuffer = createSerialBuffer()
  encodeBuffer.pushNumberAsUint64(isValid ? 1 : 0)
  return arrayToHex(encodeBuffer.asUint8Array());
};

module.exports = {
  blindSignatureGetSignature,
  blindSignatureVerify,
};
