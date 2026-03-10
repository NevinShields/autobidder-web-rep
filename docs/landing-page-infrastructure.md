# Landing Page Infrastructure Snapshot

Last updated: 2026-03-05

## Scope

This document captures the **current** landing page infrastructure in Autobidder so we can reference it later when building landing page templates.

## High-Level Summary

- Landing pages currently support a **single page per owner user** with a built-in template picker (6 templates).
- There is a complete flow for:
  - owner edit (`/dashboard/landing-page`)
  - publish/unpublish
  - public render (`/l/:slug`)
  - event tracking (`view`, `lead_submit`, `callback_request`)
- Current customization includes template key, color theme tokens, and optional service imagery.

## Data Model

### Core tables

- `landing_pages`
  - Defined in `shared/schema.ts` around `landingPages`.
  - Migration: `migrations/0006_landing_pages.sql`.
  - Key fields:
    - identity/publish: `user_id`, `slug`, `status`, `published_at`
    - template/theme: `template_key`, `theme` (JSON)
    - hero/content: `business_name`, `logo_url`, `tagline`, `cta_label`
    - sections: `trust_chips`, `services` (supports optional `imageUrl`), `how_it_works`, `faqs`
    - contact/seo: `phone`, `email`, `service_area_text`, `seo_title`, `seo_description`
- `landing_page_events`
  - Event types: `view`, `lead_submit`, `callback_request`
  - Stores optional JSON `metadata`.

### Current limitations in schema

- No separate `landing_page_templates` table/catalog; templates are currently app-level preset keys.
- No template versioning table yet.

## Backend Routes

Landing page route block is in `server/routes.ts` under `// ==================== Landing Pages ====================`.

### Owner routes

- `GET /api/landing-page/me`
  - Fetches current owner page.
  - Auto-creates one via `ensureLandingPageForUser` if missing.
- `PATCH /api/landing-page/me`
  - Updates only whitelisted fields via `sanitizeLandingPageUpdate`.
- `POST /api/landing-page/me/publish`
  - Validates basics and primary calculator readiness before publishing.
  - Syncs `directory_profiles.landing_page_slug`.
- `POST /api/landing-page/me/unpublish`
  - Sets page back to draft and clears directory profile slug.

### Public routes

- `GET /api/landing-page/public?slug=...`
  - Returns public data only when page status is `published`.
  - Adds runtime fields:
    - `primaryServiceEmbedId`
    - `landingPageUrl`
    - lead cap info
    - branding requirement flag
- `POST /api/landing-page/events`
  - Records page events (`view`, `lead_submit`, `callback_request`).

## Storage / Lifecycle

- New owner creation path calls:
  - `ensureStarterDesignForUser`
  - `ensureLandingPageForUser`
- `ensureLandingPageForUser` seeds:
  - slug from business name
  - default trust chips
  - default "How it works"
  - empty FAQs/services

## Frontend

### Routes

- Private editor: `/dashboard/landing-page`
- Public page: `/l/:slug`

### Editor page

File: `client/src/pages/landing-page-editor.tsx`

Current editable sections:

- Template picker (9 presets): `classic`, `split`, `spotlight`, `bubble-shark`, `noir-edge`, `fresh-deck`, `halo-glass`, `atlas-pro`, `mono-grid`
- Theme colors (primary/accent/background/surface/text/muted/button text)
- Basics: URL, business name, logo URL, tagline, CTA label
- Trust chips
- Services (sync from calculators, enable/disable, re-order, rename, optional image upload)
- Calculator settings (primary service, multi-service toggle)
- How it works
- FAQs
- Contact
- SEO

Autosave + manual save are implemented.

### Public renderer

File: `client/src/components/landing-page-view.tsx`

Rendered structure:

- Hero + CTA + trust chips
- Services cards
- How it works
- FAQs
- Footer/contact info
- Calculator block or multi-service selector embed

### Public page wrapper

File: `client/src/pages/landing-page-public.tsx`

Adds:

- SEO tags/meta/canonical/json-ld updates
- page-view and lead-submit event calls

## Validation Rules

`server/landing-page-utils.ts`

- Business name required
- At least one service enabled
- Primary service required
- Primary service must be enabled

## Related Systems (Important Distinction)

There is an existing **website template** system (Duda/custom website templates), but it is separate from landing pages.

- Schema: `custom_website_templates` in `shared/schema.ts`
- Public template APIs: `/api/duda-templates`, `/api/custom-website-templates`
- Admin template APIs: `/api/admin/custom-website-templates/*`
- UI consumer: `client/src/pages/website.tsx`

This should not be confused with landing page configuration, which uses the dedicated `landing_pages` fields listed above.

## Upload Infrastructure Reuse Options

Reusable upload foundations already exist:

- Object storage signed-upload endpoints (`/api/objects/*`)
- ACL finalization endpoints for public object access
- Object serving route: `GET /objects/:objectPath(*)`

Current generic form image uploader (`/api/upload-image`) writes to local `/uploads/form-images`, so it is not ideal for long-term landing-page assets compared with object storage routes.

## Current Gaps for Planned Landing Page Templates

To support "upload a few images per service + customize color scheme" templates, missing pieces are:

- Template catalog/table if templates need admin management
- Optional typography/font token controls
- Optional: template versioning/migration strategy for existing pages

## Quick File Index

- Schema: `shared/schema.ts` (`landingPages`, `landingPageEvents`)
- Migrations: `migrations/0006_landing_pages.sql`, `migrations/0012_landing_page_templates.sql`
- Routes: `server/routes.ts` (landing page APIs)
- Validation helpers: `server/landing-page-utils.ts`
- Seeding/bootstrap: `server/storage.ts` (`ensureLandingPageForUser`)
- Editor UI: `client/src/pages/landing-page-editor.tsx`
- Public route wrapper: `client/src/pages/landing-page-public.tsx`
- Public renderer: `client/src/components/landing-page-view.tsx`
- Route registration: `client/src/App.tsx`
