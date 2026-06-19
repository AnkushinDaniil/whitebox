/**
 * The EIP-1559 fee market, as a small exact engine. The base fee is not an
 * auction — it's a deterministic per-block feedback controller that targets
 * blocks being half full, and it is *burned*. Implemented in integer (bigint)
 * arithmetic to match clients exactly.
 */

export const ELASTICITY_MULTIPLIER = 2n; // gasLimit = 2 × gasTarget
export const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8n; // ±12.5% max per block

/** Gas target (the "half full" point) for a given block gas limit. */
export function gasTarget(gasLimit: bigint): bigint {
  return gasLimit / ELASTICITY_MULTIPLIER;
}

/**
 * The base fee of the next block, from the parent's base fee and gas usage.
 * Rises when the parent was over target, falls when under, capped at ±1/8.
 */
export function nextBaseFee(
  parentBaseFee: bigint,
  parentGasUsed: bigint,
  parentGasLimit: bigint,
): bigint {
  const target = gasTarget(parentGasLimit);
  if (parentGasUsed === target) return parentBaseFee;

  if (parentGasUsed > target) {
    const delta = parentGasUsed - target;
    const change = (parentBaseFee * delta) / target / BASE_FEE_MAX_CHANGE_DENOMINATOR;
    return parentBaseFee + (change > 0n ? change : 1n); // always move up by ≥1
  }

  const delta = target - parentGasUsed;
  const change = (parentBaseFee * delta) / target / BASE_FEE_MAX_CHANGE_DENOMINATOR;
  const next = parentBaseFee - change;
  return next > 0n ? next : 0n;
}

/**
 * What a transaction actually pays per gas: the base fee plus the smaller of the
 * priority tip and the room left under maxFeePerGas. Requires maxFee ≥ baseFee.
 */
export function effectiveGasPrice(
  baseFee: bigint,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
): bigint {
  const cap = maxFeePerGas; // hard ceiling the sender set
  const want = baseFee + maxPriorityFeePerGas;
  return want < cap ? want : cap;
}

/** Per-gas split of a paid price into the burned base fee and the proposer tip. */
export function feeSplit(
  baseFee: bigint,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
): { includable: boolean; effective: bigint; burned: bigint; tip: bigint } {
  if (maxFeePerGas < baseFee) {
    return { includable: false, effective: 0n, burned: 0n, tip: 0n };
  }
  const effective = effectiveGasPrice(baseFee, maxFeePerGas, maxPriorityFeePerGas);
  return { includable: true, effective, burned: baseFee, tip: effective - baseFee };
}

/** Run a base fee forward through a sequence of block gas-usage values. */
export function simulate(
  startBaseFee: bigint,
  gasLimit: bigint,
  gasUsedPerBlock: bigint[],
): bigint[] {
  const out: bigint[] = [startBaseFee];
  let fee = startBaseFee;
  for (const used of gasUsedPerBlock) {
    fee = nextBaseFee(fee, used, gasLimit);
    out.push(fee);
  }
  return out;
}
