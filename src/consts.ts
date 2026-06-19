export const SITE = {
  name: "Whitebox",
  domain: "whitebox.dev",
  url: "https://whitebox.dev",
  tagline: "How Ethereum actually works, made transparent.",
  description:
    "Interactive, explorable explanations of how Ethereum really works — cryptography, state, the EVM, consensus, and networking — for engineers who want real depth, not hand-waving.",
  author: "Whitebox",
  email: "hello@whitebox.dev",
  twitter: "@whitebox",
} as const;

/** The four depth tiers every explorable layers, in order. */
export const DEPTH_TIERS = ["intuition", "mechanism", "spec", "deeper"] as const;
export type DepthTier = (typeof DEPTH_TIERS)[number];

export const DEPTH_META: Record<
  DepthTier,
  { label: string; n: string; blurb: string }
> = {
  intuition: { label: "Intuition", n: "01", blurb: "The picture in your head" },
  mechanism: { label: "Mechanism", n: "02", blurb: "How it actually works" },
  spec: { label: "Spec & Code", n: "03", blurb: "Grounded in the real thing" },
  deeper: { label: "Go Deeper", n: "04", blurb: "Where to take it from here" },
};
