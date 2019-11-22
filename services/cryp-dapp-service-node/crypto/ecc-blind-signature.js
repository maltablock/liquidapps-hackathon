var crypto = require("crypto");
var BigInteger = require("bigi");
var ecurve = require("ecurve");
var createKeccakHash = require("keccak");
const { createSerialBuffer, arrayToHex } = require(`./helpers`);

const privateKey = Buffer.from(
  "1184cd2cdd640ca42cfc3a091c51d549b2f016d454b2774019c2b2d2e08529fd",
  "hex"
);
const m = "1";
const ecparams = ecurve.getCurveByName("secp256k1");
const curvePt = ecparams.G.multiply(BigInteger.fromBuffer(privateKey));
const x = curvePt.affineX.toBuffer(32);
const y = curvePt.affineY.toBuffer(32);

const G = ecparams.G;
const n = ecparams.n;

function random(bytes) {
  do {
    var k = BigInteger.fromByteArrayUnsigned(crypto.randomBytes(bytes));
  } while (k.toString() == "0" && k.gcd(n).toString() != "1");
  return k;
}

function randomDeterministic(numBytes, nonce, secret = ``) {
  // usually we would hash process.env.DSP_PRIVATE_KEY or something
  // to make this key different for all DSPs
  secret =
    secret ||
    process.env.DSP_CRYPTO_SECRET ||
    `MALTABLOCK_JKAWDHUIWAHDAWHJ_SECRET`;

  // implement a full domain hash
  let IV = 0;
  let bytesBuffer = Buffer.from([]);
  while (bytesBuffer.byteLength < numBytes) {
    const hash = createKeccakHash("keccak256");
    const digest = hash.update(`${secret}|${nonce}|${IV}`).digest();
    bytesBuffer = Buffer.concat([bytesBuffer, digest]);
    console.log(`IV=${IV}`, bytesBuffer);
    IV++;
  }

  return bytesBuffer.slice(0, numBytes);
}

function isOnCurve(x, y) {
  var x = x;
  var y = y;
  var a = ecurve.getCurveByName("secp256k1").a;
  var b = ecurve.getCurveByName("secp256k1").b;
  var p = ecurve.getCurveByName("secp256k1").p;

  // Check that xQ and yQ are integers in the interval [0, p - 1]
  if (x.signum() < 0 || x.compareTo(p) >= 0) return false;
  if (y.signum() < 0 || y.compareTo(p) >= 0) return false;

  // and check that y^2 = x^3 + ax + b (mod p)
  var lhs = y.square().mod(p);
  var rhs = x
    .pow(3)
    .add(a.multiply(x))
    .add(b)
    .mod(p);
  return lhs.equals(rhs);
}

function multiply(inp, k) {
  var str = inp
    .multiply(k)
    .toString()
    .replace("(", "")
    .replace(")", "");
  var arr = str.split(",").map(val => String(val));
  arr[0] = BigInteger.fromBuffer(arr[0]);
  arr[1] = BigInteger.fromBuffer(arr[1]);

  return ecurve.Point.fromAffine(ecparams, arr[0], arr[1]);
}

function add(inp, k) {
  var str = inp
    .add(k)
    .toString()
    .replace("(", "")
    .replace(")", "");
  var arr = str.split(",").map(val => String(val));
  arr[0] = BigInteger.fromBuffer(arr[0]);
  arr[1] = BigInteger.fromBuffer(arr[1]);

  return ecurve.Point.fromAffine(ecparams, arr[0], arr[1]);
}

function toHex(inp) {
  return BigInteger.fromBuffer(inp.toString(), "hex").toHex();
}

function keccak256(inp) {
  return createKeccakHash("keccak256")
    .update(inp.toString())
    .digest("hex");
}

const eccBlindSignatureSignRequest = requestId => {
  /* STEP 1
  The signer randomly selects an integer k ∈ Zn
  , calculates R = kG, and then transmits R to the
  requester
  */
  const k = BigInteger.fromBuffer(randomDeterministic(32, `${requestId}`));
  const R = multiply(G, k);
  console.log(`R = `, R);
  const buf = createSerialBuffer();
  buf.pushBytes(R.getEncoded());

  return arrayToHex(buf.asUint8Array());
};

const eccBlindSignatureCreateSignature = (requestId, blindedMessage) => {
  /* STEP 3
  The signer calculates the blind signature s’ = k − c’d, and then sends it to the requester.
  */
  blindedMessage = BigInteger.fromHex(blindedMessage)
  const k = BigInteger.fromBuffer(randomDeterministic(32, `${requestId}`));
  const blindSignature = k.subtract(
    blindedMessage.multiply(BigInteger.fromBuffer(privateKey))
  );

  return blindSignature.toHex();
};

const eccBlindSignatureVerify = (requestId, message, signature) => {
/* STEP 5
Both the requester and signer can verify the signature (c, s) through the formation
c = SHA256(m || (cP + sG)|x mod n)
*/
const c = BigInteger.fromHex(signature.c)
const s = BigInteger.fromHex(signature.s)
var toHash = add(
    multiply(curvePt,c.mod(n)),
    multiply(ecparams.G,s.mod(n))
  ).x.mod(n)
console.log("c: ")
console.log(BigInteger.fromHex(keccak256(m+toHash)).toString());

console.log("s: ")
console.log(s.mod(n).toString())

console.log("hashvote: ")
console.log(BigInteger.fromHex(keccak256(m)).toString())
  return true
};

eccBlindSignatureSignRequest();

module.exports = {
  eccBlindSignatureSignRequest,
  eccBlindSignatureCreateSignature,
  eccBlindSignatureVerify,
};

// use https://github.com/kevinejohn/blind-signatures instead