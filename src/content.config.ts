import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Explorables — the core content unit. One mechanism + a live widget, layered
 * intuition -> mechanism -> spec/code -> go deeper. New explorable = new MDX
 * file matching this schema; the framework renders the rest.
 */
const explorables = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/explorables" }),
  schema: z.object({
    title: z.string(),
    dek: z.string(), // one-line subtitle / promise
    summary: z.string(), // SEO meta description
    topic: z.string(), // e.g. "State", "Transactions"
    order: z.number().default(999), // position in the spine
    spine: z.boolean().default(true), // part of "The Execution Layer, explained"
    prerequisites: z.array(z.string()).default([]),
    updated: z.coerce.date(),
    readingMinutes: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

/**
 * Notes — the thin, low-frequency "what changed in the protocol / this
 * hardfork, explained simply" layer.
 */
const notes = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),
    summary: z.string(),
    hardfork: z.string().optional(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { explorables, notes };
