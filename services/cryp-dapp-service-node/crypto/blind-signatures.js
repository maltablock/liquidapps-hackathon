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
  // const result = BlindSignature.verify({
  //   unblinded: Alice.unblinded,
  //   N: Alice.N,
  //   E: Alice.E,
  //   message: Alice.message,
  // });
  // if (result) {
  //   console.log('Alice: Signatures verify!');
  // } else {
  //   console.log('Alice: Invalid signature');
  // }
  return false;
};

blindSignatureGetSignature(`104608218490B1CAE0043082025C020100028181008C8C37789C3C508F6B6C7335FBF94DE25EF43DF4730F4D747D812282A9A710D306CAD4D7AC1F3F062A3AC3F328054A07595EF5ADD2E32D3454240B9A68BBF10DDC30B856963493A5C5A09EC449EB3E87BAE4BFF50C8B34CAB2FE9DC589B186A96749740894BED8CC30E0F9C2E23706559CA72B83CCFECC86E38E8868B3B5F81B02030100010281801393E0923B69276BA2F21B6654B0188A44E1CED38347896985A5FC51A9222D74C7C86F378FB1568D1C4ACD4ACCB357E98828731E8076C6B0385C4105843B51CB7FF9A3C071CB7B0844BADA341397CD514EB7EF1E2104F23011F04318335D2B33123E0D236A4AE5F61C16A0465329CB956EC86CFDF8F9C42623583E7327B88C89024100DD8F122A30EDABA59C6FD3601719886E52B0CF76EC2699E4A13CA6ADA89A1B8D9202E000E44285F1D69780528EBA860C9EBD0A9F571AB9552AA4E5760F61F60D024100A2654F2EE773CEA113506677EB08A62B0447DAAC8147193ACF6D873F2E973138E69A3F1382E136A45767F2467973D7D3D1EB7B180F433F6B810A906DB73584C702406EF2601444A01F9E34F2429511BC3577996CF4D706766605F93FD7EF8A487197B9103B7FF6CDE129335E7661E11B42593B7C4ABF73ECEBF5DBFEEAF0EDCF0E5902405D0B28941A1E5AFC24E1C2E3E030E36BF016EF2E391FB04FE6BABD6BB0D90565B1921CA3A4303F2B67BCF1ADF9362B297CB3ABA23C546E48BCF57D8CAF14A5CF024100DCCC3132214DAE398F2AB631065E57FF4E697667FDE4590606713ABF54B206241FFE5C6970E8401FBE905A798BA4921152E3DFFAADE490237C2FC30D638B2038800153533F7EF1C5DE0D0B962DAD22C8AB710A62977182E0A245F7D0F58C29CE5FB99FF3DB0C8B9AC58053EA26B420C14278B6532CE425ACEE5626BD1A3A281DAF87FC7F2E1BB8090B885F46FC91922A41B2A877745596414F2FC3A185A5FA9EB45E709CC8CA527B7F1197751FA9B6BC74C6B8928E835FB37BDFE48FAD7F6E26BB82`)

module.exports = {
  blindSignatureGetSignature,
  blindSignatureVerify,
};
