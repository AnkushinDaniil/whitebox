/** The EIP-1559 fee market: base-fee controller, effective price, burn vs tip. */
export {
  ELASTICITY_MULTIPLIER,
  BASE_FEE_MAX_CHANGE_DENOMINATOR,
  gasTarget,
  nextBaseFee,
  effectiveGasPrice,
  feeSplit,
  simulate,
} from "./fees";
