# Dashboard-Inspired Design Guidelines (Marketing Social Graphics)

## Purpose
Use this guide to create social graphics that feel consistent with Autobidder's dashboard experience.

## Source Review (What This Is Based On)
Reviewed dashboard surfaces and shared layout/styles in:
- `client/src/components/dashboard-layout.tsx`
- `client/src/pages/dashboard.tsx`
- `client/src/pages/leads.tsx`
- `client/src/pages/calendar.tsx`
- `client/src/pages/form-settings.tsx`
- `client/src/pages/stats.tsx`
- `client/src/pages/design-dashboard-new.tsx`
- `client/src/index.css`

## Design Review Summary
The dashboard style is modern, high-trust, and operational. It blends:
- Warm brand accents (amber/orange gradients) for actions and emphasis.
- Calm neutral bases (white/slate/gray surfaces) for readability.
- Soft depth (blurred cards, subtle noise, gentle shadows) instead of hard contrast.
- Editorial contrast in typography (serif display headlines + clean sans body).
- Rounded geometry and pill controls to keep dense workflows approachable.

This creates a premium-but-practical look that fits product, operations, and growth messaging.

## Core Style DNA

### 1) Color System
Primary accent direction:
- Amber: `#f59e0b` (`amber-500`)
- Deep amber: `#d97706` (`amber-600`)
- Orange accent: `#ea580c` (`orange-600`)

Common gradients:
- CTA: `linear-gradient(90deg, #f59e0b, #ea580c)`
- Hero wash (light): from warm cream to white to pale orange
- Status accents: emerald/teal (positive), rose/red (alerts), blue/indigo (data)

Neutrals:
- Backgrounds: white to very light gray
- Text: slate/gray hierarchy, near-black for titles
- Borders: low-contrast, often at 40-70% opacity

### 2) Typography
- Display/headlines: `Instrument Serif` (used for page titles and major card headers).
- Body/UI: `DM Sans` (default reading and controls).
- Utility labels: uppercase micro-labels with loose tracking (`tracking-[0.2em]` style).

### 3) Shape + Spacing
- Corners: mostly `12px`, `16px`, and `20px` (`rounded-xl`, `rounded-2xl`).
- Cards: generous internal padding; avoid cramped text blocks.
- Layout rhythm: clean grid with clear section blocks and breathing room.

### 4) Surface + Depth
- Frequent pattern: semi-translucent white cards + soft blur.
- Borders are visible but subtle.
- Shadows are soft and lifted on hover, never harsh.
- Optional fine grain/noise texture for premium depth.

### 5) Motion
- Entry: short fade-up stagger (about 60ms between blocks).
- Hover: slight lift (`-1px` to `-2px`) and shadow increase.
- Buttons/toggles: smooth 200-250ms transitions.

## Social Graphics Translation Rules

### Visual Formula (Recommended)
1. Warm gradient accent block or button.
2. Soft neutral background with subtle texture.
3. Serif headline + sans supporting copy.
4. Rounded cards/pills for stats, labels, or proof points.
5. One clear CTA area with amber/orange emphasis.

### Safe Palette for Marketing Creatives
- `#f59e0b` primary amber
- `#ea580c` supporting orange
- `#0f172a` deep slate text
- `#334155` secondary text
- `#f8fafc` and `#ffffff` surfaces
- Optional support colors:
  - `#10b981` success
  - `#3b82f6` info/data
  - `#ef4444` warning/error

### Type Pairing
- Headline: Instrument Serif, semibold, tight leading.
- Body + meta: DM Sans, regular/medium.
- Keep line lengths short and scan-friendly.

## Recommended Social Layout Templates

### Template A: Product Update
- Header pill: "NEW" or "JUST SHIPPED" (amber tint).
- Big serif headline.
- 2-3 short benefit bullets in rounded cards.
- Bottom CTA chip/button.

### Template B: Metric Highlight
- Hero number in serif (large).
- Supporting context in sans.
- Small icon tile with warm gradient.
- Optional secondary metric chips below.

### Template C: Feature Education Carousel
- Slide 1: Hook + promise.
- Slide 2-4: One feature per card (icon + short value line).
- Final slide: CTA with amber/orange gradient.

## Sizing Guidance
- Feed square: `1080x1080`
- Portrait feed: `1080x1350`
- Story/Reel cover: `1080x1920`
- LinkedIn landscape alt: `1200x627`

Keep the same style system across all sizes; only reflow layout.

## Copy Tone for Matching Style
- Direct and practical.
- Outcome-first language ("book faster", "quote faster", "track pipeline").
- Avoid hype-heavy wording; stay credible and operational.

## Do / Don't

Do:
- Use warm amber/orange as the primary accent.
- Combine serif headline + sans body.
- Keep surfaces soft, rounded, and lightly layered.
- Use minimal, purposeful iconography.

Don't:
- Use harsh neon palettes or heavy glow effects.
- Overload with dense paragraphs.
- Mix unrelated visual styles in one post.
- Use sharp rectangular UI when rounded system is expected.

## Quick Build Checklist (Before Publishing)
- Uses amber/orange as primary accent.
- Headline is in serif; body is in sans.
- Includes rounded cards/pills and subtle depth.
- CTA is clear and visually prioritized.
- Contrast is accessible and text is readable on mobile.
- Feels like a dashboard extension, not a separate brand.
