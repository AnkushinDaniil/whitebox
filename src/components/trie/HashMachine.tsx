import { useEffect, useMemo, useRef, useState } from "react";
import { keccak256, utf8ToBytes, bytesToHex } from "@/lib/mpt";
import "./hashmachine.css";

/**
 * A mechanical view of keccak256: bytes drop into the hopper, the rotor churns,
 * and a fixed 32-byte fingerprint falls into the tray. The avalanche button
 * makes the defining property physical — nudge one character, watch almost
 * every output byte flip.
 */
export default function HashMachine() {
  const [input, setInput] = useState("Alice · 12.0 ETH");
  const [churning, setChurning] = useState(false);
  const prev = useRef<Uint8Array | null>(null);

  const inputBytes = useMemo(() => utf8ToBytes(input), [input]);
  const digest = useMemo(() => keccak256(inputBytes), [inputBytes]);

  // Which output bytes changed since the last input (drives the cell flash).
  const changed = useMemo(() => {
    const set = new Set<number>();
    const before = prev.current;
    if (before) {
      for (let i = 0; i < 32; i++) if (before[i] !== digest[i]) set.add(i);
    }
    return set;
  }, [digest]);

  const changedCount = changed.size;

  useEffect(() => {
    prev.current = digest;
    setChurning(true);
    const t = setTimeout(() => setChurning(false), 650);
    return () => clearTimeout(t);
  }, [digest]);

  function nudge() {
    // Increment the final character by one code point — a one-bit-ish change.
    if (!input.length) return setInput("a");
    const last = input.codePointAt(input.length - 1)!;
    const bumped = String.fromCodePoint(last + 1);
    setInput(input.slice(0, input.length - 1) + bumped);
  }

  return (
    <div className="hashm">
      {/* INPUT */}
      <section className="hm-stage hm-input">
        <span className="hm-label">Input</span>
        <input
          className="hm-text"
          value={input}
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Data to hash"
          suppressHydrationWarning
        />
        <div className="hm-bytes" aria-hidden="true">
          {Array.from(inputBytes.slice(0, 22)).map((b, i) => (
            <span key={i} className="hm-byte" style={{ animationDelay: `${i * 40}ms` }}>
              {b.toString(16).padStart(2, "0")}
            </span>
          ))}
          {inputBytes.length > 22 && <span className="hm-more">+{inputBytes.length - 22}</span>}
        </div>
        <span className="hm-sub">
          {inputBytes.length} byte{inputBytes.length === 1 ? "" : "s"} in · any length
        </span>
      </section>

      {/* ROTOR */}
      <section className="hm-stage hm-rotor">
        <Gears churning={churning} />
        <span className="hm-rotor-label">keccak256</span>
        <span className="hm-sub">256-bit sponge · always 32 bytes out</span>
      </section>

      {/* OUTPUT */}
      <section className="hm-stage hm-output">
        <div className="hm-output-head">
          <span className="hm-label">Digest · 32 bytes</span>
          {changedCount > 0 && (
            <span className="hm-avalanche" key={bytesToHex(digest)}>
              {changedCount}/32 bytes flipped
            </span>
          )}
        </div>
        <div className="hm-grid">
          {Array.from(digest).map((b, i) => (
            <span
              key={i}
              className={changed.has(i) ? "hm-cell flip" : "hm-cell"}
              style={{ animationDelay: `${(i % 16) * 18}ms` }}
            >
              {b.toString(16).padStart(2, "0")}
            </span>
          ))}
        </div>
        <code className="hm-hex">{bytesToHex(digest)}</code>
      </section>

      <div className="hm-controls">
        <button type="button" className="hm-btn" onClick={nudge}>
          ⚡ Nudge one character
        </button>
        <span className="hm-hint">
          One tiny change in → a totally different fingerprint out. That's the
          avalanche, and it's why a single edited balance rewrites the whole path
          of hashes up to the state root.
        </span>
      </div>
    </div>
  );
}

function Gears({ churning }: { churning: boolean }) {
  return (
    <svg viewBox="0 0 140 90" className={churning ? "hm-gears churn" : "hm-gears"} aria-hidden="true">
      <defs>
        <radialGradient id="hmMetal" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#2c3444" />
          <stop offset="0.55" stopColor="#1b2029" />
          <stop offset="1" stopColor="#0f131a" />
        </radialGradient>
        <radialGradient id="hmHub" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#0d1015" />
          <stop offset="1" stopColor="#04161b" />
        </radialGradient>
      </defs>
      <Gear cx={46} cy={45} r={26} teeth={10} className="g1" />
      <Gear cx={92} cy={34} r={18} teeth={8} className="g2" />
      <Gear cx={98} cy={66} r={14} teeth={7} className="g3" />
    </svg>
  );
}

function Gear({
  cx,
  cy,
  r,
  teeth,
  className,
}: {
  cx: number;
  cy: number;
  r: number;
  teeth: number;
  className: string;
}) {
  // Round to 2 decimals so server-rendered and client-rendered SVG attributes
  // are byte-identical strings — full-precision floats from Math.cos/sin differ
  // in their last digit across engines and trigger React hydration mismatches.
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const tooth = (i: number) => {
    const a = (i / teeth) * Math.PI * 2;
    const x1 = r2(cx + Math.cos(a) * r);
    const y1 = r2(cy + Math.sin(a) * r);
    const x2 = r2(cx + Math.cos(a) * (r + 5));
    const y2 = r2(cy + Math.sin(a) * (r + 5));
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="gear-tooth" />;
  };
  return (
    <g className={`gear ${className}`} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={r} className="gear-body" />
      <circle cx={cx} cy={cy} r={r2(r * 0.38)} className="gear-hub" />
      {Array.from({ length: teeth }, (_, i) => tooth(i))}
    </g>
  );
}
