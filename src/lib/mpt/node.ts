import type { Bytes } from "./bytes";
import type { Nibbles } from "./nibbles";

/**
 * Internal, immutable trie node model. The four canonical MPT node shapes:
 *  - empty      : the absence of a node (encodes to RLP "")
 *  - leaf       : terminal [ path, value ]
 *  - extension  : shared-prefix shortcut [ path, child ]
 *  - branch     : 16-way fork, plus an optional value if a key ends here
 *
 * All constructors return frozen objects; mutations always produce new nodes.
 */

export type TrieNode = EmptyNode | LeafNode | ExtensionNode | BranchNode;

export interface EmptyNode {
  readonly kind: "empty";
}
export interface LeafNode {
  readonly kind: "leaf";
  readonly key: Nibbles; // remaining path stored here
  readonly value: Bytes;
}
export interface ExtensionNode {
  readonly kind: "extension";
  readonly key: Nibbles; // shared path segment
  readonly child: TrieNode; // always a branch in a well-formed trie
}
export interface BranchNode {
  readonly kind: "branch";
  readonly children: readonly TrieNode[]; // length 16
  readonly value: Bytes | null; // value if a key terminates at this branch
}

export const EMPTY: EmptyNode = Object.freeze({ kind: "empty" });

export function leaf(key: Nibbles, value: Bytes): LeafNode {
  return Object.freeze({ kind: "leaf", key: [...key], value });
}

export function extension(key: Nibbles, child: TrieNode): ExtensionNode {
  return Object.freeze({ kind: "extension", key: [...key], child });
}

export function branch(
  children: readonly TrieNode[],
  value: Bytes | null,
): BranchNode {
  return Object.freeze({ kind: "branch", children: Object.freeze([...children]), value });
}

export function emptyBranchChildren(): TrieNode[] {
  return new Array<TrieNode>(16).fill(EMPTY);
}

export function isEmpty(node: TrieNode): boolean {
  return node.kind === "empty";
}
