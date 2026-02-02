# Public Homeowner Directory Implementation

This document describes the implementation of the public directory feature that allows homeowners to find businesses offering instant pricing calculators, filtered by service category and location.

## Overview

The directory is an opt-in feature for business owners who can control which services appear and where they serve. Homeowners can browse by category and location, view company profiles, and get instant quotes using embedded calculators.

---

## Files Modified

### 1. Database Schema

**File:** `shared/schema.ts`

Added 5 new tables at the end of the file (after line 2845):

#### directoryCategories
Standardized service categories for the public directory.
```typescript
- id: serial primary key
- name: text (unique) - "Pressure Washing"
- slug: text (unique) - "pressure-washing"
- description: text
- iconUrl: text
- parentCategoryId: integer (self-reference for hierarchy)
- status: enum ["pending", "approved", "rejected"]
- seoTitle: text
- seoDescription: text
- displayOrder: integer
- listingCount: integer
- createdAt, updatedAt: timestamps
```

#### directoryProfiles
Business opt-in profiles for the public directory.
```typescript
- id: serial primary key
- userId: varchar (unique, references users)
- companySlug: text (unique)
- companyName: text
- companyDescription: text
- companyLogoUrl: text
- websiteUrl, phoneNumber, email: text
- city, state, zipCode: text
- latitude, longitude: text
- isActive, showOnDirectory: boolean
- metaDescription: text
- totalServices: integer
- createdAt, updatedAt: timestamps
```

#### directoryServiceListings
Links formulas to directory categories.
```typescript
- id: serial primary key
- directoryProfileId: integer (references directoryProfiles, cascade delete)
- formulaId: integer (references formulas, cascade delete)
- categoryId: integer (references directoryCategories)
- isActive: boolean
- displayOrder: integer
- customDisplayName: text
- createdAt: timestamp
```

#### directoryServiceAreas
Geographic coverage for business profiles.
```typescript
- id: serial primary key
- directoryProfileId: integer (references directoryProfiles, cascade delete)
- areaType: enum ["radius", "zip_codes", "cities", "states"]
- radiusMiles: integer
- centerLatitude, centerLongitude: text
- zipCodes: jsonb (string array)
- cities: jsonb (array of {city, state})
- states: jsonb (string array)
- isActive: boolean
- createdAt: timestamp
```

#### directoryIndexCache
Denormalized cache for fast public page lookups.
```typescript
- id: serial primary key
- categoryId: integer (references directoryCategories)
- categorySlug: text
- city, state, citySlug: text
- profileIds: jsonb (number array)
- profileCount: integer
- isIndexable: boolean
- lastUpdatedAt: timestamp

Indexes:
- directory_index_cache_category_city_idx (categorySlug, citySlug)
- directory_index_cache_category_idx (categoryId)
```

Also added:
- Insert schemas (Zod) for all tables
- TypeScript types for all tables
- Drizzle relations for all tables

---

### 2. Database Migration Script

**File:** `scripts/create-directory-tables.ts` (new file)

Creates all directory tables via raw SQL and seeds 20 initial approved categories:
- Pressure Washing, Window Cleaning, House Cleaning, Lawn Care
- Gutter Cleaning, Roof Cleaning, Carpet Cleaning, Pool Cleaning
- HVAC Services, Painting, Landscaping, Junk Removal
- Moving Services, Handyman Services, Pest Control, Concrete Services
- Deck Staining, Christmas Lights, Solar Panel Cleaning, Driveway Sealing

Run with: `npx tsx scripts/create-directory-tables.ts`

---

### 3. API Routes

**File:** `server/routes.ts`

#### Import Changes (line 10-11)
```typescript
// Added to imports:
import { ..., directoryCategories, directoryProfiles, directoryServiceListings,
         directoryServiceAreas, directoryIndexCache, formulas, businessSettings,
         insertDirectoryCategorySchema, insertDirectoryProfileSchema,
         insertDirectoryServiceListingSchema, insertDirectoryServiceAreaSchema } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm"; // Added sql
```

#### New Endpoints (added before `const httpServer = createServer(app)`)

**Public Routes (no authentication):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/directory/categories` | List all approved categories |
| GET | `/api/public/directory/cities/:categorySlug` | Get cities with listings for a category |
| GET | `/api/public/directory/listings/:categorySlug/:citySlug` | Get business listings for category + city |
| GET | `/api/public/directory/company/:companySlug` | Get company profile with services |
| GET | `/sitemap-directory.xml` | SEO sitemap for directory pages |

**Authenticated Routes (business owner):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/directory/profile` | Get current user's directory profile |
| POST | `/api/directory/profile` | Create directory profile |
| PATCH | `/api/directory/profile` | Update directory profile |
| GET | `/api/directory/services` | Get user's service listings |
| POST | `/api/directory/services` | Add service listing |
| DELETE | `/api/directory/services/:id` | Remove service listing |
| GET | `/api/directory/service-areas` | Get user's service areas |
| POST | `/api/directory/service-areas` | Create/update service area |
| GET | `/api/directory/categories/search` | Search categories |
| POST | `/api/directory/categories/suggest` | Suggest new category (creates as pending) |

