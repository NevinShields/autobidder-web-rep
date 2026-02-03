import overview from "../../docs/overview.md?raw";
import quickStart from "../../docs/quick-start.md?raw";
import coreConcepts from "../../docs/core-concepts.md?raw";
import formulaBuilder from "../../docs/formula-builder.md?raw";
import designTheming from "../../docs/design-theming.md?raw";
import editor from "../../docs/editor.md?raw";
import logicPage from "../../docs/logic-page.md?raw";
import automations from "../../docs/automations.md?raw";
import zapierIntegration from "../../docs/zapier-integration.md?raw";
import troubleshooting from "../../docs/troubleshooting.md?raw";
import faq from "../../docs/faq.md?raw";
import videoGuides from "../../docs/video-guides.md?raw";
import { defaultDocSlug } from "@/docs/docs-nav";

export type DocContent = {
  title: string;
  body: string;
};

export const docsContent: Record<string, DocContent> = {
  "overview": { title: "Welcome / Overview", body: overview },
  "quick-start": { title: "Quick Start", body: quickStart },
  "core-concepts": { title: "Core Concepts", body: coreConcepts },
  "formula-builder": { title: "Formula Builder", body: formulaBuilder },
  "design-theming": { title: "Design & Theming", body: designTheming },
  "editor": { title: "Editor", body: editor },
  "logic-page": { title: "Logic Page", body: logicPage },
  "automations": { title: "Automations", body: automations },
  "zapier-integration": { title: "Zapier Integration", body: zapierIntegration },
  "video-guides": { title: "Video Guides", body: videoGuides },
  "troubleshooting": { title: "Troubleshooting", body: troubleshooting },
  "faq": { title: "FAQ", body: faq },
};

export const getDocBySlug = (slug: string): DocContent => {
  return docsContent[slug] || docsContent[defaultDocSlug];
};
