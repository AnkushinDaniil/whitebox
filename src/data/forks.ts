/**
 * Ethereum hard forks and the EIPs they shipped — the reference map behind the
 * hub. `ARTICLE_META` tags our deep-dive explorables with a category + fork;
 * `FORKS` is the full timeline (every fork, the notable EIPs inside each).
 * Chips whose `slug` is set link to our article; the rest link to eips.ethereum.org.
 */

export type EipCategory = "execution" | "consensus" | "general";

export interface ForkEip {
  eip: string; // "1559" or "2929/2930"
  title: string; // short, chip-sized
  category: EipCategory;
  slug?: string; // our explorable, if we have one
}

export interface Fork {
  name: string; // execution-layer name (or CL name for CL-only forks)
  cl?: string; // paired consensus-layer name, if any
  date: string; // ISO-ish "YYYY-MM"
  display: string; // human date "Aug 2021"
  layer: "execution" | "consensus" | "both";
  blurb: string;
  eips: ForkEip[];
}

/** Our deep-dive explorables, keyed by slug → category + fork. */
export const ARTICLE_META: Record<
  string,
  { eip: string; category: EipCategory; fork: string }
> = {
  "eip-155-replay-protection": { eip: "155", category: "general", fork: "Spurious Dragon" },
  "eip-2718-typed-transactions": { eip: "2718", category: "execution", fork: "Berlin" },
  "eip-2929-2930-access-lists": { eip: "2929/2930", category: "execution", fork: "Berlin" },
  "eip-1559-fee-market": { eip: "1559", category: "execution", fork: "London" },
  "eip-3675-the-merge": { eip: "3675", category: "consensus", fork: "Paris · The Merge" },
  "eip-4895-withdrawals": { eip: "4895", category: "consensus", fork: "Shanghai · Capella" },
  "eip-1153-transient-storage": { eip: "1153", category: "execution", fork: "Cancun · Deneb" },
  "eip-4788-beacon-root": { eip: "4788", category: "consensus", fork: "Cancun · Deneb" },
  "eip-4844-blobs": { eip: "4844", category: "execution", fork: "Cancun · Deneb" },
  "eip-7702-set-eoa-code": { eip: "7702", category: "execution", fork: "Prague · Electra" },
  "eip-7251-max-effective-balance": { eip: "7251", category: "consensus", fork: "Prague · Electra" },
  "eip-4337-account-abstraction": { eip: "4337", category: "general", fork: "Application layer (ERC)" },
};

const ours = (slug: string) => slug; // marker for readability below

