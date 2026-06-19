import type { Bytes } from "./bytes";

/**
 * Nibbles = 4-bit half-bytes. The trie keys on nibbles (16-way / "hexary"),
 * which is why a branch node has exactly 16 child slots.
 */
export type Nibbles = number[];

/** Expand a byte array into its nibbles, high nibble first. */
export function bytesToNibbles(bytes: Bytes): Nibbles {
  const out: Nibbles = new Array(bytes.length * 2);
  for (let i = 0; i < bytes.length; i++) {
    out[i * 2] = bytes[i] >> 4;
    out[i * 2 + 1] = bytes[i] & 0x0f;
  }
  return out;
}

/** Length of the shared prefix between two nibble arrays. */
export function commonPrefixLength(a: Nibbles, b: Nibbles): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

/**
 * Hex-Prefix (compact) encoding: pack a nibble path + a leaf/extension flag
 * into bytes. The high nibble of byte 0 carries flags: bit 1 = terminator
 * (leaf), bit 0 = odd-length. Yellow Paper Eq. (186-188).
 */
export function hexPrefixEncode(nibbles: Nibbles, isLeaf: boolean): Bytes {
  const terminator = isLeaf ? 1 : 0;
  const odd = nibbles.length & 1;
  const flag = 2 * terminator; // 0 (extension) or 2 (leaf), pre-odd

  const out: number[] = [];
  let rest: Nibbles;
  if (odd) {
    out.push(((flag + 1) << 4) | nibbles[0]);
    rest = nibbles.slice(1);
  } else {
    out.push(flag << 4);
    rest = nibbles;
  }
  for (let i = 0; i < rest.length; i += 2) {
    out.push((rest[i] << 4) | rest[i + 1]);
  }
  return Uint8Array.from(out);
}

/** Human-readable nibble path, e.g. [1,10,15] -> "1·a·f". */
export function nibblesToString(nibbles: Nibbles): string {
  return nibbles.map((n) => n.toString(16)).join("");
}
