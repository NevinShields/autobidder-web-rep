# Automations

## What it is
Automations let you trigger follow-up actions when events happen in your CRM. Each automation consists of a trigger and a sequence of steps that run when the trigger event occurs.

## When to use them

- Send an email to a customer after a lead is created.
- Send an SMS to a customer after they book a service.
- Tag leads automatically when their stage changes.
- Create tasks for your team to follow up on.

## How to set it up

1.  Navigate to the **Automations** section (`/automations/create`).
2.  Give your automation a name and select a **Trigger**.
3.  Add **Steps** to the automation, such as:
    *   Send Email
    *   Send SMS (requires Twilio)
    *   Wait/Delay
    *   Update Lead Stage
    *   Create Task
    *   Add/Remove Tag
4.  Save the automation.

## How to test it

- Perform the trigger action within the app (e.g., create a lead, change a lead's stage).
- Confirm that each step in the automation sequence completes as expected.

## Common issues

-   **Plan Access:** Automations are only available on specific plans (Trial, Standard, Plus, Plus_SEO).
-   **SMS Configuration:** Sending SMS messages requires a configured Twilio account.
-   **Email Configuration:** Sending emails requires a configured email provider.