export const FORKS: Fork[] = [
  {
    name: "Frontier",
    date: "2015-07",
    display: "Jul 2015",
    layer: "execution",
    blurb: "Mainnet genesis — a bare, mining-only chain.",
    eips: [],
  },
  {
    name: "Homestead",
    date: "2016-03",
    display: "Mar 2016",
    layer: "execution",
    blurb: "First planned upgrade; the network leaves beta.",
    eips: [
      { eip: "2", title: "Homestead consensus changes", category: "execution" },
      { eip: "7", title: "DELEGATECALL", category: "execution", slug: "eip-7-delegatecall" },
      { eip: "8", title: "devp2p forward compatibility", category: "general" },
    ],
  },
  {
    name: "Tangerine Whistle",
    date: "2016-10",
    display: "Oct 2016",
    layer: "execution",
    blurb: "Emergency gas repricing after the 2016 DoS attacks.",
    eips: [{ eip: "150", title: "Gas repricing for IO-heavy ops", category: "execution", slug: "eip-150-io-repricing" }],
  },
  {
    name: "Spurious Dragon",
    date: "2016-11",
    display: "Nov 2016",
    layer: "execution",
    blurb: "Replay protection and state-trie clearing after the DoS.",
    eips: [
      { eip: "155", title: "Simple replay protection (chainId)", category: "general", slug: ours("eip-155-replay-protection") },
      { eip: "160", title: "EXP cost increase", category: "execution" },
      { eip: "161", title: "State-trie clearing", category: "execution" },
      { eip: "170", title: "Contract code-size limit", category: "execution" },
    ],
  },
  {
    name: "Byzantium",
    date: "2017-10",
    display: "Oct 2017",
    layer: "execution",
    blurb: "Metropolis part one — privacy precompiles and REVERT.",
    eips: [
      { eip: "100", title: "Average-block-time difficulty", category: "consensus" },
      { eip: "140", title: "REVERT instruction", category: "execution", slug: "eip-140-revert" },
      { eip: "196", title: "alt_bn128 add/mul precompiles", category: "execution", slug: "eip-196-197-bn128-precompiles" },
      { eip: "197", title: "alt_bn128 pairing precompile", category: "execution", slug: "eip-196-197-bn128-precompiles" },
      { eip: "198", title: "Big-integer modexp", category: "execution" },
      { eip: "211", title: "RETURNDATASIZE / RETURNDATACOPY", category: "execution" },
      { eip: "214", title: "STATICCALL", category: "execution", slug: "eip-214-staticcall" },
      { eip: "649", title: "Difficulty bomb delay + 3 ETH reward", category: "consensus" },
      { eip: "658", title: "Transaction status in receipts", category: "execution" },
    ],
  },
  {
    name: "Constantinople",
    date: "2019-02",
    display: "Feb 2019",
    layer: "execution",
    blurb: "Metropolis part two — CREATE2 and cheaper bit-ops.",
    eips: [
      { eip: "145", title: "Bitwise shifting (SHL/SHR/SAR)", category: "execution", slug: "eip-145-bitwise-shifting" },
      { eip: "1014", title: "CREATE2", category: "execution", slug: "eip-1014-create2" },
      { eip: "1052", title: "EXTCODEHASH", category: "execution", slug: "eip-1052-extcodehash" },
      { eip: "1234", title: "Difficulty bomb delay + 2 ETH reward", category: "consensus" },
      { eip: "1283", title: "SSTORE net gas metering", category: "execution" },
    ],
  },
  {
    name: "Petersburg",
    date: "2019-02",
    display: "Feb 2019",
    layer: "execution",
    blurb: "Shipped with Constantinople; pulled EIP-1283 over reentrancy risk.",
    eips: [{ eip: "1283", title: "Removed (reentrancy concern)", category: "execution" }],
  },
  {
    name: "Istanbul",
    date: "2019-12",
    display: "Dec 2019",
    layer: "execution",
    blurb: "Repricings, cheaper calldata, and the CHAINID opcode.",
    eips: [
      { eip: "152", title: "Blake2 precompile", category: "execution" },
      { eip: "1108", title: "Cheaper alt_bn128", category: "execution" },
      { eip: "1344", title: "CHAINID opcode", category: "execution", slug: "eip-1344-chainid" },
      { eip: "1884", title: "Reprice trie-size-dependent ops", category: "execution" },
      { eip: "2028", title: "Cheaper calldata", category: "execution", slug: "eip-2028-calldata" },
      { eip: "2200", title: "Rebalanced SSTORE metering", category: "execution", slug: "eip-2200-sstore-metering" },
    ],
  },
  {
    name: "Muir Glacier",
    date: "2020-01",
    display: "Jan 2020",
    layer: "execution",
    blurb: "Single-purpose: push back the difficulty bomb.",
    eips: [{ eip: "2384", title: "Difficulty bomb delay", category: "consensus" }],
  },
  {
    name: "Beacon Chain",
    cl: "Phase 0",
    date: "2020-12",
    display: "Dec 2020",
    layer: "consensus",
    blurb: "Proof-of-stake genesis — runs in parallel, no execution yet.",
    eips: [{ eip: "—", title: "Beacon chain / PoS genesis", category: "consensus" }],
  },
  {
    name: "Berlin",
    date: "2021-04",
    display: "Apr 2021",
    layer: "execution",
    blurb: "Gas-access repricing and the typed-transaction envelope.",
    eips: [
      { eip: "2565", title: "ModExp gas cost", category: "execution" },
      { eip: "2718", title: "Typed transaction envelope", category: "execution", slug: ours("eip-2718-typed-transactions") },
      { eip: "2929", title: "Gas increases for state access", category: "execution", slug: ours("eip-2929-2930-access-lists") },
      { eip: "2930", title: "Optional access lists", category: "execution", slug: ours("eip-2929-2930-access-lists") },
    ],
  },
  {
    name: "London",
    date: "2021-08",
    display: "Aug 2021",
    layer: "execution",
    blurb: "The fee market is rebuilt: a base fee, and a burn.",
    eips: [
      { eip: "1559", title: "Fee market change (base fee + burn)", category: "execution", slug: ours("eip-1559-fee-market") },
      { eip: "3198", title: "BASEFEE opcode", category: "execution" },
      { eip: "3529", title: "Reduction in gas refunds", category: "execution", slug: "eip-3529-refund-reduction" },
      { eip: "3541", title: "Reject contracts starting 0xEF", category: "execution", slug: "eip-3541-ef-reservation" },
      { eip: "3554", title: "Difficulty bomb delay", category: "consensus" },
    ],
  },
  {
    name: "Altair",
    cl: "Altair",
    date: "2021-10",
    display: "Oct 2021",
    layer: "consensus",
    blurb: "First beacon-chain upgrade: sync committees, light clients.",
    eips: [{ eip: "—", title: "Sync committees · light-client support", category: "consensus", slug: "altair-sync-committees" }],
  },
  {
    name: "Arrow Glacier",
    date: "2021-12",
    display: "Dec 2021",
    layer: "execution",
    blurb: "Single-purpose: difficulty bomb delay.",
    eips: [{ eip: "4345", title: "Difficulty bomb delay", category: "consensus" }],
  },
  {
    name: "Gray Glacier",
    date: "2022-06",
    display: "Jun 2022",
    layer: "execution",
    blurb: "The last bomb delay before the Merge.",
    eips: [{ eip: "5133", title: "Difficulty bomb delay", category: "consensus" }],
  },
  {
    name: "Paris · The Merge",
    cl: "Bellatrix",
    date: "2022-09",
    display: "Sep 2022",
    layer: "both",
    blurb: "Proof-of-work is switched off; the beacon chain takes over.",
    eips: [
      { eip: "3675", title: "Upgrade to proof-of-stake", category: "consensus", slug: ours("eip-3675-the-merge") },
      { eip: "4399", title: "DIFFICULTY → PREVRANDAO", category: "execution", slug: "eip-4399-prevrandao" },
    ],
  },
  {
    name: "Shanghai · Capella",
    cl: "Capella",
    date: "2023-04",
    display: "Apr 2023",
    layer: "both",
    blurb: "Staked ETH can finally be withdrawn; PUSH0 lands.",
    eips: [
      { eip: "3651", title: "Warm COINBASE", category: "execution" },
      { eip: "3855", title: "PUSH0 instruction", category: "execution", slug: "eip-3855-push0" },
      { eip: "3860", title: "Limit and meter initcode", category: "execution", slug: "eip-3860-initcode-metering" },
      { eip: "4895", title: "Beacon-chain push withdrawals", category: "consensus", slug: ours("eip-4895-withdrawals") },
      { eip: "6049", title: "Deprecate SELFDESTRUCT (warn)", category: "execution" },
    ],
  },
  {
    name: "Cancun · Deneb",
    cl: "Deneb",
    date: "2024-03",
    display: "Mar 2024",
    layer: "both",
    blurb: "Blobs cut rollup costs ~10×; transient storage; the beacon root in the EVM.",
    eips: [
      { eip: "1153", title: "Transient storage (TSTORE/TLOAD)", category: "execution", slug: ours("eip-1153-transient-storage") },
      { eip: "4788", title: "Beacon block root in the EVM", category: "consensus", slug: ours("eip-4788-beacon-root") },
      { eip: "4844", title: "Blob transactions (proto-danksharding)", category: "execution", slug: ours("eip-4844-blobs") },
      { eip: "5656", title: "MCOPY instruction", category: "execution", slug: "eip-5656-mcopy" },
      { eip: "6780", title: "SELFDESTRUCT only same-tx", category: "execution", slug: "eip-6780-selfdestruct" },
      { eip: "7044", title: "Perpetually valid voluntary exits", category: "consensus" },
      { eip: "7045", title: "Wider attestation inclusion", category: "consensus" },
      { eip: "7514", title: "Max epoch churn limit", category: "consensus" },
      { eip: "7516", title: "BLOBBASEFEE opcode", category: "execution" },
    ],
  },
  {
    name: "Prague · Electra",
    cl: "Electra",
    date: "2025-05",
    display: "May 2025",
    layer: "both",
    blurb: "Pectra: EOAs run code (7702), validators hold up to 2048 ETH, EL-triggerable requests.",
    eips: [
      { eip: "2537", title: "BLS12-381 precompiles", category: "execution", slug: "eip-2537-bls-precompiles" },
      { eip: "2935", title: "Historical block hashes in state", category: "execution", slug: "eip-2935-historical-block-hashes" },
      { eip: "6110", title: "On-chain validator deposits", category: "consensus", slug: "eip-6110-onchain-deposits" },
      { eip: "7002", title: "EL-triggerable withdrawals", category: "consensus", slug: "eip-7002-el-withdrawals" },
      { eip: "7251", title: "Increase MAX_EFFECTIVE_BALANCE", category: "consensus", slug: ours("eip-7251-max-effective-balance") },
      { eip: "7549", title: "Move committee index out of attestation", category: "consensus" },
      { eip: "7623", title: "Increase calldata cost", category: "execution" },
      { eip: "7685", title: "General-purpose EL requests", category: "execution" },
      { eip: "7691", title: "Blob throughput increase", category: "consensus" },
      { eip: "7702", title: "Set EOA account code", category: "execution", slug: ours("eip-7702-set-eoa-code") },
      { eip: "7840", title: "Blob schedule in EL config", category: "execution" },
    ],
  },
];
