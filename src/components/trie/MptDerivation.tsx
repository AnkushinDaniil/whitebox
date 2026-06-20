import Derivation, { type DerivationStep } from "@/components/explorable/Derivation";

/* ── stage visuals ─────────────────────────────────────────────────── */

function Row({ y, k, v, hot }: { y: number; k: string; v: string; hot?: boolean }) {
  return (
    <g>
      <rect x={14} y={y} width={150} height={26} rx={5} className={hot ? "dv-box dv-hot" : "dv-box"} />
      <text x={24} y={y + 17} className="dv-txt">{k}</text>
      <text x={120} y={y + 17} className="dv-mut">{v}</text>
    </g>
  );
}

function PlainMap() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="A plain map of accounts">
      <Row y={20} k="0xA1…" v="12 Ξ" />
      <Row y={56} k="0xB2…" v="3 Ξ" />
      <Row y={92} k="0xC3…" v="88 Ξ" />
      <rect x={210} y={20} width={232} height={98} rx={8} className="dv-box" strokeDasharray="4 4" />
      <text x={326} y={52} className="dv-label dv-pulse" textAnchor="middle">? one number for all of it</text>
      <text x={326} y={78} className="dv-label dv-pulse" textAnchor="middle">? prove 0xB2 to a phone</text>
      <text x={326} y={104} className="dv-label" textAnchor="middle">— without sending it all</text>
    </svg>
  );
}

function OneHash() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="Hash everything into one number">
      <Row y={20} k="0xA1…" v="12 Ξ" />
      <Row y={56} k="0xB2…" v="3 Ξ" hot />
      <Row y={92} k="0xC3…" v="88 Ξ" />
      {[33, 69, 105].map((y, i) => (
        <path key={i} d={`M168 ${y} C220 ${y}, 240 70, 286 70`} className="dv-edge" />
      ))}
      <rect x={288} y={48} width={150} height={44} rx={8} className="dv-box dv-hash dv-pulse" />
      <text x={363} y={68} className="dv-txt" textAnchor="middle">keccak(all)</text>
      <text x={363} y={83} className="dv-mut" textAnchor="middle">0x9f3…b1 · the root</text>
    </svg>
  );
}

function MerkleTree() {
  // leaves h0..h3 → h01,h23 → root, with a highlighted proof path for h2
  const leaf = (x: number, label: string, hot?: boolean) => (
    <g>
      <rect x={x} y={120} width={56} height={26} rx={5} className={hot ? "dv-box dv-leaf dv-hot" : "dv-box dv-leaf"} />
      <text x={x + 28} y={137} className="dv-mut" textAnchor="middle">{label}</text>
    </g>
  );
  const mid = (x: number, label: string, hot?: boolean) => (
    <g>
      <rect x={x} y={66} width={70} height={26} rx={5} className={hot ? "dv-box dv-hash dv-hot" : "dv-box dv-hash"} />
      <text x={x + 35} y={83} className="dv-mut" textAnchor="middle">{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 460 170" role="img" aria-label="A Merkle tree with a proof path">
      <rect x={195} y={14} width={70} height={26} rx={5} className="dv-box dv-hash dv-hot" />
      <text x={230} y={31} className="dv-txt" textAnchor="middle">root</text>
      <path d="M230 40 L125 66" className="dv-edge" />
      <path d="M230 40 L335 66" className="dv-hot-edge" />
      {mid(90, "h01")}
      {mid(300, "h23", true)}
      <path d="M125 92 L78 120" className="dv-edge" />
      <path d="M125 92 L162 120" className="dv-edge" />
      <path d="M335 92 L298 120" className="dv-edge" />
      <path d="M335 92 L382 120" className="dv-hot-edge" />
      {leaf(50, "h0")}
      {leaf(134, "h1")}
      {leaf(270, "h2", true)}
      {leaf(354, "h3")}
      <text x={150} y={163} className="dv-mut" textAnchor="middle">proof of h2 = the ✦ siblings</text>
      <text x={300} y={108} className="dv-accent" fontSize="11" textAnchor="middle">✦</text>
      <text x={108} y={58} className="dv-accent" fontSize="11" textAnchor="middle">✦</text>
    </svg>
  );
}

function Trie() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="A radix trie indexed by key digits">
      <circle cx={230} cy={22} r={13} className="dv-box dv-branch" />
      <text x={230} y={26} className="dv-mut" textAnchor="middle">·</text>
      {[["a", 150], ["b", 320]].map(([d, x]) => (
        <g key={d as string}>
          <path d={`M230 35 L${x} 60`} className="dv-edge" />
          <text x={(230 + (x as number)) / 2 + 6} y={50} className="dv-accent" fontSize="11">{d}</text>
          <circle cx={x as number} cy={70} r={13} className="dv-box dv-branch" />
        </g>
      ))}
      {/* a long single-child chain under a → 7 → c → 1 */}
      {["7", "c", "1"].map((d, i) => (
        <g key={d}>
          <path d={`M150 ${83 + i * 30} L150 ${97 + i * 30}`} className="dv-edge" />
          <text x={160} y={94 + i * 30} className="dv-accent" fontSize="10">{d}</text>
          <circle cx={150} cy={110 + i * 30} r={11} className={i === 2 ? "dv-box dv-leaf" : "dv-box dv-branch"} />
        </g>
      ))}
      <text x={150} y={172} className="dv-mut" textAnchor="middle">one digit per level → long thin chains</text>
      <circle cx={320} cy={110} r={11} className="dv-box dv-leaf" />
      <path d="M320 83 L320 99" className="dv-edge" />
    </svg>
  );
}

