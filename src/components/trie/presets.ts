/**
 * Demo entries chosen to surface all three node types (branch, extension, leaf)
 * with short, crafted keys. Real Ethereum keys are keccak256(address) — toggle
 * "secure trie" in the UI to see why that makes production state tries flat.
 */
export interface PresetEntry {
  key: string; // hex, 0x..
  value: string; // human label (stored as utf-8 bytes)
  label: string; // display name
}

export const DEFAULT_ENTRIES: PresetEntry[] = [
  { key: "0xa7c1", value: "Alice · 12.0 ETH", label: "Alice" },
  { key: "0xa7c9", value: "Bob · 3.4 ETH", label: "Bob" },
  { key: "0xa7d4", value: "Carol · 88.1 ETH", label: "Carol" },
  { key: "0xb014", value: "Dave · 0.4 ETH", label: "Dave" },
];

/** A spare account the "add account" button drops in to show live insertion. */
export const SPARE_ACCOUNTS: PresetEntry[] = [
  { key: "0xa7c4", value: "Erin · 5.0 ETH", label: "Erin" },
  { key: "0xa700", value: "Frank · 1.1 ETH", label: "Frank" },
  { key: "0xf9d2", value: "Grace · 40.0 ETH", label: "Grace" },
  { key: "0xa7c1", value: "Alice · 999 ETH", label: "Alice (edited)" },
];
