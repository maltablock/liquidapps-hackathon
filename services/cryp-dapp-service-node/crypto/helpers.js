const { TextDecoder, TextEncoder } = require("util");
const { SerialBuffer, arrayToHex } = require("eosjs/dist/eosjs-serialize");

const createSerialBuffer = () => {
  return new SerialBuffer({
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    array: null
  });
};

module.exports = {
  createSerialBuffer,
  arrayToHex,
}