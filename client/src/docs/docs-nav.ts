export type DocNavItem = {
  title: string;
  slug: string;
};

export type DocNavSection = {
  title: string;
  items: DocNavItem[];
};

export const defaultDocSlug = "overview";

export const docsNav: DocNavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Welcome / Overview", slug: "overview" },
      { title: "Quick Start", slug: "quick-start" },
      { title: "Core Concepts", slug: "core-concepts" },
      { title: "Video Guides", slug: "video-guides" },
    ],
  },
  {
    title: "Build",
    items: [
      { title: "Formula Builder", slug: "formula-builder" },
      { title: "Design & Theming", slug: "design-theming" },
      { title: "Editor", slug: "editor" },
      { title: "Logic Page", slug: "logic-page" },
    ],
  },
  {
    title: "Automation",
    items: [
      { title: "Automations", slug: "automations" },
      { title: "Zapier Integration", slug: "zapier-integration" },
    ],
  },
  {
    title: "Support",
    items: [
      { title: "Troubleshooting", slug: "troubleshooting" },
      { title: "FAQ", slug: "faq" },
    ],
  },
];
