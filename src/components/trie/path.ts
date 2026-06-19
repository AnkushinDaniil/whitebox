import { bytesToNibbles, hexToBytes, type MptNodeView } from "@/lib/mpt";

/**
 * Walk a trie view following a key's nibbles, collecting the id of every node
 * on the path root -> leaf. This is exactly the set of nodes a single edit
 * rewrites, and the set a Merkle proof must reveal.
 */
export function pathToKey(view: MptNodeView, keyHex: string): string[] {
  const nibbles = bytesToNibbles(hexToBytes(keyHex));
  const ids: string[] = [view.id];
  let node: MptNodeView | null = view;
  let pos = 0;

  while (node && pos <= nibbles.length) {
    if (node.type === "leaf") break;
    if (node.type === "extension") {
      const child: MptNodeView | null = node.children[0] ?? null;
      pos += node.partial?.length ?? 0;
      if (child) ids.push(child.id);
      node = child;
      continue;
    }
    if (node.type === "branch") {
      const nib = nibbles[pos];
      const slot = node.childNibbles.indexOf(nib);
      if (slot < 0) break;
      const child: MptNodeView | null = node.children[slot] ?? null;
      pos += 1;
      if (child) ids.push(child.id);
      node = child;
      continue;
    }
    break;
  }
  return ids;
}

/** Decode a leaf value as text when printable, else hex. */
export function decodeValue(hex: string | null): string {
  if (!hex) return "∅";
  try {
    const bytes = hex.slice(2).match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? [];
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    return /[\x20-\x7e]/.test(text) ? text : hex;
  } catch {
    return hex;
  }
}
