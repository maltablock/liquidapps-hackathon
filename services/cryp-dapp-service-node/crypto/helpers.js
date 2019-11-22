const { TextDecoder, TextEncoder } = require("util");
const { SerialBuffer, arrayToHex } = require("eosjs/dist/eosjs-serialize");

const createSerialBuffer = (data) => {
  return new SerialBuffer({
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
    array: data ? data : null
  });
};

module.exports = {
  createSerialBuffer,
  arrayToHex,
}