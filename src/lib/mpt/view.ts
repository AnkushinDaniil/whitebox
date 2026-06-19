import { bytesToHex } from "./bytes";
import { nibblesToString, type Nibbles } from "./nibbles";
import { childRef, isInlined, nodeHashHex, nodeRlp } from "./serialize";
import type { TrieNode } from "./node";

export type MptNodeType = "branch" | "extension" | "leaf" | "empty";

/**
 * A serializable, render-ready snapshot of a node. `id` is the consumed-nibble
 * path from the root, which is globally unique within a trie — so diffing two
 * views by id reveals exactly which nodes a single edit rewrote (the basis for
 * the hash-propagation highlight in the widget).
 */
export interface MptNodeView {
  id: string;
  type: MptNodeType;
  /** nibbles consumed from the root to reach this node */
  pathFromRoot: Nibbles;
  /** partial key nibbles stored at this node (leaf / extension) */
  partial: Nibbles | null;
  partialLabel: string | null;
  /** value, 0x-hex (leaf, or a branch that holds a terminating value) */
  value: string | null;
  /** branch -> 16 slots (null = empty); extension -> [child]; leaf -> [] */
  children: (MptNodeView | null)[];
  /** branch only: nibble index for each non-null child (parallel array) */
  childNibbles: number[];
  hashHex: string;
  rlpHex: string;
  rlpLen: number;
  /** true if this node is inlined into its parent rather than hash-referenced */
  inlined: boolean;
}

function idOf(path: Nibbles): string {
  return path.length === 0 ? "root" : path.join(",");
}

export function toView(node: TrieNode, pathFromRoot: Nibbles = []): MptNodeView {
  const base = {
    id: idOf(pathFromRoot),
    pathFromRoot,
    hashHex: nodeHashHex(node),
    rlpHex: bytesToHex(nodeRlp(node)),
    rlpLen: nodeRlp(node).length,
    inlined: isInlined(node),
  };

  switch (node.kind) {
    case "empty":
      return {
        ...base,
        type: "empty",
        partial: null,
        partialLabel: null,
        value: null,
        children: [],
        childNibbles: [],
      };
    case "leaf":
      return {
        ...base,
        type: "leaf",
        partial: node.key,
        partialLabel: nibblesToString(node.key),
        value: bytesToHex(node.value),
        children: [],
        childNibbles: [],
      };
    case "extension":
      return {
        ...base,
        type: "extension",
        partial: node.key,
        partialLabel: nibblesToString(node.key),
        value: null,
        children: [toView(node.child, [...pathFromRoot, ...node.key])],
        childNibbles: [],
      };
    case "branch": {
      const children: (MptNodeView | null)[] = [];
      const childNibbles: number[] = [];
      for (let i = 0; i < 16; i++) {
        const c = node.children[i];
        if (c && c.kind !== "empty") {
          children.push(toView(c, [...pathFromRoot, i]));
          childNibbles.push(i);
        }
      }
      return {
        ...base,
        type: "branch",
        partial: null,
        partialLabel: null,
        value: node.value ? bytesToHex(node.value) : null,
        children,
        childNibbles,
      };
    }
  }
}

// re-export for callers that only import from view
export { childRef };
