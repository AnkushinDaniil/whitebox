import { useEffect, useMemo, useState } from "react";
import { run, parseBytecode, disassemble, type EvmStep } from "@/lib/evm";
import "./evm.css";

const GAS_LIMIT = 100000;

const PRESETS = [
  { name: "(2 + 3) × 4", code: "0x6002600301600402" },
  { name: "store 0x2a → slot 0", code: "0x602a600055600054" },
  { name: "memory & RETURN", code: "0x604260005260206000f3" },
  { name: "countdown loop", code: "0x60036000555b60005415601a57600054600190036000556005565b00" },
];

function dec(hex: string): string | null {
  try {
    const n = BigInt(hex);
    return n < 10n ** 12n ? n.toString(10) : null;
  } catch {
    return null;
  }
}

export default function EvmStepper() {
  const [code, setCode] = useState(PRESETS[0].code);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const { instructions, steps, result, error } = useMemo(() => {
    try {
      const bc = parseBytecode(code);
      const res = run(bc, GAS_LIMIT);
      return { instructions: disassemble(bc), steps: res.steps, result: res, error: null as string | null };
    } catch (e) {
      return { instructions: [], steps: [] as EvmStep[], result: null, error: (e as Error).message };
    }
  }, [code]);

  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [code]);

  const atEnd = stepIdx >= steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStepIdx((i) => Math.min(i + 1, steps.length - 1)), 650);
    return () => clearTimeout(t);
  }, [playing, stepIdx, atEnd, steps.length]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] as EvmStep | undefined;
  const used = step ? GAS_LIMIT - step.gasRemaining : 0;
  const memWords = step && step.memory.length > 2 ? (step.memory.slice(2).match(/.{1,64}/g) ?? []) : [];

  return (
    <div className="evm">
      <div className="evm-top">
        <div className="evm-presets">
          {PRESETS.map((p) => (
            <button key={p.name} type="button"
              className={code === p.code ? "evm-preset active" : "evm-preset"}
              onClick={() => setCode(p.code)}>
              {p.name}
            </button>
          ))}
        </div>
        <input className="evm-bytecode" value={code} spellCheck={false} suppressHydrationWarning
          onChange={(e) => setCode(e.target.value)} aria-label="EVM bytecode" />
        {error && <p className="evm-err">{error}</p>}
      </div>

      <div className="evm-controls">
        <button className="evm-ctl" onClick={() => { setStepIdx(0); setPlaying(false); }} title="Reset">⏮</button>
        <button className="evm-ctl" onClick={() => { setPlaying(false); setStepIdx((i) => Math.max(0, i - 1)); }} disabled={stepIdx === 0}>◀ step</button>
        <button className="evm-ctl play" onClick={() => (atEnd ? (setStepIdx(0), setPlaying(true)) : setPlaying((p) => !p))}>
          {playing ? "⏸ pause" : atEnd ? "↻ replay" : "▶ play"}
        </button>
        <button className="evm-ctl" onClick={() => { setPlaying(false); setStepIdx((i) => Math.min(steps.length - 1, i + 1)); }} disabled={atEnd}>step ▶</button>
        <span className="evm-counter">{steps.length ? stepIdx + 1 : 0} / {steps.length}</span>
      </div>

      <div className="evm-grid">
        {/* program / disassembly */}
        <section className="evm-prog">
          <span className="mono-label">Program</span>
          <ol className="evm-asm">
            {instructions.map((ins) => (
              <li key={ins.pc} className={step && step.pc === ins.pc ? "active" : ""}>
                <span className="pc">{ins.pc.toString(16).padStart(2, "0")}</span>
                <span className="op">{ins.name}</span>
                {ins.push && <span className="imm">{ins.push}</span>}
              </li>
            ))}
          </ol>
        </section>

        {/* machine state */}
        <section className="evm-state">
          <div className="evm-gas">
            <div className="evm-gas-head">
              <span className="mono-label">gas</span>
              <span className="evm-gas-num">
                {used.toLocaleString()} used
                {step && step.gasCost > 0 ? <em> · −{step.gasCost} this op</em> : null}
              </span>
            </div>
            <div className="evm-gas-track"><div className="evm-gas-fill" style={{ width: `${Math.min(100, (used / GAS_LIMIT) * 100)}%` }} /></div>
          </div>

          <div className="evm-panel">
            <span className="mono-label">Stack <em>(top first)</em></span>
            <ul className="evm-stack">
              {step && step.stack.length === 0 && <li className="empty">— empty —</li>}
              {step && [...step.stack].reverse().map((v, i) => {
                const d = dec(v);
                return (
                  <li key={`${step.stack.length - i}-${v}`} className={i === 0 ? "top" : ""}>
                    <span className="si">{step.stack.length - 1 - i}</span>
                    <code>{v}</code>
                    {d && <span className="sd">{d}</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="evm-row2">
            <div className="evm-panel">
              <span className="mono-label">Storage</span>
              {step && step.storage.length === 0 ? (
                <p className="evm-mini-empty">— empty —</p>
              ) : (
                <ul className="evm-storage">
                  {step?.storage.map(([k, v]) => (
                    <li key={k}><code className="sk">{k}</code> → <code className="sv">{v}</code></li>
                  ))}
                </ul>
              )}
            </div>
            <div className="evm-panel">
              <span className="mono-label">Memory</span>
              {memWords.length === 0 ? (
                <p className="evm-mini-empty">— empty —</p>
              ) : (
                <ul className="evm-mem">
                  {memWords.map((w, i) => (
                    <li key={i}><span className="mo">{(i * 32).toString(16).padStart(2, "0")}</span><code>{w}</code></li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {step && (step.halted || step.error || step.returnValue) && (
            <div className={`evm-status ${step.error ? "err" : "ok"}`}>
              {step.error ? `✗ ${step.error}` : step.returnValue ? `✓ halted · RETURN ${step.returnValue}` : "✓ halted"}
              {result && ` · ${result.gasUsed.toLocaleString()} gas total`}
            </div>
          )}
        </section>
      </div>

      <p className="evm-foot">
        A real (faithful-subset) EVM, executed in your browser. Every instruction
        pops and pushes the <strong>256-bit stack</strong>, can touch
        <strong> memory</strong> (cheap, transient) or <strong>storage</strong>
        (expensive, persistent), and burns <strong>gas</strong> until it halts or
        runs out. Edit the bytecode or pick a program and step through it.
      </p>
    </div>
  );
}
