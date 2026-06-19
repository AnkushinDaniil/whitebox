import { useMemo, useState } from "react";
import {
  type Signature,
  addressOf,
  publicKey,
  signMessage,
  recoverMessageSigner,
  randomPrivateKey,
  hexToBytes,
  bytesToHex,
} from "@/lib/sig";
import "./keylab.css";

const DEMO_PRIV = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318";
const PRIV_RE = /^0x[0-9a-fA-F]{64}$/;

function short(hex: string, head = 10, tail = 8): string {
  return hex.length > head + tail + 1 ? `${hex.slice(0, head)}…${hex.slice(-tail)}` : hex;
}

export default function KeyLab() {
  const [priv, setPriv] = useState(DEMO_PRIV);
  const [message, setMessage] = useState("I authorize sending 1 ETH to Alice.");
  const [signed, setSigned] = useState<{ sig: Signature; message: string } | null>(null);

  const key = useMemo(() => {
    try {
      const t = priv.trim();
      if (!PRIV_RE.test(t)) throw new Error("private key must be 32 bytes (0x + 64 hex)");
      const pk = hexToBytes(t);
      return { pk, address: addressOf(pk), pub: bytesToHex(publicKey(pk)), error: null as string | null };
    } catch (e) {
      return { pk: null, address: null, pub: null, error: (e as Error).message };
    }
  }, [priv]);

  const tampered = signed !== null && message !== signed.message;
  const recovered = signed && key.pk ? recoverMessageSigner(message, signed.sig) : null;
  const matches = recovered !== null && recovered === key.address && !tampered;

  function sign() {
    if (!key.pk) return;
    setSigned({ sig: signMessage(message, key.pk).sig, message });
  }
  function roll() {
    setPriv(bytesToHex(randomPrivateKey()));
    setSigned(null);
  }

  return (
    <div className="kl">
      {/* the keypair pipeline */}
      <section className="kl-pipe">
        <div className="kl-node secret">
          <div className="kl-node-head">
            <span className="kl-tag">private key</span>
            <button className="kl-roll" type="button" onClick={roll} title="Generate a new random key">
              ⟳ roll
            </button>
          </div>
          <input
            className="kl-priv"
            value={priv}
            spellCheck={false}
            suppressHydrationWarning
            onChange={(e) => { setPriv(e.target.value); setSigned(null); }}
          />
          <span className="kl-sub secret">secret · 256-bit random number · never share</span>
        </div>

        <Arrow label="× G  (curve math)" />

        <div className="kl-node">
          <span className="kl-tag">public key</span>
          <code className="kl-val">{key.pub ? short(key.pub, 12, 10) : "—"}</code>
          <span className="kl-sub">a point on secp256k1 · shareable</span>
        </div>

        <Arrow label="keccak256 · [−20:]" />

        <div className="kl-node addr">
          <span className="kl-tag">address</span>
          <code className="kl-val accent">{key.address ? short(key.address, 10, 8) : "—"}</code>
          <span className="kl-sub">last 20 bytes · this is "you"</span>
        </div>
      </section>
      {key.error && <p className="kl-err">{key.error}</p>}
      <p className="kl-oneway">→ One-way only. Public key and address are derived from the private key; you can't run the arrows backward.</p>

      {/* sign + recover */}
      <section className="kl-sign">
        <label className="kl-mlabel">Message to sign</label>
        <textarea
          className="kl-msg"
          rows={2}
          value={message}
          spellCheck={false}
          suppressHydrationWarning
          onChange={(e) => setMessage(e.target.value)}
        />

        <button className="kl-btn" type="button" onClick={sign} disabled={!key.pk}>
          {signed ? "Re-sign" : "✶ Sign with the private key"}
        </button>

        {signed && (
          <div className="kl-result">
            <div className="kl-sigvals">
              <span><em>r</em> <code>{short("0x" + signed.sig.r.toString(16), 8, 6)}</code></span>
              <span><em>s</em> <code>{short("0x" + signed.sig.s.toString(16), 8, 6)}</code></span>
              <span><em>v</em> <code>{27 + signed.sig.yParity}</code></span>
            </div>

            <div className={`kl-recover ${matches ? "ok" : "bad"}`}>
              <span className="kl-recover-label">↻ signer recovered from the signature alone</span>
              <code className="kl-recover-addr">{recovered ? short(recovered, 10, 8) : "—"}</code>
              {matches ? (
                <span className="kl-verdict ok">✓ matches the address above — verified, no private key needed</span>
              ) : (
                <span className="kl-verdict bad">⚠ message changed after signing — recovers a stranger</span>
              )}
            </div>
          </div>
        )}
      </section>

      <p className="kl-foot">
        This is a <strong>signature</strong>, not encryption. The message stays
        public — anyone can read it; the signature only proves <em>who wrote it</em>
        and that it wasn't altered. Encryption (hiding the contents) is the other
        use of the same keypair math, and Ethereum doesn't do it to transactions.
        Real secp256k1 + EIP-191, computed in your browser.
      </p>
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="kl-arrow" aria-hidden="true">
      <span className="kl-arrow-line" />
      <span className="kl-arrow-label">{label}</span>
    </div>
  );
}
