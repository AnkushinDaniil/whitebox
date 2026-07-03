/**
 * Prefix root-absolute links in markdown/MDX content with the deploy base path.
 *
 * Astro rewrites asset URLs (CSS/JS/images it processes) for `base`, but it does
 * NOT touch author-written links like `[text](/the-evm)` — those render as
 * `<a href="/the-evm">` and 404 when the site is served from a subpath
 * (e.g. GitHub Pages at /whitebox/). This walks the rendered HAST and rewrites
 * root-absolute `href`/`src` to include the base. It is idempotent (never
 * double-prefixes) and leaves external URLs, protocol-relative URLs, fragments,
 * and mailto/tel alone.
 */
export default function rehypeBaseLinks({ base = "/" } = {}) {
  const prefix = base.replace(/\/+$/, ""); // "/whitebox" (or "" for root)
  if (!prefix) return () => {};
  const ATTR = { a: "href", area: "href", img: "src", source: "src", video: "src", audio: "src" };
  const rewrite = (value) => {
    if (typeof value !== "string") return value;
    if (!value.startsWith("/")) return value; // external, fragment, relative, mailto
    if (value.startsWith("//")) return value; // protocol-relative
    if (value === prefix || value.startsWith(prefix + "/")) return value; // already based
    return prefix + value;
  };
  const walk = (node) => {
    if (node.type === "element" && node.properties) {
      const attr = ATTR[node.tagName];
      if (attr) node.properties[attr] = rewrite(node.properties[attr]);
    }
    if (node.children) for (const child of node.children) walk(child);
  };
  return (tree) => walk(tree);
}
