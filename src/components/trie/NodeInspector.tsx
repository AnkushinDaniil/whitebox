import type { MptNodeView } from "@/lib/mpt";

interface Props {
  node: MptNodeView | null;
}

function findById(view: MptNodeView, id: string): MptNodeView | null {
  if (view.id === id) return view;
  for (const c of view.children) {
    if (!c) continue;
    const found = findById(c, id);
    if (found) return found;
  }
  return null;
}

export function findNode(view: MptNodeView, id: string | null): MptNodeView | null {
  if (!id) return null;
  return findById(view, id);
}

export default function NodeInspector({ node }: Props) {
  if (!node) {
    return (
      <div className="inspector empty">
        <p className="mono-label">Inspector</p>
        <p className="hint">Click any node to see its RLP encoding and hash.</p>
      </div>
    );
  }

  return (
    <div className="inspector">
      <div className="insp-head">
        <span className={`insp-type t-${node.type}`}>{node.type.toUpperCase()}</span>
        {node.inlined && node.type !== "empty" && (
          <span className="insp-flag" title="RLP &lt; 32 bytes, so this node is embedded in its parent instead of referenced by hash">
            inlined (&lt;32B)
          </span>
        )}
      </div>

      <dl className="insp-rows">
        {node.partialLabel !== null && (
          <Row k={node.type === "leaf" ? "key end (nibbles)" : "shared nibbles"} v={node.partialLabel || "∅"} mono />
        )}
        {node.value !== null && <Row k="value" v={node.value} mono wrap />}
        {node.type === "branch" && (
          <Row k="children" v={node.childNibbles.map((n) => n.toString(16)).join(" ")} mono />
        )}
        <Row k="rlp" v={node.rlpHex} mono wrap />
        <Row k="rlp length" v={`${node.rlpLen} bytes`} />
        <Row k={node.id === "root" ? "state root" : "keccak256(rlp)"} v={node.hashHex} mono wrap highlight />
      </dl>
    </div>
  );
}

function Row({
  k,
  v,
  mono,
  wrap,
  highlight,
}: {
  k: string;
  v: string;
  mono?: boolean;
  wrap?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="insp-row">
      <dt>{k}</dt>
      <dd
        className={[mono ? "mono" : "", wrap ? "wrap" : "", highlight ? "hl" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {v}
      </dd>
    </div>
  );
}
