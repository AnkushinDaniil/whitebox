import { useMemo, useState, type ReactNode } from "react";
import {
  type TxFields,
  type Signature,
  signingHash,
  signTx,
  txHash,
  recoverSender,
  privateKeyToAddress,
  hexToBytes,
  bytesToHex,
} from "@/lib/tx";
import "./txsigner.css";

// Anvil/Hardhat account #0 — a universally-known THROWAWAY demo key.
const PRIV = hexToBytes("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const ADDR = privateKeyToAddress(PRIV);
const DEMO_TO = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // anvil account #1

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

function parseEther(s: string): bigint {
  const t = s.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) throw new Error("value must be a number");
  const [whole, frac = ""] = t.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt((frac + "0".repeat(18)).slice(0, 18));
}

function short(hex: string, head = 10, tail = 6): string {
  return hex.length > head + tail + 1 ? `${hex.slice(0, head)}…${hex.slice(-tail)}` : hex;
}

export default function TxSigner() {
  const [to, setTo] = useState(DEMO_TO);
  const [valueEth, setValueEth] = useState("1.0");
  const [nonce, setNonce] = useState("0");
  const [signed, setSigned] = useState<{ sig: Signature; hash: string } | null>(null);

  const parsed = useMemo(() => {
    try {
      if (!ADDR_RE.test(to.trim())) throw new Error("recipient must be a 20-byte address");
      if (!/^\d+$/.test(nonce.trim())) throw new Error("nonce must be a whole number");
      const tx: TxFields = {
        chainId: 1n,
        nonce: BigInt(nonce.trim()),
        maxPriorityFeePerGas: 1_000_000_000n,
        maxFeePerGas: 30_000_000_000n,
        gasLimit: 21000n,
        to: hexToBytes(to.trim()),
        value: parseEther(valueEth),
        data: new Uint8Array(0),
      };
      return { tx, hash: bytesToHex(signingHash(tx)), error: null as string | null };
    } catch (e) {
      return { tx: null, hash: null, error: (e as Error).message };
    }
  }, [to, valueEth, nonce]);

  const tampered = signed !== null && parsed.hash !== null && parsed.hash !== signed.hash;
  const recovered =
    signed && parsed.tx ? recoverSender(signingHash(parsed.tx), signed.sig) : null;
  const matches = recovered === ADDR && !tampered;
  const finalTxHash = signed && parsed.tx && !tampered ? txHash(parsed.tx, signed.sig) : null;

  function sign() {
    if (!parsed.tx || !parsed.hash) return;
    setSigned({ sig: signTx(parsed.tx, PRIV), hash: parsed.hash });
  }

  return (
    <div className="txs">
      {/* wallet */}
      <div className="txs-wallet">
        <span className="mono-label">Your wallet</span>
        <code className="txs-addr">{ADDR}</code>
        <span className="txs-fine">
          private key <code>0xac09…ff80</code> · a public throwaway demo key
        </span>
      </div>

      <div className="txs-grid">
        {/* the transaction */}
        <section className="txs-tx">
          <span className="mono-label">The transaction</span>
          <div className="txs-fields">
            <Field label="to" hint="recipient (20-byte address)">
              <input value={to} spellCheck={false} suppressHydrationWarning
                onChange={(e) => setTo(e.target.value)} />
            </Field>
            <div className="txs-row2">
              <Field label="value" hint="ETH">
                <input value={valueEth} spellCheck={false} suppressHydrationWarning
                  onChange={(e) => setValueEth(e.target.value)} />
              </Field>
              <Field label="nonce" hint="tx count">
                <input value={nonce} spellCheck={false} suppressHydrationWarning
                  onChange={(e) => setNonce(e.target.value)} />
              </Field>
            </div>
          </div>
          <ul className="txs-fixed">
            <li><span>chainId</span><code>1</code></li>
            <li><span>maxFeePerGas</span><code>30 gwei</code></li>
            <li><span>gasLimit</span><code>21000</code></li>
            <li className="txs-nofrom">no <code>from</code> field →</li>
          </ul>
          {parsed.error && <p className="txs-err">{parsed.error}</p>}
        </section>

        {/* sign + recover */}
        <section className="txs-sign">
          <div className="txs-hashrow">
            <span className="mono-label">Signing hash · keccak256(0x02 ‖ rlp(tx))</span>
            <code className={`txs-hash ${tampered ? "moved" : ""}`}>
              {parsed.hash ? short(parsed.hash, 12, 8) : "—"}
            </code>
          </div>

          <button className="txs-btn" onClick={sign} disabled={!parsed.tx}>
            {signed ? "Re-sign" : "✶ Sign with the private key"}
          </button>

          {signed && (
            <div className="txs-sig">
              <div className="txs-sigvals">
                <span><em>r</em> <code>{short("0x" + signed.sig.r.toString(16), 8, 6)}</code></span>
                <span><em>s</em> <code>{short("0x" + signed.sig.s.toString(16), 8, 6)}</code></span>
                <span><em>yParity</em> <code>{signed.sig.yParity}</code></span>
              </div>

              <div className={`txs-recover ${matches ? "ok" : "bad"}`}>
                <span className="txs-recover-label">
                  ↻ sender recovered from signature
                </span>
                <code className="txs-recover-addr">{recovered ? short(recovered, 12, 8) : "—"}</code>
                {matches ? (
                  <span className="txs-verdict ok">✓ it's you — no <code>from</code> needed</span>
                ) : (
                  <span className="txs-verdict bad">
                    ⚠ tampered — signature now recovers a stranger, not you
                  </span>
                )}
              </div>

              {finalTxHash && (
                <div className="txs-txhash">
                  <span className="mono-label">Transaction hash</span>
                  <code>{short(finalTxHash, 14, 8)}</code>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <p className="txs-foot">
        Real secp256k1 ECDSA + EIP-1559 RLP, computed in your browser. Edit any
        field <em>after</em> signing: the signature only authorizes the exact
        bytes it signed, so the recovered sender turns into a stranger — that's
        the whole security model.
      </p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <label className="txs-field">
      <span className="txs-flabel">{label} <em>{hint}</em></span>
      {children}
    </label>
  );
}
