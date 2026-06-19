import { describe, expect, it } from "vitest";
import {
  gasTarget,
  nextBaseFee,
  feeSplit,
  simulate,
  BASE_FEE_MAX_CHANGE_DENOMINATOR,
} from "./fees";

const GAS_LIMIT = 30_000_000n;
const TARGET = 15_000_000n;
const GWEI = 1_000_000_000n;

describe("gasTarget", () => {
  it("is half the gas limit", () => {
    expect(gasTarget(GAS_LIMIT)).toBe(TARGET);
  });
});

describe("nextBaseFee — the controller", () => {
  it("holds steady at exactly target", () => {
    expect(nextBaseFee(100n * GWEI, TARGET, GAS_LIMIT)).toBe(100n * GWEI);
  });

  it("rises by the full 12.5% when the block is completely full", () => {
    const base = 100n * GWEI;
    // gasUsed = gasLimit (2× target) → max increase = base / 8
    expect(nextBaseFee(base, GAS_LIMIT, GAS_LIMIT)).toBe(base + base / BASE_FEE_MAX_CHANGE_DENOMINATOR);
  });

  it("falls by the full 12.5% when the block is completely empty", () => {
    const base = 100n * GWEI;
    expect(nextBaseFee(base, 0n, GAS_LIMIT)).toBe(base - base / BASE_FEE_MAX_CHANGE_DENOMINATOR);
  });

  it("moves up by at least 1 wei when barely over target", () => {
    expect(nextBaseFee(7n, TARGET + 1n, GAS_LIMIT)).toBe(8n); // change rounds to 0 → +1
  });

  it("never goes negative", () => {
    expect(nextBaseFee(1n, 0n, GAS_LIMIT)).toBe(1n); // 1 - (1*.../8=0) = 1
  });

  it("matches the EIP-1559 formula on a half-over block", () => {
    const base = 1_000_000_000n;
    const used = TARGET + TARGET / 2n; // 50% over target
    const expected = base + (base * (used - TARGET)) / TARGET / 8n;
    expect(nextBaseFee(base, used, GAS_LIMIT)).toBe(expected);
  });
});

describe("feeSplit — burn vs tip", () => {
  it("excludes a tx whose maxFee is below the base fee", () => {
    const s = feeSplit(50n * GWEI, 40n * GWEI, 2n * GWEI);
    expect(s.includable).toBe(false);
  });

  it("pays base fee (burned) + tip when there's room", () => {
    const s = feeSplit(30n * GWEI, 100n * GWEI, 2n * GWEI);
    expect(s.includable).toBe(true);
    expect(s.burned).toBe(30n * GWEI);
    expect(s.tip).toBe(2n * GWEI);
    expect(s.effective).toBe(32n * GWEI);
  });

  it("caps the tip at maxFeePerGas (priority gets squeezed)", () => {
    // base 30, maxFee 31, wanted tip 5 → effective capped at 31, tip = 1
    const s = feeSplit(30n * GWEI, 31n * GWEI, 5n * GWEI);
    expect(s.effective).toBe(31n * GWEI);
    expect(s.burned).toBe(30n * GWEI);
    expect(s.tip).toBe(1n * GWEI);
  });
});

describe("simulate", () => {
  it("converges upward under sustained full blocks", () => {
    const series = simulate(100n * GWEI, GAS_LIMIT, Array(10).fill(GAS_LIMIT));
    expect(series.length).toBe(11);
    expect(series.at(-1)! > series[0]).toBe(true);
    // strictly monotonic up
    for (let i = 1; i < series.length; i++) expect(series[i] > series[i - 1]).toBe(true);
  });

  it("returns to roughly steady when blocks sit at target", () => {
    const series = simulate(100n * GWEI, GAS_LIMIT, Array(5).fill(TARGET));
    expect(series.every((f) => f === 100n * GWEI)).toBe(true);
  });
});
