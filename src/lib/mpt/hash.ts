import { keccak_256 } from "@noble/hashes/sha3";
import type { Bytes } from "./bytes";

/** keccak256 — the hash Ethereum's trie is built on (NOT SHA3-256/NIST). */
export function keccak256(data: Bytes): Bytes {
  return keccak_256(data);
}
