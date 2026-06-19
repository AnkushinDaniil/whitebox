import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak256 } from "@/lib/mpt/hash";
import { bytesToHex, concatBytes, utf8ToBytes, type Bytes } from "@/lib/mpt/bytes";

/**
 * The asymmetric-crypto foundation: a secp256k1 keypair, ECDSA signing of a
 * message, and recovery of the signer's address from the signature alone.
 * This is *signing* (authenticity + integrity), not encryption — the message
 * stays public; the signature proves who wrote it.
 */

export interface Signature {
  r: bigint;
  s: bigint;
  yParity: number;
}

/** Uncompressed (65-byte, 0x04-prefixed) public key for a private key. */
export function publicKey(priv: Bytes): Bytes {
  return secp256k1.getPublicKey(priv, false);
}

/** Drop the 0x04 prefix → the raw 64-byte (x‖y) point that gets hashed. */
export function rawPublicKey(priv: Bytes): Bytes {
  return publicKey(priv).slice(1);
}

/** Address = last 20 bytes of keccak256(rawPublicKey). One-way: can't reverse. */
export function addressOf(priv: Bytes): string {
  return "0x" + bytesToHex(keccak256(rawPublicKey(priv))).slice(-40);
}

/**
 * EIP-191 "personal_sign" digest:
 *   keccak256("\x19Ethereum Signed Message:\n" + len(message) + message)
 * The \x19 prefix makes a signed message un-mistakable for a signed transaction.
 */
export function personalHash(message: string): Bytes {
  const msg = utf8ToBytes(message);
  const prefix = utf8ToBytes("\x19Ethereum Signed Message:\n" + msg.length);
  return keccak256(concatBytes(prefix, msg));
}

/** Sign a 32-byte digest with a private key → (r, s, yParity). */
export function signHash(hash: Bytes, priv: Bytes): Signature {
  const sig = secp256k1.sign(hash, priv);
  return { r: sig.r, s: sig.s, yParity: sig.recovery };
}

/** Sign an EIP-191 message; returns the signature and the digest it covers. */
export function signMessage(message: string, priv: Bytes): { sig: Signature; hash: Bytes } {
  const hash = personalHash(message);
  return { sig: signHash(hash, priv), hash };
}

/**
 * Recover the signer's address from (digest, signature). No private key needed —
 * this is what every node does to authenticate a message or transaction.
 */
export function recoverAddress(hash: Bytes, sig: Signature): string {
  const s = new secp256k1.Signature(sig.r, sig.s).addRecoveryBit(sig.yParity);
  return "0x" + bytesToHex(keccak256(s.recoverPublicKey(hash).toRawBytes(false).slice(1))).slice(-40);
}

/** Recover the signer of an EIP-191 message. */
export function recoverMessageSigner(message: string, sig: Signature): string {
  return recoverAddress(personalHash(message), sig);
}

/** A fresh random private key (browser CSPRNG). */
export function randomPrivateKey(): Bytes {
  return secp256k1.utils.randomPrivateKey();
}
