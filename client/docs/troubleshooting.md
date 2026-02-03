# Troubleshooting Guide

## My formula is not showing up for customers.

-   Ensure that the formula is marked as both **Active** and **Displayed** in the Formula Builder.
-   Confirm that your embed code or custom form is pointing to the correct formula.

## The prices look wrong.

-   Double-check that the formula expression is using the correct variable IDs.
-   Make sure that you have set the numeric values for all of your options.
-   Check the global pricing modifiers in the **Logic** section (bundle discount, sales tax, distance pricing).

## A variable is not appearing.

-   Remember that conditional logic can only reference variables that appear above it in the variable list.
-   Confirm that the expected value and condition type are set correctly.

## My custom CSS is not being applied.

-   The CSS editor will show an error if your CSS is invalid.
-   Make sure you are using the correct selectors (e.g., `.ab-service-card`, `.ab-button-primary`).

## The AI features are failing.

-   AI-powered tools require API keys to be configured on the server.
-   In a production environment, this typically means connecting to OpenAI and Gemini for AI features.

## Distance pricing is not working.

-   A valid business address is required for distance pricing to work correctly.
-   Without a Google Maps API key, distance pricing will use a fallback method that may be less accurate.

## My automations are not running.

-   Confirm that your current plan includes access to Automations.
-   Sending SMS messages requires a configured Twilio account.
-   Sending emails requires a configured email provider.

## I'm getting Zapier authentication errors.

-   Make sure you are using the correct `Authorization: Bearer <api_key>` header.
-   Verify that the server URL is correct.
