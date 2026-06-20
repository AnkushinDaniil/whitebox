/**
 * A teaching model of Ethereum's consensus defenses against double-spending:
 * LMD-GHOST fork choice (the heaviest-attested chain wins) plus Casper-FFG
 * finality (a checkpoint with ≥2/3 of stake is justified; two in a row is
 * finalized and economically irreversible). Simplified but faithful to the
 * security argument; the head-selection function is exact and unit-tested.
 */

export interface Block {
  id: string;
  parent: string | null;
}

/**
 * LMD-GHOST: starting from the root, repeatedly walk to the child whose subtree
 * holds the most validator votes, until a leaf. That leaf is the head.
 * `votes` maps a validator to the block id of its latest attestation.
 */
export function ghostHead(blocks: Block[], votes: Record<string, string>, rootId: string): string {
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const children = new Map<string, string[]>();
  for (const b of blocks) {
    if (b.parent) children.set(b.parent, [...(children.get(b.parent) ?? []), b.id]);
  }

  // subtree weight = number of latest votes landing on this block or a descendant
  const ancestors = (id: string): Set<string> => {
    const set = new Set<string>();
    let cur: string | undefined = id;
    while (cur) {
      set.add(cur);
      cur = byId.get(cur)?.parent ?? undefined;
    }
    return set;
  };
  const weight = new Map<string, number>();
  for (const votedBlock of Object.values(votes)) {
    for (const anc of ancestors(votedBlock)) weight.set(anc, (weight.get(anc) ?? 0) + 1);
  }

  let head = rootId;
  for (;;) {
    const kids = children.get(head) ?? [];
    if (kids.length === 0) return head;
    // pick the heaviest child (ties broken by id for determinism)
    head = kids.reduce((best, k) =>
      (weight.get(k) ?? 0) > (weight.get(best) ?? 0) ||
      ((weight.get(k) ?? 0) === (weight.get(best) ?? 0) && k < best)
        ? k
        : best,
    );
  }
}

export type Verdict = "finalized-safe" | "finality-stalled" | "majority-reorg";

export interface ReorgParams {
  attackerShare: number; // 0..1 of validators controlled by the attacker
  blocksUntilFinality: number; // honest blocks after payment before it finalizes
  committee: number; // attesting validators per slot
  totalStakeEth: number; // total ETH staked across the network
}

export interface ReorgResult {
  honestValidators: number;
  attackerValidators: number;
  honestWeight: number; // votes on the honest chain at reveal
  attackerWeight: number; // votes on the secret attacker chain at reveal
  headIsHonest: boolean;
  finalizes: boolean; // does the payment block reach finality?
  verdict: Verdict;
  slashedEth: number; // stake the attacker must burn to revert a finalized block
}

/**
 * Model an attacker who forks just before a payment and races the honest chain
 * to erase it. Honest validators (1−share) build and attest the canonical
 * chain; the attacker's share attests a hidden fork. Resolve via weight +
 * finality + slashing.
 */
export function simulateReorg(p: ReorgParams): ReorgResult {
  const attackerValidators = Math.round(p.attackerShare * p.committee);
  const honestValidators = p.committee - attackerValidators;

  // both chains build for the same number of slots after the fork point
  const slots = p.blocksUntilFinality + 1;
  const honestWeight = honestValidators * slots;
  const attackerWeight = attackerValidators * slots;
  const headIsHonest = honestWeight >= attackerWeight;

  // FFG finality needs ≥2/3 honest participation; the attacker cannot be slashed
  // for finalizing, so finality proceeds iff the attacker holds < 1/3.
  const finalizes = p.attackerShare < 1 / 3 && headIsHonest;

  // reverting a finalized checkpoint requires ≥1/3 of total stake to have
  // attested both sides — all of it slashable.
  const slashedEth = Math.ceil(p.totalStakeEth / 3);

  let verdict: Verdict;
  if (p.attackerShare >= 0.5) verdict = "majority-reorg";
  else if (p.attackerShare >= 1 / 3) verdict = "finality-stalled";
  else verdict = "finalized-safe";

  return {
    honestValidators,
    attackerValidators,
    honestWeight,
    attackerWeight,
    headIsHonest,
    finalizes,
    verdict,
    slashedEth,
  };
}
