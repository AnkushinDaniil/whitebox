import Derivation, { type DerivationStep } from "@/components/explorable/Derivation";

/* ── stage visuals (schematic) ─────────────────────────────────────── */

function Ledger() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="A shared ledger">
      <rect x={120} y={16} width={220} height={148} rx={8} className="dv-box" />
      <text x={230} y={36} className="dv-mut" textAnchor="middle">SHARED LEDGER</text>
      <line x1={134} y1={44} x2={326} y2={44} className="dv-edge" />
      <text x={140} y={66} className="dv-txt">Alice → Bob: 5 Ξ</text>
      <text x={140} y={90} className="dv-txt">Bob → Carol: 2 Ξ</text>
      <g className="dv-pulse">
        <rect x={132} y={104} width={196} height={22} rx={4} className="dv-box dv-hot" />
        <text x={140} y={120} className="dv-txt" fill="var(--color-changed)">Eve → Eve: 100 Ξ</text>
      </g>
      <text x={230} y={150} className="dv-mut" textAnchor="middle" fill="var(--color-changed)">✗ who said Eve could write that?</text>
    </svg>
  );
}

function Signed() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="Every line is signed">
      <rect x={120} y={16} width={220} height={148} rx={8} className="dv-box" />
      <text x={230} y={36} className="dv-mut" textAnchor="middle">SIGNED LEDGER</text>
      <line x1={134} y1={44} x2={326} y2={44} className="dv-edge" />
      {["Alice → Bob: 5 Ξ", "Bob → Carol: 2 Ξ"].map((t, i) => (
        <g key={i}>
          <text x={140} y={68 + i * 26} className="dv-txt">{t}</text>
          <circle cx={314} cy={63 + i * 26} r={8} className="dv-box dv-leaf" />
          <text x={314} y={67 + i * 26} className="dv-mut" textAnchor="middle" fontSize="8">✓</text>
        </g>
      ))}
      <g>
        <text x={140} y={120} className="dv-mut">Eve → Eve: 100 Ξ</text>
        <text x={300} y={120} className="dv-mut" fill="var(--color-changed)">✗ no key</text>
      </g>
      <text x={230} y={150} className="dv-mut" textAnchor="middle">a signature nobody can forge = authorization</text>
    </svg>
  );
}

function Accounts() {
  const row = (y: number, a: string, b: string) => (
    <g>
      <rect x={40} y={y} width={150} height={24} rx={5} className="dv-box" />
      <text x={50} y={y + 16} className="dv-txt">{a}</text>
      <text x={150} y={y + 16} className="dv-mut">{b}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="Accounts with balances">
      <text x={115} y={28} className="dv-mut" textAnchor="middle">STATE: address → balance</text>
      {row(40, "0xAlice", "5 Ξ")}
      {row(72, "0xBob", "9 Ξ")}
      {row(104, "0xCarol", "2 Ξ")}
      <path d="M200 84 L270 84" className="dv-hot-edge" />
      <text x={235} y={76} className="dv-accent" fontSize="9" textAnchor="middle">tx (nonce 7)</text>
      <rect x={272} y={56} width={150} height={56} rx={8} className="dv-box dv-hot" />
      <text x={347} y={78} className="dv-txt" textAnchor="middle">−2 from Alice</text>
      <text x={347} y={96} className="dv-txt" textAnchor="middle">+2 to Bob</text>
      <text x={230} y={150} className="dv-mut" textAnchor="middle">balances, not coins — only spend what you have</text>
    </svg>
  );
}

function Decentralize() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="Everyone holds a copy">
      {[60, 200, 340].map((x, i) => (
        <g key={i}>
          <rect x={x} y={40} width={80} height={80} rx={8} className="dv-box" />
          <text x={x + 40} y={58} className="dv-mut" textAnchor="middle" fontSize="9">node {i + 1}</text>
          <line x1={x + 12} y1={70} x2={x + 68} y2={70} className="dv-edge" />
          <line x1={x + 12} y1={84} x2={x + 68} y2={84} className="dv-edge" />
          <line x1={x + 12} y1={98} x2={x + 60} y2={98} className="dv-edge" />
        </g>
      ))}
      <path d="M140 80 L200 80" className="dv-edge" strokeDasharray="3 3" />
      <path d="M280 80 L340 80" className="dv-edge" strokeDasharray="3 3" />
      <text x={230} y={150} className="dv-mut" textAnchor="middle">every node holds the full state — no bank in the middle</text>
    </svg>
  );
}

