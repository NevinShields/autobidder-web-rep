import type { LandingPage } from "@shared/schema";

export function slugifyLandingPage(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50) || "business";
}

export function validateLandingPageBasics(page: LandingPage): string[] {
  const errors: string[] = [];
  const services = (page.services as Array<{ serviceId: number; enabled: boolean }> | null) || [];
  const enabledServices = services.filter(s => s.enabled);

  if (!page.businessName || !page.businessName.trim()) {
    errors.push("Business name is required.");
  }
  if (enabledServices.length === 0) {
    errors.push("At least one service must be enabled.");
  }
  if (!page.primaryServiceId) {
    errors.push("Primary service is required.");
  } else if (!enabledServices.find(s => s.serviceId === page.primaryServiceId)) {
    errors.push("Primary service must be enabled in services list.");
  }

  return errors;
}
