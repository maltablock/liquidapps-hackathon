import BlindSignature from 'blind-signatures'
import { BigInteger } from 'jsbn'

export const blindMessage = (
  message,
  N_hex,
  e,
) => {
  const N = new BigInteger(Buffer.from(N_hex, `hex`))
  const { blinded, r } = BlindSignature.blind({
    message,
    N,
    E: e,
  });

  return {
    blindedMessage: blinded,
    blindFactor: r,
  }
};

export const unblindSignature = (blindSignatureHex, N_hex, blindFactor) => {
  const blindSignature = new BigInteger(Buffer.from(blindSignatureHex, `hex`))
  const N = new BigInteger(Buffer.from(N_hex, `hex`))
  const signature = BlindSignature.unblind({
    signed: blindSignature,
    N: N,
    r: blindFactor,
  });

  return signature
};


export const blindSignatureVerify = (N_hex, e, message, signature) => {
  const N = new BigInteger(Buffer.from(N_hex, `hex`))

  const isValid = BlindSignature.verify({
    unblinded: signature,
    N: N,
    E: e,
    message: message,
  });

  return isValid;
};

export const bigIntegerToHexString = (bigI:BigInteger) => {
  console.log(`bigIntegerToHexString`, bigI)
  return Buffer.from(
    new Uint8Array(bigI.toByteArray())
  ).toString(`hex`);
}
