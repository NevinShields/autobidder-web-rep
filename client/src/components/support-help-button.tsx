import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSupportModal } from "./page-support-modal";

// Map route paths to page keys and names
const PAGE_SUPPORT_MAP: Record<string, { key: string; name: string }> = {
  "/": { key: "dashboard", name: "Dashboard" },
  "/dashboard": { key: "dashboard", name: "Dashboard" },
  "/formulas": { key: "formulas", name: "Formulas" },
  "/formula-builder": { key: "formula-builder", name: "Formula Builder" },
  "/leads": { key: "leads", name: "Customers" },
  "/calendar": { key: "calendar", name: "Calendar" },
  "/design": { key: "design", name: "Design" },
  "/form-settings": { key: "logic", name: "Logic" },
  "/embed-code": { key: "embed-code", name: "Embed Code" },
  "/stats": { key: "stats", name: "Stats" },
  "/email-settings": { key: "email-settings", name: "Email Settings" },
  "/integrations": { key: "integrations", name: "Integrations" },
  "/website": { key: "website", name: "Website" },
  "/custom-forms": { key: "custom-forms", name: "Custom Forms" },
  "/crm/automations": { key: "automations", name: "Automations" },
  "/automations": { key: "automations", name: "Automations" },
  "/photos": { key: "photos", name: "Photos" },
  "/profile": { key: "profile", name: "Profile" },
  "/call-screen": { key: "call-screen", name: "Call Screen" },
  "/proposals": { key: "proposals", name: "Proposals" },
  "/estimates": { key: "estimates", name: "Estimates" },
  "/work-orders": { key: "work-orders", name: "Work Orders" },
};

interface PageSupportConfig {
  isEnabled: boolean;
  videos: any[];
}

export function SupportHelpButton() {
  const [location] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get the page info based on current route
  const getPageInfo = () => {
    // First try exact match
    if (PAGE_SUPPORT_MAP[location]) {
      return PAGE_SUPPORT_MAP[location];
    }

    // Try matching route prefix (for routes like /formula-builder:id)
    for (const [route, info] of Object.entries(PAGE_SUPPORT_MAP)) {
      if (location.startsWith(route) && route !== "/") {
        return info;
      }
    }

    return null;
  };

  const pageInfo = getPageInfo();

  // Fetch page support config to check if enabled
  const { data: supportConfig } = useQuery<PageSupportConfig>({
    queryKey: [`/api/support/page/${pageInfo?.key}`],
    enabled: !!pageInfo?.key,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Don't render if no page info or support is disabled
  if (!pageInfo || (supportConfig && !supportConfig.isEnabled)) {
    return null;
  }

  // Don't show if no videos
  if (supportConfig && supportConfig.videos?.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="h-9 w-9 p-0 relative text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors"
        title={`Help for ${pageInfo.name}`}
      >
        <HelpCircle className="h-[18px] w-[18px]" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
      </Button>

      <PageSupportModal
        pageKey={pageInfo.key}
        pageName={pageInfo.name}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
