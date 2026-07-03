import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "@/consts";
import { entryLang, entrySlug, withBase } from "@/i18n/utils";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  // English feed (the canonical one). The /ru/ pages are reachable via hreflang.
  const explorables = (
    await getCollection("explorables", ({ data }) => !data.draft)
  ).filter((e) => entryLang(e.id) === "en");
  const notes = (await getCollection("notes", ({ data }) => !data.draft)).filter(
    (n) => entryLang(n.id) === "en",
  );

  const items = [
    ...explorables.map((e) => ({
      title: e.data.title,
      description: e.data.summary,
      pubDate: e.data.updated,
      link: withBase(`/${entrySlug(e.id)}`),
      categories: [e.data.topic, "explorable"],
    })),
    ...notes.map((n) => ({
      title: n.data.title,
      description: n.data.summary,
      pubDate: n.data.date,
      link: withBase(`/notes/${entrySlug(n.id)}`),
      categories: ["note"],
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
  });
}
