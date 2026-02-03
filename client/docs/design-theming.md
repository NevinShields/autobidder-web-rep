# Design & Theming

## What It Is
The **Design Dashboard** is where you control the global look and feel of your calculators. It includes themes, typography, component styling, and custom CSS overrides.

## Typical Use Cases

- Match your brand's colors and fonts.
- Adjust spacing, borders, and shadows.
- Style pricing cards for a premium look.
- Add advanced styling with custom CSS.

## Step-by-Step Setup

1.  Go to the **Design** section (`/design`).
2.  In the **Themes** tab, choose a preset or customize your colors and typography.
3.  In the **Components** tab, fine-tune the styling of service cards, inputs, buttons, and cards.
4.  Optionally, add your own **Custom CSS** for advanced styling.
5.  Save your changes.

## How It Affects Pricing

- Design changes only affect the appearance of your calculators. Pricing logic is not affected.
- Custom CSS can be used to hide or emphasize parts of the user interface.

## Customizing Title Colors

You can use Custom CSS to change the color of the titles in your documentation. Here's an example of how you can do this:

```css
/* Change the color of all h1 titles */
h1 {
  color: #your-color-here;
}

/* Change the color of all h2 titles */
h2 {
  color: #your-color-here;
}
```

You can add this CSS in the **Custom CSS** section of the **Design** page.

## Examples

**Service Cards**

```css
.ab-service-card {
  border: 2px solid #6d5bd0;
  border-radius: 14px;
}

.ab-service-card:hover {
  transform: scale(1.02);
}
```

**Buttons**

```css
.ab-button-primary {
  background: linear-gradient(135deg, #5b3cc4, #8a6cff);
  border: none;
}
```

## Useful Selectors

-   `.ab-service-card`
-   `.ab-button-primary`
-   `.ab-input`
-   `.ab-pricing-card`

## Helpful CSS Variables

-   `--ab-primary-color`
-   `--ab-button-bg`
-   `--ab-input-border-color`
-   `--ab-service-selector-bg`

## Common Mistakes

-   **Custom CSS Overrides:** Custom CSS will always override the settings in the Components tab.
-   **Invalid CSS:** The editor will reject invalid CSS.
-   **Global Settings:** Design settings apply to all of your calculators.

## Related Pages

- [Formula Builder](/docs/formula-builder)
- [Logic Page](/docs/logic-page)
- [Core Concepts](/docs/core-concepts)
- [Troubleshooting](/docs/troubleshooting)
