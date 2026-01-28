# Design & Theming

## What it is
The Design Dashboard controls the global look and feel of your calculators. It includes themes, typography, component styling, and custom CSS overrides.

## Typical use cases

- Match your brand colors and fonts
- Adjust spacing, borders, and shadows
- Style pricing cards for a premium look
- Add advanced styling with custom CSS

## Step-by-step setup / usage

1. Go to **Design** (`/design`).
2. In **Themes**, choose a preset or adjust colors and typography.
3. In **Components**, tune service cards, inputs, buttons, and cards.
4. Optional: add **Custom CSS**.
5. Save changes.

## How it affects pricing/output/results

- Design changes appearance only. Pricing logic is unaffected.
- Custom CSS can hide or emphasize parts of the UI.

## Examples

**Service cards**

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

## Useful selectors (partial)

- `.ab-service-card`
- `.ab-button-primary`
- `.ab-input`
- `.ab-pricing-card`

## Helpful CSS variables (partial)

- `--ab-primary-color`
- `--ab-button-bg`
- `--ab-input-border-color`
- `--ab-service-selector-bg`

## Gotchas / common mistakes

- Custom CSS overrides component settings.
- Invalid CSS will be rejected.
- Design settings apply globally across calculators.

## Related pages

- [Formula Builder](/docs/formula-builder)
- [Logic Page](/docs/logic-page)
- [Core Concepts](/docs/core-concepts)
- [Troubleshooting](/docs/troubleshooting)