function Consensus() {
  const blk = (x: number, y: number, cls: string, label: string) => (
    <g>
      <rect x={x} y={y} width={46} height={26} rx={5} className={`dv-box ${cls}`} />
      <text x={x + 23} y={y + 17} className="dv-mut" textAnchor="middle" fontSize="9">{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="Consensus picks the heaviest chain">
      {blk(20, 70, "", "#1")}
      {blk(96, 70, "", "#2")}
      <path d="M66 83 L96 83" className="dv-edge" />
      {/* honest fork (top) */}
      {blk(180, 40, "dv-leaf", "#3")}
      {blk(256, 40, "dv-leaf", "#4")}
      <path d="M142 76 L180 53" className="dv-hot-edge" />
      <path d="M226 53 L256 53" className="dv-edge" />
      <text x={302} y={56} fontSize="12">🔒</text>
      {/* attacker fork (bottom) */}
      {blk(180, 110, "", "#3′")}
      <path d="M142 90 L180 123" className="dv-edge" strokeDasharray="3 3" />
      <text x={236} y={127} className="dv-mut" fill="var(--color-changed)">✗ too little stake</text>
      <text x={230} y={166} className="dv-mut" textAnchor="middle">follow the heaviest-staked chain; finalized blocks lock 🔒</text>
    </svg>
  );
}

function Evm() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="A computer inside the ledger">
      <rect x={30} y={60} width={110} height={56} rx={8} className="dv-box dv-branch" />
      <text x={85} y={82} className="dv-mut" textAnchor="middle" fontSize="9">account</text>
      <text x={85} y={100} className="dv-txt" textAnchor="middle">{"{ code }"}</text>
      <path d="M140 88 L186 88" className="dv-hot-edge" />
      <text x={163} y={80} className="dv-accent" fontSize="9" textAnchor="middle">call</text>
      <circle cx={230} cy={88} r={34} className="dv-box dv-ext" />
      <text x={230} y={84} className="dv-mut" textAnchor="middle" fontSize="9">EVM</text>
      <text x={230} y={98} className="dv-txt" textAnchor="middle">⚙</text>
      <path d="M264 88 L310 88" className="dv-edge" />
      <text x={287} y={80} className="dv-mut" fontSize="9" textAnchor="middle">read/write</text>
      <rect x={312} y={64} width={118} height={48} rx={8} className="dv-box" />
      <text x={371} y={92} className="dv-mut" textAnchor="middle" fontSize="9">state (storage)</text>
      <text x={230} y={156} className="dv-mut" textAnchor="middle">accounts can hold code — the ledger becomes programmable</text>
    </svg>
  );
}

function Gas() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="Meter every instruction with gas">
      <rect x={90} y={70} width={280} height={20} rx={10} className="dv-box" />
      <rect x={92} y={72} width={150} height={16} rx={8} className="dv-hash" />
      <text x={92} y={62} className="dv-mut" fontSize="9">gas remaining</text>
      <text x={368} y={62} className="dv-mut" fontSize="9" textAnchor="end">empty → halt</text>
      {["PUSH −3", "ADD −3", "SSTORE −20000"].map((t, i) => (
        <text key={i} x={92 + i * 130} y={116} className="dv-mut" fontSize="9">{t}</text>
      ))}
      <text x={230} y={150} className="dv-mut" textAnchor="middle">each instruction costs gas — no program can loop forever</text>
    </svg>
  );
}

function StateRoot() {
  return (
    <svg viewBox="0 0 460 180" role="img" aria-label="All state in one root">
      {[30, 70, 110].map((y, i) => (
        <rect key={i} x={20} y={y} width={70} height={22} rx={4} className="dv-box" />
      ))}
      {[41, 81, 121].map((y, i) => (
        <path key={i} d={`M90 ${y} C150 ${y}, 150 80, 200 80`} className="dv-edge" />
      ))}
      <rect x={200} y={62} width={70} height={36} rx={6} className="dv-box dv-branch" />
      <text x={235} y={84} className="dv-mut" textAnchor="middle" fontSize="9">trie</text>
      <path d="M270 80 L312 80" className="dv-hot-edge" />
      <rect x={312} y={40} width={130} height={80} rx={8} className="dv-box" />
      <text x={377} y={58} className="dv-mut" textAnchor="middle" fontSize="9">BLOCK HEADER</text>
      <rect x={322} y={70} width={110} height={24} rx={4} className="dv-box dv-hot" />
      <text x={377} y={86} className="dv-txt" textAnchor="middle" fontSize="9">stateRoot 0x…</text>
      <text x={230} y={150} className="dv-mut" textAnchor="middle">all of state → one 32-byte root in every block</text>
    </svg>
  );
}

