export type MarketingPlanId = "free" | "core" | "plus" | "plus-seo";

export interface MarketingPlan {
  id: MarketingPlanId;
  name: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  description: string;
  features: string[];
  featured?: boolean;
}

export const marketingPlans: MarketingPlan[] = [
  {
    id: "free",
    name: "Autobidder Free",
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    description: "Starter access with core visibility tools.",
    features: [
      "No MeasureMap Features",
      "10 Leads per Month",
      "Access to Directory",
    ],
  },
  {
    id: "core",
    name: "Core",
    monthlyPrice: 49,
    yearlyMonthlyPrice: 41.42,
    description: "Essential automation for growing service businesses.",
    features: [
      "AI Formula Builder",
      "Dynamic Formula Builder",
      "Custom Design Editor",
      "CRM Integration - Zapier",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    monthlyPrice: 97,
    yearlyMonthlyPrice: 80.83,
    description: "Expanded toolkit for teams scaling lead flow.",
    features: [
      "Website Included",
      "Autoblogger SEO Tool",
      "AI Measure Tool",
      "Property Data API",
    ],
    featured: true,
  },
  {
    id: "plus-seo",
    name: "Plus SEO",
    monthlyPrice: 297,
    yearlyMonthlyPrice: 247.5,
    description: "Growth + SEO acceleration in one plan.",
    features: [
      "Everything in Plus",
      "50 Location Pages Added Monthly for SEO",
      "Custom White Label Video",
    ],
  },
];
