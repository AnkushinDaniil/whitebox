import { useId, useState, type FormEvent } from "react";
import { activeAdapter, isValidEmail } from "@/lib/email/adapter";
import { ui } from "@/i18n/ui";
import type { Lang } from "@/i18n/ui";
import "./EmailCapture.css";

interface Props {
  /** which explorable/page this lives on, for later segmentation */
  source?: string;
  /** override the default heading */
  heading?: string;
  blurb?: string;
  lang?: Lang;
}

type Status = "idle" | "submitting" | "ok" | "error";

export default function EmailCapture({ source, heading, blurb, lang = "en" }: Props) {
  const t = ui[lang].email;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const inputId = useId();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage(t.invalid);
      return;
    }
    setStatus("submitting");
    const res = await activeAdapter.subscribe({ email, source });
    setStatus(res.ok ? "ok" : "error");
    setMessage(res.ok ? t.success : res.message);
    if (res.ok) setEmail("");
  }

  return (
    <aside className="email-capture" aria-labelledby={`${inputId}-h`}>
      <div className="ec-glow" aria-hidden="true" />
      <div className="ec-content">
        <p className="ec-eyebrow">{t.eyebrow}</p>
        <h3 id={`${inputId}-h`} className="ec-heading">
          {heading ?? t.heading}
        </h3>
        <p className="ec-blurb">{blurb ?? t.blurb}</p>

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
              {t.emailLabel}
            </label>
            <input
              id={inputId}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t.placeholder}
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
              {status === "submitting" ? "…" : t.subscribe}
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
