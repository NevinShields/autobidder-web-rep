import type { UpsellItem } from "./schema";
import { evaluateConditionalRule } from "./conditional-logic";

export type UpsellCalculationType = "percentage_service" | "percentage_total" | "fixed_amount";

export type CalculatedUpsellSelection = {
  id: string;
  upsellId: string;
  name: string;
  description?: string;
  category?: string;
  isPopular?: boolean;
  iconUrl?: string;
  imageUrl?: string;
  tooltip?: string;
  serviceId: number;
  serviceName: string;
  percentageOfMain: number;
  calculationType: UpsellCalculationType;
  calculationValue: number;
  pricingLabel: string;
  amount: number;
};

export function getUpsellCalculationType(upsell: Partial<UpsellItem>): UpsellCalculationType {
  return upsell.calculationType || "percentage_service";
}

export function getUpsellCalculationValue(upsell: Partial<UpsellItem>): number {
  const calculationType = getUpsellCalculationType(upsell);
  if (calculationType === "fixed_amount") {
    return Number(upsell.fixedAmount ?? 0);
  }
  return Number(upsell.percentageOfMain ?? 0);
}

export function buildUpsellSelectionKey(serviceId: number, upsellId: string): string {
  // Upsells are defined on individual services, so selection keys must include the parent service.
  return `${serviceId}:${upsellId}`;
}

export function getUpsellPricingLabel(upsell: Partial<UpsellItem>): string {
  const calculationType = getUpsellCalculationType(upsell);
  const value = getUpsellCalculationValue(upsell);

  switch (calculationType) {
    case "fixed_amount":
      return `$${value.toLocaleString()} fixed`;
    case "percentage_total":
      return `${value}% of total quote`;
    case "percentage_service":
    default:
      return `${value}% of this service`;
  }
}

export function isUpsellVisible(
  upsell: Partial<UpsellItem>,
  variableValues: Record<string, any>,
): boolean {
  if (!upsell.conditionalLogic?.enabled) {
    return true;
  }

  // Upsells reuse the same condition DSL as calculator variables so display
  // rules stay aligned with the existing form system.
  return evaluateConditionalRule(upsell.conditionalLogic, variableValues);
}

export function calculateUpsellAmount(
  upsell: Partial<UpsellItem>,
  serviceSubtotal: number,
  cartSubtotal: number,
): number {
  const calculationType = getUpsellCalculationType(upsell);
  const value = getUpsellCalculationValue(upsell);

  switch (calculationType) {
    case "fixed_amount":
      return Math.max(0, Math.round(value));
    case "percentage_total":
      return Math.max(0, Math.round(cartSubtotal * (value / 100)));
    case "percentage_service":
    default:
      return Math.max(0, Math.round(serviceSubtotal * (value / 100)));
  }
}

export function buildCalculatedUpsellSelection(params: {
  upsell: UpsellItem;
  serviceId: number;
  serviceName: string;
  serviceSubtotal: number;
  cartSubtotal: number;
}): CalculatedUpsellSelection {
  const { upsell, serviceId, serviceName, serviceSubtotal, cartSubtotal } = params;
  const calculationType = getUpsellCalculationType(upsell);
  const calculationValue = getUpsellCalculationValue(upsell);

  return {
    id: buildUpsellSelectionKey(serviceId, upsell.id),
    upsellId: upsell.id,
    name: upsell.name,
    description: upsell.description,
    category: upsell.category,
    isPopular: upsell.isPopular,
    iconUrl: upsell.iconUrl,
    imageUrl: upsell.imageUrl,
    tooltip: upsell.tooltip,
    serviceId,
    serviceName,
    percentageOfMain: Number(upsell.percentageOfMain ?? 0),
    calculationType,
    calculationValue,
    pricingLabel: getUpsellPricingLabel(upsell),
    amount: calculateUpsellAmount(upsell, serviceSubtotal, cartSubtotal),
  };
}
