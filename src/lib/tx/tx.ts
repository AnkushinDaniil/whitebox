import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak256 } from "@/lib/mpt/hash";
import { rlpEncodeBytes, rlpEncodeList } from "@/lib/mpt/rlp";
import { bytesToHex, hexToBytes, concatBytes, type Bytes } from "@/lib/mpt/bytes";

/**
 * A real (type-2 / EIP-1559) Ethereum transaction signer. Reuses the RLP and
 * keccak256 primitives from the MPT engine. Produces the same signing hash,
 * signature, sender, and transaction hash a live client/wallet would — so the
 * widget's "the sender is *recovered* from the signature" claim is verifiable.
 */

export interface TxFields {
  chainId: bigint;
  nonce: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to: Bytes; // 20 bytes; empty = contract creation
  value: bigint;
  data: Bytes;
}

export interface Signature {
  r: bigint;
  s: bigint;
  yParity: number; // 0 or 1
}

const TYPE_2 = 0x02;

/** Minimal big-endian encoding of a non-negative integer (empty for zero). */
export function intToBytes(n: bigint): Bytes {
  if (n < 0n) throw new Error("intToBytes: negative");
  if (n === 0n) return new Uint8Array(0);
  let hex = n.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  return hexToBytes("0x" + hex);
}

/** The 9-field EIP-1559 body (access list always empty here), as RLP items. */
function bodyItems(tx: TxFields): Bytes[] {
  return [
    rlpEncodeBytes(intToBytes(tx.chainId)),
    rlpEncodeBytes(intToBytes(tx.nonce)),
    rlpEncodeBytes(intToBytes(tx.maxPriorityFeePerGas)),
    rlpEncodeBytes(intToBytes(tx.maxFeePerGas)),
    rlpEncodeBytes(intToBytes(tx.gasLimit)),
    rlpEncodeBytes(tx.to),
    rlpEncodeBytes(intToBytes(tx.value)),
    rlpEncodeBytes(tx.data),
    rlpEncodeList([]), // accessList: []
  ];
}

/** The bytes that get hashed to produce what the key actually signs. */
export function signingPayload(tx: TxFields): Bytes {
  return concatBytes(Uint8Array.of(TYPE_2), rlpEncodeList(bodyItems(tx)));
}

/** keccak256 of the signing payload — the 32-byte digest the key signs. */
export function signingHash(tx: TxFields): Bytes {
  return keccak256(signingPayload(tx));
}

/** Sign the transaction with a private key; returns r, s, yParity. */
export function signTx(tx: TxFields, privateKey: Bytes): Signature {
  const sig = secp256k1.sign(signingHash(tx), privateKey);
  return { r: sig.r, s: sig.s, yParity: sig.recovery };
}

/** The fully-encoded signed transaction (what's broadcast / stored). */
export function serializeSigned(tx: TxFields, sig: Signature): Bytes {
  const items = [
    ...bodyItems(tx),
    rlpEncodeBytes(intToBytes(BigInt(sig.yParity))),
    rlpEncodeBytes(intToBytes(sig.r)),
    rlpEncodeBytes(intToBytes(sig.s)),
  ];
  return concatBytes(Uint8Array.of(TYPE_2), rlpEncodeList(items));
}

/** The transaction hash (what you'd look up on Etherscan). */
export function txHash(tx: TxFields, sig: Signature): string {
  return bytesToHex(keccak256(serializeSigned(tx, sig)));
}

/** Derive the 20-byte address from an uncompressed (65-byte) public key. */
function pubToAddress(pub65: Bytes): string {
  return "0x" + bytesToHex(keccak256(pub65.slice(1))).slice(-40);
}

/** The address controlled by a private key. */
export function privateKeyToAddress(privateKey: Bytes): string {
  return pubToAddress(secp256k1.getPublicKey(privateKey, false));
}

/**
 * Recover the sender address from (signing hash, signature). There is no
 * "from" field in a transaction — the sender is this recovered value.
 */
export function recoverSender(hash: Bytes, sig: Signature): string {
  const s = new secp256k1.Signature(sig.r, sig.s).addRecoveryBit(sig.yParity);
  return pubToAddress(s.recoverPublicKey(hash).toRawBytes(false));
}
