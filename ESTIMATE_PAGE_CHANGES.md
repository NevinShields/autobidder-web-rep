# Estimate Page System Changes (Jan 29, 2026)

This document summarizes the estimate-page system updates made today and the intended next steps.

## Summary
We implemented the foundation for a customizable estimate page system that supports:
- pre-estimates vs confirmed estimates
- per-estimate page customization
- global defaults via a dedicated Estimate Page Editor
- locking estimate presentation settings after sending
- preventing customer acceptance of pre-estimates

---

## Backend / Schema Changes

### 1) Estimates table fields (shared/schema.ts)
Added new fields to `estimates`:
- `estimateType` (text, default `confirmed`) — values: `pre_estimate` | `confirmed`
- `customMessage` (text)
- `layoutId` (text)
- `theme` (json)
- `attachments` (json array)
- `videoUrl` (text)
- `revisionReason` (text)
- `isSentLocked` (boolean, default false)

### 2) Business settings defaults (shared/schema.ts)
Added:
- `estimatePageSettings` (json) under `business_settings` with:
  - `defaultLayoutId`
  - `defaultTheme` (primary/accent/background/text colors)
  - `defaultAttachments` (image/pdf array)
  - `defaultVideoUrl`
  - `defaultIncludeAttachments`

### 3) Send estimate API payload expanded (shared/schema.ts)
`sendEstimateToCustomerSchema` now accepts:
- `customMessage`, `layoutId`, `theme`, `attachments`, `videoUrl`

### 4) DB Migration
New migration file:
- `migrations/0002_estimate_page_settings.sql`

---

## Server Behavior Updates (server/routes.ts)

### 1) Estimate send flow
- Uses **business defaults** if estimate has no settings.
- Allows per-send overrides from UI.
- Locks estimate presentation (`isSentLocked = true`) when sent.
- Rejects post-send changes to layout/theme/attachments/video/custom message.
- Uses `getBusinessSettingsByUserId` (multi-tenant safe) when sending.

### 2) Pre-estimate restrictions
Blocked these actions when `estimateType = pre_estimate`:
- customer accept
- customer decline
- owner “mark customer approved”
- convert to work order

### 3) Estimate creation
- Lead-based estimate creation now sets `estimateType: pre_estimate`.
- Confirm-bid flow sets `estimateType: confirmed`.

### 4) Business settings allowlist
`estimatePageSettings` added to allowed fields in PATCH /api/business-settings/:id.

---

## Client UI Updates

### 1) Customer estimate page (client/src/pages/estimate.tsx)
- Added a **Pre-Estimate / Confirmed** tag.
- Added a pre-estimate notice card.
- Accept/Decline only shown for confirmed estimates.

### 2) Owner estimates list (client/src/pages/estimates.tsx)
- Added a **Type** column with Pre-Estimate / Confirmed badge.

### 3) Per-estimate editing (client/src/components/edit-estimate-dialog.tsx)
Added "Estimate Page Details":
- custom estimate message
- layout preset
- theme colors
- attachments (URL-based)
- video link
- revision reason

### 4) Send-confirmed-bid dialog (client/src/components/notifications/send-bid-dialog.tsx)
Added "Estimate Page Details" section with:
- layout
- theme colors
- attachments (toggle per attachment)
- custom message
- video link

This dialog now sends those overrides to the API.

### 5) New global Estimate Page Editor
New standalone page:
- `client/src/pages/estimate-page-settings.tsx`
- Route: `/estimate-page-settings`
- Sidebar link: Manage → “Estimate Page Editor”

This page manages global defaults stored in `estimatePageSettings`.

---

## Navigation / Routing

- Added new route: `/estimate-page-settings` in `client/src/App.tsx`.
- Sidebar link updated in `client/src/components/dashboard-layout.tsx`.
- Business settings tab support for estimate editor was added, but a standalone page is now the primary entry.

---

## Files Touched

### Backend
- `shared/schema.ts`
- `server/routes.ts`
- `migrations/0002_estimate_page_settings.sql`

### Client
- `client/src/pages/estimate.tsx`
- `client/src/pages/estimates.tsx`
- `client/src/components/edit-estimate-dialog.tsx`
- `client/src/components/notifications/send-bid-dialog.tsx`
- `client/src/components/lead-details-modal.tsx`
- `client/src/pages/business-settings.tsx` (contains estimate page tab; now redundant)
- `client/src/pages/estimate-page-settings.tsx`
- `client/src/components/dashboard-layout.tsx`
- `client/src/App.tsx`

---

## Next Steps

1) **Render layout/theme/attachments/video on the customer estimate page**
   - Update `client/src/pages/estimate.tsx` to read and render `customMessage`, `attachments`, `videoUrl`, `theme`, `layoutId`.
   - Add a layout switcher (classic/minimal/detailed) renderer.

2) **Add attachment upload support**
   - Replace manual URL input with upload UI.
   - Persist files and return URLs.

3) **Validation for revision reasons**
   - Require `revisionReason` when price changes vs pre-estimate or when owner revises.
   - Enforce in server update route.

4) **Migrations**
   - Apply `migrations/0002_estimate_page_settings.sql` in the environment.

5) **Consolidate settings UI** (optional)
   - Remove the Estimate Page tab from `business-settings` page to avoid confusion.

---

## Notes / Decisions

- Theme/layout are locked after sending.
- Defaults are pulled from business settings and can be overridden during send.
- Pre-estimates are view-only to customers.
- Attachments are URL-based for now.

