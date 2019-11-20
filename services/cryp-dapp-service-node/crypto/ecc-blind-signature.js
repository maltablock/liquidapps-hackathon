const { createBuffer, arrayToHex } = require(`./helpers`)

const eccBlindSignatureSignRequest = () => {
  const buf = createBuffer()

  // TODO: do the real thing
  buf.pushBytes([0,1,2,3,4,5,6,7,8])
  
  return arrayToHex(buf.asUint8Array());
}

module.exports = {
  eccBlindSignatureSignRequest,
}