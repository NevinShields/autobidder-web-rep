# Zapier Integration

## What it does
Zapier connects Autobidder to thousands of other apps. The integration currently supports one trigger: **New Lead**, which fires when a `/styled-calculator` form is completed.

## When to use it

- Send new leads to a CRM or spreadsheet
- Notify your team in Slack when a lead arrives
- Create a lead in Autobidder from another system

## How to connect

1. Go to **Integrations** (`/integrations`).
2. Generate a **Zapier API key** and copy it (shown once).
3. Note your **Server URL** (from the Integrations dialog).
4. In Zapier, connect Autobidder using API key auth:
   - `Authorization: Bearer <api_key>`
   - Alternatives: `X-API-Key` header or `api_key` query param
5. Test authentication.

## How to test

- Auth: `/api/zapier/auth/test`
- Trigger: `/api/zapier/triggers/new-leads`
- Use the Zapier test step to confirm sample data loads.

## Common issues

- 401 errors usually mean the Authorization header is wrong.
- API keys are shown once. Generate a new one if lost.
- Server URL must match the exact base URL in Integrations.
- Access is limited to certain plans (trial, standard, plus, plus_seo).

