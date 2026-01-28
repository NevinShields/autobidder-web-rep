# Notes

## What I found

- Formula Builder lives at `client/src/pages/formula-builder.tsx` with core UI in `client/src/components/formula-builder.tsx`.
- Design/Theming is handled in `client/src/pages/design-dashboard-new.tsx` and stored in the `design_settings` table in `shared/schema.ts`.
- The Editor page maps to Custom Forms (`client/src/pages/custom-form-editor.tsx`) and uses formulas selected from `/api/formulas`.
- Logic settings are configured in `client/src/pages/form-settings.tsx`.
- Automations are defined in `client/src/pages/automations.tsx` with triggers and step types in that file.
- Zapier integration is exposed via `client/src/pages/integrations.tsx` and server routes in `server/zapier-routes.ts` / `server/zapier-integration.ts`.

## Needs confirmation

- The "Editor" page in the docs assumes the Custom Form Editor is the intended target.

## How to run docs locally

1. `npm run dev`
2. Open `http://localhost:3000/docs`
