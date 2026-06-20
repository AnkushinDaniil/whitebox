import { describe, expect, it } from "vitest";
import { ghostHead, simulateReorg, type Block } from "./index";

// A simple fork: genesis → a → {b1 (left), b2 (right)} ; b1 → b1a ; b2 → b2a
const FORK: Block[] = [
  { id: "g", parent: null },
  { id: "a", parent: "g" },
  { id: "b1", parent: "a" },
  { id: "b1a", parent: "b1" },
  { id: "b2", parent: "a" },
  { id: "b2a", parent: "b2" },
];

describe("LMD-GHOST head selection", () => {
  it("follows the heavier-voted fork", () => {
    const votes = { v1: "b1a", v2: "b1a", v3: "b1", v4: "b2a" }; // 3 left, 1 right
    expect(ghostHead(FORK, votes, "g")).toBe("b1a");
  });

  it("flips to the other fork when the vote weight flips", () => {
    const votes = { v1: "b2a", v2: "b2a", v3: "b2", v4: "b1a" }; // 3 right, 1 left
    expect(ghostHead(FORK, votes, "g")).toBe("b2a");
  });

  it("counts descendants toward an ancestor's weight (GHOST)", () => {
    // one vote each for b2 and b2a → b2 subtree has 2, b1 subtree has 1
    const votes = { v1: "b2", v2: "b2a", v3: "b1a" };
    expect(ghostHead(FORK, votes, "g")).toBe("b2a");
  });

  it("returns the root when there are no blocks beyond it", () => {
    expect(ghostHead([{ id: "g", parent: null }], {}, "g")).toBe("g");
  });
});

describe("double-spend resistance via simulateReorg", () => {
  const base = { blocksUntilFinality: 4, committee: 100, totalStakeEth: 33_000_000 };

  it("honest majority: payment finalizes and is safe", () => {
    const r = simulateReorg({ ...base, attackerShare: 0.2 });
    expect(r.headIsHonest).toBe(true);
    expect(r.finalizes).toBe(true);
    expect(r.verdict).toBe("finalized-safe");
  });

  it("1/3..1/2 attacker: finality stalls but the honest chain stays heaviest", () => {
    const r = simulateReorg({ ...base, attackerShare: 0.4 });
    expect(r.headIsHonest).toBe(true);
    expect(r.finalizes).toBe(false);
    expect(r.verdict).toBe("finality-stalled");
  });

  it("majority attacker: can out-weigh the honest chain (reorg)", () => {
    const r = simulateReorg({ ...base, attackerShare: 0.6 });
    expect(r.headIsHonest).toBe(false);
    expect(r.verdict).toBe("majority-reorg");
  });

  it("reverting a finalized block burns at least 1/3 of all stake", () => {
    const r = simulateReorg({ ...base, attackerShare: 0.2 });
    expect(r.slashedEth).toBe(Math.ceil(33_000_000 / 3));
    expect(r.slashedEth).toBeGreaterThan(10_000_000);
  });
});
