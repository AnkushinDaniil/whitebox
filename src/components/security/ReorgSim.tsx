import { useMemo, useState } from "react";
import { simulateReorg } from "@/lib/forkchoice";
import "./reorgsim.css";

const COMMITTEE = 100;
const TOTAL_STAKE_ETH = 34_000_000;
const LANE = 4; // blocks shown per lane

export default function ReorgSim() {
  const [share, setShare] = useState(0.3);
  const [revealed, setRevealed] = useState(false);

  const r = useMemo(
    () =>
      simulateReorg({
        attackerShare: share,
        blocksUntilFinality: LANE - 1,
        committee: COMMITTEE,
        totalStakeEth: TOTAL_STAKE_ETH,
      }),
    [share],
  );

  const pct = Math.round(share * 100);
  const honestPct = 100 - pct;
  const maxW = Math.max(r.honestWeight, r.attackerWeight, 1);

  const verdict = {
    "finalized-safe": {
      cls: "ok",
      title: "✓ Double-spend defeated",
      body: `Honest validators hold ${honestPct}% — the majority. Fork choice keeps the honest chain, your payment finalizes in ~13 minutes, and reverting a finalized block would require burning ≥${r.slashedEth.toLocaleString()} ETH of stake (~$${Math.round((r.slashedEth * 3000) / 1e9)}B). No attacker pays that to steal one coffee.`,
    },
    "finality-stalled": {
      cls: "warn",
      title: "⚠ Liveness attack — but no theft",
      body: `With ${pct}% (over ⅓) the attacker can stall finality: checkpoints can't reach the ⅔ supermajority, so your payment stays unconfirmed. But the honest chain is still heavier — the attacker can't reorg it. The chain halts rather than lies. Merchants simply keep waiting.`,
    },
    "majority-reorg": {
      cls: "bad",
      title: "✗ Majority attack",
      body: `Above 50% the attacker's secret fork out-weighs the honest chain and can reorg unfinalized blocks — so accepting a payment instantly is unsafe, but anyone who waited for finality is still protected (reverting that costs ≥${r.slashedEth.toLocaleString()} ETH). Acquiring >50% of stake costs tens of billions, all of it slashable. The defense is economic, not magical.`,
    },
  }[r.verdict];

  const lockHonest = r.finalizes && revealed;

  return (
    <div className="rs">
      <div className="rs-control">
        <label className="rs-slabel">
          Validators the attacker controls: <strong>{pct}%</strong>
          <span className="rs-honest"> · honest {honestPct}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => {
            setShare(Number(e.target.value) / 100);
            setRevealed(false);
          }}
          className="rs-range"
          suppressHydrationWarning
        />
        <div className="rs-thresholds" aria-hidden="true">
          <span style={{ left: "33%" }}>⅓ finality</span>
          <span style={{ left: "50%" }}>½ reorg</span>
        </div>
      </div>

      <div className="rs-stage">
        {/* honest chain */}
        <div className="rs-lane honest">
          <div className="rs-lane-head">
            <span className="rs-lane-tag">honest chain</span>
            {revealed && (
              <span className={`rs-head-badge ${r.headIsHonest ? "show" : ""}`}>◀ HEAD</span>
            )}
          </div>
          <div className="rs-blocks">
            {Array.from({ length: LANE }, (_, i) => (
              <div key={i} className="rs-block honest" style={{ animationDelay: `${i * 70}ms` }}>
                <span className="rs-bnum">#{i + 1}</span>
                {i === 0 && <span className="rs-pay">💰 your payment</span>}
                {lockHonest && <span className="rs-lock" style={{ animationDelay: `${600 + i * 120}ms` }}>🔒</span>}
              </div>
            ))}
          </div>
          <Weight value={r.honestWeight} max={maxW} cls="honest" label={`${r.honestValidators} validators × ${LANE} slots`} />
        </div>

        <div className="rs-fork">forks here ↓ (just before your payment)</div>

        {/* attacker chain */}
        <div className={`rs-lane attacker ${revealed ? "revealed" : "hidden"}`}>
          <div className="rs-lane-head">
            <span className="rs-lane-tag">attacker's secret fork</span>
            {revealed && !r.headIsHonest && <span className="rs-head-badge show bad">◀ HEAD</span>}
          </div>
          <div className="rs-blocks">
            {Array.from({ length: LANE }, (_, i) => (
              <div key={i} className="rs-block attacker" style={{ animationDelay: `${i * 70}ms` }}>
                <span className="rs-bnum">#{i + 1}′</span>
                {i === 0 && <span className="rs-nopay">no payment</span>}
              </div>
            ))}
          </div>
          {revealed && <Weight value={r.attackerWeight} max={maxW} cls="attacker" label={`${r.attackerValidators} validators × ${LANE} slots`} />}
        </div>
      </div>

      {!revealed ? (
        <button className="rs-btn" type="button" onClick={() => setRevealed(true)}>
          ▶ Reveal the attack
        </button>
      ) : (
        <div className={`rs-verdict ${verdict.cls}`} key={r.verdict}>
          <strong>{verdict.title}</strong>
          <p>{verdict.body}</p>
        </div>
      )}

      <p className="rs-foot">
        Three layers stop a double-spend: a <strong>nonce</strong> blocks re-spending
        from one account; <strong>fork choice</strong> (LMD-GHOST) makes the
        heaviest-attested chain canonical so a minority fork loses; and
        <strong> finality + slashing</strong> (Casper-FFG) make reversing a
        finalized block cost a third of all staked ETH. Security is economic — and
        the numbers are enormous.
      </p>
    </div>
  );
}

function Weight({ value, max, cls, label }: { value: number; max: number; cls: string; label: string }) {
  return (
    <div className="rs-weight">
      <div className="rs-weight-track">
        <div className={`rs-weight-fill ${cls}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="rs-weight-num">{value} votes <em>· {label}</em></span>
    </div>
  );
}
