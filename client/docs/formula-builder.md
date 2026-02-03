# Formula Builder

## What It Is
The **Formula Builder** is where you define a service calculator. This includes the questions (variables), the pricing formula, and other supporting details like descriptions and icons.

## Typical Use Cases

- Build a price quote calculator for any service (e.g., cleaning, landscaping, repairs).
- Create multi-step questionnaires with automatic pricing.
- Add optional upsells as a percentage of the total.
- Collect measurements with our map or photo measurement tools.
- Save a formula as a reusable template for future use.

## Step-by-Step Setup

1.  Open the **Formulas** section and create a new formula (or edit an existing one).
2.  Add **Basic Details** such as the name, title, description, and bullet points.
3.  Add **Variables** and choose a type for each:
    *   Number, Text, Checkbox, Select, Dropdown, Slider, or Multiple-Choice.
4.  For variables with options, set the **Numeric Values** that will be used in your pricing calculations.
5.  Reorder variables if needed (conditional logic depends on the order of your variables).
6.  Build the **Formula Expression** using the variable IDs.
7.  Optionally, set a **Minimum/Maximum Price**.
8.  Optionally, enable the **Measure Map** or **AI Photo Measure** features.
9.  Optionally, add **Upsell Items**.
10. Preview your calculator and **Save** your changes.

## How It Affects Pricing

- The **Formula Expression** is the core of your pricing calculation.
- **Min/Max Price** caps the final output (stored in cents).
- **Distance Pricing** (per formula) can add a travel fee.
- **Upsells** add a percentage of the main total to the final price.
- **Hidden Variables** use their default values when configured.
- Only **Active** and **Displayed** formulas will be visible to your customers.

## Examples

-   **Simple Formula:** `squareFeet * pricePerSqft + baseFee`
-   **Multi-Select Option:** `extras_gutter_cleaning`
-   **Min/Max Price:** Set a minimum price of $99 and a maximum of $499.

## Common Mistakes

-   **Variable IDs:** Make sure your variable IDs match exactly what's in the formula expression.
-   **Numeric Values:** Multi-choice options need numeric values for calculations.
-   **Conditional Logic:** Conditional logic can only reference variables that appear above it in the variable list.
-   **Min/Max Values:** Min/max values are shown in dollars but are stored in cents.
-   **Remember to Save:** Always save your changes after making edits.

## Related Pages

- [Design & Theming](/docs/design-theming)
- [Logic Page](/docs/logic-page)
- [Quick Start](/docs/quick-start)
- [Core Concepts](/docs/core-concepts)
