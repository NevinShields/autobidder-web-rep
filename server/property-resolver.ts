import { attomApi } from "./attom-api";
import { storage } from "./storage";
import type { PropertyAttributes, PropertySnapshot } from "@shared/schema";

/**
 * Normalize an address string for cache key purposes.
 * Lowercases, trims, standardizes abbreviations, strips unit/apt suffixes.
 */
export function normalizeAddress(input: string): string {
  let addr = input.trim().toLowerCase();

  // Strip unit/apt/suite suffixes
  addr = addr.replace(/\b(apt|unit|suite|ste|#)\s*[a-z0-9-]+$/i, '').trim();

  // Standardize common abbreviations
  const abbreviations: Record<string, string> = {
    'street': 'st',
    'avenue': 'ave',
    'boulevard': 'blvd',
    'drive': 'dr',
    'lane': 'ln',
    'road': 'rd',
    'court': 'ct',
    'place': 'pl',
    'circle': 'cir',
    'highway': 'hwy',
    'parkway': 'pkwy',
    'north': 'n',
    'south': 's',
    'east': 'e',
    'west': 'w',
    'northeast': 'ne',
    'northwest': 'nw',
    'southeast': 'se',
    'southwest': 'sw',
  };

  for (const [full, abbr] of Object.entries(abbreviations)) {
    addr = addr.replace(new RegExp(`\\b${full}\\b`, 'g'), abbr);
  }

  // Collapse multiple spaces
  addr = addr.replace(/\s+/g, ' ').trim();

  // Remove trailing punctuation
  addr = addr.replace(/[.,]+$/, '').trim();

  return addr;
}

/**
 * Parse dimension strings like "24X24", "24 x 16", "24ft x 16ft", "24X24;12X10"
 * into total square footage.
 */
export function parseDimensions(raw: string): { sqft: number; raw: string } | null {
  if (!raw || !raw.trim()) return null;

  const cleaned = raw.trim().toUpperCase();

  // Split multi-section dimensions by semicolon
  const sections = cleaned.split(';').map(s => s.trim()).filter(Boolean);

  let totalSqft = 0;
  let validSections = 0;

  for (const section of sections) {
    // Match patterns like "24X24", "24 x 16", "24ft x 16ft", "24 X 16"
    const match = section.match(/^(\d+(?:\.\d+)?)\s*(?:FT)?\s*[Xx*]\s*(\d+(?:\.\d+)?)\s*(?:FT)?$/);
    if (match) {
      const w = parseFloat(match[1]);
      const h = parseFloat(match[2]);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        totalSqft += w * h;
        validSections++;
      }
    }
  }

  if (validSections === 0) return null;

  return { sqft: Math.round(totalSqft), raw };
}

/**
 * Map ATTOM API response to canonical PropertyAttributes.
 */
export function mapAttomToCanonical(response: any): PropertyAttributes {
  const attrs: PropertyAttributes = {};
  const property = response?.property?.[0];
  if (!property) return attrs;

  // Building area
  const bldgSize = property?.building?.size?.bldgSize
    || property?.building?.size?.livingSize
    || property?.building?.size?.universalSize;
  if (bldgSize && bldgSize > 0) {
    attrs.building_area_sqft = bldgSize;
  }

  // Stories
  const levels = property?.building?.summary?.levels;
  if (levels && levels > 0) {
    attrs.stories = levels;
  }

  // Year built
  const yearBuilt = property?.building?.summary?.yearBuilt
    || property?.summary?.yearBuilt;
  if (yearBuilt && yearBuilt > 1600) {
    attrs.year_built = yearBuilt;
  }

  // Lot area
  const lotSize = property?.lot?.lotSize1;
  if (lotSize && lotSize > 0) {
    attrs.lot_area_sqft = lotSize;
  }

  // Roof material
  const roofCover = property?.building?.construction?.roofCover;
  if (roofCover) {
    attrs.roof_material = roofCover;
  }

  // Exterior wall material
  const wallType = property?.building?.construction?.wallType
    || property?.building?.construction?.exteriorWallType;
  if (wallType) {
    attrs.exterior_wall_material = wallType;
  }

  // Garage area
  const garageSqft = property?.building?.parking?.garageSqft;
  if (garageSqft && garageSqft > 0) {
    attrs["surface.garage.area_sqft"] = garageSqft;
  }

  return attrs;
}

/**
 * Parse address into address1 (street) and address2 (city, state zip) for ATTOM API.
 */
function splitAddress(address: string): { address1: string; address2: string } {
  // Try to split on comma
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return {
      address1: parts[0],
      address2: parts.slice(1).join(', '),
    };
  }

  // Fallback: try to find state abbreviation pattern
  const stateMatch = address.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (stateMatch) {
    return {
      address1: stateMatch[1],
      address2: `${stateMatch[2]} ${stateMatch[3]}`,
    };
  }

  // Last resort: use entire address as address1
  return { address1: address, address2: '' };
}

/**
 * Main orchestrator: resolve property data for an address.
 * Checks cache first (30-day TTL), then falls back to ATTOM API.
 */
export async function resolvePropertyData(address: string): Promise<{
  snapshot: PropertySnapshot | null;
  attributes: PropertyAttributes;
}> {
  const normalized = normalizeAddress(address);

  // Check DB cache (30-day TTL)
  const existing = await storage.getPropertySnapshotByAddress(normalized);
  if (existing) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (existing.retrievedAt > thirtyDaysAgo) {
      console.log(`[PropertyResolver] Cache hit for: ${normalized}`);
      return {
        snapshot: existing,
        attributes: existing.attributesJson as PropertyAttributes,
      };
    }
  }

  // Call ATTOM API
  if (!attomApi.isConfigured()) {
    console.warn('[PropertyResolver] ATTOM API not configured');
    return { snapshot: null, attributes: {} };
  }

  const { address1, address2 } = splitAddress(address);

  try {
    const response = await attomApi.getPropertyDetail(address1, address2);
    const attributes = mapAttomToCanonical(response);

    // Store snapshot
    const snapshot = await storage.createPropertySnapshot({
      addressNormalized: normalized,
      addressInput: address,
      attributesJson: attributes,
      source: 'attom',
      retrievedAt: new Date(),
      rawPayloadJson: response,
    });

    return { snapshot, attributes };
  } catch (error) {
    console.error('[PropertyResolver] ATTOM API call failed:', error);
    return { snapshot: null, attributes: {} };
  }
}
