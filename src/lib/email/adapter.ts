/**
 * Pluggable email-capture adapter. Milestone 1 ships a local no-op default so
 * the UX is real and testable without committing to a provider. Wiring a real
 * provider later = implement this interface and swap `activeAdapter`.
 *
 * Designed so the same capture component can later feed the hardfork-readiness
 * product funnel (segment by source/explorable).
 */

export interface SubscribeInput {
  email: string;
  /** which explorable/page the capture happened on (for later segmentation) */
  source?: string;
}

export interface SubscribeResult {
  ok: boolean;
  message: string;
}

export interface EmailAdapter {
  readonly id: string;
  subscribe(input: SubscribeInput): Promise<SubscribeResult>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/**
 * Default adapter: validates and persists to localStorage so the flow is fully
 * exercisable in a static build. Replace with Buttondown/Kit/Resend later.
 */
const localAdapter: EmailAdapter = {
  id: "local-stub",
  async subscribe({ email, source }) {
    if (!isValidEmail(email)) {
      return { ok: false, message: "That doesn't look like a valid email." };
    }
    try {
      if (typeof localStorage !== "undefined") {
        const key = "whitebox:subscribers";
        const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
        existing.push({ email: email.trim(), source: source ?? null, at: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(existing));
      }
    } catch {
      // non-fatal: capture UX still succeeds
    }
    return { ok: true, message: "You're in. I'll send the next note when it ships." };
  },
};

/** Swap this to wire a real provider (e.g. an Astro endpoint + Buttondown). */
export const activeAdapter: EmailAdapter = localAdapter;
