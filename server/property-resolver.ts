import { attomApi } from "./attom-api";
import { storage } from "./storage";
import type { PropertyAttributes, PropertySnapshot } from "@shared/schema";

function coercePositiveNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function coerceLoosePositiveNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === "string") {
    // Accept strings like "2,134", "2,134 sq ft", "2134 SF"
    const match = value.match(/-?\d[\d,]*(?:\.\d+)?/);
    if (!match) return null;
    const parsed = Number(match[0].replace(/,/g, ""));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function pickFirstPositive(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = coercePositiveNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function findFirstPositiveByKeyPriority(input: unknown, keyHints: string[]): number | null {
  if (!input || typeof input !== "object") return null;
  const entries = Object.entries(input as Record<string, unknown>);

  for (const hint of keyHints) {
    for (const [key, value] of entries) {
      if (key.toLowerCase().includes(hint)) {
        const parsed = coerceLoosePositiveNumber(value);
        if (parsed !== null) return parsed;
      }
    }
  }

  for (const [, value] of entries) {
    const parsed = coerceLoosePositiveNumber(value);
    if (parsed !== null) return parsed;
  }

  return null;
}

function findBuildingAreaFromPayload(property: any): number | null {
  const results: Array<{ path: string; value: number }> = [];
  const seen = new Set<any>();

  const visit = (node: any, path: string) => {
    if (node === null || node === undefined) return;
    if (typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    for (const [key, rawValue] of Object.entries(node)) {
      const nextPath = path ? `${path}.${key}` : key;

      const parsed = coerceLoosePositiveNumber(rawValue);
      if (parsed !== null) {
        const lowPath = nextPath.toLowerCase();
        const includesSizeSignal =
          lowPath.includes('size') || lowPath.includes('sqft') || lowPath.includes('square') || lowPath.includes('area');
        const includesBuildingSignal =
          lowPath.includes('building') || lowPath.includes('bldg') || lowPath.includes('living') || lowPath.includes('gross') || lowPath.includes('floor');
        const excludesSurfaceSignals =
          lowPath.includes('lot') || lowPath.includes('land') || lowPath.includes('garage') || lowPath.includes('parking') ||
          lowPath.includes('deck') || lowPath.includes('patio') || lowPath.includes('driveway') || lowPath.includes('pool');

        // Typical residential sqft range to reduce false positives from unrelated values.
        const plausibleRange = parsed >= 300 && parsed <= 25000;
        if (includesSizeSignal && includesBuildingSignal && !excludesSurfaceSignals && plausibleRange) {
          results.push({ path: nextPath, value: parsed });
        }
      }

      if (typeof rawValue === 'object' && rawValue !== null) {
        visit(rawValue, nextPath);
      }
    }
  };

  visit(property, 'property');

  if (results.length === 0) return null;

  // Prefer more specific canonical-like paths first.
  const preferred = results.find((r) =>
    r.path.toLowerCase().includes('building.size')
    || r.path.toLowerCase().includes('living')
    || r.path.toLowerCase().includes('gross')
    || r.path.toLowerCase().includes('bldgsize')
  );
  return preferred?.value ?? results[0].value;
}

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
  const buildingSize = property?.building?.size;

  // Building area
  const bldgSize = pickFirstPositive(
    buildingSize?.bldgSize,
    buildingSize?.livingSize,
    buildingSize?.universalSize,
    // ATTOM variants that are often present when bldgSize is not
    buildingSize?.grossSize,
    buildingSize?.grossSizeAdjusted,
    buildingSize?.groundFloorSize,
    // Fallback for non-standard key variants in ATTOM payloads
    findFirstPositiveByKeyPriority(buildingSize, ['bldg', 'living', 'gross', 'universal', 'ground', 'sqft', 'size']),
    // Deep fallback scan across payload for non-standard ATTOM naming
    findBuildingAreaFromPayload(property),
  );
  if (bldgSize !== null) {
    attrs.building_area_sqft = bldgSize;
  } else {
    console.log('[PropertyResolver] building_area_sqft missing. building.size keys:', Object.keys(buildingSize || {}));
  }

  // Stories
  const levels = pickFirstPositive(
    property?.building?.summary?.levels,
  );
  if (levels !== null) {
    attrs.stories = levels;
  }

  // Year built
  const yearBuilt = pickFirstPositive(
    property?.building?.summary?.yearBuilt,
    property?.summary?.yearBuilt,
  );
  if (yearBuilt !== null && yearBuilt > 1600) {
    attrs.year_built = yearBuilt;
  }

  // Lot area
  const lotSize = pickFirstPositive(
    property?.lot?.lotSize1,
    property?.lot?.lotSize2,
  );
  if (lotSize !== null) {
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
  const garageSqft = pickFirstPositive(
    property?.building?.parking?.garageSqft,
    property?.building?.parking?.prkgSize,
  );
  if (garageSqft !== null) {
    attrs["surface.garage.area_sqft"] = garageSqft;
  }

  return attrs;
}

/**
 * Parse address into address1 (street) and address2 (city, state zip) for ATTOM API.
 */
const STREET_SUFFIXES = new Set([
  'st', 'street', 'ave', 'avenue', 'blvd', 'boulevard', 'rd', 'road',
  'dr', 'drive', 'ln', 'lane', 'ct', 'court', 'cir', 'circle', 'pl', 'place',
  'pkwy', 'parkway', 'hwy', 'highway', 'trl', 'trail', 'ter', 'terrace', 'way',
]);

function splitAddressFromUnformattedLine(address: string): { address1: string; address2: string } | null {
  const compact = address.replace(/,/g, ' ').trim().replace(/\s+/g, ' ');
  const tokens = compact.split(' ').filter(Boolean);
  if (tokens.length < 4) return null;

  const zipIndex = tokens.findIndex((t) => /^\d{5}(?:-\d{4})?$/.test(t));
  if (zipIndex < 2) return null;

  const stateIndex = zipIndex - 1;
  const stateToken = tokens[stateIndex];
  if (!/^[a-z]{2}$/i.test(stateToken)) return null;

  const beforeState = tokens.slice(0, stateIndex);
  if (beforeState.length < 2) return null;

  let suffixIndex = -1;
  for (let i = beforeState.length - 1; i >= 0; i--) {
    const normalized = beforeState[i].toLowerCase().replace(/[.,]/g, '');
    if (STREET_SUFFIXES.has(normalized)) {
      suffixIndex = i;
      break;
    }
  }

  // Need at least one token for city after street suffix.
  if (suffixIndex <= 0 || suffixIndex >= beforeState.length - 1) return null;

  const street = beforeState.slice(0, suffixIndex + 1).join(' ');
  const city = beforeState.slice(suffixIndex + 1).join(' ');
  const state = stateToken.toUpperCase();
  const zip = tokens[zipIndex];

  return {
    address1: street,
    address2: `${city}, ${state} ${zip}`,
  };
}

function stripCountrySuffix(part: string): string {
  return part
    .replace(/\b(united states|usa|us)\b\.?$/i, '')
    .replace(/[,\s]+$/g, '')
    .trim();
}

function splitAddress(address: string): { address1: string; address2: string } {
  // Try to split on comma
  let parts = address.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const strippedLast = stripCountrySuffix(parts[parts.length - 1]);
    if (!strippedLast) {
      parts = parts.slice(0, -1);
    } else {
      parts[parts.length - 1] = strippedLast;
    }
  }
  if (parts.length >= 2) {
    return {
      address1: parts[0],
      address2: parts.slice(1).join(', '),
    };
  }

  // Heuristic for unformatted addresses like:
  // "435 south 3rd st lemoyne pa 17043"
  const heuristicSplit = splitAddressFromUnformattedLine(address);
  if (heuristicSplit) return heuristicSplit;

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
      const cachedAttributes = (existing.attributesJson || {}) as PropertyAttributes;

      // Backfill old cached snapshots using current mapping logic without forcing a live ATTOM call.
      // This helps when payload had sqft data under alternate keys we previously did not map.
      if ((cachedAttributes as any).building_area_sqft === undefined && existing.rawPayloadJson) {
        const remapped = mapAttomToCanonical(existing.rawPayloadJson);
        if ((remapped as any).building_area_sqft !== undefined) {
          const merged = { ...cachedAttributes, ...remapped };
          console.log(`[PropertyResolver] Cache backfill applied for: ${normalized}`);
          return {
            snapshot: existing,
            attributes: merged,
          };
        }
      }

      console.log(`[PropertyResolver] Cache hit for: ${normalized}`);
      return {
        snapshot: existing,
        attributes: cachedAttributes,
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
