import { Link, useLocation } from "wouter";
import { ChevronRight, FileText, Video } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { cn } from "@/lib/utils";
import { getDashboardNav, type DashboardNavItem } from "@/lib/dashboard-nav";
import { useAuth } from "@/hooks/useAuth";

const PAGE_COPY: Record<string, { eyebrow: string; description: string }> = {
  "/": {
    eyebrow: "Overview",
    description: "Your main dashboard for daily activity, account health, and quick entry points.",
  },
  "/design": {
    eyebrow: "Build",
    description: "Design calculators, steps, fields, and the customer-facing experience.",
  },
  "/form-settings": {
    eyebrow: "Build",
    description: "Control form logic, steps, branching, and the rules behind each flow.",
  },
  "/formulas": {
    eyebrow: "Build",
    description: "Manage pricing formulas, services, and the calculators tied to your offers.",
  },
  "/custom-forms": {
    eyebrow: "Build",
    description: "Create specialized intake forms for lead capture, screening, and qualification.",
  },
  "/website": {
    eyebrow: "Build",
    description: "Launch and manage your website pages, templates, and SEO setup tools.",
  },
  "/dashboard/landing-page": {
    eyebrow: "Build",
    description: "Edit the landing page experience shown from the website workspace.",
  },
  "/calendar": {
    eyebrow: "Manage",
    description: "View scheduled work, appointments, and time-based operations in one place.",
  },
  "/leads": {
    eyebrow: "Manage",
    description: "Track customers, stages, estimates, and sales activity across the CRM.",
  },
  "/call-screen": {
    eyebrow: "Manage",
    description: "Use the call workflow for live lead intake and quick estimate routing.",
  },
  "/photos": {
    eyebrow: "Manage",
    description: "Review uploaded job photos, reference assets, and image-based context.",
  },
  "/crm/automations": {
    eyebrow: "Manage",
    description: "Configure CRM automations, triggers, and workflow rules for follow-up.",
  },
  "/email-settings": {
    eyebrow: "Manage",
    description: "Control sending domains, email behavior, and communication defaults.",
  },
  "/estimate-page-settings": {
    eyebrow: "Manage",
    description: "Customize the estimate page experience customers see when reviewing quotes.",
  },
  "/stats": {
    eyebrow: "Manage",
    description: "Monitor usage, lead flow, and business performance trends over time.",
  },
  "/embed-code": {
    eyebrow: "Manage",
    description: "Grab install code and deployment snippets for calculators and forms.",
  },
  "/profile": {
    eyebrow: "Settings",
    description: "Update account details, preferences, business defaults, and feature flags.",
  },
  "/integrations": {
    eyebrow: "Settings",
    description: "Connect third-party tools and manage platform integrations.",
  },
  "/knowledge-base": {
    eyebrow: "Settings",
    description: "Browse help articles, walkthroughs, and setup documentation.",
  },
  "/admin": {
    eyebrow: "Admin",
    description: "Access platform administration, testing tools, and internal controls.",
  },
  "/admin/support-videos": {
    eyebrow: "Admin",
    description: "Manage the internal support video library and training content.",
  },
  "/admin/knowledge-base": {
    eyebrow: "Admin",
    description: "Create and edit knowledge base categories, articles, and publishing status.",
  },
  "/blog-posts": {
    eyebrow: "Content",
    description: "Create, edit, and sync blog content for local SEO and website publishing.",
  },
  "/white-label-videos": {
    eyebrow: "Content",
    description: "Access white-label video assets for sales, onboarding, and marketing use.",
  },
};

const GROUP_STYLES = {
  build: {
    shell: "from-sky-100/90 via-white to-cyan-50/80 dark:from-sky-950/30 dark:via-slate-950 dark:to-cyan-950/20",
    chip: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    icon: "from-sky-500 to-cyan-500",
    ring: "ring-sky-200/70 dark:ring-sky-800/40",
  },
  manage: {
    shell: "from-emerald-100/90 via-white to-teal-50/80 dark:from-emerald-950/30 dark:via-slate-950 dark:to-teal-950/20",
    chip: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    icon: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-200/70 dark:ring-emerald-800/40",
  },
  settings: {
    shell: "from-amber-100/90 via-white to-orange-50/80 dark:from-amber-950/30 dark:via-slate-950 dark:to-orange-950/20",
    chip: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    icon: "from-amber-500 to-orange-500",
    ring: "ring-amber-200/70 dark:ring-amber-800/40",
  },
  extras: {
    shell: "from-fuchsia-100/90 via-white to-rose-50/80 dark:from-fuchsia-950/30 dark:via-slate-950 dark:to-rose-950/20",
    chip: "bg-fuchsia-500/10 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
    icon: "from-fuchsia-500 to-rose-500",
    ring: "ring-fuchsia-200/70 dark:ring-fuchsia-800/40",
  },
} as const;

