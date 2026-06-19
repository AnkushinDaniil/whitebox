import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "@/consts";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const explorables = await getCollection("explorables", ({ data }) => !data.draft);
  const notes = await getCollection("notes", ({ data }) => !data.draft);

  const items = [
    ...explorables.map((e) => ({
      title: e.data.title,
      description: e.data.summary,
      pubDate: e.data.updated,
      link: `/${e.id}`,
      categories: [e.data.topic, "explorable"],
    })),
    ...notes.map((n) => ({
      title: n.data.title,
      description: n.data.summary,
      pubDate: n.data.date,
      link: `/notes/${n.id}`,
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
