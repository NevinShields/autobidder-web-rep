import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Eye, 
  Settings, 
  Save, 
  RotateCcw, 
  Monitor, 
  Smartphone,
  Grid2x2,
  Palette,
  CheckCircle,
  AlertCircle,
  Loader2,
  MousePointer,
  ChevronDown,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DesignSettings, StylingOptions } from "@shared/schema";
import { generateCSSVariables } from "@shared/css-variables";
import VisualComponentEditor from "@/components/visual-component-editor";
import ThemeEditor from "@/components/theme-editor";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const highlightCSS = (value: string) => {
  const escaped = escapeHtml(value);
  const patterns: Array<{ regex: RegExp; className: string }> = [
    { regex: /\/\*[\s\S]*?\*\//g, className: "css-token-comment" },
    { regex: /"[^"\n]*"|'[^'\n]*'/g, className: "css-token-string" },
    { regex: /#[0-9a-fA-F]{3,8}\b/g, className: "css-token-color" },
    { regex: /@\w[\w-]*/g, className: "css-token-atrule" },
    { regex: /\b\d+(\.\d+)?(px|rem|em|%|vh|vw|deg|s|ms)?\b/g, className: "css-token-number" },
    { regex: /(^|\n|\s)([a-zA-Z-]+)(?=\s*:)/g, className: "css-token-property" },
    { regex: /(^|\n)\s*([^{\n]+)(?=\s*\{)/g, className: "css-token-selector" },
  ];

  let highlighted = escaped;
  patterns.forEach(({ regex, className }) => {
    highlighted = highlighted.replace(regex, (match, prefix) => {
      if (className === "css-token-property" && typeof prefix === "string") {
        const property = match.replace(prefix, "");
        return `${prefix}<span class="${className}">${property}</span>`;
      }
      if (className === "css-token-selector" && typeof prefix === "string") {
        const selector = match.replace(prefix, "");
        return `${prefix}<span class="${className}">${selector.trim()}</span>`;
      }
      return `<span class="${className}">${match}</span>`;
    });
  });

  return highlighted;
};

const formatCustomCSS = (value: string) => {
  if (!value.trim()) return value;
  let formatted = value.replace(/\}\s*(?=[.#a-zA-Z])/g, '}\n');
  formatted = formatted.replace(/;\s*(?=\})/g, ';\n');
  return formatted;
};

type PreviewTarget = {
  selector: string;
  label: string;
};

const previewTargetAttributes = (selector: string, label: string) => ({
  "data-css-target": selector,
  "data-css-label": label,
});

const previewScaffoldCSS = `
#design-css-preview {
  position: relative;
}

#design-css-preview .preview-stage {
  margin-top: 20px;
}

#design-css-preview .preview-stage:first-of-type {
  margin-top: 0;
}

#design-css-preview .preview-stage-title {
  margin-bottom: 12px;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(100 116 139);
  font-weight: 600;
}

.dark #design-css-preview .preview-stage-title {
  color: rgb(148 163 184);
}

#design-css-preview [data-css-target] {
  transition: outline-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
  cursor: pointer;
}

#design-css-preview [data-css-target]:hover {
  outline: 2px dashed rgba(59, 130, 246, 0.72);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(191, 219, 254, 0.35);
}

#design-css-preview #autobidder-form.ab-form-container {
  width: min(100%, 1040px);
  margin: 0 auto;
  color: var(--ab-text-color, #1F2937);
  font-family: var(--ab-font-family), Inter, "Segoe UI", sans-serif;
  font-size: var(--ab-font-size, 1rem);
}

/* Button styles */
#design-css-preview #autobidder-form .ab-button {
  background-color: var(--ab-button-bg, #2563EB);
  color: var(--ab-button-text-color, #FFFFFF);
  border-color: var(--ab-button-border-color, #2563EB);
  border-radius: var(--ab-button-border-radius, 12px);
  border-width: var(--ab-button-border-width, 0px);
  border-style: solid;
  padding: var(--ab-button-padding, 12px 24px);
  font-size: var(--ab-button-font-size, 18px);
  font-weight: var(--ab-button-font-weight, 600);
  box-shadow: var(--ab-button-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

#design-css-preview #autobidder-form .ab-button:hover {
  background-color: var(--ab-button-hover-bg, #1d4ed8);
  color: var(--ab-button-hover-text-color, #FFFFFF);
  border-color: var(--ab-button-hover-border-color, #1d4ed8);
}

#design-css-preview #autobidder-form .ab-button-secondary {
  background: transparent;
  color: var(--ab-text-color, #1F2937);
  border-color: rgb(148 163 184 / 0.65);
}

/* Service card styles */
#design-css-preview #autobidder-form .ab-service-card {
  background-color: var(--ab-service-selector-bg, #FFFFFF);
  border-color: var(--ab-service-selector-border-color, #E5E7EB);
  border-radius: var(--ab-service-selector-border-radius, 16px);
  border-width: var(--ab-service-selector-border-width, 1px);
  border-style: solid;
  box-shadow: var(--ab-service-selector-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
  padding: 16px;
  text-align: left;
  transition: all 160ms ease;
}

#design-css-preview #autobidder-form .ab-service-card.selected {
  background-color: var(--ab-service-selector-active-bg, #EFF6FF);
  border-color: var(--ab-service-selector-active-border-color, #3B82F6);
  border-width: var(--ab-service-selector-border-width, 2px);
}

#design-css-preview #autobidder-form .ab-service-card:hover:not(.selected) {
  background-color: var(--ab-service-selector-hover-bg, #F3F4F6);
  border-color: var(--ab-service-selector-hover-border-color, #D1D5DB);
}

/* Input styles */
#design-css-preview #autobidder-form .ab-input,
#design-css-preview #autobidder-form .ab-number-input,
#design-css-preview #autobidder-form .ab-text-input,
#design-css-preview #autobidder-form .ab-textarea,
#design-css-preview #autobidder-form .ab-select {
  width: 100%;
  background: var(--ab-input-bg, #FFFFFF);
  color: var(--ab-input-text-color, #1F2937);
  border-color: var(--ab-input-border-color, #D1D5DB);
  border-radius: var(--ab-input-border-radius, 8px);
  border-width: var(--ab-input-border-width, 1px);
  border-style: solid;
  padding: var(--ab-input-padding, 8px 12px);
  min-height: var(--ab-input-height, 40px);
  box-shadow: var(--ab-input-shadow, none);
  font-size: var(--ab-input-font-size, 1rem);
}

#design-css-preview #autobidder-form .ab-input:focus,
#design-css-preview #autobidder-form .ab-number-input:focus,
#design-css-preview #autobidder-form .ab-text-input:focus,
#design-css-preview #autobidder-form .ab-textarea:focus,
#design-css-preview #autobidder-form .ab-select:focus {
  border-color: var(--ab-primary-color, #3B82F6);
  outline: none;
}

#design-css-preview #autobidder-form .ab-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--ab-primary-color, #2563EB);
}

/* Multiple choice styles */
#design-css-preview #autobidder-form .ab-multiple-choice,
#design-css-preview #autobidder-form .ab-multichoice-card {
  border-color: var(--ab-multiple-choice-border-color, #D1D5DB);
  border-radius: var(--ab-multiple-choice-border-radius, 12px);
  border-width: var(--ab-multiple-choice-border-width, 2px);
  border-style: solid;
  background-color: var(--ab-multiple-choice-bg, transparent);
  box-shadow: var(--ab-multichoice-card-shadow, none);
  padding: 12px;
  text-align: left;
}

#design-css-preview #autobidder-form .ab-multiple-choice.selected {
  background-color: var(--ab-multiple-choice-active-bg, #3B82F6);
  border-color: var(--ab-multiple-choice-active-border-color, #2563EB);
  color: var(--ab-multiple-choice-active-text-color, #FFFFFF);
}

#design-css-preview #autobidder-form .ab-multiple-choice:hover:not(.selected) {
  background-color: var(--ab-multiple-choice-hover-bg, #F3F4F6);
  border-color: var(--ab-multiple-choice-hover-border-color, #D1D5DB);
}

/* Question card styles */
#design-css-preview #autobidder-form .ab-question-card {
  background-color: var(--ab-question-card-bg, #FFFFFF);
  border-radius: var(--ab-question-card-border-radius, 12px);
  border-color: var(--ab-question-card-border-color, #E5E7EB);
  border-width: var(--ab-question-card-border-width, 1px);
  border-style: solid;
  padding: var(--ab-question-card-padding, 24px);
  box-shadow: var(--ab-question-card-shadow, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
}

/* Form container styles */
#design-css-preview #autobidder-form.ab-form-container {
  background: var(--ab-background-color, transparent);
  border-radius: var(--ab-container-border-radius, 16px);
  padding: var(--ab-container-padding, 8px);
  margin: var(--ab-container-margin, 0px);
  box-shadow: var(--ab-container-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  border-width: var(--ab-container-border-width, 0px);
  border-color: var(--ab-container-border-color, #E5E7EB);
  border-style: solid;
}

/* Question label styles */
#design-css-preview #autobidder-form .ab-label,
#design-css-preview #autobidder-form .ab-question-label {
  color: var(--ab-label-color, #374151);
  font-family: var(--ab-label-font-family, 'Inter, sans-serif');
  font-weight: var(--ab-label-font-weight, 500);
  font-size: var(--ab-label-font-size, 0.875rem);
}

/* Service title styles */
#design-css-preview #autobidder-form .ab-service-title {
  color: var(--ab-service-title-color, #374151);
  font-family: var(--ab-service-title-font-family, 'Inter, sans-serif');
  font-weight: var(--ab-service-title-font-weight, 900);
  font-size: var(--ab-service-title-font-size, 0.875rem);
}

/* Pricing card styles */
#design-css-preview #autobidder-form .ab-pricing-card {
  background-color: var(--ab-pricing-card-bg, #FFFFFF);
  border-radius: var(--ab-pricing-card-border-radius, 16px);
  border-color: var(--ab-pricing-card-border-color, #E5E7EB);
  border-width: var(--ab-pricing-card-border-width, 1px);
  border-style: solid;
  box-shadow: var(--ab-pricing-card-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
  padding: var(--ab-pricing-card-padding, 10px);
}

#design-css-preview #autobidder-form .ab-pricing-card:hover {
  transform: var(--ab-pricing-card-hover-transform, scale(1.01));
}

#design-css-preview #autobidder-form .ab-pricing-card-price {
  background-color: var(--ab-pricing-card-price-bg, transparent);
  color: var(--ab-pricing-card-price-color, inherit);
}

#design-css-preview #autobidder-form .ab-pricing-card-title {
  color: var(--ab-pricing-card-title-color, inherit);
  font-family: var(--ab-pricing-card-title-font-family, inherit);
  font-weight: var(--ab-pricing-card-title-font-weight, inherit);
}

#design-css-preview #autobidder-form .ab-pricing-card-description {
  color: var(--ab-pricing-card-description-color, inherit);
}

#design-css-preview #autobidder-form .ab-pricing-card-bullet-icon {
  background-color: var(--ab-pricing-card-bullet-icon-bg, inherit);
}

#design-css-preview #autobidder-form .ab-pricing-card-bullet-text {
  color: var(--ab-pricing-card-bullet-text-color, inherit);
}

/* Slider styles */
#design-css-preview #autobidder-form .ab-slider {
  width: 100%;
  height: var(--slider-height, 8px);
  accent-color: var(--ab-primary-color, #2563EB);
}

#design-css-preview #autobidder-form .ab-slider [role="slider"] {
  background-color: var(--slider-thumb-bg, #2563EB);
  border-radius: var(--slider-thumb-border-radius, 50%);
  width: var(--slider-thumb-size, 16px);
  height: var(--slider-thumb-size, 16px);
}

#design-css-preview #autobidder-form .ab-slider-value {
  color: var(--ab-slider-value-color, inherit);
}

#design-css-preview #autobidder-form .ab-slider-unit {
  color: var(--ab-slider-unit-color, inherit);
}

#design-css-preview #autobidder-form .ab-discount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

#design-css-preview #autobidder-form .ab-discount-card {
  border: 1px solid rgb(148 163 184 / 0.4);
  border-radius: 10px;
  padding: 8px;
}

#design-css-preview #autobidder-form .ab-discount-card.selected {
  border-color: var(--ab-primary-color, #2563EB);
  background: rgb(59 130 246 / 0.08);
}

#design-css-preview #autobidder-form .ab-discount-applied {
  display: inline-flex;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgb(16 185 129 / 0.2);
  color: rgb(5 150 105);
}

#design-css-preview #autobidder-form .ab-discount-line,
#design-css-preview #autobidder-form .ab-customer-summary-line,
#design-css-preview #autobidder-form .ab-discount-savings-row,
#design-css-preview #autobidder-form .ab-discount-savings-total {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

#design-css-preview #autobidder-form .ab-discount-savings-total {
  font-weight: 700;
  border-top: 1px dashed rgb(148 163 184 / 0.6);
  margin-top: 6px;
  padding-top: 6px;
}

#design-css-preview #autobidder-form .ab-calendar-nav,
#design-css-preview #autobidder-form .ab-calendar-date,
#design-css-preview #autobidder-form .ab-time-slot {
  border: 1px solid rgb(148 163 184 / 0.45);
}

#design-css-preview #autobidder-form .ab-calendar-nav {
  border-radius: 8px;
  padding: 4px 8px;
}

#design-css-preview #autobidder-form .ab-calendar-month-title {
  font-weight: 600;
}

#design-css-preview #autobidder-form .ab-calendar-day-header {
  text-align: center;
  font-size: 0.78rem;
  color: rgb(100 116 139);
}

#design-css-preview #autobidder-form .ab-calendar-date {
  border-radius: 8px;
  padding: 6px;
  text-align: center;
}

#design-css-preview #autobidder-form .ab-time-slot {
  border-radius: 8px;
  padding: 8px;
}

#design-css-preview #autobidder-form .ab-calendar-date.selected,
#design-css-preview #autobidder-form .ab-time-slot.selected {
  background: var(--ab-primary-color, #2563EB);
  color: #ffffff;
  border-color: var(--ab-primary-color, #2563EB);
}

#design-css-preview #autobidder-form .disabled {
  opacity: 0.5;
}

#design-css-preview #autobidder-form .ab-error {
  color: rgb(220 38 38);
  font-size: 0.8rem;
  font-weight: 600;
}
`;

const scopeCSSForPreview = (css: string): string => {
  const previewRoot = '#design-css-preview #autobidder-form';
  const previewRootWithContainerClass = '#design-css-preview #autobidder-form.ab-form-container';

  const prefixSelector = (selector: string): string => {
    if (selector.trim() === ':root') return selector;

    if (selector.includes(previewRoot)) return selector;

    if (selector.includes('#autobidder-form')) {
      return selector.replace(/#autobidder-form/g, previewRoot);
    }

    if (selector.includes('.ab-form-container')) {
      return selector.replace(/\.ab-form-container/g, previewRootWithContainerClass);
    }

    return selector
      .split(',')
      .map((entry) => {
        const sel = entry.trim();

        if (sel === '.ab-form-container' || sel.startsWith('.ab-form-container:') || sel.startsWith('.ab-form-container.')) {
          return sel.replace('.ab-form-container', previewRootWithContainerClass);
        }

        if (sel.includes(':')) {
          const [base, ...pseudo] = sel.split(':');
          const safeBase = base.trim() ? base : previewRoot;
          if (safeBase === previewRoot) {
            return `${safeBase}:${pseudo.join(':')}`;
          }
          return `${previewRoot} ${safeBase}:${pseudo.join(':')}`;
        }
        return `${previewRoot} ${sel}`;
      })
      .join(', ');
  };

  const scopeCSS = (value: string): string => {
    const result: string[] = [];
    let buffer = '';
    let braceDepth = 0;
    let isAtRule = false;
    let shouldScopeContent = false;
    const scopableAtRules = ['@media', '@supports', '@container', '@layer'];

    for (let i = 0; i < value.length; i++) {
      const char = value[i];

      if (char === '{') {
        braceDepth++;
        if (braceDepth === 1) {
          const currentSelector = buffer.trim();
          isAtRule = currentSelector.startsWith('@');
          if (isAtRule) {
            shouldScopeContent = scopableAtRules.some((rule) => currentSelector.toLowerCase().startsWith(rule));
            result.push(`${currentSelector} {`);
          } else {
            result.push(`${prefixSelector(currentSelector)} {`);
          }
          buffer = '';
        } else {
          buffer += char;
        }
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          if (isAtRule) {
            result.push(shouldScopeContent ? scopeCSS(buffer) : buffer);
          } else {
            result.push(buffer);
          }
          result.push('}');
          buffer = '';
          isAtRule = false;
          shouldScopeContent = false;
        } else {
          buffer += char;
        }
      } else {
        buffer += char;
      }
    }

    if (buffer.trim()) {
      result.push(buffer);
    }

    return result.join('');
  };

  return scopeCSS(css);
};

// Default styling options
const defaultStyling: StylingOptions = {
  containerWidth: 700,
  containerHeight: 850,
  containerBorderRadius: 16,
  containerShadow: 'xl',
  containerBorderWidth: 0,
  containerBorderColor: '#E5E7EB',
  containerPadding: 8,
  containerMargin: 0,
  backgroundColor: '#FFFFFF',
  fontFamily: 'inter',
  fontSize: 'base',
  fontWeight: 'medium',
  textColor: '#1F2937',
  primaryColor: '#2563EB',
  buttonStyle: 'rounded',
  buttonBorderRadius: 12,
  buttonPadding: 'lg',
  buttonFontWeight: 'semibold',
  buttonShadow: 'md',
  buttonBackgroundColor: '#2563EB',
  buttonTextColor: '#FFFFFF',
  buttonBorderWidth: 0,
  buttonBorderColor: '#2563EB',
  buttonHoverBackgroundColor: '#1d4ed8',
  buttonHoverTextColor: '#FFFFFF',
  buttonHoverBorderColor: '#1d4ed8',
  inputBorderRadius: 10,
  inputBorderWidth: 2,
  inputBorderColor: '#E5E7EB',
  inputFocusColor: '#2563EB',
  inputPadding: 'lg',
  inputBackgroundColor: '#F9FAFB',
  inputShadow: 'sm',
  inputFontSize: 'base',
  inputTextColor: '#1F2937',
  inputHeight: 40,
  inputWidth: 'full',
  multiChoiceImageSize: 'lg',
  multiChoiceImageShadow: 'md',
  multiChoiceImageBorderRadius: 12,
  multiChoiceCardBorderRadius: 12,
  multiChoiceCardShadow: 'sm',
  multiChoiceSelectedColor: '#2563EB',
  multiChoiceSelectedBgColor: '#EFF6FF',
  multiChoiceHoverBgColor: '#F8FAFC',
  multiChoiceLayout: 'grid',
  multipleChoiceActiveBackgroundColor: '#3B82F6',
  multipleChoiceActiveBorderColor: '#2563EB',
  multipleChoiceHoverBackgroundColor: '#F3F4F6',
  multipleChoiceHoverBorderColor: '#D1D5DB',
  questionCardBackgroundColor: '#FFFFFF',
  questionCardBorderRadius: 12,
  questionCardBorderWidth: 1,
  questionCardBorderColor: '#E5E7EB',
  questionCardShadow: 'sm',
  questionCardPadding: 'lg',
  serviceSelectorWidth: 900,
  serviceSelectorCardSize: 'lg',
  serviceSelectorCardsPerRow: 'auto',
  serviceSelectorBorderRadius: 16,
  serviceSelectorShadow: 'xl',
  serviceSelectorBackgroundColor: '#FFFFFF',
  serviceSelectorBorderWidth: 0,
  serviceSelectorBorderColor: '#E5E7EB',
  serviceSelectorSelectedBgColor: '#EFF6FF',
  serviceSelectorSelectedBorderColor: '#2563EB',
  serviceSelectorTitleFontSize: 'xl',
  serviceSelectorDescriptionFontSize: 'base',
  serviceSelectorTitleLineHeight: 'normal',
  serviceSelectorDescriptionLineHeight: 'normal',
  serviceSelectorTitleLetterSpacing: 'normal',
  serviceSelectorDescriptionLetterSpacing: 'normal',
  serviceSelectorIconSize: 'xl',
  serviceSelectorIconPosition: 'top',
  serviceSelectorIconSizeUnit: 'preset',
  serviceSelectorIconPixelSize: 48,
  serviceSelectorIconPercentSize: 30,
  serviceSelectorMaxHeight: 300,
  serviceSelectorLineHeight: 20,
  serviceSelectorPadding: 'xl',
  serviceSelectorGap: 'lg',
  serviceSelectorContentAlignment: 'center',
  serviceSelectorActiveBackgroundColor: '#3B82F6',
  serviceSelectorActiveBorderColor: '#2563EB',
  serviceSelectorHoverBackgroundColor: '#F8FAFC',
  serviceSelectorHoverBorderColor: '#D1D5DB',
  pricingCardBorderRadius: 12,
  pricingCardShadow: 'lg',
  pricingCardBorderWidth: 0,
  pricingCardBorderColor: '#E5E7EB',
  pricingCardBackgroundColor: '#FFFFFF',
  pricingTextColor: '#1F2937',
  pricingAccentColor: '#2563EB',
  pricingIconVisible: true,
  pricingTextAlignment: 'left',
  pricingBulletIconType: 'checkmark',
  pricingBulletIconSize: 20,
  showPriceBreakdown: true,
  includeLedCapture: true,
  requireContactFirst: false,
  showBundleDiscount: false,
  bundleDiscountPercent: 10,
  enableSalesTax: false,
  salesTaxRate: 8.25,
  salesTaxLabel: 'Sales Tax',
  showProgressGuide: true,
  showFormTitle: true,
  showFormSubtitle: true,
  enableDisclaimer: false,
  disclaimerText: 'Prices are estimates and may vary based on specific requirements. Final pricing will be confirmed after consultation.',
  showSectionTitles: true,
  showStepDescriptions: true,
  enableBooking: true,
  requireName: true,
  requireEmail: true,
  requirePhone: false,
  enablePhone: true,
  enableAddress: false,
  requireAddress: false,
  enableNotes: false,
  enableHowDidYouHear: false,
  requireHowDidYouHear: false,
  howDidYouHearOptions: ['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other'],
  nameLabel: 'Full Name',
  emailLabel: 'Email Address',
  phoneLabel: 'Phone Number',
  addressLabel: 'Address',
  notesLabel: 'Additional Notes',
  howDidYouHearLabel: 'How did you hear about us?',
  enableImageUpload: false,
  requireImageUpload: false,
  imageUploadLabel: 'Upload Images',
  imageUploadDescription: 'Please upload relevant images to help us provide an accurate quote',
  maxImages: 5,
  maxImageSize: 10,
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  imageUploadHelperText: 'Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.',
  showOneQuestionAtTime: false,
  showOneSectionAtTime: false,
  requireNextButtonClick: false,
  formAnimationStyle: 'slide',
  enableCustomButton: false,
  customButtonText: 'Get Another Quote',
  customButtonUrl: ''
};

// Default component styles
const defaultComponentStyles = {
  serviceSelector: {
    borderColor: '#E5E7EB',
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    activeBackgroundColor: '#3B82F6',
    activeBorderColor: '#2563EB',
    hoverBackgroundColor: '#F8FAFC',
    hoverBorderColor: '#D1D5DB',
    shadow: 'xl',
    height: 120,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 16,
    iconPosition: 'left',
    iconSize: 48,
    showImage: true,
  },
  textInput: {
    borderColor: '#E5E7EB', 
    borderWidth: 2,
    backgroundColor: '#F9FAFB',
    shadow: 'sm',
    height: 40,
    width: 'full',
    padding: 12,
    margin: 4,
    borderRadius: 10,
  },
  dropdown: {
    borderColor: '#E5E7EB',
    borderWidth: 2, 
    backgroundColor: '#F9FAFB',
    shadow: 'sm',
    height: 40,
    width: 'full',
    padding: 12,
    margin: 4,
    borderRadius: 10,
  },
  multipleChoice: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    activeBackgroundColor: '#3B82F6',
    activeBorderColor: '#2563EB',
    hoverBackgroundColor: '#F3F4F6',
    hoverBorderColor: '#D1D5DB',
    shadow: 'sm',
    height: 80,
    width: 'full',
    padding: 12,
    margin: 4,
    borderRadius: 12,
    showImage: true,
  },
  pricingCard: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadow: 'sm',
    height: 120,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    showServiceIcon: true,
  },
  questionCard: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadow: 'sm',
    height: 100,
    width: 'full',
    padding: 16,
    margin: 8,
    borderRadius: 12,
  },
  slider: {
    borderColor: '#E5E7EB',
    borderWidth: 0,
    backgroundColor: '#2563EB',
    trackBackgroundColor: '#E2E8F0',
    shadow: 'none',
    height: 8,
    width: 'full',
    padding: 0,
    margin: 0,
    borderRadius: 999,
    thumbColor: '#2563EB',
    thumbSize: 20,
    thumbBorderRadius: 50,
  },
  button: {
    borderColor: '#2563EB',
    borderWidth: 0,
    backgroundColor: '#2563EB',
    shadow: 'md',
    height: 48,
    width: 'auto',
    padding: 16,
    margin: 4,
    borderRadius: 12,
    textColor: '#FFFFFF',
    fontSize: 'base',
  },
};

// Component configurations for the visual editor
const componentConfigs = [
  {
    id: 'service-selector',
    title: 'Service Selector Cards',
    description: 'Customize the appearance of service selection cards',
    type: 'service-selector' as const,
    icon: Grid2x2,
  },
  {
    id: 'text-input',
    title: 'Text Input Fields',
    description: 'Style text input fields and number inputs',
    type: 'text-input' as const,
    icon: Settings,
  },
  {
    id: 'multiple-choice',
    title: 'Multiple Choice Options',
    description: 'Style multiple choice selection cards',
    type: 'multiple-choice' as const,
    icon: Grid2x2,
  },
  {
    id: 'slider',
    title: 'Slider Inputs',
    description: 'Customize slider/range input appearance',
    type: 'slider' as const,
    icon: Settings,
  },
  {
    id: 'pricing-card',
    title: 'Pricing Display',
    description: 'Customize the final pricing card appearance',
    type: 'pricing-card' as const,
    icon: Palette,
  },
  {
    id: 'question-card',
    title: 'Question Cards',
    description: 'Style question container cards',
    type: 'question-card' as const,
    icon: Settings,
  },
  {
    id: 'button',
    title: 'Action Buttons',
    description: 'Customize the appearance of form buttons',
    type: 'button' as const,
    icon: MousePointer,
  },
];

// Helper functions
const kebabToCamelCase = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

const camelToKebabCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

const mergeComponentStyles = (styles: any) => {
  let parsed = styles;
  if (typeof styles === 'string') {
    try {
      parsed = JSON.parse(styles);
    } catch (error) {
      console.warn('Failed to parse component styles:', error);
      parsed = {};
    }
  }
  const mergedStyles = { ...defaultComponentStyles };
  Object.keys(mergedStyles).forEach(key => {
    if (parsed?.[key]) {
      mergedStyles[key as keyof typeof mergedStyles] = {
        ...mergedStyles[key as keyof typeof mergedStyles],
        ...parsed[key],
      };
    }
  });
  return mergedStyles;
};

export default function DesignDashboard() {

  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [styling, setStyling] = useState<StylingOptions>(defaultStyling);
  const [componentStyles, setComponentStyles] = useState(defaultComponentStyles);
  const [customCSS, setCustomCSS] = useState('');
  const [customCSSError, setCustomCSSError] = useState('');
  const cssHighlightRef = useRef<HTMLPreElement | null>(null);
  const cssInputRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightedCSS = useMemo(() => highlightCSS(customCSS || ''), [customCSS]);
  const [isFormContainerExpanded, setIsFormContainerExpanded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCSS, setIsGeneratingCSS] = useState(false);
  const [aiCSSError, setAiCSSError] = useState('');
  const [isPreviewLabOpen, setIsPreviewLabOpen] = useState(false);
  const [hoveredPreviewTarget, setHoveredPreviewTarget] = useState<PreviewTarget | null>(null);
  const [selectedPreviewTarget, setSelectedPreviewTarget] = useState<PreviewTarget | null>(null);
  const [targetedEditPrompt, setTargetedEditPrompt] = useState('');
  const previewSurfaceRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Throttling for API calls
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const previewVariablesCSS = useMemo(() => {
    return `
#design-css-preview #autobidder-form {
${generateCSSVariables(styling)}
}
`;
  }, [styling]);

  const scopedPreviewCustomCSS = useMemo(() => {
    if (!customCSS.trim()) return '';
    try {
      return scopeCSSForPreview(customCSS);
    } catch (error) {
      console.error('Failed to scope preview custom CSS:', error);
      return '';
    }
  }, [customCSS]);

  // Fetch design settings from new API
  const { data: designSettings, isLoading } = useQuery<DesignSettings>({
    queryKey: ['/api/design-settings'],
  });
  const hasRestoredBackupRef = useRef(false);

  // Load saved design settings
  useEffect(() => {
    if (designSettings) {
      try {
        // Load styling
        if (designSettings.styling) {
          setStyling({ ...defaultStyling, ...designSettings.styling });
        }
        
        // Load component styles
        if (designSettings.componentStyles) {
          setComponentStyles(mergeComponentStyles(designSettings.componentStyles));
        }
        
        // Load custom CSS
        if (designSettings.customCSS) {
          setCustomCSS(formatCustomCSS(designSettings.customCSS));
        }
        
        // Store a local backup so settings don't appear "lost" if a future fetch fails
        try {
          localStorage.setItem(
            'design-settings-backup',
            JSON.stringify({
              styling: designSettings.styling,
              componentStyles: designSettings.componentStyles,
              customCSS: designSettings.customCSS || '',
            })
          );
        } catch (storageError) {
          console.warn('Failed to store design settings backup:', storageError);
        }

        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error loading design settings:', error);
        toast({
          title: "Error Loading Design Settings",
          description: "Failed to load saved design settings. Using defaults.",
          variant: "destructive",
        });
      }
    }
  }, [designSettings, toast]);

  // Restore backup if design settings failed to load
  useEffect(() => {
    if (!designSettings && !isLoading && !hasRestoredBackupRef.current) {
      hasRestoredBackupRef.current = true;
      try {
        const backup = localStorage.getItem('design-settings-backup');
        if (!backup) return;
        const parsed = JSON.parse(backup);
        if (parsed?.styling) {
          setStyling({ ...defaultStyling, ...parsed.styling });
        }
        if (parsed?.componentStyles) {
          setComponentStyles(mergeComponentStyles(parsed.componentStyles));
        }
        if (typeof parsed?.customCSS === 'string') {
          setCustomCSS(parsed.customCSS);
        }
        toast({
          title: "Loaded Backup Design",
          description: "Using your last known design settings from this device.",
        });
      } catch (error) {
        console.warn('Failed to restore design settings backup:', error);
      }
    }
  }, [designSettings, isLoading, toast]);

  // Cleanup throttle timeout on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  // Save mutation for design settings
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", "/api/design-settings", {
        styling,
        componentStyles,
        customCSS: customCSS.trim() || null
      });
      return response.json();
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      setIsSaving(false);
      try {
        localStorage.setItem(
          'design-settings-backup',
          JSON.stringify({
            styling,
            componentStyles,
            customCSS: customCSS || '',
          })
        );
      } catch (storageError) {
        console.warn('Failed to update design settings backup:', storageError);
      }
      toast({
        title: "Design Saved",
        description: "Your design changes have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/design-settings'] });
    },
    onError: (error) => {
      setIsSaving(false);
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save design changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle styling changes (themes tab)
  const handleStylingChange = useCallback((updates: Partial<StylingOptions>) => {
    setStyling(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle component style changes
  const handleComponentStyleChange = useCallback((componentId: string, updates: any) => {
    const camelCaseId = kebabToCamelCase(componentId);
    setComponentStyles(prev => ({
      ...prev,
      [camelCaseId]: {
        ...prev[camelCaseId as keyof typeof prev],
        ...updates,
      },
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Toggle component expansion
  const toggleComponent = useCallback((componentId: string) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  }, []);

  // Save changes
  const handleSave = useCallback(() => {
    if (!hasUnsavedChanges || isSaving) return;
    
    setIsSaving(true);
    saveMutation.mutate();
  }, [hasUnsavedChanges, isSaving, saveMutation]);

  // Handle custom CSS changes with validation
  const handleCustomCSSChange = useCallback((value: string) => {
    setCustomCSS(value);
    setHasUnsavedChanges(true);
    
    // Basic CSS validation
    if (value.trim()) {
      try {
        // Create a temporary style element to test CSS validity
        const tempStyle = document.createElement('style');
        tempStyle.textContent = value;
        document.head.appendChild(tempStyle);
        
        // If no errors, clear error state
        setCustomCSSError('');
        
        // Clean up
        document.head.removeChild(tempStyle);
      } catch (error) {
        setCustomCSSError('Invalid CSS syntax detected');
      }
    } else {
      setCustomCSSError('');
    }
  }, []);


  useEffect(() => {
    if (cssInputRef.current && cssHighlightRef.current) {
      cssHighlightRef.current.scrollTop = cssInputRef.current.scrollTop;
      cssHighlightRef.current.scrollLeft = cssInputRef.current.scrollLeft;
    }
  }, [customCSS]);

  // Handle AI CSS generation
  const handleGenerateCSS = useCallback(async (description: string) => {
    setIsGeneratingCSS(true);
    setAiCSSError('');
    
    try {
      const response = await apiRequest("POST", "/api/design-settings/generate-css", {
        description
      });
      const data = await response.json();
      
      if (data.css) {
        setCustomCSS(formatCustomCSS(data.css));
        setHasUnsavedChanges(true);
        toast({
          title: "CSS Generated!",
          description: "AI has generated custom CSS based on your description.",
        });
      }
    } catch (error) {
      console.error('CSS generation error:', error);
      setAiCSSError(error instanceof Error ? error.message : 'Failed to generate CSS. Please try again.');
    } finally {
      setIsGeneratingCSS(false);
    }
  }, [toast]);

  // Handle AI CSS editing
  const handleEditCSS = useCallback(async (editDescription: string) => {
    setIsGeneratingCSS(true);
    setAiCSSError('');
    
    try {
      const response = await apiRequest("POST", "/api/design-settings/edit-css", {
        currentCSS: customCSS,
        editDescription
      });
      const data = await response.json();
      
      if (data.css) {
        setCustomCSS(formatCustomCSS(data.css));
        setHasUnsavedChanges(true);
        toast({
          title: "CSS Edited!",
          description: "AI has updated your CSS based on your request.",
        });
        // Clear the input field
        const input = document.querySelector('[data-testid="input-ai-css-edit"]') as HTMLInputElement;
        if (input) input.value = '';
      }
    } catch (error) {
      console.error('CSS editing error:', error);
      setAiCSSError(error instanceof Error ? error.message : 'Failed to edit CSS. Please try again.');
      toast({
        title: "Edit Failed",
        description: error instanceof Error ? error.message : "Failed to edit CSS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCSS(false);
    }
  }, [customCSS, toast]);

  const handlePreviewPointerMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const hoverTarget = (event.target as HTMLElement).closest<HTMLElement>('[data-css-target]');
    if (!hoverTarget || !previewSurfaceRef.current?.contains(hoverTarget)) {
      setHoveredPreviewTarget(null);
      return;
    }

    const selector = hoverTarget.dataset.cssTarget;
    if (!selector) {
      setHoveredPreviewTarget(null);
      return;
    }

    const label = hoverTarget.dataset.cssLabel || selector;
    setHoveredPreviewTarget((previous) => {
      if (previous?.selector === selector && previous.label === label) {
        return previous;
      }
      return { selector, label };
    });
  }, []);

  const handlePreviewElementSelect = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const selectedElement = (event.target as HTMLElement).closest<HTMLElement>('[data-css-target]');
    if (!selectedElement || !previewSurfaceRef.current?.contains(selectedElement)) {
      return;
    }

    event.preventDefault();
    const selector = selectedElement.dataset.cssTarget;
    if (!selector) return;

    setSelectedPreviewTarget({
      selector,
      label: selectedElement.dataset.cssLabel || selector,
    });
  }, []);

  const handleTargetedEdit = useCallback(async () => {
    if (!selectedPreviewTarget || !targetedEditPrompt.trim() || isGeneratingCSS) return;

    if (customCSS.trim()) {
      const scopedEditPrompt = [
        `Target selector: ${selectedPreviewTarget.selector}`,
        `Element description: ${selectedPreviewTarget.label}`,
        `Request: ${targetedEditPrompt.trim()}`,
        `Only add or change CSS rules for ${selectedPreviewTarget.selector}.`,
        'Keep all unrelated existing CSS untouched.',
      ].join('\n');
      await handleEditCSS(scopedEditPrompt);
    } else {
      const scopedGeneratePrompt = [
        `Create initial custom CSS for ${selectedPreviewTarget.selector}.`,
        `Element description: ${selectedPreviewTarget.label}`,
        `Request: ${targetedEditPrompt.trim()}`,
        `Only generate selectors and styles for ${selectedPreviewTarget.selector}.`,
      ].join('\n');
      await handleGenerateCSS(scopedGeneratePrompt);
    }

    setTargetedEditPrompt('');
  }, [selectedPreviewTarget, targetedEditPrompt, isGeneratingCSS, customCSS, handleEditCSS, handleGenerateCSS]);

  const handleTogglePreviewLab = useCallback(() => {
    const nextState = !isPreviewLabOpen;
    setIsPreviewLabOpen(nextState);
    if (!nextState) {
      setHoveredPreviewTarget(null);
      setSelectedPreviewTarget(null);
      setTargetedEditPrompt('');
    }
  }, [isPreviewLabOpen]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setStyling(defaultStyling);
    setComponentStyles(defaultComponentStyles);
    setCustomCSS('');
    setCustomCSSError('');
    setIsPreviewLabOpen(false);
    setHoveredPreviewTarget(null);
    setSelectedPreviewTarget(null);
    setTargetedEditPrompt('');
    setHasUnsavedChanges(true);
    toast({
      title: "Design Reset",
      description: "All design settings have been reset to defaults.",
    });
  }, [toast]);


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Design Dashboard</h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Customize your calculator's appearance and styling</p>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              {/* Action Buttons */}
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleReset} className="flex-1 sm:flex-none">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
                
                <Button 
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="relative flex-1 sm:flex-none"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : hasUnsavedChanges ? (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  <span className="sm:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
                </Button>
              </div>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                You have unsaved changes. Click "Save Changes" to apply your updates.
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="w-full">
          {/* Editor Panel - Full Width */}
          <div className="w-full">
            <Tabs defaultValue="components" className="w-full">
              <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="inline-flex w-auto min-w-fit rounded-full bg-slate-100/80 dark:bg-gray-800/70 p-1 shadow-sm ring-1 ring-slate-200/70 dark:ring-gray-700/70 backdrop-blur">
                  <TabsTrigger
                    value="components"
                    className="h-10 rounded-full px-5 text-sm font-medium text-slate-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-white"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Components
                  </TabsTrigger>
                  <TabsTrigger
                    value="themes"
                    className="h-10 rounded-full px-5 text-sm font-medium text-slate-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-white"
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Themes
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom-css"
                    className="h-10 rounded-full px-5 text-sm font-medium text-slate-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Custom CSS
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="components" className="mt-6">
                <div className="space-y-6">
                  {/* Form Container Design */}
                  <Card className="mb-4">
                    <CardHeader className="pb-2 pt-0">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 -m-2 rounded"
                        onClick={() => setIsFormContainerExpanded(!isFormContainerExpanded)}
                      >
                        <div className="flex items-center space-x-3">
                          {isFormContainerExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <div className="flex flex-col justify-center">
                            <CardTitle className="text-base">Form Container</CardTitle>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Customize the main form container spacing and appearance</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {isFormContainerExpanded && (
                      <CardContent className="pt-2">
                        <div className="space-y-3">
                          {/* Colors Row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-medium">Background Color</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="color"
                                  value={styling.backgroundColor || '#FFFFFF'}
                                  onChange={(e) => handleStylingChange({ backgroundColor: e.target.value })}
                                  className="w-12 h-8 p-1 border rounded cursor-pointer"
                                />
                                <Input
                                  type="text"
                                  value={styling.backgroundColor || '#FFFFFF'}
                                  onChange={(e) => handleStylingChange({ backgroundColor: e.target.value })}
                                  className="flex-1 text-xs h-8"
                                  placeholder="#FFFFFF"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Border Color</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="color"
                                  value={styling.containerBorderColor || '#E5E7EB'}
                                  onChange={(e) => handleStylingChange({ containerBorderColor: e.target.value })}
                                  className="w-12 h-8 p-1 border rounded cursor-pointer"
                                />
                                <Input
                                  type="text"
                                  value={styling.containerBorderColor || '#E5E7EB'}
                                  onChange={(e) => handleStylingChange({ containerBorderColor: e.target.value })}
                                  className="flex-1 text-xs h-8"
                                  placeholder="#E5E7EB"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Border Radius */}
                          <div>
                            <Label className="text-xs font-medium">Border Radius</Label>
                            <div className="flex items-center gap-3 mt-1">
                              <Slider
                                value={[styling.containerBorderRadius || 16]}
                                onValueChange={(value) => handleStylingChange({ containerBorderRadius: value[0] })}
                                max={50}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="min-w-[50px] text-center text-xs text-gray-500">
                                {styling.containerBorderRadius || 16}px
                              </span>
                            </div>
                          </div>

                          {/* Padding & Margin Row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-medium">Padding</Label>
                              <div className="flex items-center gap-3 mt-1">
                                <Slider
                                  value={[styling.containerPadding || 8]}
                                  onValueChange={(value) => handleStylingChange({ containerPadding: value[0] })}
                                  max={100}
                                  min={0}
                                  step={1}
                                  className="flex-1"
                                />
                                <span className="min-w-[50px] text-center text-xs text-gray-500">
                                  {styling.containerPadding || 8}px
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Margin</Label>
                              <div className="flex items-center gap-3 mt-1">
                                <Slider
                                  value={[styling.containerMargin || 0]}
                                  onValueChange={(value) => handleStylingChange({ containerMargin: value[0] })}
                                  max={100}
                                  min={0}
                                  step={1}
                                  className="flex-1"
                                />
                                <span className="min-w-[50px] text-center text-xs text-gray-500">
                                  {styling.containerMargin || 0}px
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {componentConfigs.map((component) => (
                    <VisualComponentEditor
                      key={component.id}
                      title={component.title}
                      description={component.description}
                      componentType={component.type}
                      isExpanded={expandedComponents.has(component.id)}
                      onToggle={() => toggleComponent(component.id)}
                      style={componentStyles[kebabToCamelCase(component.id) as keyof typeof componentStyles]}
                      onStyleChange={(updates) => handleComponentStyleChange(component.id, updates)}
                      onRealTimeChange={(updates) => handleComponentStyleChange(component.id, updates)}
                      styling={styling}
                      onStylingChange={
                        (component.type === 'service-selector' || component.type === 'multiple-choice' || component.type === 'pricing-card') 
                          ? (key: string, value: any) => handleStylingChange({ [key]: value })
                          : undefined
                      }
                    />
                  ))}
                  
                  {/* Custom CSS Section */}
                  
                </div>
              </TabsContent>

              <TabsContent value="themes" className="mt-6">
                <ThemeEditor
                  designSettings={{ styling, componentStyles }}
                  onChange={(updates) => {
                    if (updates.styling) {
                      handleStylingChange(updates.styling);
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="custom-css" className="mt-6">
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Custom CSS</CardTitle>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Generate or edit custom CSS that overrides component settings.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Interactive Preview Lab */}
                      <div className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Interactive Preview Lab</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Full demo form with all stages visible. Hover to inspect a class, then click an element to target AI edits for that selector.
                            </p>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={handleTogglePreviewLab} className="self-start">
                            <Eye className="mr-2 h-4 w-4" />
                            {isPreviewLabOpen ? 'Hide Preview' : 'Show Preview'}
                          </Button>
                        </div>

                        {!isPreviewLabOpen ? (
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                              Preview is hidden by default. Click <span className="font-semibold">Show Preview</span> to load the full staged form.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div
                              id="design-css-preview"
                              className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/35 p-3 sm:p-4"
                            >
                              <style>{previewVariablesCSS}</style>
                              <style>{previewScaffoldCSS}</style>
                              {scopedPreviewCustomCSS && <style>{scopedPreviewCustomCSS}</style>}

                              <div className="relative">
                                <div
                                  ref={previewSurfaceRef}
                                  onMouseMove={handlePreviewPointerMove}
                                  onMouseLeave={() => setHoveredPreviewTarget(null)}
                                  onClick={handlePreviewElementSelect}
                                >
                                  <div
                                    id="autobidder-form"
                                    className="ab-form-container form-container max-w-5xl w-full mx-auto"
                                    {...previewTargetAttributes('.ab-form-container', 'Form container')}
                                  >
                                    <div className="preview-stage">
                                      <p className="preview-stage-title">Stage 1 · Service Selection</p>
                                      <div className="grid gap-3 md:grid-cols-3">
                                        <button
                                          type="button"
                                          className="ab-service-card selected"
                                          {...previewTargetAttributes('.ab-service-card', 'Service card')}
                                        >
                                          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Most booked</p>
                                          <h4
                                            className="ab-service-title mt-1"
                                            {...previewTargetAttributes('.ab-service-title', 'Service card title')}
                                          >
                                            Whole Home Cleaning
                                          </h4>
                                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Great for quarterly deep resets.</p>
                                        </button>
                                        <button
                                          type="button"
                                          className="ab-service-card"
                                          {...previewTargetAttributes('.ab-service-card', 'Service card')}
                                        >
                                          <h4
                                            className="ab-service-title"
                                            {...previewTargetAttributes('.ab-service-title', 'Service card title')}
                                          >
                                            Move-Out Detail
                                          </h4>
                                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Top-to-bottom prep before handoff.</p>
                                        </button>
                                        <button
                                          type="button"
                                          className="ab-service-card"
                                          {...previewTargetAttributes('.ab-service-card', 'Service card')}
                                        >
                                          <h4
                                            className="ab-service-title"
                                            {...previewTargetAttributes('.ab-service-title', 'Service card title')}
                                          >
                                            Office Refresh
                                          </h4>
                                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Evening service for teams and studios.</p>
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        className="ab-service-accordion mt-3 text-sm"
                                        {...previewTargetAttributes('.ab-service-accordion', 'Service accordion header')}
                                      >
                                        What is included in each package?
                                      </button>
                                    </div>

                                    <div className="preview-stage">
                                      <p className="preview-stage-title">Stage 2 · Contact + Inputs</p>
                                      <div
                                        className="ab-question-card space-y-4"
                                        {...previewTargetAttributes('.ab-question-card', 'Question card')}
                                      >
                                        <div className="flex flex-wrap gap-2 text-[11px]">
                                          <span
                                            className="ab-input inline-flex rounded-full border border-slate-300 px-2 py-0.5"
                                            {...previewTargetAttributes('.ab-input', 'Input base class')}
                                          >
                                            .ab-input
                                          </span>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                          <div className="space-y-1">
                                            <label
                                              className="ab-label text-xs font-medium"
                                              {...previewTargetAttributes('.ab-label', 'Generic label')}
                                            >
                                              Full Name
                                            </label>
                                            <input
                                              className="ab-input ab-text-input"
                                              defaultValue="Jordan Smith"
                                              {...previewTargetAttributes('.ab-text-input', 'Text input')}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label
                                              className="ab-label ab-question-label text-xs font-medium"
                                              {...previewTargetAttributes('.ab-question-label', 'Question label')}
                                            >
                                              Rooms to service
                                            </label>
                                            <input
                                              type="number"
                                              className="ab-input ab-number-input"
                                              defaultValue={6}
                                              {...previewTargetAttributes('.ab-number-input', 'Number input')}
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="ab-question-label text-xs font-medium">Property Type</label>
                                          <button
                                            type="button"
                                            className="ab-select text-left"
                                            {...previewTargetAttributes('.ab-select', 'Dropdown trigger')}
                                          >
                                            Residential · Single Family
                                          </button>
                                          <div
                                            className="ab-select-content mt-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs"
                                            {...previewTargetAttributes('.ab-select-content', 'Dropdown menu content')}
                                          >
                                            Residential · Condo
                                          </div>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                          <div className="space-y-1">
                                            <label className="ab-question-label text-xs font-medium">Service Address</label>
                                            <input
                                              className="ab-input ab-address-input"
                                              defaultValue="1455 Sunset Ave, Austin, TX"
                                              {...previewTargetAttributes('.ab-address-input', 'Address input')}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="ab-question-label text-xs font-medium">Upload Reference Photos</label>
                                            <input
                                              type="file"
                                              className="ab-input ab-file-input"
                                              {...previewTargetAttributes('.ab-file-input', 'File input')}
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="ab-question-label text-xs font-medium">Special Instructions</label>
                                          <textarea
                                            className="ab-input ab-textarea"
                                            defaultValue="Please avoid citrus products in the kitchen."
                                            {...previewTargetAttributes('.ab-textarea', 'Textarea')}
                                          />
                                        </div>

                                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                          <input
                                            type="checkbox"
                                            className="ab-checkbox"
                                            defaultChecked
                                            {...previewTargetAttributes('.ab-checkbox', 'Checkbox')}
                                          />
                                          Text me updates before the crew arrives
                                        </label>

                                        <div className="space-y-2">
                                          <label className="ab-question-label text-xs font-medium">Approximate Square Footage</label>
                                          <input
                                            type="range"
                                            className="ab-slider"
                                            defaultValue={45}
                                            {...previewTargetAttributes('.ab-slider', 'Slider')}
                                          />
                                          <div className="flex items-center justify-between text-xs">
                                            <span
                                              className="ab-slider-min"
                                              {...previewTargetAttributes('.ab-slider-min', 'Slider minimum label')}
                                            >
                                              500
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <span
                                                className="ab-slider-value"
                                                {...previewTargetAttributes('.ab-slider-value', 'Slider value')}
                                              >
                                                2,100
                                              </span>
                                              <span
                                                className="ab-slider-unit"
                                                {...previewTargetAttributes('.ab-slider-unit', 'Slider unit')}
                                              >
                                                sq ft
                                              </span>
                                            </span>
                                            <span
                                              className="ab-slider-max"
                                              {...previewTargetAttributes('.ab-slider-max', 'Slider maximum label')}
                                            >
                                              5,000
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="preview-stage">
                                      <p className="preview-stage-title">Stage 3 · Multiple Choice</p>
                                      <div
                                        className="ab-question-card space-y-3"
                                        {...previewTargetAttributes('.ab-question-card', 'Question card')}
                                      >
                                        <label className="ab-question-label text-xs font-medium">Choose Add-On Services</label>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                          <button
                                            type="button"
                                            className="ab-multiple-choice ab-multichoice-card selected"
                                            {...previewTargetAttributes('.ab-multiple-choice', 'Multiple choice card')}
                                          >
                                            Inside Fridge Cleaning
                                          </button>
                                          <button
                                            type="button"
                                            className="ab-multiple-choice ab-multichoice-card"
                                            {...previewTargetAttributes('.ab-multichoice-card', 'Multiple choice card (alt selector)')}
                                          >
                                            Garage Sweep + Organize
                                          </button>
                                          <button
                                            type="button"
                                            className="ab-multiple-choice ab-multichoice-card"
                                            {...previewTargetAttributes('.ab-multiple-choice', 'Multiple choice card')}
                                          >
                                            Pet Hair Extra Pass
                                          </button>
                                          <button
                                            type="button"
                                            className="ab-multiple-choice ab-multichoice-card"
                                            {...previewTargetAttributes('.ab-multichoice-card', 'Multiple choice card (alt selector)')}
                                          >
                                            Eco Product Upgrade
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="preview-stage">
                                      <p className="preview-stage-title">Stage 4 · Pricing + Summary</p>
                                      <div
                                        className="ab-pricing-card space-y-3"
                                        {...previewTargetAttributes('.ab-pricing-card', 'Pricing card')}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="space-y-1">
                                            <p
                                              className="ab-pricing-card-icon text-xs font-semibold"
                                              {...previewTargetAttributes('.ab-pricing-card-icon', 'Pricing icon')}
                                            >
                                              Premium Tier
                                            </p>
                                            <h4
                                              className="ab-pricing-card-title text-base font-semibold"
                                              {...previewTargetAttributes('.ab-pricing-card-title', 'Pricing title')}
                                            >
                                              Whole Home Detail
                                            </h4>
                                            <p
                                              className="ab-pricing-card-description text-sm"
                                              {...previewTargetAttributes('.ab-pricing-card-description', 'Pricing description')}
                                            >
                                              4 bedrooms · 3 bathrooms · 2,100 sq ft
                                            </p>
                                          </div>
                                          <span
                                            className="ab-pricing-card-price"
                                            {...previewTargetAttributes('.ab-pricing-card-price', 'Pricing badge')}
                                          >
                                            $499
                                          </span>
                                        </div>

                                        <ul className="space-y-1 text-sm">
                                          <li className="flex items-center gap-2">
                                            <span
                                              className="ab-pricing-card-bullet-icon"
                                              {...previewTargetAttributes('.ab-pricing-card-bullet-icon', 'Pricing bullet icon')}
                                            >
                                              •
                                            </span>
                                            <span
                                              className="ab-pricing-card-bullet-text"
                                              {...previewTargetAttributes('.ab-pricing-card-bullet-text', 'Pricing bullet text')}
                                            >
                                              HEPA vacuum + allergen wipe down
                                            </span>
                                          </li>
                                          <li className="flex items-center gap-2">
                                            <span className="ab-pricing-card-bullet-icon">•</span>
                                            <span className="ab-pricing-card-bullet-text">Kitchen appliance detail</span>
                                          </li>
                                          <li className="flex items-center gap-2">
                                            <span className="ab-pricing-card-bullet-icon">•</span>
                                            <span className="ab-pricing-card-bullet-text">Bathroom polish + sanitizing</span>
                                          </li>
                                        </ul>
                                      </div>

                                      <div
                                        className="ab-discount-section mt-3 space-y-2"
                                        {...previewTargetAttributes('.ab-discount-section', 'Discount section')}
                                      >
                                        <p
                                          className="ab-discount-title text-sm font-semibold"
                                          {...previewTargetAttributes('.ab-discount-title', 'Discount title')}
                                        >
                                          Discounts Available
                                        </p>
                                        <p
                                          className="ab-discount-subtitle text-xs"
                                          {...previewTargetAttributes('.ab-discount-subtitle', 'Discount subtitle')}
                                        >
                                          Combine one service discount with one loyalty discount.
                                        </p>
                                        <div
                                          className="ab-discount-grid"
                                          {...previewTargetAttributes('.ab-discount-grid', 'Discount grid')}
                                        >
                                          <div
                                            className="ab-discount-card selected space-y-1"
                                            {...previewTargetAttributes('.ab-discount-card', 'Discount card')}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span
                                                className="ab-discount-name text-xs font-semibold"
                                                {...previewTargetAttributes('.ab-discount-name', 'Discount name')}
                                              >
                                                New Customer
                                              </span>
                                              <span
                                                className="ab-discount-percent text-xs font-semibold"
                                                {...previewTargetAttributes('.ab-discount-percent', 'Discount percent')}
                                              >
                                                -10%
                                              </span>
                                            </div>
                                            <p
                                              className="ab-discount-description text-xs"
                                              {...previewTargetAttributes('.ab-discount-description', 'Discount description')}
                                            >
                                              First booking bonus.
                                            </p>
                                            <span
                                              className="ab-discount-applied"
                                              {...previewTargetAttributes('.ab-discount-applied', 'Discount applied badge')}
                                            >
                                              Applied
                                            </span>
                                          </div>

                                          <div className="ab-discount-card space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="ab-discount-name text-xs font-semibold">Quarterly Plan</span>
                                              <span className="ab-discount-percent text-xs font-semibold">-7%</span>
                                            </div>
                                            <p className="ab-discount-description text-xs">Commit to every 90 days.</p>
                                          </div>
                                        </div>

                                        <div
                                          className="ab-discount-savings space-y-1"
                                          {...previewTargetAttributes('.ab-discount-savings', 'Discount savings')}
                                        >
                                          <p
                                            className="ab-discount-savings-title text-xs font-semibold"
                                            {...previewTargetAttributes('.ab-discount-savings-title', 'Discount savings title')}
                                          >
                                            Savings Breakdown
                                          </p>
                                          <div
                                            className="ab-discount-savings-row text-xs"
                                            {...previewTargetAttributes('.ab-discount-savings-row', 'Discount savings row')}
                                          >
                                            <span>Base quote</span>
                                            <span>$553</span>
                                          </div>
                                          <div
                                            className="ab-discount-savings-total text-xs"
                                            {...previewTargetAttributes('.ab-discount-savings-total', 'Discount savings total')}
                                          >
                                            <span>Total saved</span>
                                            <span>$54</span>
                                          </div>
                                        </div>

                                        <div
                                          className="ab-discount-line text-xs"
                                          {...previewTargetAttributes('.ab-discount-line', 'Discount line item')}
                                        >
                                          <span
                                            className="ab-discount-line-label"
                                            {...previewTargetAttributes('.ab-discount-line-label', 'Discount line label')}
                                          >
                                            Applied promo
                                          </span>
                                          <span
                                            className="ab-discount-line-value"
                                            {...previewTargetAttributes('.ab-discount-line-value', 'Discount line value')}
                                          >
                                            -$54
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        className="ab-customer-summary mt-3 space-y-1 text-xs"
                                        {...previewTargetAttributes('.ab-customer-summary', 'Customer summary')}
                                      >
                                        <p
                                          className="ab-customer-summary-title font-semibold"
                                          {...previewTargetAttributes('.ab-customer-summary-title', 'Customer summary title')}
                                        >
                                          Customer Summary
                                        </p>
                                        <div
                                          className="ab-customer-summary-line"
                                          {...previewTargetAttributes('.ab-customer-summary-line', 'Customer summary line')}
                                        >
                                          <span>Service</span>
                                          <span>Whole Home Detail</span>
                                        </div>
                                        <div className="ab-customer-summary-line">
                                          <span>Address</span>
                                          <span>1455 Sunset Ave</span>
                                        </div>
                                      </div>

                                      <div
                                        className="ab-pricing-disclaimer mt-3"
                                        {...previewTargetAttributes('.ab-pricing-disclaimer', 'Pricing disclaimer')}
                                      >
                                        <p
                                          className="ab-pricing-disclaimer-label text-xs font-semibold"
                                          {...previewTargetAttributes('.ab-pricing-disclaimer-label', 'Pricing disclaimer label')}
                                        >
                                          Disclaimer
                                        </p>
                                        <p
                                          className="ab-pricing-disclaimer-text text-xs"
                                          {...previewTargetAttributes('.ab-pricing-disclaimer-text', 'Pricing disclaimer text')}
                                        >
                                          Final pricing is confirmed after an on-site review.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="preview-stage">
                                      <p className="preview-stage-title">Stage 5 · Booking + Final CTA</p>
                                      <div className="ab-question-card space-y-3">
                                        <div className="flex flex-wrap gap-2 text-[11px]">
                                          <span
                                            className="ab-calendar-nav inline-flex rounded-full border border-slate-300 px-2 py-0.5"
                                            {...previewTargetAttributes('.ab-calendar-nav', 'Calendar navigation base class')}
                                          >
                                            .ab-calendar-nav
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <button
                                            type="button"
                                            className="ab-calendar-nav ab-calendar-nav-prev text-xs"
                                            {...previewTargetAttributes('.ab-calendar-nav-prev', 'Calendar previous button')}
                                          >
                                            Prev
                                          </button>
                                          <p
                                            className="ab-calendar-month-title text-sm"
                                            {...previewTargetAttributes('.ab-calendar-month-title', 'Calendar month title')}
                                          >
                                            March 2026
                                          </p>
                                          <button
                                            type="button"
                                            className="ab-calendar-nav ab-calendar-nav-next text-xs"
                                            {...previewTargetAttributes('.ab-calendar-nav-next', 'Calendar next button')}
                                          >
                                            Next
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                            <span
                                              key={day}
                                              className="ab-calendar-day-header"
                                              {...previewTargetAttributes('.ab-calendar-day-header', 'Calendar day header')}
                                            >
                                              {day}
                                            </span>
                                          ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 text-xs">
                                          {['', '', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((value, index) => (
                                            <button
                                              key={`${value}-${index}`}
                                              type="button"
                                              className={`ab-calendar-date ${value === '10' ? 'selected' : ''} ${value === '8' ? 'disabled' : ''}`}
                                              {...previewTargetAttributes('.ab-calendar-date', 'Calendar date button')}
                                            >
                                              {value || ' '}
                                            </button>
                                          ))}
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-3">
                                          <button
                                            type="button"
                                            className="ab-time-slot selected text-xs"
                                            {...previewTargetAttributes('.ab-time-slot', 'Time slot')}
                                          >
                                            9:00 AM
                                          </button>
                                          <button
                                            type="button"
                                            className="ab-time-slot text-xs"
                                            {...previewTargetAttributes('.ab-time-slot', 'Time slot')}
                                          >
                                            11:30 AM
                                          </button>
                                          <button
                                            type="button"
                                            className="ab-time-slot disabled text-xs"
                                            {...previewTargetAttributes('.ab-time-slot', 'Time slot')}
                                          >
                                            2:00 PM (Booked)
                                          </button>
                                        </div>
                                      </div>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          className="ab-button ab-button-secondary"
                                          {...previewTargetAttributes('.ab-button', 'Button base class')}
                                        >
                                          Back
                                        </button>
                                        <button
                                          type="button"
                                          className="ab-button ab-button-primary"
                                          {...previewTargetAttributes('.ab-button-primary', 'Primary button')}
                                        >
                                          Book My Service
                                        </button>
                                      </div>

                                      <p className="ab-error mt-2" {...previewTargetAttributes('.ab-error', 'Error message')}>
                                        Please choose an available time slot.
                                      </p>

                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <span
                                          className="selected inline-flex rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"
                                          {...previewTargetAttributes('.selected', 'Selected state class')}
                                        >
                                          .selected
                                        </span>
                                        <span
                                          className="disabled inline-flex rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"
                                          {...previewTargetAttributes('.disabled', 'Disabled state class')}
                                        >
                                          .disabled
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {hoveredPreviewTarget && (
                                  <div className="pointer-events-none absolute bottom-3 right-3 z-20 max-w-[250px] rounded-xl border border-blue-200 dark:border-blue-800 bg-white/95 dark:bg-slate-900/95 px-3 py-2 shadow-lg">
                                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Hover target</p>
                                    <p className="mt-1 font-mono text-[11px] text-blue-700 dark:text-blue-300">{hoveredPreviewTarget.selector}</p>
                                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                      Click this element to set your AI edit target.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/20 p-3 space-y-3">
                              <div className="flex flex-col gap-1">
                                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Element-Specific AI Edit</p>
                                {selectedPreviewTarget ? (
                                  <p className="text-xs text-blue-800 dark:text-blue-200">
                                    Editing <span className="font-mono">{selectedPreviewTarget.selector}</span> ({selectedPreviewTarget.label})
                                  </p>
                                ) : (
                                  <p className="text-xs text-blue-800 dark:text-blue-200">
                                    Select a preview element first, then describe the style change in plain language.
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                  value={targetedEditPrompt}
                                  onChange={(event) => setTargetedEditPrompt(event.target.value)}
                                  disabled={!selectedPreviewTarget || isGeneratingCSS}
                                  placeholder={
                                    selectedPreviewTarget
                                      ? `e.g. Make ${selectedPreviewTarget.label.toLowerCase()} rounded with a softer shadow`
                                      : "Click any preview element to start"
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      event.preventDefault();
                                      handleTargetedEdit();
                                    }
                                  }}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    disabled={!selectedPreviewTarget || !targetedEditPrompt.trim() || isGeneratingCSS}
                                    onClick={handleTargetedEdit}
                                  >
                                    {isGeneratingCSS ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Applying...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Apply Edit
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={!selectedPreviewTarget}
                                    onClick={() => {
                                      setSelectedPreviewTarget(null);
                                      setTargetedEditPrompt('');
                                    }}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* CSS Class Reference & Examples */}
                      <div className="space-y-3">
                        {/* Class Reference */}
                        <details className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <summary className="text-xs font-semibold cursor-pointer text-blue-900 dark:text-blue-100">
                            📋 Available CSS Classes (click to expand)
                          </summary>
                          <div className="mt-3 space-y-3 text-xs font-mono">
                            {/* Form & Container */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Form & Container:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-form-container</span> - Form wrapper</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-question-card</span> - Question cards</div>
                              </div>
                            </div>
                            {/* Buttons */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Buttons:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-button</span> - All buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-button-primary</span> - Primary buttons</div>
                              </div>
                            </div>
                            {/* Input Fields */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Input Fields:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-input</span> - All inputs (base)</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-number-input</span> - Number inputs</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-text-input</span> - Text inputs</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-textarea</span> - Textareas</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-select</span> - Dropdown triggers</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-select-content</span> - Dropdown menu</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-checkbox</span> - Checkboxes</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-address-input</span> - Address inputs</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-file-input</span> - File uploads</div>
                              </div>
                            </div>
                            {/* Slider */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Slider:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider</span> - Range sliders</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider-value</span> - Slider value</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider-unit</span> - Slider unit</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider-min</span> - Min label</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-slider-max</span> - Max label</div>
                              </div>
                            </div>
                            {/* Labels */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Labels:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-label</span> - All labels</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-question-label</span> - Question labels</div>
                              </div>
                            </div>
                            {/* Service Cards */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Service Cards:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-service-card</span> - Service cards</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-service-title</span> - Service titles</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-service-accordion</span> - Accordion headers</div>
                              </div>
                            </div>
                            {/* Multiple Choice */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Multiple Choice:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-multiple-choice</span> - Choice cards</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-multichoice-card</span> - Choice cards (alt)</div>
                              </div>
                            </div>
                            {/* Pricing Cards */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Pricing Cards:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card</span> - Pricing cards</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-price</span> - Price badge</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-icon</span> - Service icon</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-title</span> - Service title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-description</span> - Description</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-bullet-icon</span> - Bullet icons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-card-bullet-text</span> - Bullet text</div>
                              </div>
                            </div>
                            {/* Discounts & Messages */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Discounts & Messages:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-section</span> - Discount section wrapper</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-title</span> - Discount section title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-subtitle</span> - Discount helper text</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-grid</span> - Discount grid</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-card</span> - Discount card</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-name</span> - Discount name</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-description</span> - Discount description</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-percent</span> - Discount percent</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-applied</span> - Applied badge</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-savings</span> - Savings panel</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-savings-title</span> - Savings title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-savings-row</span> - Savings row</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-savings-total</span> - Savings total</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-line</span> - Discount line item</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-line-label</span> - Line label</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-discount-line-value</span> - Line value</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-disclaimer</span> - Pricing disclaimer</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-disclaimer-text</span> - Disclaimer text</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-disclaimer-label</span> - Disclaimer label</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-customer-summary</span> - Customer summary</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-customer-summary-title</span> - Customer summary title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-customer-summary-line</span> - Customer summary line</div>
                              </div>
                            </div>
                            {/* Calendar */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Booking Calendar:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-nav</span> - Nav buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-nav-prev</span> - Prev button</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-nav-next</span> - Next button</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-month-title</span> - Month title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-day-header</span> - Day headers</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-date</span> - Date buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-time-slot</span> - Time slots</div>
                              </div>
                            </div>
                            {/* State Classes */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">State & Utility:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.selected</span> - Selected state</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.disabled</span> - Disabled state</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-error</span> - Error messages</div>
                              </div>
                            </div>
                          </div>
                        </details>

                        {/* CSS Variables Info */}
                        <details className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                          <summary className="text-xs font-semibold cursor-pointer text-green-900 dark:text-green-100">
                            🎨 CSS Variables (click to expand)
                          </summary>
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-green-800 dark:text-green-200">Your design settings are available as CSS variables. Use them or override with your own values:</p>
                            <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                              <div><span className="text-green-600 dark:text-green-400">--ab-primary-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-button-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-button-text-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-button-hover-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-button-border-radius</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-input-border-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-input-border-radius</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-border-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-border-radius</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-active-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-selector-hover-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-multiple-choice-border-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-multiple-choice-active-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-multiple-choice-hover-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-label-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-label-font-family</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-label-font-weight</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-label-font-size</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-title-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-title-font-family</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-title-font-weight</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-title-font-size</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-bg</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-border-radius</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-border-color</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-border-width</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-shadow</span></div>
                              <div><span className="text-green-600 dark:text-green-400">--ab-pricing-card-padding</span></div>
                            </div>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-2 italic">✨ Custom CSS overrides inline styles - full control!</p>
                          </div>
                        </details>

                        {/* Examples Dropdown */}
                        <details className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <summary className="text-xs font-semibold cursor-pointer text-purple-900 dark:text-purple-100">
                            📚 Example CSS Patterns (click to expand)
                          </summary>
                          <div className="mt-3 space-y-3 text-xs">
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Hover Effects on Service Cards:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`.ab-service-card:hover {\n  transform: scale(1.05);\n  box-shadow: 0 10px 20px rgba(0,0,0,0.15);\n  border-color: #3B82F6;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Style Selected Service Cards:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`.ab-service-card.selected {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  border: 3px solid #764ba2;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Gradient Buttons:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`.ab-button-primary {\n  background: linear-gradient(to right, #3B82F6, #8B5CF6);\n  border: none;\n  transition: all 0.3s ease;\n}\n\n.ab-button-primary:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Custom Input Focus States:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`.ab-input:focus {\n  border-color: #8B5CF6;\n  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);\n  outline: none;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Customize Range Sliders:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`/* Style slider track and thumb */\n.ab-slider [role=\"slider\"] {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  width: 20px;\n  height: 20px;\n  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.5);\n}\n\n/* Style slider value display */\n.ab-slider-value {\n  font-weight: 700;\n  color: #667eea;\n  font-size: 1.25rem;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Customize Question Labels & Service Titles:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`/* Style question labels */\n.ab-question-label {\n  font-family: 'Georgia', serif;\n  font-weight: 600;\n  font-size: 1rem;\n  color: #1E40AF;\n}\n\n/* Style service titles */\n.ab-service-title {\n  font-family: 'Roboto', sans-serif;\n  font-weight: 700;\n  color: #DC2626;\n  text-transform: uppercase;\n}`}</code></pre>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Customize Pricing Cards:</p>
                              <pre className="bg-white dark:bg-gray-900 p-2 rounded border border-purple-200 dark:border-purple-800 overflow-x-auto text-gray-900 dark:text-gray-100"><code>{`/* Style pricing card wrapper */\n.ab-pricing-card {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  border: 2px solid #764ba2;\n  border-radius: 20px;\n  box-shadow: 0 25px 50px rgba(118, 75, 162, 0.3);\n}\n\n/* Style price badge */\n.ab-pricing-card-price {\n  background: #F59E0B !important;\n  color: white !important;\n  font-size: 1.5rem;\n}\n\n/* Style service title on card */\n.ab-pricing-card-title {\n  font-family: 'Georgia', serif;\n  color: white;\n  text-shadow: 0 2px 4px rgba(0,0,0,0.2);\n}\n\n/* Style bullet icons */\n.ab-pricing-card-bullet-icon {\n  background: #10B981 !important;\n}`}</code></pre>
                            </div>
                          </div>
                        </details>
                      </div>

                      {/* AI CSS Generation */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">AI CSS Generator</h4>
                          <Badge variant="secondary" className="text-xs">New ✨</Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          Describe the design style you want and AI will generate custom CSS for you
                        </p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Neumorphism, Glassmorphism, Dark mode with neon accents..."
                            className="text-sm flex-1"
                            data-testid="input-ai-css-description"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget as HTMLInputElement;
                                if (input.value.trim()) {
                                  handleGenerateCSS(input.value);
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector('[data-testid="input-ai-css-description"]') as HTMLInputElement;
                              if (input?.value.trim()) {
                                handleGenerateCSS(input.value);
                              }
                            }}
                            disabled={isGeneratingCSS}
                            data-testid="button-generate-css"
                          >
                            {isGeneratingCSS ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                        {aiCSSError && (
                          <p className="text-xs text-red-600 mt-2">{aiCSSError}</p>
                        )}
                      </div>

                      {/* CSS Textarea */}
                      <div>
                        <Label className="text-sm font-medium">Custom CSS Code</Label>
                        <div className="css-editor-wrapper mt-2">
                          <pre
                            ref={cssHighlightRef}
                            className="css-editor-highlight"
                            aria-hidden="true"
                            dangerouslySetInnerHTML={{
                              __html: highlightedCSS || "",
                            }}
                          />
                          <Textarea
                            ref={cssInputRef}
                            value={customCSS}
                            onChange={(e) => handleCustomCSSChange(e.target.value)}
                            onScroll={(e) => {
                              if (cssHighlightRef.current) {
                                cssHighlightRef.current.scrollTop = e.currentTarget.scrollTop;
                                cssHighlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
                              }
                            }}
                            className="css-editor-input font-mono text-xs min-h-[200px]"
                            placeholder={`/* Add your custom CSS here. Examples:\n\n/* Style service cards */\n.ab-service-card {\n  border: 2px solid #3B82F6;\n  border-radius: 12px;\n}\n\n.ab-service-card:hover {\n  transform: scale(1.05);\n  box-shadow: 0 10px 20px rgba(0,0,0,0.15);\n}\n\n/* Style buttons */\n.ab-button-primary {\n  background: linear-gradient(to right, #3B82F6, #8B5CF6);\n  border: none;\n}\n\n.ab-button-primary:hover {\n  transform: translateY(-2px);\n}\n\n/* Style inputs */\n.ab-input:focus {\n  border-color: #8B5CF6;\n  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);\n}\n*/`}
                          />
                        </div>
                        {customCSSError && (
                          <p className="text-xs text-red-600 mt-1">{customCSSError}</p>
                        )}

                        {/* AI Edit CSS Feature */}
                        {customCSS && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-blue-600" />
                              <h5 className="text-xs font-semibold text-blue-900">AI Edit CSS</h5>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Describe changes you want to make to your existing CSS
                            </p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="e.g., Make buttons bigger, Change cards to red, Add glow effect..."
                                className="text-sm flex-1"
                                data-testid="input-ai-css-edit"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.currentTarget as HTMLInputElement;
                                    if (input.value.trim()) {
                                      handleEditCSS(input.value);
                                    }
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const input = document.querySelector('[data-testid="input-ai-css-edit"]') as HTMLInputElement;
                                  if (input?.value.trim()) {
                                    handleEditCSS(input.value);
                                  }
                                }}
                                disabled={isGeneratingCSS}
                                data-testid="button-edit-css"
                              >
                                {isGeneratingCSS ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Editing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Edit
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          ⚠️ Custom CSS will override editor settings. If errors occur, styles will revert to editor settings.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