type SectionKey = keyof typeof GROUP_STYLES;
type NavigationSection = {
  key: SectionKey;
  title: string;
  subtitle: string;
  items: DashboardNavItem[];
};

function flattenItems(items: DashboardNavItem[]): DashboardNavItem[] {
  return items.flatMap((item) => [item, ...(item.subItems ?? [])]);
}

function buildSectionItems(items: DashboardNavItem[]): DashboardNavItem[] {
  return flattenItems(items).filter((item) => item.href !== "/navigation");
}

export default function NavigationPage() {
  const { user, isSuperAdmin } = useAuth();
  const [location] = useLocation();
  const { navGroups, settingsGroup } = getDashboardNav(user, isSuperAdmin);

  const buildItems = buildSectionItems(navGroups.build.items);
  const manageItems = buildSectionItems(navGroups.manage.items);
  const settingItems = buildSectionItems(settingsGroup.settings.items);
  const extraItems: DashboardNavItem[] = [
    { name: "Blog Posts", href: "/blog-posts", icon: FileText },
    { name: "White Label Videos", href: "/white-label-videos", icon: Video },
  ];

  const sections: NavigationSection[] = [
    {
      key: "build",
      title: "Build Workspace",
      subtitle: "Core setup and website-building destinations from the sidebar.",
      items: buildItems,
    },
    {
      key: "manage",
      title: "Manage Workspace",
      subtitle: "Daily operations, CRM tools, and business controls from the sidebar.",
      items: manageItems,
    },
    {
      key: "settings",
      title: "Settings",
      subtitle: "Account, help, and admin destinations currently available in the sidebar.",
      items: settingItems,
    },
    {
      key: "extras",
      title: "Content Shortcuts",
      subtitle: "Additional destinations requested for faster navigation outside the sidebar set.",
      items: extraItems,
    },
  ].filter((section): section is NavigationSection => section.items.length > 0);

  return (
    <DashboardLayout>
      <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(247,247,245,0.92)_42%,_rgba(239,239,235,0.96)_100%)] px-4 pb-8 pt-2 dark:bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.9),_rgba(2,6,23,0.96)_45%,_rgba(2,6,23,1)_100%)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {sections.map((section) => {
            const style = GROUP_STYLES[section.key];

            return (
              <section key={section.key} className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      {section.title}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                      {section.subtitle}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const copy = PAGE_COPY[item.href] ?? {
                      eyebrow: section.title,
                      description: `Open ${item.name.toLowerCase()} and continue working in that part of the platform.`,
                    };
                    const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));

                    return (
                      <Link key={item.href} href={item.href}>
                        <article
                          className={cn(
                            "group relative overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-br p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,23,42,0.1)] dark:border-white/10",
                            style.shell,
                            style.ring,
                            active && "shadow-[0_22px_48px_rgba(15,23,42,0.13)]"
                          )}
                        >
                          <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-white/50 blur-2xl dark:bg-white/5" />
                          <div className="relative flex h-full flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className={cn("flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-to-br text-white shadow-lg", style.icon)}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                                  style.chip
                                )}
                              >
                                {copy.eyebrow}
                              </span>
                            </div>

                            <div className="mt-4 flex-1">
                              <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                                {item.name}
                              </h3>
                              <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                {copy.description}
                              </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200">
                              <span className="rounded-full bg-white/70 px-2.5 py-1 shadow-sm dark:bg-slate-900/60">
                                {item.href}
                              </span>
                              <span className="flex items-center gap-1 text-slate-500 transition-transform duration-200 group-hover:translate-x-1 dark:text-slate-300">
                                Open
                                <ChevronRight className="h-4 w-4" />
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
