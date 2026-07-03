import { ui, defaultLang, type Lang } from "./ui";

export type { Lang };
export { languages, defaultLang } from "./ui";

// The deploy base path (e.g. "/whitebox" on GitHub Pages, "" at root). Vite
// injects import.meta.env.BASE_URL from astro's `base`; it has a trailing slash.
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

/** Prefix a base-free app path with the deploy base. "/about" -> "/whitebox/about". */
export function withBase(path: string): string {
  if (!BASE) return path;
  if (path === "/") return `${BASE}/`;
  return BASE + (path.startsWith("/") ? path : `/${path}`);
}

/** Remove the deploy base from a pathname. "/whitebox/ru/x" -> "/ru/x". */
export function stripBase(path: string): string {
  if (!BASE) return path;
  if (path === BASE || path === `${BASE}/`) return "/";
  return path.startsWith(`${BASE}/`) ? path.slice(BASE.length) : path;
}

/** The locale segment of a URL path: "/ru/foo" -> "ru", everything else -> "en". */
export function getLangFromUrl(url: URL): Lang {
  const seg = stripBase(url.pathname).split("/")[1];
  return seg === "ru" ? "ru" : "en";
}

/** The chrome strings for a language. */
export function useTranslations(lang: Lang) {
  return ui[lang];
}

/**
 * A ready-to-use href for a base-free app path in the given language.
 * "/about" + ru -> "/whitebox/ru/about". Applies both locale and deploy base.
 */
export function localizePath(path: string, lang: Lang): string {
  const localized =
    lang === defaultLang
      ? path
      : path === "/"
        ? "/ru/"
        : `/ru${path.startsWith("/") ? path : `/${path}`}`;
  return withBase(localized);
}

/** A pathname (possibly base- and locale-prefixed) reduced to its base-free, locale-free form. */
export function stripLang(path: string): string {
  const p = stripBase(path);
  if (p === "/ru" || p === "/ru/") return "/";
  return p.replace(/^\/ru(?=\/)/, "") || "/";
}

/** The same page in the *other* language, for the language switcher (returns a full href). */
export function altLangPath(path: string, current: Lang): string {
  const canonical = stripLang(path);
  return localizePath(canonical, current === "en" ? "ru" : "en");
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
