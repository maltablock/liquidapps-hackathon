var crypto = require("crypto");
var BigInteger = require("bigi");
var ecurve = require("ecurve");
var createKeccakHash = require("keccak");

const privateKey = Buffer.from(
  "1184cd2cdd640ca42cfc3a091c51d549b2f016d454b2774019c2b2d2e08529fd",
  "hex"
);
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

function randomDeterministic(numBytes, nonce, secret = `SECRET_FOR_USER`) {
  // usually we would hash process.env.DSP_PRIVATE_KEY or something
  // to make this key different for all DSPs

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

const computeC = (requestId, encodedR, message) => {
  const R = ecurve.Point.decodeFrom(ecparams, Buffer.from(encodedR, `hex`));
  const γ = BigInteger.fromBuffer(randomDeterministic(32, `${requestId}-gamma`));
  const δ = BigInteger.fromBuffer(randomDeterministic(32, `${requestId}-rho`));

  const A = add(add(R, multiply(G, γ)), multiply(curvePt, δ));

  const t = A.x.mod(n).toString();

  const c = BigInteger.fromHex(keccak256(message + t.toString()));
  return c;
};

const eccBlindSignatureCreateBlindedMessage = (
  requestId,
  encodedR,
  message
) => {
  /* STEP 2
  The requester randomly selects two integers γ and δ ∈ Zn, blinds the message, and then
  calculates point A = R + γG + δP = (x, y), t = x (mod n). If t equals zero, then γ and δ should
  be reselected. The requester calculates c = SHA256 (m || t), c’ = c − δ, where SHA256 is a
  novel hash function computed with 32-bit words and c’ is the blinded message, and then sends
  c’ to the signer.
  */
  const c = computeC(requestId, encodedR, message);

  const δ = BigInteger.fromBuffer(randomDeterministic(32, `${requestId}-rho`));
  const cBlinded = c.subtract(δ);

  return cBlinded.toHex();
};

const eccBlindSignatureUnblind = (
  requestId,
  encodedR,
  message,
  blindSignature
) => {
  /* STEP 4
The requester calculates s = s’ + γ, and (c, s) is the signature on m.
*/
  blindSignature = BigInteger.fromHex(blindSignature);
  var γ = BigInteger.fromBuffer(randomDeterministic(32, `${requestId}-gamma`));
  var s = blindSignature.add(γ);

  const c = computeC(requestId, encodedR, message);
  const signature = {
    c: c.toHex(),
    s: s.toHex()
  };

  return signature
};

module.exports = {
  eccBlindSignatureCreateBlindedMessage,
  eccBlindSignatureUnblind,
};
