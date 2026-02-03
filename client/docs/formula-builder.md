# Formula Builder

## What It Is
The **Formula Builder** is where you define a service calculator. This includes the questions (variables), the pricing formula, and other supporting details like descriptions and icons.

## Quick Video Guides

### Formulas Page

Rearrange, delete, toggle visibility, edit services, and add new calculators.

<iframe width="100%" height="420" src="https://www.youtube.com/embed/mSXa3nwMBmc" title="Formulas Page" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Formula Builder - Adding Variables

Set up variables (numbers, multiple choice, dropdowns) and assign values for calculations.

<iframe width="100%" height="420" src="https://www.youtube.com/embed/50jqnTeTnsU" title="Formula Builder - Adding Variables" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Formula Expression Builder

Combine variables into unified pricing formulas using multiplication and minimum prices.

<iframe width="100%" height="420" src="https://www.youtube.com/embed/JquCHWhCudM" title="Formula Expression Builder" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### Formula Builder - Sales Features

Bundle/custom discounts, discount stacking, guide videos, sales tax, pricing disclaimers, lead contact info, and location-based pricing.

<iframe width="100%" height="420" src="https://www.youtube.com/embed/6uVFzaJgeP8" title="Formula Builder - Sales Features" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### How to Add Guide Photos to Autobidder

Enable the Service Image feature to add guide photos so customers understand requirements.

<iframe width="100%" height="420" src="https://www.youtube.com/embed/RFnonmvtV0c" title="How to Add Guide Photos to Autobidder" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### AI Formula Builder

Generate pricing expressions by describing the service and variables, then tweak them manually.

<iframe width="100%" height="420" src="https://www.youtube.com/embed/rPxHFpNqBAY" title="AI Formula Builder" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

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
