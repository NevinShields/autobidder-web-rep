import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Calculator,
  Calendar,
  ClipboardList,
  Code,
  Compass,
  FileText,
  Globe,
  Home,
  Image,
  Layers,
  Mail,
  Palette,
  Phone,
  Settings,
  Shield,
  User,
  Video,
  Workflow,
  Zap,
} from "lucide-react";

export type DashboardNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  subItems?: DashboardNavItem[];
};

export type DashboardNavGroup = {
  title: string;
  icon: LucideIcon;
  items: DashboardNavItem[];
};

type DashboardNavOptions = {
  includeHiddenItems?: boolean;
};

export function getDashboardNav(
  user: unknown,
  isSuperAdmin: boolean,
  options?: DashboardNavOptions,
): {
  navGroups: Record<string, DashboardNavGroup>;
  settingsGroup: Record<string, DashboardNavGroup>;
} {
  const includeHiddenItems = options?.includeHiddenItems ?? false;
  const showLandingPageNav = Boolean(
    (user as any)?.showLandingPageNav ?? (user as any)?.businessInfo?.showLandingPageNav
  );

  const navGroups: Record<string, DashboardNavGroup> = {
    build: {
      title: "BUILD",
      icon: Layers,
      items: [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Design", href: "/design", icon: Palette },
        { name: "Logic", href: "/form-settings", icon: Settings },
        { name: "Formulas", href: "/formulas", icon: Calculator },
        { name: "Custom Forms", href: "/custom-forms", icon: FileText },
        {
          name: "Website",
          href: "/website",
          icon: Globe,
          subItems: showLandingPageNav
            ? [{ name: "Landing Page", href: "/dashboard/landing-page", icon: Globe }]
            : [],
        },
      ],
    },
    manage: {
      title: "MANAGE",
      icon: Briefcase,
      items: [
        { name: "Calendar", href: "/calendar", icon: Calendar },
        { name: "Customers", href: "/leads", icon: ClipboardList },
        { name: "Call Screen", href: "/call-screen", icon: Phone },
        { name: "Photos", href: "/photos", icon: Image },
        ...(includeHiddenItems
          ? [
              { name: "Ad Library", href: "/ad-library", icon: Image },
              { name: "Ad Creative Request", href: "/ad-creative-request", icon: Image },
            ]
          : []),
        { name: "Automations", href: "/crm/automations", icon: Workflow },
        { name: "Email Settings", href: "/email-settings", icon: Mail },
        { name: "Estimate Page Editor", href: "/estimate-page-settings", icon: FileText },
        { name: "Stats", href: "/stats", icon: BarChart3 },
        { name: "Embed Code", href: "/embed-code", icon: Code },
      ],
    },
  };

  const settingsGroup: Record<string, DashboardNavGroup> = {
    settings: {
      title: "SETTINGS",
      icon: Settings,
      items: [
        { name: "Profile", href: "/profile", icon: User },
        { name: "Integrations", href: "/integrations", icon: Zap },
        { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
        { name: "Navigation", href: "/navigation", icon: Compass },
        ...(isSuperAdmin
          ? [
              { name: "Admin Dashboard", href: "/admin", icon: Shield },
              ...(includeHiddenItems
                ? [{ name: "Ad Library Admin", href: "/admin/ad-library", icon: Image }]
                : []),
              { name: "Support Videos", href: "/admin/support-videos", icon: Video },
              { name: "KB Admin", href: "/admin/knowledge-base", icon: BookOpen },
            ]
          : []),
      ],
    },
  };

  return { navGroups, settingsGroup };
}
