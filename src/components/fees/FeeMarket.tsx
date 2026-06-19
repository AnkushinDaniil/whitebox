import { useMemo, useState } from "react";
import { simulate, gasTarget, feeSplit } from "@/lib/fees";
import "./feemarket.css";

const GAS_LIMIT = 30_000_000n;
const GWEI = 1_000_000_000n;
const START = 30n * GWEI;
const N = 12;

// fullness levels a block can cycle through (fraction of gas limit)
const LEVELS = [0, 0.25, 0.5, 0.75, 1];
const PRESETS: Record<string, number[]> = {
  "demand spike": [0.5, 0.5, 1, 1, 1, 1, 0.75, 0.5, 0.25, 0.25, 0.5, 0.5],
  congested: Array(N).fill(1),
  calm: Array(N).fill(0.5),
  draining: Array(N).fill(0),
};

const toGwei = (wei: bigint) => Number(wei) / 1e9;

export default function FeeMarket() {
  const [fullness, setFullness] = useState<number[]>(PRESETS["demand spike"]);

  const series = useMemo(() => {
    const used = fullness.map((f) => BigInt(Math.round(f * Number(GAS_LIMIT))));
    return simulate(START, GAS_LIMIT, used); // length N+1
  }, [fullness]);

  const feesGwei = series.map(toGwei);
  const maxFee = Math.max(...feesGwei, toGwei(START)) * 1.1;
  const minFee = Math.min(...feesGwei) * 0.9;
  const currentBaseFee = series[series.length - 1];

  // a sample tx to show the burn/tip split at the current base fee
  const split = feeSplit(currentBaseFee, currentBaseFee + 3n * GWEI, 2n * GWEI);
  const targetPct = Number(gasTarget(GAS_LIMIT)) / Number(GAS_LIMIT); // 0.5

  // chart geometry (viewBox units)
  const W = 720;
  const H = 230;
  const padL = 44, padR = 12, padT = 12, padB = 64;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const x = (i: number) => padL + (plotW * i) / N;
  const yFee = (g: number) => padT + plotH - (plotH * (g - minFee)) / (maxFee - minFee || 1);
  const barTop = H - padB + 8;
  const barH = padB - 16;

  const linePts = feesGwei.map((g, i) => `${x(i)},${yFee(g)}`).join(" ");

  function cycle(i: number) {
    setFullness((prev) => {
      const cur = prev[i];
      const idx = LEVELS.indexOf(cur);
      const next = LEVELS[(idx + 1) % LEVELS.length];
      return prev.map((v, j) => (j === i ? next : v));
    });
  }

  return (
    <div className="fm">
      <div className="fm-presets">
        <span className="mono-label">demand</span>
        {Object.keys(PRESETS).map((p) => (
          <button key={p} className="fm-preset" type="button" onClick={() => setFullness(PRESETS[p])}>
            {p}
          </button>
        ))}
        <span className="fm-hint">— or click any block to change how full it is</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="fm-svg" role="img" aria-label="Base fee response to block fullness">
        {/* base fee axis labels */}
        <text x={padL - 8} y={yFee(maxFee / 1.1)} className="fm-axis" textAnchor="end">{Math.round(maxFee / 1.1)}</text>
        <text x={padL - 8} y={yFee(minFee)} className="fm-axis" textAnchor="end">{Math.round(minFee)}</text>
        <text x={6} y={padT + plotH / 2} className="fm-axis vert">gwei</text>

        {/* base fee area + line */}
        <polyline points={`${padL},${padT + plotH} ${linePts} ${x(N)},${padT + plotH}`} className="fm-area" />
        <polyline points={linePts} className="fm-line" />
        {feesGwei.map((g, i) => (
          <circle key={i} cx={x(i)} cy={yFee(g)} r="3" className="fm-dot" />
        ))}

        {/* fullness bars (clickable) */}
        <line x1={padL} y1={barTop + barH * (1 - targetPct)} x2={W - padR} y2={barTop + barH * (1 - targetPct)} className="fm-target" />
        <text x={W - padR} y={barTop + barH * (1 - targetPct) - 3} className="fm-axis" textAnchor="end">target · 50%</text>
        {fullness.map((f, i) => {
          const bw = (plotW / N) * 0.62;
          const cls = f > targetPct ? "over" : f < targetPct ? "under" : "at";
          return (
            <g key={i} className={`fm-bar ${cls}`} onClick={() => cycle(i)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycle(i); } }}>
              <rect x={x(i) - bw / 2} y={barTop} width={bw} height={barH} className="fm-bar-track" rx="2" />
              <rect x={x(i) - bw / 2} y={barTop + barH * (1 - f)} width={bw} height={barH * f} className="fm-bar-fill" rx="2" />
            </g>
          );
        })}
      </svg>

      <div className="fm-readouts">
        <div className="fm-stat">
          <span className="k">base fee now</span>
          <span className="v">{toGwei(currentBaseFee).toFixed(2)} <em>gwei</em></span>
        </div>
        <div className="fm-stat">
          <span className="k">burned / gas</span>
          <span className="v burn">{toGwei(split.burned).toFixed(2)} <em>gwei</em></span>
        </div>
        <div className="fm-stat">
          <span className="k">tip → proposer / gas</span>
          <span className="v tip">{toGwei(split.tip).toFixed(2)} <em>gwei</em></span>
        </div>
      </div>

      <p className="fm-foot">
        The base fee isn't an auction — it's a controller. Each block, it moves
        <strong> ±12.5% at most</strong>, up when the previous block was over half
        full and down when under, steering the chain toward <strong>50% full</strong>.
        And it's <strong>burned</strong>, not paid to anyone. Senders add a
        <em> priority tip</em> on top to compete for ordering.
      </p>
    </div>
  );
}
