import type { StylingOptions } from './schema';

/**
 * Converts padding size strings to pixel values
 */
function getPaddingValue(padding: string | number): number {
  if (typeof padding === 'number') return padding;
  const paddingMap: Record<string, number> = {
    'xs': 4,
    'sm': 8,
    'md': 16,
    'lg': 20,
    'xl': 24,
    '2xl': 32
  };
  return paddingMap[padding] || 16;
}

/**
 * Converts font size strings to pixel values
 */
function getFontSizeValue(fontSize: string): string {
  const sizeMap: Record<string, string> = {
    'xs': '0.75rem',
    'sm': '0.875rem',
    'base': '1rem',
    'lg': '1.125rem',
    'xl': '1.25rem',
    '2xl': '1.5rem'
  };
  return sizeMap[fontSize] || '1rem';
}

/**
 * Converts shadow size to CSS box-shadow value
 */
function getShadowValue(shadow: string): string {
  const shadowMap: Record<string, string> = {
    'none': 'none',
    'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  };
  return shadowMap[shadow] || 'none';
}

/**
 * Generates CSS variables string from styling options
 * These variables can be used in custom CSS and will automatically update
 * when design settings change
 */
export function generateCSSVariables(styling: StylingOptions): string {
  const vars = {
    // Container
    '--ab-container-width': `${styling.containerWidth || 700}px`,
    '--ab-container-height': `${styling.containerHeight || 850}px`,
    '--ab-container-border-radius': `${styling.containerBorderRadius || 16}px`,
    '--ab-container-shadow': getShadowValue(styling.containerShadow || 'xl'),
    '--ab-container-border-width': `${styling.containerBorderWidth || 0}px`,
    '--ab-container-border-color': styling.containerBorderColor || '#E5E7EB',
    '--ab-container-padding': `${styling.containerPadding || 8}px`,
    '--ab-container-margin': `${styling.containerMargin || 0}px`,
    '--ab-background-color': styling.backgroundColor || '#FFFFFF',
    
    // Typography
    '--ab-font-family': styling.fontFamily || 'inter',
    '--ab-font-size': getFontSizeValue(styling.fontSize || 'base'),
    '--ab-font-weight': styling.fontWeight || 'medium',
    '--ab-text-color': styling.textColor || '#1F2937',
    
    // Primary colors
    '--ab-primary-color': styling.primaryColor || '#2563EB',
    
    // Buttons
    '--ab-button-bg': styling.buttonBackgroundColor || '#2563EB',
    '--ab-button-text-color': styling.buttonTextColor || '#FFFFFF',
    '--ab-button-border-radius': `${styling.buttonBorderRadius || 12}px`,
    '--ab-button-border-width': `${styling.buttonBorderWidth || 0}px`,
    '--ab-button-border-color': styling.buttonBorderColor || '#2563EB',
    '--ab-button-padding': `${getPaddingValue(styling.buttonPadding || 'lg')}px`,
    '--ab-button-font-weight': styling.buttonFontWeight || 'semibold',
    '--ab-button-shadow': getShadowValue(styling.buttonShadow || 'md'),
    '--ab-button-hover-bg': styling.buttonHoverBackgroundColor || '#1d4ed8',
    '--ab-button-hover-text-color': styling.buttonHoverTextColor || '#FFFFFF',
    '--ab-button-hover-border-color': styling.buttonHoverBorderColor || '#1d4ed8',
    
    // Inputs
    '--ab-input-bg': styling.inputBackgroundColor || '#F9FAFB',
    '--ab-input-text-color': styling.inputTextColor || '#1F2937',
    '--ab-input-border-radius': `${styling.inputBorderRadius || 10}px`,
    '--ab-input-border-width': `${styling.inputBorderWidth || 2}px`,
    '--ab-input-border-color': styling.inputBorderColor || '#E5E7EB',
    '--ab-input-focus-color': styling.inputFocusColor || '#2563EB',
    '--ab-input-padding': `${getPaddingValue(styling.inputPadding || 'lg')}px`,
    '--ab-input-shadow': getShadowValue(styling.inputShadow || 'sm'),
    '--ab-input-font-size': getFontSizeValue(styling.inputFontSize || 'base'),
    '--ab-input-height': `${styling.inputHeight || 40}px`,
    
    // Service Selector
    '--ab-service-selector-bg': styling.serviceSelectorBackgroundColor || '#FFFFFF',
    '--ab-service-selector-border-radius': `${styling.serviceSelectorBorderRadius || 16}px`,
    '--ab-service-selector-border-width': `${styling.serviceSelectorBorderWidth || 0}px`,
    '--ab-service-selector-border-color': styling.serviceSelectorBorderColor || '#E5E7EB',
    '--ab-service-selector-shadow': getShadowValue(styling.serviceSelectorShadow || 'xl'),
    '--ab-service-selector-padding': `${getPaddingValue(styling.serviceSelectorPadding || 'xl')}px`,
    '--ab-service-selector-hover-bg': styling.serviceSelectorHoverBackgroundColor || '#F8FAFC',
    '--ab-service-selector-hover-border-color': styling.serviceSelectorHoverBorderColor || '#D1D5DB',
    '--ab-service-selector-selected-bg': styling.serviceSelectorSelectedBgColor || '#EFF6FF',
    '--ab-service-selector-selected-border-color': styling.serviceSelectorSelectedBorderColor || '#2563EB',
    '--ab-service-selector-active-bg': styling.serviceSelectorActiveBackgroundColor || '#3B82F6',
    '--ab-service-selector-active-border-color': styling.serviceSelectorActiveBorderColor || '#2563EB',
    '--ab-service-selector-title-font-size': getFontSizeValue(styling.serviceSelectorTitleFontSize || 'xl'),
    '--ab-service-selector-desc-font-size': getFontSizeValue(styling.serviceSelectorDescriptionFontSize || 'base'),
    
    // Multiple Choice
    '--ab-multichoice-card-bg': '#FFFFFF',
    '--ab-multichoice-card-border-radius': `${styling.multiChoiceCardBorderRadius || 12}px`,
    '--ab-multichoice-card-shadow': getShadowValue(styling.multiChoiceCardShadow || 'sm'),
    '--ab-multichoice-selected-color': styling.multiChoiceSelectedColor || '#2563EB',
    '--ab-multichoice-selected-bg': styling.multiChoiceSelectedBgColor || '#EFF6FF',
    '--ab-multichoice-hover-bg': styling.multiChoiceHoverBgColor || '#F8FAFC',
    '--ab-multichoice-active-bg': styling.multipleChoiceActiveBackgroundColor || '#3B82F6',
    '--ab-multichoice-active-border-color': styling.multipleChoiceActiveBorderColor || '#2563EB',
    '--ab-multichoice-hover-border-color': styling.multipleChoiceHoverBorderColor || '#D1D5DB',
    
    // Question Cards
    '--ab-question-card-bg': styling.questionCardBackgroundColor || '#FFFFFF',
    '--ab-question-card-border-radius': `${styling.questionCardBorderRadius || 12}px`,
    '--ab-question-card-border-width': `${styling.questionCardBorderWidth || 1}px`,
    '--ab-question-card-border-color': styling.questionCardBorderColor || '#E5E7EB',
    '--ab-question-card-shadow': getShadowValue(styling.questionCardShadow || 'sm'),
    '--ab-question-card-padding': `${getPaddingValue(styling.questionCardPadding || 'lg')}px`,
    
    // Pricing Cards
    '--ab-pricing-card-bg': styling.pricingCardBackgroundColor || '#FFFFFF',
    '--ab-pricing-card-border-radius': `${styling.pricingCardBorderRadius || 12}px`,
    '--ab-pricing-card-border-width': `${styling.pricingCardBorderWidth || 0}px`,
    '--ab-pricing-card-border-color': styling.pricingCardBorderColor || '#E5E7EB',
    '--ab-pricing-card-shadow': getShadowValue(styling.pricingCardShadow || 'lg'),
    '--ab-pricing-text-color': styling.pricingTextColor || '#1F2937',
    '--ab-pricing-accent-color': styling.pricingAccentColor || '#2563EB',
  };

  // Convert to CSS string
  return Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

/**
 * Creates a scoped style element with CSS variables
 * Use this to inject design settings as CSS variables into the page
 */
export function injectCSSVariables(styling: StylingOptions, containerId: string = 'autobidder-form'): void {
  const styleId = 'autobidder-css-variables';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  const cssVariables = generateCSSVariables(styling);
  
  styleElement.textContent = `
/* Autobidder Form CSS Variables */
/* These variables are generated from your design settings */
/* You can reference them in Custom CSS using var(--ab-variable-name) */

#${containerId} {
${cssVariables}
}
`;
}

/**
 * Generates example custom CSS to help users get started
 */
export function generateCustomCSSExamples(): string {
  return `/* EXAMPLE CUSTOM CSS */
/* All design editor settings are available as CSS variables */
/* Format: var(--ab-property-name) */

/* Example 1: Customize button hover effect */
.ab-button:hover {
  background: linear-gradient(135deg, var(--ab-primary-color), var(--ab-button-hover-bg));
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* Example 2: Add custom service selector hover animation */
.ab-service-card:hover {
  transform: translateY(-4px);
  border-color: var(--ab-primary-color);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Example 3: Style specific input types */
.ab-input[type="number"] {
  border-left: 4px solid var(--ab-primary-color);
}

/* Example 4: Customize the active state of service cards */
.ab-service-card.selected {
  background: linear-gradient(135deg, var(--ab-service-selector-selected-bg), #ffffff);
  border-width: 3px;
}

/* Example 5: Add focus ring to all interactive elements */
.ab-button:focus,
.ab-input:focus,
.ab-select:focus {
  outline: 2px solid var(--ab-primary-color);
  outline-offset: 2px;
}

/* Example 6: Customize multiple choice cards */
.ab-multichoice-card:hover {
  background: var(--ab-multichoice-hover-bg);
  border-color: var(--ab-multichoice-hover-border-color);
}

.ab-multichoice-card.selected {
  background: var(--ab-multichoice-selected-bg);
  border-color: var(--ab-multichoice-selected-color);
}

/* Example 7: Custom price display styling */
.ab-pricing-card .price {
  background: linear-gradient(135deg, var(--ab-primary-color), var(--ab-pricing-accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Example 8: Add animation to form container */
.ab-form-container {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Available CSS Classes:
 * .ab-form-container - Main form wrapper
 * .ab-button - All buttons
 * .ab-button-primary - Primary action buttons
 * .ab-button-secondary - Secondary buttons
 * .ab-input - Text inputs
 * .ab-select - Dropdown selects
 * .ab-slider - Range sliders
 * .ab-service-card - Service selector cards
 * .ab-multichoice-card - Multiple choice option cards
 * .ab-question-card - Question container cards
 * .ab-pricing-card - Pricing display cards
 * .ab-label - Form labels
 * .ab-error - Error messages
 * .selected - Selected state (for cards)
 * .disabled - Disabled state
 */`;
}
