import { realieApi } from "./realie-api";
import { storage } from "./storage";
import type { PropertyAttributes, PropertySnapshot } from "@shared/schema";

/**
 * Normalize an address string for cache key purposes.
 * Lowercases, trims, standardizes abbreviations, strips unit/apt suffixes.
 */
export function normalizeAddress(input: string): string {
  let addr = input.trim().toLowerCase();

  addr = addr.replace(/\b(apt|unit|suite|ste|#)\s*[a-z0-9-]+$/i, "").trim();

  const abbreviations: Record<string, string> = {
    street: "st",
    avenue: "ave",
    boulevard: "blvd",
    drive: "dr",
    lane: "ln",
    road: "rd",
    court: "ct",
    place: "pl",
    circle: "cir",
    highway: "hwy",
    parkway: "pkwy",
    north: "n",
    south: "s",
    east: "e",
    west: "w",
    northeast: "ne",
    northwest: "nw",
    southeast: "se",
    southwest: "sw",
  };

  for (const [full, abbr] of Object.entries(abbreviations)) {
    addr = addr.replace(new RegExp(`\\b${full}\\b`, "g"), abbr);
  }

  addr = addr.replace(/\s+/g, " ").trim();
  addr = addr.replace(/[.,]+$/, "").trim();

  return addr;
}

function parseRealieAddress(address: string): { addressLine: string; state: string; unit?: string } | null {
  const normalized = address.replace(/\s+/g, " ").trim();
  const unitMatch = normalized.match(/\b(?:apt|unit|suite|ste|#)\s*([a-z0-9-]+)\b/i);
  const unit = unitMatch?.[1];

  const withoutCountry = normalized.replace(/\b(?:united states|usa|us)\b\.?$/i, "").replace(/[,\s]+$/g, "").trim();
  const commaParts = withoutCountry.split(",").map((part) => part.trim()).filter(Boolean);

  let state: string | null = null;
  if (commaParts.length >= 2) {
    const tail = commaParts[commaParts.length - 1];
    const match = tail.match(/\b([A-Z]{2})\b/i);
    if (match) {
      state = match[1].toUpperCase();
    }
  }

  if (!state) {
    const inlineMatch = withoutCountry.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?$/i);
    if (inlineMatch) {
      state = inlineMatch[1].toUpperCase();
    }
  }

  if (!state) {
    return null;
  }

  let addressLine = withoutCountry;
  if (commaParts.length >= 2) {
    addressLine = commaParts[0];
  } else {
    const stateIndex = withoutCountry.search(new RegExp(`\\b${state}\\b`, "i"));
    if (stateIndex > 0) {
      addressLine = withoutCountry.slice(0, stateIndex).trim().replace(/,+$/, "").trim();
    }
  }

  if (unitMatch) {
    addressLine = addressLine.replace(unitMatch[0], "").replace(/\s+/g, " ").trim().replace(/,+$/, "").trim();
  }

  if (!addressLine) {
    return null;
  }

  return {
    addressLine,
    state,
    unit,
  };
}

export function mapRealieToCanonical(response: any): PropertyAttributes {
  return realieApi.mapToCanonical(response);
}

/**
 * Main orchestrator: resolve property data for an address.
 * Checks cache first (30-day TTL), then falls back to Realie API.
 */
export async function resolvePropertyData(address: string): Promise<{
  snapshot: PropertySnapshot | null;
  attributes: PropertyAttributes;
}> {
  const normalized = normalizeAddress(address);

  const existing = await storage.getPropertySnapshotByAddress(normalized);
  if (existing) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (existing.retrievedAt > thirtyDaysAgo) {
      const cachedAttributes = (existing.attributesJson || {}) as PropertyAttributes;

      if (existing.rawPayloadJson && existing.source === "realie") {
        const remapped = mapRealieToCanonical(existing.rawPayloadJson);
        const merged: PropertyAttributes = { ...cachedAttributes, ...remapped };
        return {
          snapshot: existing,
          attributes: merged,
        };
      }

      return {
        snapshot: existing,
        attributes: cachedAttributes,
      };
    }
  }

  if (!realieApi.isConfigured()) {
    console.warn("[PropertyResolver] Realie API not configured");
    return { snapshot: null, attributes: {} };
  }

  const parsedAddress = parseRealieAddress(address);
  if (!parsedAddress) {
    console.warn("[PropertyResolver] Could not parse address for Realie lookup");
    return { snapshot: null, attributes: {} };
  }

  try {
    const response = await realieApi.getPropertyByAddress(
      parsedAddress.addressLine,
      parsedAddress.state,
      parsedAddress.unit,
    );
    const attributes = mapRealieToCanonical(response);

    const snapshot = await storage.createPropertySnapshot({
      addressNormalized: normalized,
      addressInput: address,
      attributesJson: attributes,
      source: "realie",
      retrievedAt: new Date(),
      rawPayloadJson: response,
    });

    return { snapshot, attributes };
  } catch (error) {
    console.error("[PropertyResolver] Realie API call failed:", error);
    return { snapshot: null, attributes: {} };
  }
}