/* ── the derivation ────────────────────────────────────────────────── */

const STEPS: DerivationStep[] = [
  {
    label: "Ledger",
    title: "You and your friends want money without a bank",
    idea: "Skip cash — just keep a shared ledger of who paid whom. At the end of the month you settle up. Trust the ledger, not a bank.",
    flaw: "But the ledger is public and editable — anyone can scribble “Eve → Eve: 100 Ξ”. There's nothing tying a line to the person it claims to be from.",
    fix: "Sign it",
    visual: <Ledger />,
  },
  {
    label: "Signatures",
    title: "Make every line provably yours",
    idea: "A private key signs each entry; anyone can verify the signature with your public key, but nobody can forge it. Your identity is the ability to sign. (This is the keys & signatures explorable.)",
    flaw: "Forgery's gone — but people could still sign payments they can't afford, or sign two payments that spend the same money. We need to track what each account actually has.",
    fix: "Track balances",
    visual: <Signed />,
  },
  {
    label: "Accounts",
    title: "Track balances — and order with nonces",
    idea: "The ledger becomes a map of address → balance. A transaction debits one account, credits another, only if it's funded — and carries a nonce so the same payment can't be replayed. Ethereum picks accounts over Bitcoin's coins precisely so it can do more than move money.",
    flaw: "But who keeps this map, and whose copy is the truth? If one server hosts it, you've reinvented the bank.",
    fix: "Decentralize",
    visual: <Accounts />,
  },
  {
    label: "Decentralize",
    title: "Everyone keeps a copy",
    idea: "Every node holds the full state and the rules to update it. No one is in charge; anyone can verify everything from genesis.",
    flaw: "Now the hard part: with no leader, whose next block is canonical? Two people can broadcast conflicting histories — one where you paid the merchant, one where you didn't. That's the double-spend.",
    fix: "Agree on order",
    visual: <Decentralize />,
  },
  {
    label: "Consensus",
    title: "Make rewriting history ruinously expensive",
    idea: "Validators bond real money (stake) to propose and vote on blocks; the chain follows the heaviest-attested fork, and finalized blocks can only be reversed by validators who get their stake destroyed (slashed). Bitcoin burns electricity; Ethereum burns stake. (This is the double-spending explorable.)",
    flaw: "Great — but this is still just moving balances around. I wanted programmable rules: escrows, tokens, auctions, lending. Plain payments can't express any of that.",
    fix: "Add a computer",
    visual: <Consensus />,
  },
  {
    label: "The EVM",
    title: "Put a computer inside the ledger",
    idea: "Let accounts hold code, not just a balance. A transaction can call that code, which runs identically on every node — reading and writing state. Now the ledger is a world computer: smart contracts. (This is the EVM explorable.)",
    flaw: "But a program could loop forever and freeze every node on Earth — the halting problem, weaponized. You can't run untrusted code for free.",
    fix: "Meter it",
    visual: <Evm />,
  },
  {
    label: "Gas",
    title: "Charge for every instruction",
    idea: "Each opcode costs gas; the transaction prepays a budget; when it runs out, execution halts and reverts. Computation is now bounded and paid for, and the fee market (EIP-1559) prices it. (This is the mempool & fees explorable.)",
    flaw: "Last problem: with all this state — every account, contract, and storage slot — how does each node cheaply agree it holds the exact same world as everyone else?",
    fix: "Commit it",
    visual: <Gas />,
  },
  {
    label: "State root",
    title: "Fold all of state into one number",
    idea: "A Merkle-Patricia trie commits the entire world state to a single 32-byte root, placed in every block header. Match the root, and you've proven you hold the identical state — and you can prove any single account with a tiny path. (This is the state explorable.)",
    visual: <StateRoot />,
  },
];

export default function InventEthereum() {
  return <Derivation steps={STEPS} />;
}
