import { useState, type FormEvent } from "react";
import type { PresetEntry } from "./presets";
import { SPARE_ACCOUNTS } from "./presets";

interface Props {
  entries: PresetEntry[];
  secure: boolean;
  onUpsert: (e: PresetEntry) => void;
  onRemove: (key: string) => void;
  onReset: () => void;
  onToggleSecure: () => void;
}

const HEX_RE = /^0x[0-9a-fA-F]{1,64}$/;

export default function TrieControls({
  entries,
  secure,
  onUpsert,
  onRemove,
  onReset,
  onToggleSecure,
}: Props) {
  const [key, setKey] = useState("0xa7c4");
  const [value, setValue] = useState("Erin · 5.0 ETH");
  const [error, setError] = useState<string | null>(null);
  const [spareIdx, setSpareIdx] = useState(0);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!HEX_RE.test(key.trim())) {
      setError("Key must be hex like 0xa7c4 (1–64 hex digits).");
      return;
    }
    if (!value.trim()) {
      setError("Value can't be empty.");
      return;
    }
    setError(null);
    onUpsert({ key: key.trim().toLowerCase(), value: value.trim(), label: value.trim() });
  }

  function addSpare() {
    const spare = SPARE_ACCOUNTS[spareIdx % SPARE_ACCOUNTS.length];
    setKey(spare.key);
    setValue(spare.value);
    onUpsert(spare);
    setSpareIdx((i) => i + 1);
  }

  return (
    <div className="trie-controls">
      <form onSubmit={submit} className="tc-form">
        <div className="tc-field">
          <label htmlFor="tc-key">Account key</label>
          <input
            id="tc-key"
            value={key}
            spellCheck={false}
            onChange={(e) => setKey(e.target.value)}
            placeholder="0xa7c4"
            suppressHydrationWarning
          />
        </div>
        <div className="tc-field grow">
          <label htmlFor="tc-val">Value</label>
          <input
            id="tc-val"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Erin · 5.0 ETH"
            suppressHydrationWarning
          />
        </div>
        <button type="submit" className="tc-primary">
          Insert / edit
        </button>
      </form>

      {error && <p className="tc-error">{error}</p>}

      <div className="tc-actions">
        <button onClick={addSpare} className="tc-ghost" type="button">
          + Add an account
        </button>
        <button onClick={onReset} className="tc-ghost" type="button">
          Reset
        </button>
        <label className="tc-toggle">
          <input type="checkbox" checked={secure} onChange={onToggleSecure} />
          <span>
            Secure trie <em>(hash keys like Ethereum)</em>
          </span>
        </label>
      </div>

      <ul className="tc-entries">
        {entries.map((e) => (
          <li key={e.key}>
            <button
              className="tc-chip"
              type="button"
              onClick={() => {
                setKey(e.key);
                setValue(e.value);
              }}
              title="Load into the editor"
            >
              <code>{e.key}</code>
              <span>{e.value}</span>
            </button>
            <button
              className="tc-remove"
              type="button"
              aria-label={`Remove ${e.key}`}
              onClick={() => onRemove(e.key)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
