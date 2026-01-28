# Automations

## What they do
Automations let you trigger follow-up actions when events happen in your CRM. Each automation has a trigger and a sequence of steps.

## When to use them

- Email a customer after a lead is created
- Text a customer after they book
- Tag leads when stages change
- Create tasks for internal follow-up

## How to connect / set up

1. Go to **Automations** (`/automations/create`).
2. Name the automation and choose a **Trigger**.
3. Add **Steps**, such as:
   - send email
   - send SMS (Twilio)
   - wait/delay
   - update lead stage
   - create task
   - add/remove tag
4. Save the automation.

## How to test

- Perform the trigger action in the app (create a lead, change stage, etc.).
- Confirm each step completes.

## Common issues

- Plan access is limited to certain tiers (trial, standard, plus, plus_seo).
- SMS requires Twilio configuration.
- Email requires a configured email provider.

