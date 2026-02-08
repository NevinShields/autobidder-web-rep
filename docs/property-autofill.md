# Property Data Autofill

## Overview

Property Data Autofill integrates the ATTOM property data API to auto-fill pricing calculator form fields based on a customer's property address. This reduces friction for customers and improves quote accuracy by pulling in verified property measurements.

## How It Works

### Business Owner Setup

1. **Enable the feature** in Form Settings > Property Data Autofill toggle
2. **Map questions** in the Formula Builder by setting "Prefill from Property Data" on each variable that should be auto-filled
3. Each variable can be mapped to one canonical property attribute (e.g., `building_area_sqft`, `roof_material`)

### Customer Flow

1. Customer selects services as usual
2. If any selected service has variables with `prefillSourceKey` mappings, an **Address step** appears between Select and Configure
3. Customer enters their property address
4. System calls ATTOM API to retrieve property data
5. Matching form fields are pre-filled with property values
6. Customer can still modify any pre-filled value
7. Pre-filled fields show a green "Prefilled from property data" badge

### Skip Behavior

- Customer can skip the address step entirely
- If the ATTOM API fails, the customer proceeds with empty fields (no blocking)
- If the feature toggle is OFF, no address step appears regardless of mappings

## Canonical Property Attributes

| Key | Description | Source (ATTOM Path) |
|-----|-------------|---------------------|
| `building_area_sqft` | Building area in sqft | `building.size.bldgSize` |
| `stories` | Number of stories | `building.summary.levels` |
| `year_built` | Year built | `building.summary.yearBuilt` |
| `lot_area_sqft` | Lot area in sqft | `lot.lotSize1` |
| `exterior_wall_material` | Wall material | `building.construction.wallType` |
| `roof_material` | Roof cover material | `building.construction.roofCover` |
| `surface.driveway.area_sqft` | Driveway area | Parsed from dimensions |
| `surface.patio.area_sqft` | Patio area | Parsed from dimensions |
| `surface.deck.area_sqft` | Deck area | Parsed from dimensions |
| `surface.pool.area_sqft` | Pool area | Parsed from dimensions |
| `surface.garage.area_sqft` | Garage area | `building.parking.garageSqft` |
| `surface.fence.linear_ft` | Fence length | Parsed from dimensions |

## Dimensions Parser

The `parseDimensions()` function handles ATTOM dimension strings:

- `"24X24"` → 576 sqft
- `"24 x 16"` → 384 sqft
- `"24ft x 16ft"` → 384 sqft
- `"24X24;12X10"` → 696 sqft (multi-section, summed)
- `""` or `"abc"` → null (invalid)

## Cache Behavior

- Property data is cached in the `property_snapshots` database table
- Cache key: normalized address (lowercased, standardized abbreviations, unit suffixes stripped)
- TTL: 30 days from `retrieved_at`
- On cache hit within TTL, no ATTOM API call is made
- Raw API payload is stored for debugging

## API Endpoints

### `POST /api/property/resolve`
- Auth: optional (called from public customer form)
- Input: `{ address: string, formulaIds?: number[] }`
- Returns: `{ snapshotId, attributes, source, addressNormalized }`
- If `formulaIds` provided, only attributes matching mapped `prefillSourceKey` values are returned

### `GET /api/property/attributes`
- Auth: required (form builder UI)
- Returns: `{ attributes, groups, configured }` (label map, grouping, and whether ATTOM API key is set)

## Configuration

Set the `ATTOM_API_KEY` environment variable (Replit secret) with your ATTOM Data API key.

## Coverage Notes

- ATTOM coverage varies by property and region
- Core attributes (building area, year built, lot size) have high coverage for residential properties
- Surface-specific data (driveway, patio, deck dimensions) may not be available for all properties
- The system gracefully handles missing data — only available attributes are returned and prefilled
