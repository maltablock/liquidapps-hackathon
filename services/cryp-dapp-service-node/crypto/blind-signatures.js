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

console.log(
  blindSignatureVerify(`810100DFE2346EBE07462FC28AE58368221AA15547E3C818C350E9E8615B20A52CF7D534B99B194622F391DB63951D98090E5B4131EF6DBF7A3FD5091CCE2D60E621B79585080C42CEC022DAE79033C97287A77DE01408A08B33488D6D8E06B072E39DB1DD189E4AD67C38B7F1B4FC810BE8B7A0358B87D52C99E965CBC1BAB182C8E101000100000000000131810100D19EF82B647EF2495920F39C31F5F0716B0DC1940D60E940DC496686B15F4E791EA932DABB7A6C9F15864CF4D1365877ABB61A73F3833069A2E8C6D8B2D03C651B025F95A29D3D48273F54CA13DAC8DF395BDDAFF7935E96E473F17C74D45DEB0775C39B48EC02B597990A3DAA3D1D02B37EA9FDE5BA3279C55EE4B84AEFEEE7`)
)

module.exports = {
  blindSignatureGetSignature,
  blindSignatureVerify,
};
