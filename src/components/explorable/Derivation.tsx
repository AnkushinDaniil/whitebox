import { useState, type ReactNode } from "react";
import "./derivation.css";

export interface DerivationStep {
  /** short label for the progress rail */
  label: string;
  /** heading for this stage of the design */
  title: string;
  /** what this design is / how it works */
  idea: ReactNode;
  /** the disadvantage that motivates the next step (omit on the final design) */
  flaw?: ReactNode;
  /** short verb for the "advance" button, e.g. "Hash it" */
  fix?: string;
  /** the diagram for this stage */
  visual: ReactNode;
}

/**
 * A constructive-derivation stepper: start from the dumbest design, watch it
 * break, fix the break, repeat — until the real design is obvious. Each step
 * shows a visual, the idea, and the flaw that forces the next step.
 */
export default function Derivation({ steps }: { steps: DerivationStep[] }) {
  const [i, setI] = useState(0);
  const step = steps[i];
  const atEnd = i === steps.length - 1;

  return (
    <div className="drv">
      <ol className="drv-rail">
        {steps.map((s, n) => (
          <li key={n} className={n === i ? "active" : n < i ? "done" : ""}>
            <button type="button" onClick={() => setI(n)}>
              <span className="drv-dot">{n + 1}</span>
              <span className="drv-rlabel">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="drv-stage" key={i}>
        {step.visual}
      </div>

      <div className="drv-caption">
        <h4 className="drv-title">{step.title}</h4>
        <p className="drv-idea">{step.idea}</p>
        {step.flaw && (
          <p className="drv-flaw">
            <span className="drv-x">✗ the catch</span>
            {step.flaw}
          </p>
        )}
        {atEnd && (
          <p className="drv-done">
            ✓ And there's the real design — every piece now obvious, because you
            watched it become necessary.
          </p>
        )}
      </div>

      <div className="drv-nav">
        <button className="drv-btn ghost" type="button" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
          ◀ back
        </button>
        <span className="drv-count">{i + 1} / {steps.length}</span>
        <button
          className="drv-btn"
          type="button"
          onClick={() => setI(Math.min(steps.length - 1, i + 1))}
          disabled={atEnd}
        >
          {step.fix ? `${step.fix} →` : "next →"}
        </button>
      </div>
    </div>
  );
}
