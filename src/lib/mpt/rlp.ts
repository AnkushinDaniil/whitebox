import { concatBytes, type Bytes } from "./bytes";

/**
 * Recursive Length Prefix (RLP) encoding — Ethereum's canonical serialization,
 * used here to serialize trie nodes before hashing. Spec: Yellow Paper App. B.
 *
 * We only need the encoder (the visualizer never decodes).
 */

function encodeLength(len: number, offset: number): Bytes {
  if (len < 56) {
    return Uint8Array.of(offset + len);
  }
  // length-of-length form
  const hex = len.toString(16);
  const lenBytes = hexLenToBytes(hex);
  return concatBytes(Uint8Array.of(offset + 55 + lenBytes.length), lenBytes);
}

function hexLenToBytes(hex: string): Bytes {
  const padded = hex.length % 2 ? "0" + hex : hex;
  const out = new Uint8Array(padded.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Encode a byte string as a single RLP item. */
export function rlpEncodeBytes(input: Bytes): Bytes {
  if (input.length === 1 && input[0] < 0x80) {
    return input; // single low byte is its own encoding
  }
  return concatBytes(encodeLength(input.length, 0x80), input);
}

/**
 * Encode a list whose items are ALREADY rlp-encoded items. This matches how
 * trie nodes embed child references (already-encoded inline rlp or a hash).
 */
export function rlpEncodeList(items: Bytes[]): Bytes {
  const payload = concatBytes(...items);
  return concatBytes(encodeLength(payload.length, 0xc0), payload);
}

/** Convenience: rlp of a list of byte strings (each gets encoded as bytes). */
export function rlpEncodeByteList(items: Bytes[]): Bytes {
  return rlpEncodeList(items.map(rlpEncodeBytes));
}
