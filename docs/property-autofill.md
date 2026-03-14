# Property Data Autofill

## Overview

Property Data Autofill integrates the Realie property data API to auto-fill pricing calculator form fields based on a customer's property address. This reduces friction for customers and improves quote accuracy by pulling in verified property measurements.

## How It Works

### Business Owner Setup

1. **Enable the feature** in Form Settings > Property Data Autofill toggle
2. **Map questions** in the Formula Builder by setting "Prefill from Property Data" on each variable that should be auto-filled
3. Each variable can be mapped to one canonical property attribute (e.g., `building_area_sqft`, `roof_material`)

### Customer Flow

1. Customer selects services as usual
2. If any selected service has variables with `prefillSourceKey` mappings, an **Address step** appears between Select and Configure
3. Customer enters their property address
4. System calls the Realie API to retrieve property data
5. Matching form fields are pre-filled with property values
6. Customer can still modify any pre-filled value
7. Pre-filled fields show a green "Prefilled from property data" badge

### Skip Behavior

- Customer can skip the address step entirely
- If the Realie API fails, the customer proceeds with empty fields (no blocking)
- If the feature toggle is OFF, no address step appears regardless of mappings

## Canonical Property Attributes

| Key | Description | Source (Realie Field) |
|-----|-------------|---------------------|
| `building_area_sqft` | Building area in sqft | `buildingArea` |
| `stories` | Number of stories | `stories` |
| `exterior_wall_material` | Siding / wall material | `wallType` (decoded) |
| `roof_material` | Roof material | `roofType` (decoded) |

## Cache Behavior

- Property data is cached in the `property_snapshots` database table
- Cache key: normalized address (lowercased, standardized abbreviations, unit suffixes stripped)
- TTL: 30 days from `retrieved_at`
- On cache hit within TTL, no Realie API call is made
- Raw API payload is stored for debugging

## API Endpoints

### `POST /api/property/resolve`
- Auth: optional (called from public customer form)
- Input: `{ address: string, formulaIds?: number[] }`
- Returns: `{ snapshotId, attributes, source, addressNormalized }`
- If `formulaIds` provided, only attributes matching mapped `prefillSourceKey` values are returned

### `GET /api/property/attributes`
- Auth: required (form builder UI)
- Returns: `{ attributes, groups, configured }` (label map, grouping, and whether the Realie API key is set)

## Configuration

Set the `REALIE_API_KEY` environment variable (secret) with your Realie API key.

## Coverage Notes

- Realie coverage varies by property and region
- Core attributes like building area and stories should be treated as the primary autofill fields
- Roof and siding values are decoded from provider field keys when available
- The system gracefully handles missing data — only available attributes are returned and prefilled
