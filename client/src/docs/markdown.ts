import { marked } from "marked";
import { slugify } from "@/docs/utils";

export type TocItem = {
  level: 2 | 3;
  text: string;
  slug: string;
};

const renderer = new marked.Renderer();

renderer.heading = (text, level) => {
  const headingText =
    typeof text === "string"
      ? text
      : (text as any)?.text ?? (text as any)?.raw ?? "";
  const safeText = String(headingText);
  const slug = slugify(safeText);
  return `
<h${level} id="${slug}">
  <a class="docs-anchor" href="#${slug}" aria-hidden="true">#</a>
  <span>${safeText}</span>
</h${level}>`;
};

renderer.link = (href, title, text) => {
  const safeHref = typeof href === "string" ? href : "";
  const isExternal = safeHref.startsWith("http://") || safeHref.startsWith("https://");
  const titleAttr = title ? ` title="${title}"` : "";
  const targetAttr = isExternal ? " target=\"_blank\" rel=\"noopener noreferrer\"" : "";
  const safeText = typeof text === "string" ? text : String(text ?? "");
  return `<a href="${safeHref}"${titleAttr}${targetAttr}>${safeText}</a>`;
};

marked.setOptions({
  gfm: true,
  breaks: false,
  mangle: false,
  headerIds: false,
});

marked.use({ renderer });

export const renderMarkdown = (markdown: string): string => {
  return marked.parse(markdown) as string;
};

export const buildToc = (markdown: string): TocItem[] => {
  const tokens = marked.lexer(markdown);
  const items: TocItem[] = [];

  for (const token of tokens) {
    if (token.type === "heading" && (token.depth === 2 || token.depth === 3)) {
      const text = typeof token.text === "string" ? token.text : String(token.text ?? "");
      items.push({
        level: token.depth,
        text,
        slug: slugify(text),
      });
    }
  }

  return items;
};
