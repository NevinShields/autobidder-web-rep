import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import "@/docs/docs.css";
import { docsNav, defaultDocSlug } from "@/docs/docs-nav";
import { docsContent } from "@/docs/docs-content";
import { buildToc, renderMarkdown } from "@/docs/markdown";

const getSlugFromLocation = (location: string): string => {
  const path = location.split("?")[0].split("#")[0];
  if (!path.startsWith("/docs")) {
    return defaultDocSlug;
  }
  const slug = path.replace(/^\/docs\/?/, "");
  return slug || defaultDocSlug;
};

export default function DocsPage() {
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    docsNav.forEach((section) => {
      initial[section.title] = true;
    });
    return initial;
  });

  const slug = getSlugFromLocation(location);
  const missing = !docsContent[slug];
  const doc = docsContent[slug] || docsContent[defaultDocSlug];

  const toc = useMemo(() => buildToc(doc.body), [doc.body]);
  const html = useMemo(() => renderMarkdown(doc.body), [doc.body]);

  const filteredNav = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return docsNav;
    }

    return docsNav
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.title.toLowerCase().includes(query)),
      }))
      .filter((section) => section.items.length > 0);
  }, [search]);

  const isSearching = search.trim().length > 0;

  const handleToggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    const target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [slug, html]);

  return (
    <div className="docs-root">
      <div className="docs-shell">
        <header className="docs-topbar">
          <div className="docs-brand">Autobidder Docs</div>
          <div className="docs-search">
            <input
              type="search"
              placeholder="Search docs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search documentation"
            />
          </div>
          <button
            type="button"
            className="docs-topbar-link"
            onClick={() => setLocation("/")}
          >
            Back to app
          </button>
        </header>

        <div className="docs-grid">
          <aside className="docs-sidebar">
            <div className="docs-panel">
              {filteredNav.map((section) => {
                const isOpen = isSearching ? true : openSections[section.title];
                return (
                  <div key={section.title}>
                    <button
                      type="button"
                      className="docs-section-toggle"
                      onClick={() => handleToggleSection(section.title)}
                    >
                      <span>{section.title}</span>
                      <span>{isOpen ? "-" : "+"}</span>
                    </button>
                    {isOpen && (
                      <ul className="docs-nav-list">
                        {section.items.map((item) => (
                          <li key={item.slug} className="docs-nav-item">
                            <Link
                              href={`/docs/${item.slug}`}
                              className="docs-nav-link"
                              data-active={slug === item.slug}
                            >
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {filteredNav.length === 0 && (
                <div className="docs-empty">No matches found.</div>
              )}
            </div>
          </aside>

          <main className="docs-main">
            <div className="docs-content">
              {missing && (
                <p className="docs-empty">
                  This page was not found. Showing the overview instead.
                </p>
              )}
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </main>

          <aside className="docs-toc">
            <div className="docs-panel">
              <div className="docs-toc-title">On this page</div>
              <nav className="docs-toc">
                {toc.length === 0 && (
                  <div className="docs-empty">No sections</div>
                )}
                {toc.map((item) => (
                  <a
                    key={`${item.slug}-${item.text}`}
                    href={`#${item.slug}`}
                    data-level={item.level}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
