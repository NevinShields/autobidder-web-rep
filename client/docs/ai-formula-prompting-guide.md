# AI Formula Prompting Guide

## Goal
Use this guide when writing prompts for the AI Formula Builder. Strong prompts produce better variables, cleaner pricing logic, and fewer manual fixes afterward.

## What To Include

- The service being priced.
- The main pricing drivers.
- How pricing should scale.
- Any base fee, minimum charge, or travel fee.
- The variable types you expect.
- The answer options for dropdown or multiple-choice questions.
- Any conditional follow-up questions.
- Anything that should always be included or never be included.

## Best Prompt Structure

Use this format:

```text
Create a pricing calculator for [service].

The main factors that affect price are:
- [factor 1]
- [factor 2]
- [factor 3]

Use these question types:
- [number / dropdown / multiple choice / checkbox / text]

Include these options and values:
- [option name] = [numeric price/value]
- [option name] = [numeric price/value]

Pricing rules:
- Base fee: [$ amount]
- Minimum price: [$ amount]
- Add [fee or multiplier] for [condition]
- Show [follow-up question] only if [previous answer]

Do not include:
- [anything irrelevant]
```

## Prompt Checklist

Before you submit a prompt, make sure it answers these:

- What exactly is being sold?
- What makes the price go up or down?
- Which answers should be numbers versus fixed-price options?
- Which options need explicit dollar values?
- Should the AI ask for quantity, size, difficulty, or add-ons?
- Are there any common upsells that should be included?
- Are there any questions that should only appear after a specific answer?

## What Works Best

- Be specific about units.
  Example: `square feet`, `linear feet`, `rooms`, `stories`, `gates`, `panes`, `dumpster loads`.

- Give option values when you already know them.
  Example: `Single story = 0, Two story = 75, Three story = 150`.

- Tell the AI how to break pricing apart.
  Example: `Use square footage for the main cleaning cost, then add fixed prices for add-ons.`

- Call out your minimum charge.
  Example: `Set a minimum price of $199 even for small jobs.`

- Name conditional logic clearly.
  Example: `If the customer selects "Yes" for detached garage, show a follow-up dropdown for garage size.`

- Ask for a realistic first draft, not a perfect final calculator.
  Example: `Create a practical starter calculator I can refine later.`

## What To Avoid

- Vague prompts like `make me a calculator for pressure washing`.
- Asking for too many unrelated services in one formula.
- Saying `use logic however you want` without describing pricing drivers.
- Leaving dropdown and multiple-choice options undefined.
- Asking for complicated formula syntax instead of pricing behavior.

## Recommended Details By Variable Type

### Number Inputs
Use for measurable quantities:

- Square footage
- Linear feet
- Number of rooms
- Number of windows
- Acres
- Dumpster loads

### Dropdowns
Use for one-of-one selections with fixed pricing:

- Service tier
- Building height
- Surface type
- Material type
- Project difficulty

### Multiple Choice
Use for optional add-ons:

- Gutter brightening
- Screen cleaning
- Sealer
- Pet treatment
- Rush service

### Conditional Questions
Use when one answer should unlock another:

- `If "Has fence" = yes, ask for fence length`
- `If "Roof cleaning" is selected, ask for roof type`
- `If "Commercial" is selected, ask for building access difficulty`

## High-Quality Prompt Examples

### Exterior Cleaning

```text
Create a pressure washing calculator for residential exterior cleaning.

The main factors that affect price are total square footage, number of stories, surface type, and add-on services.

Use these questions:
- Number input for square footage
- Dropdown for stories: 1 story = 0, 2 story = 75, 3 story = 150
- Dropdown for surface type: vinyl siding = 0, brick = 60, stucco = 90
- Multiple-choice add-ons: driveway cleaning = 125, sidewalk cleaning = 60, gutter brightening = 95

Pricing rules:
- Base fee of 149
- Main cost should scale with square footage
- Add selected surface and add-on prices to the total
- Minimum price should be 199
```

### House Cleaning

```text
Create a house cleaning calculator.

The main factors are number of bedrooms, number of bathrooms, home size, cleaning frequency, and deep-clean add-ons.

Use these questions:
- Dropdown for bedrooms with increasing prices
- Dropdown for bathrooms with increasing prices
- Number input for square footage
- Dropdown for frequency: one-time = 90, biweekly = 0, monthly = 40
- Checkbox or multiple-choice for inside oven, inside fridge, and pet hair treatment

Pricing rules:
- Use square footage and room count for the main price
- Add a one-time premium for first-time deep cleaning
- Minimum price should be 160
```

### Remodeling

```text
Create a bathroom remodeling calculator.

The main factors are bathroom size, tile tier, fixture package, demolition scope, and layout complexity.

Use these questions:
- Dropdown for bathroom size: half bath, small full bath, standard full bath, large primary bath
- Dropdown for tile tier: builder grade, mid-range, premium
- Dropdown for fixture package with fixed upgrade values
- Dropdown for demolition scope
- Dropdown for layout complexity

Pricing rules:
- Start with a base project fee
- Add fixed values for material and scope upgrades
- Include a higher multiplier or fee for complex layouts
- Keep the calculator focused on ballpark pricing, not exact estimating
```

## Editing An Existing Formula With AI

When you already have a calculator, use direct edit requests like these:

- `Add a detached garage question. If yes, show a follow-up asking for 1-car, 2-car, or 3-car garage.`
- `Change the square footage rate from a premium-heavy model to a simpler flat rate per square foot.`
- `Remove the roof pitch question and replace it with a simpler difficulty dropdown.`
- `Add a minimum price of 249 and update the wording to sound more premium.`

## Fast Formula Builder Prompt Template

```text
Create a pricing calculator for [service].

The main pricing drivers are [driver 1], [driver 2], [driver 3], and [driver 4].

Use:
- [number input] for [measurable field]
- [dropdown] for [single selection]
- [multiple choice] for [add-ons]

Include these fixed values:
- [option] = [value]
- [option] = [value]

Pricing rules:
- Base fee = [value]
- Minimum price = [value]
- Add [value] for [condition]
- Show [follow-up question] only when [condition]

Keep it focused on a practical first-draft pricing calculator for [business type].
```

## Final Tip
The AI works best when you describe pricing behavior, not just the service. If you tell it how the price should move, what options exist, and what each option should add, the first draft is usually much closer to usable.
