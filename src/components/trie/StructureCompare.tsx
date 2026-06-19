import { useState } from "react";
import "./compare.css";

/**
 * An illustrative contrast of the three state-tree designs. The shapes and
 * witness bars are schematic (order-of-magnitude), NOT a live cryptographic
 * model — the prose is explicit about that. The point is structural intuition:
 * why the tree shape changes when you change the commitment scheme.
 */

type Mode = "mpt" | "verkle" | "binary";

interface ModeInfo {
  label: string;
  status: string;
  arity: string;
  /** relative witness size, 0..1 for the bar */
  witness: number;
  witnessLabel: string;
  blurb: string;
  why: string;
}

const MODES: Record<Mode, ModeInfo> = {
  mpt: {
    label: "Hexary MPT",
    status: "Today",
    arity: "16-way",
    witness: 1,
    witnessLabel: "large",
    blurb:
      "A branch node has 16 slots. To prove one account you must reveal up to 15 sibling hashes at every level — and the secure-trie keys make the tree deep-ish and wide.",
    why: "Merkle proof cost ≈ (arity − 1) × depth hashes. With arity 16, siblings dominate the witness.",
  },
  verkle: {
    label: "Verkle tree",
    status: "Was the plan (2021–2024)",
    arity: "256-way",
    witness: 0.12,
    witnessLabel: "tiny",
    blurb:
      "Replace Merkle hashing with vector commitments (KZG/IPA). A node commits to all 256 children in one short proof, so you reveal essentially no siblings — the witness collapses even though the tree is far wider.",
    why: "Polynomial/vector commitments give a constant-size opening per level. Width stops hurting you.",
  },
  binary: {
    label: "Binary tree",
    status: "Current roadmap (EIP-7864)",
    arity: "2-way",
    witness: 0.45,
    witnessLabel: "small",
    blurb:
      "The roadmap pivoted away from Verkle toward a binary Merkle tree: only 1 sibling per level, plain hashing, no exotic cryptography or trusted setup — and it's friendlier to the SNARK provers that will eventually verify state.",
    why: "Arity 2 means 1 sibling/level. Deeper than hexary, but far fewer siblings — and STARK-provable with a simple hash.",
  },
};

const ORDER: Mode[] = ["mpt", "verkle", "binary"];

export default function StructureCompare() {
  const [mode, setMode] = useState<Mode>("mpt");
  const info = MODES[mode];

  return (
    <div className="cmp">
      <div className="cmp-tabs" role="tablist" aria-label="State tree design">
        {ORDER.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            className={mode === m ? "cmp-tab active" : "cmp-tab"}
            onClick={() => setMode(m)}
          >
            <span>{MODES[m].label}</span>
            <em>{MODES[m].status}</em>
          </button>
        ))}
      </div>

      <div className="cmp-body">
        <div className="cmp-diagram">
          <TreeSchematic mode={mode} />
        </div>

        <div className="cmp-detail">
          <div className="cmp-stats">
            <div className="stat">
              <span className="k">Node arity</span>
              <span className="v">{info.arity}</span>
            </div>
            <div className="stat">
              <span className="k">Witness size</span>
              <span className="v">{info.witnessLabel}</span>
            </div>
          </div>

          <div className="witness-bar" aria-hidden="true">
            <div className="track">
              <div
                className={`fill m-${mode}`}
                style={{ width: `${Math.max(6, info.witness * 100)}%` }}
              />
            </div>
            <span className="wb-caption">relative proof size (schematic)</span>
          </div>

          <p className="cmp-blurb">{info.blurb}</p>
          <p className="cmp-why">
            <span className="why-tag">why</span>
            {info.why}
          </p>
        </div>
      </div>

      <p className="cmp-foot">
        Diagrams and bars are illustrative, order-of-magnitude — not a live
        cryptographic benchmark. The takeaway is structural: the commitment
        scheme dictates the tree shape, and the tree shape dictates how big a
        stateless witness has to be.
      </p>
    </div>
  );
}

function TreeSchematic({ mode }: { mode: Mode }) {
  // Hand-placed schematic nodes per mode — highlighted path = the witness.
  if (mode === "mpt") {
    return (
      <svg viewBox="0 0 260 150" className="schematic" role="img" aria-label="Hexary tree schematic">
        <Level y={20} count={1} cx={130} />
        <Fan x0={40} x1={220} y={60} count={6} pathIndex={2} from={130} fromY={28} />
        <Fan x0={20} x1={120} y={110} count={5} pathIndex={3} from={88} fromY={68} />
        <text x="130" y="145" className="sc-cap">
          16 slots/level · many siblings to reveal
        </text>
      </svg>
    );
  }
  if (mode === "verkle") {
    return (
      <svg viewBox="0 0 260 150" className="schematic" role="img" aria-label="Verkle tree schematic">
        <Level y={20} count={1} cx={130} />
        <Fan x0={20} x1={240} y={70} count={9} pathIndex={4} from={130} fromY={28} wide />
        <circle cx={130} cy={70} r="7" className="sc-node path" />
        <text x="130" y="120" className="sc-cap">
          256 slots/level · one short vector-commitment proof
        </text>
        <text x="130" y="138" className="sc-cap dim">
          siblings stay hidden
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 260 150" className="schematic" role="img" aria-label="Binary tree schematic">
      <Level y={16} count={1} cx={130} />
      <Fan x0={70} x1={190} y={52} count={2} pathIndex={0} from={130} fromY={24} />
      <Fan x0={40} x1={100} y={90} count={2} pathIndex={1} from={70} fromY={60} />
      <Fan x0={20} x1={60} y={126} count={2} pathIndex={0} from={40} fromY={98} />
      <text x="130" y="146" className="sc-cap">
        2 slots/level · exactly 1 sibling per level
      </text>
    </svg>
  );
}

function Level({ y, count, cx }: { y: number; count: number; cx: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={cx} cy={y} r="8" className="sc-node root" />
      ))}
    </g>
  );
}

function Fan({
  x0,
  x1,
  y,
  count,
  pathIndex,
  from,
  fromY,
  wide,
}: {
  x0: number;
  x1: number;
  y: number;
  count: number;
  pathIndex: number;
  from: number;
  fromY: number;
  wide?: boolean;
}) {
  const xs = Array.from({ length: count }, (_, i) =>
    count === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (count - 1),
  );
  return (
    <g>
      {xs.map((x, i) => (
        <line
          key={`l${i}`}
          x1={from}
          y1={fromY}
          x2={x}
          y2={y - 7}
          className={i === pathIndex ? "sc-edge path" : "sc-edge"}
        />
      ))}
      {xs.map((x, i) => (
        <circle
          key={`c${i}`}
          cx={x}
          cy={y}
          r={wide ? 4 : 7}
          className={
            i === pathIndex ? "sc-node path" : wide ? "sc-node faint" : "sc-node sibling"
          }
        />
      ))}
    </g>
  );
}
