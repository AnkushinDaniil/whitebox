/** Consensus defenses against double-spending: fork choice + finality. */
export {
  type Block,
  type Verdict,
  type ReorgParams,
  type ReorgResult,
  ghostHead,
  simulateReorg,
} from "./forkchoice";
