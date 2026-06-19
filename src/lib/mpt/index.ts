/**
 * A real, auditable Merkle-Patricia Trie engine. Decoupled from any UI so it
 * can later back a standalone state-debugging tool — the visualizer is just
 * one consumer of this API.
 */
export { Trie } from "./trie";
export type { TrieEntry } from "./trie";
export type { MptNodeView, MptNodeType } from "./view";
export {
  hexToBytes,
  bytesToHex,
  utf8ToBytes,
  type Bytes,
} from "./bytes";
export { keccak256 } from "./hash";
export { bytesToNibbles, nibblesToString } from "./nibbles";
