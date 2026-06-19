import { hierarchy, tree, type HierarchyPointNode } from "d3-hierarchy";
import type { MptNodeView } from "@/lib/mpt";

export interface PositionedNode {
  x: number;
  y: number;
  data: MptNodeView;
  /** the nibble that leads from the parent branch to this node, if any */
  edgeNibble: number | null;
}

export interface PositionedLink {
  source: PositionedNode;
  target: PositionedNode;
  edgeNibble: number | null;
}

export interface TrieLayout {
  nodes: PositionedNode[];
  links: PositionedLink[];
  width: number;
  height: number;
}

const NODE_W = 116;
const X_GAP = 26;
const Y_GAP = 104;
const NODE_H = 56;
// Node positions are centers, so the viewBox must reserve each node's half-size
// (+ room for selection/pulse glow) or the outermost nodes get clipped by the
// SVG's default overflow:hidden.
const MARGIN_X = NODE_W / 2 + 22;
const MARGIN_Y = NODE_H / 2 + 22;

/**
 * Lay out the trie top-down with d3.tree. Branch edges are annotated with the
 * nibble index that selects the child, so the SVG can label each link 0–f.
 */
export function computeLayout(view: MptNodeView): TrieLayout {
  const root = hierarchy(view, (d) => d.children.filter(Boolean) as MptNodeView[]);

  const layout = tree<MptNodeView>()
    .nodeSize([NODE_W + X_GAP, Y_GAP])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.25));

  const positioned = layout(root);

  // Determine the edge nibble for each node from its parent branch.
  const edgeNibbleOf = (node: HierarchyPointNode<MptNodeView>): number | null => {
    const parent = node.parent;
    if (!parent) return null;
    if (parent.data.type !== "branch") return null;
    const idx = parent.data.children.findIndex((c) => c?.id === node.data.id);
    return idx >= 0 ? parent.data.childNibbles[idx] : null;
  };

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of positioned.descendants()) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    maxY = Math.max(maxY, n.y);
  }
  const offsetX = MARGIN_X - minX;

  const map = new Map<string, PositionedNode>();
  const nodes: PositionedNode[] = positioned.descendants().map((n) => {
    const pn: PositionedNode = {
      x: n.x + offsetX,
      y: n.y + MARGIN_Y,
      data: n.data,
      edgeNibble: edgeNibbleOf(n),
    };
    map.set(n.data.id, pn);
    return pn;
  });

  const links: PositionedLink[] = positioned.links().map((l) => ({
    source: map.get(l.source.data.id)!,
    target: map.get(l.target.data.id)!,
    edgeNibble: map.get(l.target.data.id)!.edgeNibble,
  }));

  return {
    nodes,
    links,
    width: maxX - minX + MARGIN_X * 2,
    height: maxY + MARGIN_Y * 2,
  };
}

export const NODE_WIDTH = NODE_W;
