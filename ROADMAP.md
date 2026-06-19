# Whitebox roadmap — the whole protocol, explained

Goal: an interactive, explorable explanation of **how Ethereum actually works**,
end to end — every mechanism paired with a live, tinkerable widget, layered
intuition → mechanism → spec/code → go deeper. Real engines (verified against
reference implementations), high-craft visuals, purposeful animation.

Each explorable is built to the same bar: a real (tested) engine where
applicable, a polished interactive widget, layered MDX, browser-verified, and
committed.

Legend: ✅ shipped · 🔨 in progress · ⬜ planned

## Foundations
- ✅ **Keys, signatures & addresses** — secp256k1, ECDSA, recovery, sign≠encrypt
- ⬜ **Hashing & Merkle proofs** — keccak256, Merkle trees, proof verification widget

## Execution layer — state & transactions
- ✅ **How Ethereum stores state** — the Merkle-Patricia Trie (+ Verkle/binary)
- ✅ **How transactions work** — EIP-1559, signing, sender recovery
- ⬜ **Accounts** — EOAs vs contracts, nonces, balance; account abstraction (4337, 7702)
- ✅ **The mempool & the fee market** — propagation, EIP-1559 base-fee simulator

## The EVM
- ⬜ **The EVM** — stack / memory / storage, a live opcode stepper
- ⬜ **Gas & metering** — per-opcode costs, refunds, gas limit (EIP-3529, 1559 base fee)
- ⬜ **Calls** — CALL / DELEGATECALL / STATICCALL, the call stack, context
- ⬜ **Contract creation** — init code, CREATE / CREATE2
- ⬜ **Logs, events & the bloom filter**
- ⬜ **Precompiles**

## Blocks & validation
- ⬜ **Anatomy of a block** — header fields, withdrawals, the roots
- ⬜ **The state transition function** — how a block mutates the world state
- ⬜ **Receipts & the receipts trie**

## Consensus layer (Proof of Stake)
- ⬜ **The Merge & the EL/CL split** — the Engine API handoff
- ⬜ **Proof of Stake** — validators, staking, rewards, slashing
- ⬜ **Slots, epochs & attestations**
- ⬜ **Gasper** — Casper-FFG finality + LMD-GHOST fork choice; reorgs & double-spend resolution

## Scaling & data availability
- ⬜ **Blobs & EIP-4844** — proto-danksharding, the blob fee market
- ⬜ **Statelessness & the binary state tree** (EIP-7864) — witnesses, weak statelessness
- ⬜ **Rollups & L2 data availability**

## Networking & node sync
- ⬜ **Peer discovery** — discv5, devp2p, the node table
- ⬜ **Sync methods** — full, snap, light / checkpoint, era files (compared, with trade-offs)

## Reference
- ⬜ **/eips** — a browsable index of the EIPs the explorables depend on, each
  cross-linked to where it's explained.

---

### Build conventions
- Real engines live in `src/lib/<domain>/` with differential tests
  (vs `@ethereumjs/mpt`, `viem`, …). Reuse `lib/mpt` (RLP, keccak) and
  `lib/sig` (secp256k1) where possible.
- Widgets in `src/components/<domain>/`, framed by `WidgetFrame`, composed of
  reusable primitives. Animations unconditional; respect compositor-only props.
- Content in `src/content/explorables/*.mdx` using the `DepthLayer` framework.
- Verify each in a real browser (Playwright/Maestro) before committing.
