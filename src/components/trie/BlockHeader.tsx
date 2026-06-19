interface Props {
  stateRoot: string;
  /** previous root, to show that an edit produced a brand-new root */
  prevRoot: string | null;
  changed: boolean;
}

/**
 * A miniature block header showing where stateRoot lands among the header
 * fields — driving home that one storage edit changes the block's identity.
 */
const FIELDS = [
  "parentHash",
  "stateRoot",
  "transactionsRoot",
  "receiptsRoot",
  "number",
  "timestamp",
] as const;

export default function BlockHeader({ stateRoot, prevRoot, changed }: Props) {
  return (
    <div className="block-header">
      <div className="bh-head">
        <span className="mono-label">Block header</span>
        <span className="bh-sub">where the root lands</span>
      </div>
      <ul className="bh-fields">
        {FIELDS.map((f) => {
          const isState = f === "stateRoot";
          return (
            <li key={f} className={isState ? "bh-field state" : "bh-field"}>
              <span className="bh-key">{f}</span>
              {isState ? (
                <span className={changed ? "bh-val root changed" : "bh-val root"}>
                  {stateRoot.slice(0, 14)}…
                </span>
              ) : (
                <span className="bh-val muted">0x…</span>
              )}
            </li>
          );
        })}
      </ul>
      {changed && prevRoot && prevRoot !== stateRoot && (
        <p className="bh-delta">
          <span className="old">{prevRoot.slice(0, 10)}…</span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
          <span className="new">{stateRoot.slice(0, 10)}…</span>
          <span className="note">new state root</span>
        </p>
      )}
    </div>
  );
}
