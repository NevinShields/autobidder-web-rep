interface RealieConfig {
  apiKey: string;
  baseUrl: string;
}

interface RealiePropertyData {
  buildingArea?: number | string | null;
  stories?: number | string | null;
  roofType?: string | null;
  wallType?: string | null;
  [key: string]: unknown;
}

const REALIE_ROOF_TYPE_MAP: Record<string, string> = {
  A: "Asphalt",
  B: "Built-up",
  C: "Composition",
  F: "Flat",
  G: "Gravel",
  M: "Metal",
  P: "Composition Shingle",
  R: "Roll Composition",
  S: "Shake/Shingle",
  T: "Tile",
  W: "Wood Shingle",
};

const REALIE_WALL_TYPE_MAP: Record<string, string> = {
  A: "Aluminum",
  B: "Block",
  BRC: "Brick",
  C: "Concrete",
  D: "Stucco",
  F: "Frame",
  M: "Masonry",
  N: "Concrete Block",
  S: "Stone",
  STU: "Stucco",
  V: "Vinyl",
  WD: "Wood",
  WOD: "Wood",
};

function coercePositiveNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function normalizeMaterial(code: string | null | undefined, lookup: Record<string, string>): string | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase();
  return lookup[normalized] || normalized;
}

export class RealieApiService {
  private config: RealieConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REALIE_API_KEY || "",
      baseUrl: "https://app.realie.ai/api/public",
    };
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  async getPropertyByAddress(address: string, state: string, unit?: string): Promise<RealiePropertyData | null> {
    const url = new URL(`${this.config.baseUrl}/property/address/`);
    url.searchParams.set("address", address);
    url.searchParams.set("state", state);
    if (unit) {
      url.searchParams.set("unit", unit);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: this.config.apiKey,
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Realie API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return (data?.data ?? data) as RealiePropertyData | null;
  }

  mapToCanonical(data: RealiePropertyData | null): {
    building_area_sqft?: number;
    stories?: number;
    roof_material?: string;
    exterior_wall_material?: string;
  } {
    if (!data) return {};

    const attrs: {
      building_area_sqft?: number;
      stories?: number;
      roof_material?: string;
      exterior_wall_material?: string;
    } = {};

    const buildingArea = coercePositiveNumber(data.buildingArea);
    if (buildingArea !== null) {
      attrs.building_area_sqft = buildingArea;
    }

    const stories = coercePositiveNumber(data.stories);
    if (stories !== null) {
      attrs.stories = stories;
    }

    const roofMaterial = normalizeMaterial(data.roofType ?? null, REALIE_ROOF_TYPE_MAP);
    if (roofMaterial) {
      attrs.roof_material = roofMaterial;
    }

    const wallMaterial = normalizeMaterial(data.wallType ?? null, REALIE_WALL_TYPE_MAP);
    if (wallMaterial) {
      attrs.exterior_wall_material = wallMaterial;
    }

    return attrs;
  }
}

export const realieApi = new RealieApiService();