**Admin Routes (super_admin only):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/directory/categories` | Get all categories (including pending) |
| POST | `/api/admin/directory/categories` | Create category |
| PATCH | `/api/admin/directory/categories/:id` | Update category |
| POST | `/api/admin/directory/categories/:id/approve` | Approve pending category |

**Helper Functions Added:**
- `generateSlug(name)` - Creates URL-friendly slugs
- `updateDirectoryIndexCache(profileId)` - Updates denormalized cache when profile changes

---

### 4. Frontend Routes

**File:** `client/src/App.tsx`

#### Import Changes (after line 97)
```typescript
// Directory pages
const DirectoryHome = lazy(() => import("@/pages/directory/directory-home"));
const DirectoryCategoryPage = lazy(() => import("@/pages/directory/category-page"));
const DirectoryCityCategoryPage = lazy(() => import("@/pages/directory/city-category-page"));
const DirectoryCompanyPage = lazy(() => import("@/pages/directory/company-page"));
const DirectorySetup = lazy(() => import("@/pages/directory/directory-setup"));
const DirectoryDashboard = lazy(() => import("@/pages/directory/directory-dashboard"));
```

#### Routes Added

**Unauthenticated Routes (public access):**
```tsx
<Route path="/directory" component={DirectoryHome} />
<Route path="/quotes/:categorySlug/:citySlug" component={DirectoryCityCategoryPage} />
<Route path="/quotes/:categorySlug" component={DirectoryCategoryPage} />
<Route path="/directory/company/:companySlug" component={DirectoryCompanyPage} />
```

**Authenticated Routes (same public routes + owner pages):**
```tsx
<Route path="/directory" component={DirectoryHome} />
<Route path="/quotes/:categorySlug/:citySlug" component={DirectoryCityCategoryPage} />
<Route path="/quotes/:categorySlug" component={DirectoryCategoryPage} />
<Route path="/directory/company/:companySlug" component={DirectoryCompanyPage} />
<Route path="/directory-setup" component={DirectorySetup} />
<Route path="/directory-dashboard" component={DirectoryDashboard} />
```

---

### 5. Frontend Pages

**Directory:** `client/src/pages/directory/` (new folder)

#### directory-home.tsx
Public directory homepage with:
- Hero section with search
- Category grid with icons and listing counts
- "How It Works" section
- Footer

#### category-page.tsx
Category page listing cities:
- Breadcrumb navigation
- City search filter
- Cities grouped by state
- Profile counts per city
- CTA for empty states

#### city-category-page.tsx
Business listings for category + city:
- Breadcrumb navigation
- Business cards with logo, description, location
- "Instant Pricing" badges
- Links to company profiles
- CTA for empty states

#### company-page.tsx
Company profile page:
- Company header with logo, contact info, website link
- Services grouped by category
- Expandable inline calculators (iframe)
- CTA for business owners

#### directory-setup.tsx
Multi-step setup wizard (authenticated):
1. **Profile Setup** - Company name, description, location, contact
2. **Select Services** - Choose formulas, assign categories
3. **Service Area** - Radius or specific cities
4. **Review** - Preview and publish toggle

Features:
- Pre-fills from existing businessSettings
- Category search and suggestion
- State selector dropdown
- Progress indicators

#### directory-dashboard.tsx
Listing management dashboard (authenticated):
- Visibility toggle (show/hide listing)
- Profile summary card
- Services list with categories
- Service area summary
- Stats placeholders (coming soon)
- Warning for incomplete setup

---

## URL Structure

| URL | Page | SEO |
|-----|------|-----|
| `/directory` | Directory home | Always indexable |
| `/quotes/{category}` | Category cities | Indexable if approved |
| `/quotes/{category}/{city}` | Listings | Indexable if profileCount >= 1 |
| `/directory/company/{slug}` | Company profile | Indexable if active |
| `/directory-setup` | Setup wizard | noindex (auth required) |
| `/directory-dashboard` | Dashboard | noindex (auth required) |

---

## Category Workflow

1. **Approved categories** - Visible in all filters, SEO indexed
2. **Pending categories** - Created via "suggest", visible only on own company page
3. **Admin approval** - Super admin reviews pending, adds SEO metadata, approves

---

## Cache Strategy

The `directoryIndexCache` table stores pre-computed category + city combinations:
- Updated when business enables/disables listing
- Updated when service area changes
- Avoids expensive joins on public page loads
- `isIndexable` flag controls SEO indexing

---

## Testing

### API Testing
```bash
# Get categories
curl /api/public/directory/categories

# Get listings
curl /api/public/directory/listings/pressure-washing/philadelphia-pa

# Get company
curl /api/public/directory/company/joes-cleaning
```

### Manual Testing
1. Create directory profile as business owner
2. Add services with categories
3. Set service area (radius or cities)
4. Verify company appears in `/quotes/{category}/{city}`
5. Verify calculator loads inline on company page
6. Toggle visibility on/off

---

## Future Enhancements

- [ ] Profile view analytics
- [ ] Lead tracking from directory
- [ ] Reviews/ratings system
- [ ] Featured listings (paid)
- [ ] Radius-based city expansion (geocoding)
- [ ] Admin category management UI
- [ ] Cache cleanup job for stale entries
