# Whitebox

> Ethereum's execution layer, made transparent.

Interactive, explorable explanations of Ethereum's **execution layer** — for
engineers, node operators, and aspiring core/protocol contributors who want real
depth. The core unit isn't a wiki page; it's an _explorable_: one mechanism + a
live, tinker-able widget, layered **intuition → mechanism → spec & code → go
deeper**.

## Stack

- **Astro 5** (islands) + **MDX** content collections — static, SEO-first, ships
  zero JS except the interactive widgets.
- **React 19** islands for widgets, **SVG + d3-hierarchy** for visualizers.
- **Tailwind v4** (CSS-first design tokens), dark-mode-first.
- **TypeScript**, strict.

## What's here (milestone 1)

The flagship explorable **"How Ethereum stores state"** with a live
Merkle-Patricia-Trie visualizer.

The MPT engine in `src/lib/mpt/` is a **real, auditable** implementation — real
RLP, hex-prefix encoding, and keccak256 — that produces byte-for-byte the same
`stateRoot` a live client would. It's validated against `@ethereumjs/mpt` across
100 randomized cases (`pnpm test`). The engine is deliberately decoupled from the
UI so it can later back a standalone state-debugging tool.

## Commands

```bash
pnpm dev        # local dev server
pnpm build      # static build -> dist/
pnpm preview    # serve the build
pnpm test       # MPT engine differential tests (vitest)
pnpm typecheck  # astro check
```

## Project shape

```
src/
  lib/mpt/                 Real Merkle-Patricia Trie engine (+ tests)
  components/
    explorable/            Reusable framework: DepthLayer, WidgetFrame,
                           SpecExcerpt, Callout, KeyTerm, GoDeeper
    trie/                  The flagship widget (visualizer + Verkle/Binary contrast)
  content/
    explorables/*.mdx      The evergreen spine
    notes/*.mdx            Low-frequency "what changed this hardfork" notes
  layouts/                 BaseLayout, ExplorableLayout
  pages/                   index, the-execution-layer, [...slug], notes, about, rss
```

## Adding an explorable

1. Drop a new `.mdx` file in `src/content/explorables/` matching the schema in
   `src/content.config.ts`.
2. Compose it from the framework components (`DepthLayer`, `WidgetFrame`, …).
3. Build a widget from the shared primitives, or reuse an existing one.

## Notes & decisions

- **State-tree contrast** covers MPT → **Verkle** → **Binary (EIP-7864)**,
  telling the real roadmap-pivot story. The contrast widget's diagrams/bars are
  explicitly _illustrative_, not a live cryptographic benchmark.
- **Hosting:** static build, host-agnostic for now.
