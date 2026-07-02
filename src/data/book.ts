/**
 * The book's spine — the single, ordered reading path through Whitebox.
 * Part I designs the machine from first principles; Part II shows it running;
 * Part III walks every consequential upgrade in the order it shipped. Chapter
 * titles come from the content collection (single source); this file only
 * defines the order and the part/fork grouping.
 */

export interface BookChapter {
  slug: string; // explorable slug (EN)
  eip?: string; // "1559" or "2929/2930"
}
export interface BookGroup {
  /** fork name for Part III groups; undefined for the foundational parts */
  forkName?: string;
  label?: string; // non-fork group label (e.g. "Application layer")
  date?: string; // "Aug 2021"
  chapters: BookChapter[];
}
export interface BookPart {
  n: string; // "I"
  title: string;
  blurb: string;
  groups: BookGroup[];
}

export const BOOK: BookPart[] = [
  {
    n: "I",
    title: "Designing the machine",
    blurb:
      "Build Ethereum from a shared spreadsheet up to a programmable, staked world computer — inventing each piece the moment you feel its absence.",
    groups: [
      {
        chapters: [
          { slug: "you-could-have-invented-ethereum" },
          { slug: "the-evm" },
          { slug: "state-and-the-trie" },
        ],
      },
    ],
  },
  {
    n: "II",
    title: "Running it",
    blurb:
      "The live clockwork: how a million validators with no leader agree every twelve seconds, how a fresh node catches up, and how clients actually keep the state on disk.",
    groups: [
      {
        chapters: [
          { slug: "how-consensus-runs" },
          { slug: "how-a-node-syncs" },
          { slug: "flat-db-nethermind" },
        ],
      },
    ],
  },
  {
    n: "III",
    title: "The upgrades, in order",
    blurb:
      "Every consequential change to Ethereum, in the order it shipped — each one a problem the network hit, derived to its fix.",
    groups: [
      { forkName: "Homestead", date: "Mar 2016", chapters: [{ slug: "eip-7-delegatecall", eip: "7" }] },
      { forkName: "Tangerine Whistle", date: "Oct 2016", chapters: [{ slug: "eip-150-io-repricing", eip: "150" }] },
      { forkName: "Spurious Dragon", date: "Nov 2016", chapters: [{ slug: "eip-155-replay-protection", eip: "155" }] },
      {
        forkName: "Byzantium",
        date: "Oct 2017",
        chapters: [
          { slug: "eip-140-revert", eip: "140" },
          { slug: "eip-214-staticcall", eip: "214" },
          { slug: "eip-196-197-bn128-precompiles", eip: "196/197" },
        ],
      },
      { forkName: "Constantinople", date: "Feb 2019", chapters: [{ slug: "eip-1014-create2", eip: "1014" }] },
      {
        forkName: "Istanbul",
        date: "Dec 2019",
        chapters: [
          { slug: "eip-2028-calldata", eip: "2028" },
          { slug: "eip-1344-chainid", eip: "1344" },
          { slug: "eip-2200-sstore-metering", eip: "2200" },
        ],
      },
      {
        forkName: "Berlin",
        date: "Apr 2021",
        chapters: [
          { slug: "eip-2718-typed-transactions", eip: "2718" },
          { slug: "eip-2929-2930-access-lists", eip: "2929/2930" },
        ],
      },
      {
        forkName: "London",
        date: "Aug 2021",
        chapters: [
          { slug: "eip-1559-fee-market", eip: "1559" },
          { slug: "eip-3529-refund-reduction", eip: "3529" },
          { slug: "eip-3541-ef-reservation", eip: "3541" },
        ],
      },
      { forkName: "Altair", date: "Oct 2021", chapters: [{ slug: "altair-sync-committees" }] },
      {
        forkName: "Paris · The Merge",
        date: "Sep 2022",
        chapters: [
          { slug: "eip-3675-the-merge", eip: "3675" },
          { slug: "eip-4399-prevrandao", eip: "4399" },
        ],
      },
      {
        forkName: "Shanghai · Capella",
        date: "Apr 2023",
        chapters: [
          { slug: "eip-3855-push0", eip: "3855" },
          { slug: "eip-3860-initcode-metering", eip: "3860" },
          { slug: "eip-4895-withdrawals", eip: "4895" },
        ],
      },
      { label: "Application layer", date: "2023", chapters: [{ slug: "eip-4337-account-abstraction", eip: "4337" }] },
      {
        forkName: "Cancun · Deneb",
        date: "Mar 2024",
        chapters: [
          { slug: "eip-1153-transient-storage", eip: "1153" },
          { slug: "eip-4788-beacon-root", eip: "4788" },
          { slug: "eip-4844-blobs", eip: "4844" },
          { slug: "eip-6780-selfdestruct", eip: "6780" },
        ],
      },
      {
        forkName: "Prague · Electra",
        date: "May 2025",
        chapters: [
          { slug: "eip-7702-set-eoa-code", eip: "7702" },
          { slug: "eip-2537-bls-precompiles", eip: "2537" },
          { slug: "eip-2935-historical-block-hashes", eip: "2935" },
          { slug: "eip-6110-onchain-deposits", eip: "6110" },
          { slug: "eip-7002-el-withdrawals", eip: "7002" },
          { slug: "eip-7251-max-effective-balance", eip: "7251" },
        ],
      },
    ],
  },
];

export interface FlatChapter {
  slug: string;
  eip?: string;
  number: number; // 1-based, sequential across the whole book
  partN: string;
  partTitle: string;
  groupLabel?: string; // fork or group label
  groupDate?: string;
}

/** The whole book flattened into one numbered reading sequence. */
export function flatChapters(): FlatChapter[] {
  const out: FlatChapter[] = [];
  let n = 0;
  for (const part of BOOK) {
    for (const g of part.groups) {
      for (const ch of g.chapters) {
        n += 1;
        out.push({
          slug: ch.slug,
          eip: ch.eip,
          number: n,
          partN: part.n,
          partTitle: part.title,
          groupLabel: g.forkName ?? g.label,
          groupDate: g.date,
        });
      }
    }
  }
  return out;
}

export interface ChapterNav {
  current: FlatChapter;
  prev: FlatChapter | null;
  next: FlatChapter | null;
  total: number;
}

/** Prev/next + numbering for a given chapter slug, or null if not in the book. */
export function chapterNav(slug: string): ChapterNav | null {
  const flat = flatChapters();
  const i = flat.findIndex((c) => c.slug === slug);
  if (i < 0) return null;
  return {
    current: flat[i],
    prev: flat[i - 1] ?? null,
    next: flat[i + 1] ?? null,
    total: flat.length,
  };
}
