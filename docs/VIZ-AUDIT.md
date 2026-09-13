# Whitebox visualization audit (2026-09-13)

Full eyes-on pass over all 160 `Scene.astro` figures via a QA contact-sheet
(`/qa/all`) rendered and reviewed frame-by-frame. Goal: every concept clear at a
glance, every detail drawn (not narrated), no boxes-with-text-only.

Cross-cutting defect classes found:
- **Missing arrowheads** on flows that imply direction (most common).
- **Caption clipping** — bottom `t-cap` strings wider than the 480 viewBox get
  cut at both edges (`cl-*`, `db*`, `sync*`, `mpt`).
- **Text overlap / spill** — labels running into boxes, lines, or each other.
- **Boxes-with-text-only** — no real diagram (`ec-use`, `fm-use`, `ic-result`,
  `mb-payoff`, `bls-use`, `pr-caveat`, `wr-trustless`, `wd-credit`, `ts-*`).
- **Low contrast / faint** content (`network`, `dbcompact`, `blocks`).
- **Technical error**: `evm` stack shows `5,2` after PUSH2/PUSH3/ADD; must be `5`.
- **Tofu glyphs** — emoji (lock, etc.) render as missing-box in some fonts;
  prefer geometry over emoji.

Per-scene findings are the raw review below (only defective scenes listed).

## Systemic fixes applied
- Node depth: shared node fill → vertical gradient (`wb-node`), stroke +0.2.
- Caption contrast: `t-cap` faint → muted.
- Reusable `<defs>`: arrowhead markers, gradients, glow, soft shadow, hatch.
- Redesigned exemplars: `root`, `mpt` (real trie, leaf→ext→branch→root re-hash
  cascade, verified frame-aware over ~8 cycles).

## Raw per-scene review (contact sheet)
(see git history / session; consolidated list of defective scenes by tile)
