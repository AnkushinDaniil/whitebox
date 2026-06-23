import { ui, defaultLang, type Lang } from "./ui";

export type { Lang };
export { languages, defaultLang } from "./ui";

/** The locale segment of a URL path: "/ru/foo" -> "ru", everything else -> "en". */
export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split("/")[1];
  return seg === "ru" ? "ru" : "en";
}

/** The chrome strings for a language. */
export function useTranslations(lang: Lang) {
  return ui[lang];
}

/** Prefix a canonical (English) path with the locale. "/about" + ru -> "/ru/about". */
export function localizePath(path: string, lang: Lang): string {
  if (lang === defaultLang) return path;
  if (path === "/") return "/ru/";
  return `/ru${path.startsWith("/") ? path : `/${path}`}`;
}

/** Drop the locale prefix from a path. "/ru/about" -> "/about", "/ru/" -> "/". */
export function stripLang(path: string): string {
  if (path === "/ru" || path === "/ru/") return "/";
  return path.replace(/^\/ru(?=\/)/, "") || "/";
}

/** The same page in the *other* language, for the language switcher. */
export function altLangPath(path: string, current: Lang): string {
  const base = stripLang(path);
  return current === "en" ? localizePath(base, "ru") : base;
}

/** Date locale per language. */
export const dateLocale: Record<Lang, string> = { en: "en-US", ru: "ru-RU" };

/** Lang + public slug from a content-collection entry id like "ru/how-a-node-syncs". */
export function entryLang(id: string): Lang {
  return id.startsWith("ru/") ? "ru" : "en";
}
export function entrySlug(id: string): string {
  return id.replace(/^(en|ru)\//, "");
}
