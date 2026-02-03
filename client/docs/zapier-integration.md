# Zapier Integration

## What It Does
Our Zapier integration allows you to connect Autobidder to thousands of other apps. The integration currently supports one trigger: **New Lead**, which fires when a `/styled-calculator` form is completed.

## When to Use It

- Send new leads to your CRM or a Google Sheet.
- Notify your team in Slack when a new lead comes in.
- Create a new lead in Autobidder from another system.

## How to Connect

1.  Go to the **Integrations** section (`/integrations`).
2.  Generate a **Zapier API Key** and copy it (it will only be shown once).
3.  Take note of your **Server URL** (also found in the Integrations dialog).
4.  In Zapier, connect to Autobidder using API key authentication:
    *   `Authorization: Bearer <api_key>`
    *   Alternatively, you can use the `X-API-Key` header or the `api_key` query parameter.
5.  Test the authentication to ensure everything is working correctly.

## How to Test

-   **Authentication:** `/api/zapier/auth/test`
-   **Trigger:** `/api/zapier/triggers/new-leads`
-   Use the test step in Zapier to confirm that sample data is being loaded correctly.

## Common Issues

-   **401 Errors:** A 401 error usually means that the Authorization header is incorrect.
-   **Lost API Keys:** API keys are only shown once. If you lose your key, you will need to generate a new one.
-   **Incorrect Server URL:** The server URL must match the base URL shown in the Integrations dialog exactly.
-   **Plan Access:** Access to the Zapier integration is limited to certain plans (Trial, Standard, Plus, Plus_SEO).
