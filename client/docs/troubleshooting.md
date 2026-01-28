# Troubleshooting

## Formula not showing to customers

- Ensure the formula is **Active** and **Displayed**.
- Confirm the embed or custom form is pointing to the right formula.

## Prices look wrong

- Verify the formula expression uses the correct variable IDs.
- Ensure option numeric values are set.
- Check global pricing modifiers (bundle discount, sales tax, distance pricing).

## Variable not visible

- Conditional logic only references variables above it.
- Confirm the expected value and condition type.

## Custom CSS not applying

- Fix invalid CSS (the editor will show errors).
- Use the correct selectors (for example `.ab-service-card`, `.ab-button-primary`).

## AI features fail

- AI tools require API keys on the server.
- Production uses OpenAI and Gemini for AI features.

## Distance pricing not working

- Business address is required.
- Without a Google Maps API key, distance pricing uses a fallback and may be less accurate.

## Automations not running

- Confirm your plan includes Automations.
- SMS requires Twilio.
- Email requires a configured provider.

## Zapier authentication errors

- Use `Authorization: Bearer <api_key>`.
- Verify the server URL is correct.

