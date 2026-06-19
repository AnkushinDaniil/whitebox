import { useId, useState, type FormEvent } from "react";
import { activeAdapter, isValidEmail } from "@/lib/email/adapter";
import "./EmailCapture.css";

interface Props {
  /** which explorable/page this lives on, for later segmentation */
  source?: string;
  /** override the default heading */
  heading?: string;
  blurb?: string;
}

type Status = "idle" | "submitting" | "ok" | "error";

export default function EmailCapture({
  source,
  heading = "Get the next explorable",
  blurb = "One practitioner's note when something new ships — a new explorable, or a plain-English read on what changed in the protocol. No noise.",
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const inputId = useId();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("That doesn't look like a valid email.");
      return;
    }
    setStatus("submitting");
    const res = await activeAdapter.subscribe({ email, source });
    setStatus(res.ok ? "ok" : "error");
    setMessage(res.message);
    if (res.ok) setEmail("");
  }

  return (
    <aside className="email-capture" aria-labelledby={`${inputId}-h`}>
      <div className="ec-glow" aria-hidden="true" />
      <div className="ec-content">
        <p className="ec-eyebrow">Whitebox · Notes</p>
        <h3 id={`${inputId}-h`} className="ec-heading">
          {heading}
        </h3>
        <p className="ec-blurb">{blurb}</p>

        {status === "ok" ? (
          <p className="ec-success" role="status">
            <span className="check" aria-hidden="true">
              ✓
            </span>
            {message}
          </p>
        ) : (
          <form className="ec-form" onSubmit={onSubmit} noValidate>
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <input
              id={inputId}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@node.eth"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              aria-invalid={status === "error"}
              disabled={status === "submitting"}
              suppressHydrationWarning
            />
            <button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "…" : "Subscribe"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="ec-error" role="alert">
            {message}
          </p>
        )}
      </div>
    </aside>
  );
}
