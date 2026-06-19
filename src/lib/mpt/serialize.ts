import { bytesToHex, type Bytes } from "./bytes";
import { keccak256 } from "./hash";
import { hexPrefixEncode } from "./nibbles";
import { rlpEncodeBytes, rlpEncodeList } from "./rlp";
import type { TrieNode } from "./node";

const EMPTY_BYTES = new Uint8Array(0);

/** Full RLP encoding of a node (the thing you'd hash to reference it). */
export function nodeRlp(node: TrieNode): Bytes {
  switch (node.kind) {
    case "empty":
      return rlpEncodeBytes(EMPTY_BYTES); // 0x80
    case "leaf":
      return rlpEncodeList([
        rlpEncodeBytes(hexPrefixEncode(node.key, true)),
        rlpEncodeBytes(node.value),
      ]);
    case "extension":
      return rlpEncodeList([
        rlpEncodeBytes(hexPrefixEncode(node.key, false)),
        childRef(node.child),
      ]);
    case "branch": {
      const items: Bytes[] = [];
      for (let i = 0; i < 16; i++) items.push(childRef(node.children[i]));
      items.push(rlpEncodeBytes(node.value ?? EMPTY_BYTES));
      return rlpEncodeList(items);
    }
  }
}

/**
 * The reference embedded for a child inside its parent's RLP:
 *  - empty           -> RLP("")             (0x80)
 *  - rlp < 32 bytes  -> the rlp inlined verbatim
 *  - rlp >= 32 bytes -> RLP(keccak256(rlp)) (a 32-byte hash string)
 *
 * This inlining rule is exactly what keeps small subtrees off the hash layer
 * and is a frequent source of "my root doesn't match geth" bugs.
 */
export function childRef(node: TrieNode): Bytes {
  if (node.kind === "empty") return rlpEncodeBytes(EMPTY_BYTES);
  const enc = nodeRlp(node);
  if (enc.length < 32) return enc;
  return rlpEncodeBytes(keccak256(enc));
}

/** True if a node would be inlined (not referenced by hash) in its parent. */
export function isInlined(node: TrieNode): boolean {
  if (node.kind === "empty") return true;
  return nodeRlp(node).length < 32;
}

/** keccak256 of a node's RLP, as 0x-hex (the node's "hash", for display). */
export function nodeHashHex(node: TrieNode): string {
  return bytesToHex(keccak256(nodeRlp(node)));
}

/**
 * The state root: keccak256 of the root node's RLP. The root is ALWAYS hashed,
 * even when its RLP is shorter than 32 bytes.
 */
export function rootHashHex(root: TrieNode): string {
  return bytesToHex(keccak256(nodeRlp(root)));
}
