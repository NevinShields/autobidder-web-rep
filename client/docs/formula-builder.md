# Formula Builder

## What it is
The Formula Builder is where you define a service calculator: questions (variables), the pricing formula, and supporting details like descriptions and icons.

## Typical use cases

- Build a service quote calculator (cleaning, landscaping, repairs)
- Create multi-step questionnaires with automatic pricing
- Add optional upsells as a percentage of the total
- Collect measurements with map or photo measurement
- Save a formula as a reusable template

## Step-by-step setup / usage

1. Open **Formulas** and create a new formula (or edit one).
2. Add **basic details** (name, title, description, bullet points).
3. Add **variables** and choose a type:
   - number, text, checkbox, select, dropdown, slider, multiple-choice
4. For options, set **numeric values** used in pricing.
5. Reorder variables if needed (logic depends on order).
6. Build the **formula expression** using variable IDs.
7. Optional: set **min/max price**.
8. Optional: enable **Measure Map** or **AI Photo Measure**.
9. Optional: add **upsell items**.
10. Preview and **Save**.

## How it affects pricing/output/results

- The formula expression is the base calculation.
- Min/max price caps the output (stored in cents).
- Distance pricing (per formula) can add a travel fee.
- Upsells add a percentage of the main total.
- Hidden variables use default values when configured.
- Only **active** and **displayed** formulas show to customers.

## Examples

- **Simple**: `squareFeet * pricePerSqft + baseFee`
- **Multi-select option**: `extras_gutter_cleaning`
- **Min/Max**: set a minimum of $99 and maximum of $499

## Gotchas / common mistakes

- Variable IDs must match exactly.
- Multi-choice options need numeric values for calculations.
- Conditional logic can only reference variables above it.
- Min/max values are shown in dollars but stored in cents.
- Remember to save after changes.

## Related pages

- [Design & Theming](/docs/design-theming)
- [Logic Page](/docs/logic-page)
- [Quick Start](/docs/quick-start)
- [Core Concepts](/docs/core-concepts)

