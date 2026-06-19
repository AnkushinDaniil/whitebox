// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Static-only for milestone 1 (host decided later). Email capture uses a
// pluggable client-side adapter, so no server adapter is required yet.
export default defineConfig({
  site: "https://whitebox.dev",
  output: "static",
  integrations: [mdx(), react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle the deps the React islands import so Vite doesn't discover them
    // mid-session, re-optimize, and serve a stale chunk (the "504 Outdated
    // Optimize Dep" that made islands fail to load in dev).
    optimizeDeps: {
      include: ["d3-hierarchy", "@noble/hashes/sha3"],
    },
    server: {
      watch: {
        // Tooling state dirs churn constantly (the oh-my-claudecode HUD rewrites
        // .omc/state/* every second). Without this, the dev server full-reloads
        // on every write and the React islands never stay mounted.
        ignored: ["**/.omc/**", "**/.claude/**", "**/.git/**"],
      },
    },
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark-default",
      wrap: false,
    },
  },
});
