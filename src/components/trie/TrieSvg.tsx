import { useMemo, type CSSProperties } from "react";
import type { MptNodeView } from "@/lib/mpt";
import { computeLayout, NODE_WIDTH, type PositionedNode } from "./layout";

interface Props {
  view: MptNodeView;
  changedIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const TYPE_COLOR: Record<string, string> = {
  branch: "var(--color-node-branch)",
  extension: "var(--color-node-extension)",
  leaf: "var(--color-node-leaf)",
  empty: "var(--color-node-empty)",
};

const TYPE_LABEL: Record<string, string> = {
  branch: "BRANCH",
  extension: "EXTENSION",
  leaf: "LEAF",
  empty: "EMPTY",
};

const NODE_H = 56;
/** ms between successive levels of the bottom-up propagation wave */
const WAVE_STEP = 110;

function shortHash(hex: string): string {
  return hex.slice(0, 8) + "…" + hex.slice(-4);
}

function linkPath(s: PositionedNode, t: PositionedNode): string {
  const sy = s.y + NODE_H / 2;
  const ty = t.y - NODE_H / 2;
  const my = (sy + ty) / 2;
  return `M${s.x},${sy} C${s.x},${my} ${t.x},${my} ${t.x},${ty}`;
}

export default function TrieSvg({ view, changedIds, selectedId, onSelect }: Props) {
  const layout = useMemo(() => computeLayout(view), [view]);

  // The edit happens at a leaf and re-hashes upward, so deeper changed nodes
  // pulse first. We delay each level so the highlight visibly travels to root.
  const maxChangedDepth = useMemo(() => {
    let m = 0;
    for (const n of layout.nodes) {
      if (changedIds.has(n.data.id)) m = Math.max(m, n.data.pathFromRoot.length);
    }
    return m;
  }, [layout, changedIds]);

  const delayFor = (depth: number) => (maxChangedDepth - depth) * WAVE_STEP;

  return (
    <div className="trie-svg-scroll">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        // Scale to fit the frame (via viewBox) but never upscale past natural
        // size, so a wide tree shrinks to stay fully visible instead of clipping.
        style={{ maxWidth: `${layout.width}px` }}
        role="img"
        aria-label="Merkle-Patricia Trie structure"
        className="trie-svg"
      >
        {/* edges */}
        <g className="links">
          {layout.links.map((l) => {
            const changed = changedIds.has(l.target.data.id);
            const delay = delayFor(l.target.data.pathFromRoot.length);
            return (
              <g key={`${l.source.data.id}->${l.target.data.id}`}>
                <path
                  d={linkPath(l.source, l.target)}
                  className={changed ? "link changed" : "link"}
                  fill="none"
                  style={changed ? ({ "--pd": `${delay}ms` } as CSSProperties) : undefined}
                />
                {changed && (
                  <path
                    d={linkPath(l.source, l.target)}
                    className="link-flow"
                    fill="none"
                    style={{ "--pd": `${delay}ms` } as CSSProperties}
                  />
                )}
                {l.edgeNibble !== null && (
                  <g
                    className="nibble"
                    transform={`translate(${(l.source.x + l.target.x) / 2}, ${
                      (l.source.y + NODE_H / 2 + l.target.y - NODE_H / 2) / 2
                    })`}
                  >
                    <circle r="10" className="nibble-bg" />
                    <text className="nibble-label" dy="0.32em">
                      {l.edgeNibble.toString(16)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* nodes */}
        <g className="nodes">
          {layout.nodes.map((n) => (
            <NodeCard
              key={n.data.id}
              node={n}
              changed={changedIds.has(n.data.id)}
              selected={selectedId === n.data.id}
              delay={delayFor(n.data.pathFromRoot.length)}
              onSelect={onSelect}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function NodeCard({
  node,
  changed,
  selected,
  delay,
  onSelect,
}: {
  node: PositionedNode;
  changed: boolean;
  selected: boolean;
  delay: number;
  onSelect: (id: string) => void;
}) {
  const d = node.data;
  const color = TYPE_COLOR[d.type];
  const x = node.x - NODE_WIDTH / 2;
  const y = node.y - NODE_H / 2;

  return (
    <g
      // CSS transform (not the SVG attribute) so position changes animate.
      style={
        {
          transform: `translate(${x}px, ${y}px)`,
          "--pd": `${delay}ms`,
        } as CSSProperties
      }
      className={[
        "node",
        changed ? "node-changed" : "",
        selected ? "node-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(d.id)}
      tabIndex={0}
      role="button"
      aria-label={`${TYPE_LABEL[d.type]} node`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(d.id);
        }
      }}
    >
      <rect
        width={NODE_WIDTH}
        height={NODE_H}
        rx="9"
        className="node-rect"
        style={{ stroke: color }}
      />
      <rect x={9} y={2} width={NODE_WIDTH - 18} height="3" rx="1.5" style={{ fill: color }} />
      <text x="10" y="20" className="node-type" style={{ fill: color }}>
        {TYPE_LABEL[d.type]}
        {d.inlined && d.type !== "empty" ? " · inline" : ""}
      </text>

      {d.type === "leaf" && (
        <>
          <text x="10" y="35" className="node-sub">
            {truncate(decodeMaybe(d.value), 16)}
          </text>
          <text x="10" y="48" className="node-hash">
            path …{truncate(d.partialLabel || "∅", 9)}
          </text>
        </>
      )}
      {d.type === "extension" && (
        <>
          <text x="10" y="35" className="node-sub">
            shares: {truncate(d.partialLabel || "∅", 9)}
          </text>
          <text x="10" y="48" className="node-hash">
            {shortHash(d.hashHex)}
          </text>
        </>
      )}
      {d.type === "branch" && (
        <>
          <text x="10" y="35" className="node-sub">
            {d.childNibbles.length} children
            {d.value ? " + value" : ""}
          </text>
          <text x="10" y="48" className="node-hash">
            {shortHash(d.hashHex)}
          </text>
        </>
      )}
    </g>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** Try to show a leaf value as text; fall back to hex. */
function decodeMaybe(hex: string | null): string {
  if (!hex) return "∅";
  try {
    const bytes = hex.slice(2).match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? [];
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    return /[\x20-\x7e]/.test(text) ? text : hex;
  } catch {
    return hex;
  }
}

export type { MptNodeView };
