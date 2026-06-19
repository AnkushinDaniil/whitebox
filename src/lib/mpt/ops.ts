import type { Bytes } from "./bytes";
import { commonPrefixLength, type Nibbles } from "./nibbles";
import {
  EMPTY,
  branch,
  emptyBranchChildren,
  extension,
  isEmpty,
  leaf,
  type BranchNode,
  type TrieNode,
} from "./node";

/**
 * Pure trie operations over the immutable node model. Each returns a brand-new
 * node tree; the original is never mutated (structural sharing where possible).
 */

/** Insert/overwrite `path -> value`, returning the new root node. */
export function insert(node: TrieNode, path: Nibbles, value: Bytes): TrieNode {
  switch (node.kind) {
    case "empty":
      return leaf(path, value);

    case "leaf":
      return insertIntoLeafLike(node.key, leaf(node.key, node.value), node.value, true, node, path, value);

    case "extension": {
      const cpl = commonPrefixLength(path, node.key);
      if (cpl === node.key.length) {
        // entire extension consumed — recurse into its child
        const newChild = insert(node.child, path.slice(cpl), value);
        return extension(node.key, newChild);
      }
      // diverged inside the extension's path
      const b = emptyBranchChildren();
      let branchValue: Bytes | null = null;
      const extRem = node.key.slice(cpl);
      // existing side: rebuild the remainder of the extension
      const existing =
        extRem.length === 1 ? node.child : extension(extRem.slice(1), node.child);
      b[extRem[0]] = existing;
      // new side
      const newRem = path.slice(cpl);
      if (newRem.length === 0) {
        branchValue = value;
      } else {
        b[newRem[0]] = leaf(newRem.slice(1), value);
      }
      const branched = branch(b, branchValue);
      return cpl === 0 ? branched : extension(path.slice(0, cpl), branched);
    }

    case "branch": {
      if (path.length === 0) {
        return branch(node.children, value);
      }
      const i = path[0];
      const newChild = insert(node.children[i] ?? EMPTY, path.slice(1), value);
      const children = [...node.children];
      children[i] = newChild;
      return branch(children, node.value);
    }
  }
}

/** Shared split logic for a leaf (and conceptually any single-path node). */
function insertIntoLeafLike(
  existingKey: Nibbles,
  _existingNode: TrieNode,
  existingValue: Bytes,
  _isLeaf: boolean,
  _node: TrieNode,
  path: Nibbles,
  value: Bytes,
): TrieNode {
  const cpl = commonPrefixLength(path, existingKey);
  if (cpl === existingKey.length && cpl === path.length) {
    return leaf(path, value); // exact overwrite
  }
  const b = emptyBranchChildren();
  let branchValue: Bytes | null = null;

  const existRem = existingKey.slice(cpl);
  if (existRem.length === 0) {
    branchValue = existingValue;
  } else {
    b[existRem[0]] = leaf(existRem.slice(1), existingValue);
  }

  const newRem = path.slice(cpl);
  if (newRem.length === 0) {
    branchValue = value;
  } else {
    b[newRem[0]] = leaf(newRem.slice(1), value);
  }

  const branched = branch(b, branchValue);
  return cpl === 0 ? branched : extension(path.slice(0, cpl), branched);
}

/** Lookup a value by nibble path; null if absent. */
export function find(node: TrieNode, path: Nibbles): Bytes | null {
  switch (node.kind) {
    case "empty":
      return null;
    case "leaf":
      return path.length === node.key.length &&
        commonPrefixLength(path, node.key) === path.length
        ? node.value
        : null;
    case "extension": {
      const cpl = commonPrefixLength(path, node.key);
      if (cpl !== node.key.length) return null;
      return find(node.child, path.slice(cpl));
    }
    case "branch": {
      if (path.length === 0) return node.value;
      return find(node.children[path[0]] ?? EMPTY, path.slice(1));
    }
  }
}

/** Remove `path`, returning a normalized new root (collapses where needed). */
export function remove(node: TrieNode, path: Nibbles): TrieNode {
  switch (node.kind) {
    case "empty":
      return EMPTY;
    case "leaf":
      return path.length === node.key.length &&
        commonPrefixLength(path, node.key) === path.length
        ? EMPTY
        : node;
    case "extension": {
      const cpl = commonPrefixLength(path, node.key);
      if (cpl !== node.key.length) return node; // key not present
      const newChild = remove(node.child, path.slice(cpl));
      if (isEmpty(newChild)) return EMPTY;
      return mergeExtension(node.key, newChild);
    }
    case "branch":
      return removeFromBranch(node, path);
  }
}

function removeFromBranch(node: BranchNode, path: Nibbles): TrieNode {
  let children = [...node.children];
  let value = node.value;
  if (path.length === 0) {
    value = null;
  } else {
    const i = path[0];
    children[i] = remove(children[i] ?? EMPTY, path.slice(1));
  }
  return normalizeBranch(branch(children, value));
}

/**
 * A branch with fewer than two "occupants" is degenerate and must collapse
 * into a leaf or extension to keep the trie canonical (and the root hash
 * matching real clients).
 */
function normalizeBranch(b: BranchNode): TrieNode {
  const occupied: number[] = [];
  for (let i = 0; i < 16; i++) if (!isEmpty(b.children[i])) occupied.push(i);
  const hasValue = b.value !== null;

  if (occupied.length === 0) {
    return hasValue ? leaf([], b.value as Bytes) : EMPTY;
  }
  if (occupied.length === 1 && !hasValue) {
    const idx = occupied[0];
    const child = b.children[idx];
    return mergeExtension([idx], child);
  }
  return b; // still a real branch
}

/** Prepend `prefix` nibbles onto a child, fusing extensions/leaves. */
function mergeExtension(prefix: Nibbles, child: TrieNode): TrieNode {
  switch (child.kind) {
    case "leaf":
      return leaf([...prefix, ...child.key], child.value);
    case "extension":
      return extension([...prefix, ...child.key], child.child);
    case "branch":
      return extension(prefix, child);
    case "empty":
      return EMPTY;
  }
}
