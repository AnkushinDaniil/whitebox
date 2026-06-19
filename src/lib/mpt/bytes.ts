/**
 * Byte / hex helpers. Kept tiny and dependency-free so the MPT engine stays a
 * portable, auditable core (it later doubles as a state-debugging tool engine).
 */

export type Bytes = Uint8Array;

const HEX_RE = /^(0x)?[0-9a-fA-F]*$/;

/** Parse a hex string (with or without 0x, even length) into bytes. */
export function hexToBytes(hex: string): Bytes {
  let h = hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
  if (!HEX_RE.test(hex)) {
    throw new Error(`invalid hex: ${hex}`);
  }
  if (h.length % 2 !== 0) h = "0" + h; // tolerate odd-length input
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Encode bytes as a 0x-prefixed lowercase hex string. */
export function bytesToHex(bytes: Bytes): string {
  let s = "0x";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

/** UTF-8 encode a string to bytes (handy for the classic do/dog/horse demo). */
export function utf8ToBytes(str: string): Bytes {
  return new TextEncoder().encode(str);
}

export function concatBytes(...arrays: Bytes[]): Bytes {
  let len = 0;
  for (const a of arrays) len += a.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

export function bytesEqual(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