function Mpt() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="The Merkle-Patricia trie">
      <rect x={186} y={12} width={88} height={28} rx={6} className="dv-box dv-branch" />
      <text x={230} y={30} className="dv-mut" textAnchor="middle">BRANCH</text>
      <path d="M210 40 L150 64" className="dv-edge" />
      <path d="M250 40 L330 64" className="dv-edge" />
      <rect x={96} y={64} width={108} height={28} rx={6} className="dv-box dv-ext" />
      <text x={150} y={82} className="dv-mut" textAnchor="middle">EXT "a7"</text>
      <rect x={296} y={64} width={70} height={28} rx={6} className="dv-box dv-leaf" />
      <text x={331} y={82} className="dv-mut" textAnchor="middle">LEAF</text>
      <path d="M150 92 L150 112" className="dv-edge" />
      <rect x={108} y={112} width={84} height={26} rx={6} className="dv-box dv-branch" />
      <text x={150} y={129} className="dv-mut" textAnchor="middle">BRANCH</text>
      <path d="M130 138 L100 158" className="dv-edge" />
      <path d="M170 138 L200 158" className="dv-edge" />
      <rect x={62} y={158} width={70} height={20} rx={5} className="dv-box dv-leaf" />
      <rect x={170} y={158} width={70} height={20} rx={5} className="dv-box dv-leaf" />
      <text x={392} y={150} className="dv-label" textAnchor="middle">shared prefix</text>
      <text x={392} y={164} className="dv-label" textAnchor="middle">→ one EXT node</text>
    </svg>
  );
}

/* ── the derivation ────────────────────────────────────────────────── */

const STEPS: DerivationStep[] = [
  {
    label: "Plain map",
    title: "Start dumb: just a map",
    idea: "Keep accounts in a hash map — address → balance. It stores and looks up fine. Done?",
    flaw: "Not done. There's no single number that fingerprints the whole state, and to prove one account's balance to a light client you'd have to send it the entire state. Both are dealbreakers.",
    fix: "Hash it",
    visual: <PlainMap />,
  },
  {
    label: "One hash",
    title: "Hash everything into one number",
    idea: "Concatenate all of state and keccak256 it. Now there's a single root that commits to everything — change one byte and the root changes.",
    flaw: "But it's all-or-nothing. Editing one balance forces you to re-hash the entire state, and proving one account still means revealing all of it to recompute the hash. Too coarse.",
    fix: "Make a tree",
    visual: <OneHash />,
  },
  {
    label: "Merkle tree",
    title: "Hash in a tree, not a blob",
    idea: "Hash accounts in pairs, then hash the pairs, up to one root (a Merkle tree). Now a proof for one account is just the ~log(n) sibling hashes along its path — and a change only re-hashes that one path.",
    flaw: "Lovely — but where does an account go in the tree? Its position is arbitrary. Given an address, you can't navigate to it; you'd have to scan.",
    fix: "Index by key",
    visual: <MerkleTree />,
  },
  {
    label: "Trie",
    title: "Let the key be the route",
    idea: "Index by the key's digits: at each level, the next digit of the address picks the next child. Now you navigate straight to any account — and you still hash it like a Merkle tree, so proofs and the root survive.",
    flaw: "But Ethereum keys are 64 hex digits. Most paths are long chains of single-child nodes — mostly empty, mostly wasted hashing and depth.",
    fix: "Collapse it",
    visual: <Trie />,
  },
  {
    label: "Patricia MPT",
    title: "Collapse the chains: the Merkle-Patricia Trie",
    idea: "Replace any run of single-child nodes with one extension node that carries the shared prefix, and fork 16 ways at a branch node, ending in leaf nodes that hold the value. Key-addressed, provable, compact — and every node still hashed into the state root.",
    visual: <Mpt />,
  },
];

export default function MptDerivation() {
  return <Derivation steps={STEPS} />;
}
