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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    // Keep indentation/newlines untouched so the highlight layer stays line-aligned with textarea text.
    { regex: /(^|\n)([ \t]*)([a-zA-Z-]+)(?=\s*:)/g, className: "css-token-property" },
    { regex: /(^|\n)([ \t]*)([^{\n]+)(?=\s*\{)/g, className: "css-token-selector" },
  ];

  let highlighted = escaped;
  patterns.forEach(({ regex, className }) => {
    highlighted = highlighted.replace(regex, (match, prefix, indentation, token) => {
      if (className === "css-token-property" && typeof prefix === "string" && typeof token === "string") {
        return `${prefix}${indentation || ""}<span class="${className}">${token}</span>`;
      }
      if (className === "css-token-selector" && typeof prefix === "string" && typeof token === "string") {
        return `${prefix}${indentation || ""}<span class="${className}">${token}</span>`;
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

type CssThemePreset = {
  id: string;
  name: string;
  description: string;
  css: string;
  preview: {
    canvas: string;
    surface: string;
    border: string;
    text: string;
    accent: string;
    button: string;
  };
};

type CssThemeTokens = {
  containerBg: string;
  surfaceBg: string;
  border: string;
  text: string;
  surfaceText: string;
  mutedText: string;
  selectedText: string;
  primary: string;
  primaryText: string;
  primaryHover: string;
  accent: string;
  accentSoft: string;
  selectedBg: string;
  selectedBorder: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  priceBg: string;
  priceText: string;
  error: string;
};

const buildThemeCss = (t: CssThemeTokens) => `
.ab-form-container {
  background: ${t.containerBg};
  border: 1px solid ${t.border};
  color: ${t.text};
  border-radius: 18px;
  box-shadow: 0 20px 38px rgba(15, 23, 42, 0.14);
}

.ab-question-card {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.ab-calendar-container {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.ab-button,
.ab-button-primary {
  background: ${t.primary};
  color: ${t.primaryText};
  border: 1px solid ${t.primary};
  border-radius: 12px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.ab-button:hover,
.ab-button-primary:hover {
  background: ${t.primaryHover};
  border-color: ${t.primaryHover};
  transform: translateY(-1px);
}

.ab-input,
.ab-number-input,
.ab-text-input,
.ab-textarea,
.ab-select,
.ab-address-input,
.ab-file-input {
  background: ${t.inputBg};
  color: ${t.inputText};
  border: 1px solid ${t.inputBorder};
  border-radius: 10px;
  caret-color: ${t.inputText};
}

.ab-select-content {
  background: ${t.inputBg};
  border: 1px solid ${t.inputBorder};
  color: ${t.inputText};
}

.ab-input::placeholder,
.ab-number-input::placeholder,
.ab-text-input::placeholder,
.ab-textarea::placeholder,
.ab-address-input::placeholder {
  color: ${t.inputPlaceholder};
  opacity: 1;
}

.ab-checkbox {
  accent-color: ${t.primary};
}

.ab-slider {
  accent-color: ${t.primary};
}

.ab-slider-value,
.ab-slider-unit {
  color: ${t.primary};
  font-weight: 700;
}

.ab-slider-min,
.ab-slider-max {
  color: ${t.mutedText};
}

.ab-label,
.ab-question-label {
  color: ${t.text};
  font-weight: 600;
}

.ab-form-title {
  color: ${t.surfaceText};
  font-weight: 800;
}

.ab-form-subtitle {
  color: ${t.mutedText};
}

.ab-progress-label {
  color: ${t.text};
}

.ab-progress-percentage {
  color: ${t.primary};
  font-weight: 700;
}

.ab-progress-track {
  background: ${t.border};
  border-radius: 999px;
  overflow: hidden;
}

.ab-progress-fill {
  background: ${t.primary};
}

.ab-address-nav-button,
.ab-address-back-button,
.ab-address-skip-button {
  color: ${t.primary};
}

.ab-address-nav-button:hover,
.ab-address-back-button:hover,
.ab-address-skip-button:hover {
  color: ${t.primaryHover};
}

.ab-address-input-label {
  color: ${t.primary};
  font-weight: 600;
}

.ab-service-card {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  border-radius: 14px;
  color: ${t.surfaceText};
}

.ab-service-title {
  color: ${t.surfaceText};
  font-weight: 800;
}

.ab-service-accordion {
  border: 1px solid ${t.border};
  background: ${t.surfaceBg};
  border-radius: 12px;
}

.ab-service-accordion-text {
  color: ${t.surfaceText};
}

.ab-multiple-choice,
.ab-multichoice-card {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  color: ${t.surfaceText};
}

.ab-multiple-choice-label {
  color: ${t.surfaceText};
}

.ab-pricing-card {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  border-radius: 16px;
  color: ${t.surfaceText};
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.12);
}

.ab-pricing-card-price {
  background: ${t.priceBg};
  color: ${t.priceText};
  border-radius: 999px;
  font-weight: 800;
}

.ab-pricing-card-icon {
  background: ${t.accentSoft};
  border: 1px solid ${t.selectedBorder};
  color: ${t.primary};
}

.ab-pricing-card-title,
.ab-pricing-card-description,
.ab-pricing-card-bullet-text {
  color: ${t.surfaceText};
}

.ab-pricing-card-bullet-icon {
  background: ${t.accent};
  color: ${t.primaryText};
}

.ab-pricing-section-title,
.ab-pricing-breakdown-title,
.ab-pricing-line-item-name,
.ab-pricing-line-item-value,
.ab-pricing-subtotal-label,
.ab-pricing-subtotal-value,
.ab-pricing-tax-label,
.ab-pricing-tax-value,
.ab-pricing-total-label {
  color: ${t.surfaceText};
}

.ab-pricing-cart-status {
  color: ${t.mutedText};
}

.ab-pricing-total-value {
  color: ${t.primary};
}

.ab-upsell-section,
.ab-discount-section,
.ab-pricing-disclaimer,
.ab-customer-summary,
.ab-upsell-selected-summary,
.ab-discount-savings {
  background: ${t.accentSoft};
  border: 1px solid ${t.selectedBorder};
  border-radius: 12px;
}

.ab-upsell-heading,
.ab-upsell-title,
.ab-discount-title,
.ab-customer-summary-title,
.ab-pricing-disclaimer-label,
.ab-discount-savings-title {
  color: ${t.surfaceText};
  font-weight: 700;
}

.ab-upsell-subtitle,
.ab-upsell-description,
.ab-upsell-tooltip,
.ab-discount-subtitle,
.ab-discount-description,
.ab-pricing-disclaimer-text,
.ab-customer-summary-line,
.ab-discount-line-label,
.ab-discount-line-value,
.ab-discount-savings-row {
  color: ${t.mutedText};
}

.ab-upsell-grid,
.ab-discount-grid {
  gap: 10px;
}

.ab-upsell-card,
.ab-discount-card {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  border-radius: 12px;
}

.ab-upsell-card-selected,
.ab-discount-card.selected,
.ab-multiple-choice.selected,
.ab-service-card.selected {
  background: ${t.selectedBg};
  border-color: ${t.selectedBorder};
  box-shadow: 0 0 0 2px ${t.selectedBorder}33;
}

.ab-upsell-price,
.ab-discount-percent,
.ab-discount-savings-total,
.ab-upsell-selected-total {
  color: ${t.primary};
  font-weight: 700;
}

.ab-upsell-popular-badge,
.ab-discount-applied {
  background: ${t.selectedBg};
  color: ${t.primary};
  border: 1px solid ${t.selectedBorder};
}

.ab-discount-name {
  color: ${t.surfaceText};
  font-weight: 600;
}

.ab-discount-line {
  border-top: 1px dashed ${t.border};
}

.ab-calendar-nav,
.ab-calendar-nav-prev,
.ab-calendar-nav-next {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  color: ${t.surfaceText};
}

.ab-calendar-month-title,
.ab-calendar-day-header {
  color: ${t.surfaceText};
}

.ab-calendar-date {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  color: ${t.surfaceText};
}

.ab-calendar-date.ab-calendar-date-available {
  background: ${t.accentSoft};
  border-color: ${t.selectedBorder};
  box-shadow: inset 0 0 0 1px ${t.selectedBorder}44;
}

.ab-calendar-date.ab-calendar-date-available:hover {
  border-color: ${t.primary};
  background: ${t.selectedBg};
  transform: translateY(-1px);
}

.ab-calendar-date.ab-calendar-date-unavailable,
.ab-calendar-date.ab-calendar-date-past,
.ab-calendar-date:disabled {
  background: ${t.inputBg};
  border: 1px dashed ${t.border};
  color: ${t.mutedText};
  opacity: 0.58;
  filter: grayscale(0.22);
  cursor: not-allowed;
}

.ab-calendar-date .ab-calendar-date-meta {
  color: ${t.mutedText};
}

.ab-time-slot {
  background: ${t.surfaceBg};
  border: 1px solid ${t.border};
  color: ${t.surfaceText};
}

.ab-time-slot.ab-time-slot-available:hover {
  border-color: ${t.primary};
  background: ${t.selectedBg};
}

.ab-calendar-date.selected,
.ab-time-slot.selected {
  background: ${t.primary};
  border-color: ${t.primary};
  color: ${t.primaryText};
  box-shadow: 0 0 0 2px ${t.primary}33;
}

.ab-time-slot .ab-time-slot-meta {
  color: ${t.mutedText};
}

.ab-time-slot:disabled,
.ab-time-slot.disabled {
  background: ${t.inputBg};
  border: 1px dashed ${t.border};
  color: ${t.mutedText};
}

.ab-calendar-legend-label {
  color: ${t.mutedText};
}

.ab-calendar-legend-swatch-available {
  background: ${t.accentSoft};
  border-color: ${t.selectedBorder};
}

.ab-calendar-legend-swatch-selected {
  background: ${t.primary};
  border-color: ${t.primary};
}

.ab-calendar-legend-swatch-unavailable {
  background: ${t.inputBg};
  border-color: ${t.border};
}

.ab-calendar-date.selected .ab-calendar-date-meta,
.ab-time-slot.selected .ab-time-slot-meta {
  color: ${t.primaryText};
  opacity: 0.9;
}

.selected {
  border-color: ${t.selectedBorder} !important;
}

.disabled {
  opacity: 0.55;
  filter: grayscale(0.15);
  pointer-events: none;
}

.ab-error {
  color: ${t.error};
  font-weight: 600;
}

.ab-service-card.selected,
.ab-multiple-choice.selected,
.ab-upsell-card-selected,
.ab-discount-card.selected,
.selected {
  color: ${t.selectedText} !important;
}

.ab-service-card.selected .ab-service-title,
.ab-multiple-choice.selected .ab-multiple-choice-label,
.ab-upsell-card-selected .ab-upsell-title,
.ab-upsell-card-selected .ab-upsell-description,
.ab-discount-card.selected .ab-discount-name,
.ab-discount-card.selected .ab-discount-description {
  color: ${t.selectedText} !important;
}
`;

const CSS_THEME_PRESETS: CssThemePreset[] = [
  {
    id: "clean-precision",
    name: "Clean Precision",
    description: "Crisp, neutral layout with subtle depth and sharp contrast.",
    preview: {
      canvas: "#f8fafc",
      surface: "#ffffff",
      border: "#dbe3ef",
      text: "#0f172a",
      accent: "#111827",
      button: "linear-gradient(135deg, #0f172a 0%, #111827 100%)",
    },
    css: buildThemeCss({
      containerBg: "#ffffff",
      surfaceBg: "#ffffff",
      border: "#dbe3ef",
      text: "#0f172a",
      surfaceText: "#0f172a",
      mutedText: "#475569",
      selectedText: "#0f172a",
      primary: "#0f172a",
      primaryText: "#f8fafc",
      primaryHover: "#111827",
      accent: "#111827",
      accentSoft: "#f1f5f9",
      selectedBg: "#eef2ff",
      selectedBorder: "#334155",
      inputBg: "#ffffff",
      inputBorder: "#cbd5e1",
      inputText: "#0f172a",
      inputPlaceholder: "#64748b",
      priceBg: "#e2e8f0",
      priceText: "#0f172a",
      error: "#b91c1c",
    }),
  },
  {
    id: "sunset-card",
    name: "Sunset Card",
    description: "Warm amber-coral gradient theme with soft rounded elements.",
    preview: {
      canvas: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
      surface: "#ffffff",
      border: "#fdba74",
      text: "#7c2d12",
      accent: "#f97316",
      button: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(180deg, #fff7ed 0%, #ffffff 48%)",
      surfaceBg: "#ffffff",
      border: "#fdba74",
      text: "#7c2d12",
      surfaceText: "#7c2d12",
      mutedText: "#9a3412",
      selectedText: "#7c2d12",
      primary: "#f97316",
      primaryText: "#ffffff",
      primaryHover: "#ea580c",
      accent: "#ef4444",
      accentSoft: "#fff1e8",
      selectedBg: "#fff1e8",
      selectedBorder: "#f97316",
      inputBg: "#ffffff",
      inputBorder: "#fdba74",
      inputText: "#7c2d12",
      inputPlaceholder: "#c2410c",
      priceBg: "#ffedd5",
      priceText: "#c2410c",
      error: "#dc2626",
    }),
  },
  {
    id: "ocean-glass",
    name: "Ocean Glass",
    description: "Cool aqua glassmorphism feel with transparent layered cards.",
    preview: {
      canvas: "linear-gradient(135deg, #cffafe 0%, #ecfdf5 100%)",
      surface: "rgba(255,255,255,0.7)",
      border: "#99f6e4",
      text: "#155e75",
      accent: "#0d9488",
      button: "linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(145deg, rgba(207, 250, 254, 0.8), rgba(236, 253, 245, 0.86))",
      surfaceBg: "rgba(255, 255, 255, 0.72)",
      border: "rgba(45, 212, 191, 0.55)",
      text: "#155e75",
      surfaceText: "#155e75",
      mutedText: "#0f766e",
      selectedText: "#134e4a",
      primary: "#0d9488",
      primaryText: "#f8fafc",
      primaryHover: "#0f766e",
      accent: "#0891b2",
      accentSoft: "rgba(207, 250, 254, 0.52)",
      selectedBg: "rgba(204, 251, 241, 0.7)",
      selectedBorder: "#0d9488",
      inputBg: "rgba(255, 255, 255, 0.9)",
      inputBorder: "rgba(45, 212, 191, 0.6)",
      inputText: "#155e75",
      inputPlaceholder: "#0f766e",
      priceBg: "rgba(186, 230, 253, 0.7)",
      priceText: "#0c4a6e",
      error: "#be123c",
    }),
  },
  {
    id: "graphite-lime",
    name: "Graphite Lime",
    description: "High-contrast dark panels with electric lime accents.",
    preview: {
      canvas: "#111827",
      surface: "#1f2937",
      border: "#374151",
      text: "#f9fafb",
      accent: "#a3e635",
      button: "linear-gradient(135deg, #a3e635 0%, #84cc16 100%)",
    },
    css: buildThemeCss({
      containerBg: "#111827",
      surfaceBg: "#1f2937",
      border: "#374151",
      text: "#f9fafb",
      surfaceText: "#f9fafb",
      mutedText: "#cbd5e1",
      selectedText: "#ecfccb",
      primary: "#a3e635",
      primaryText: "#111827",
      primaryHover: "#84cc16",
      accent: "#bef264",
      accentSoft: "#1b2a10",
      selectedBg: "#25331a",
      selectedBorder: "#a3e635",
      inputBg: "#111827",
      inputBorder: "#4b5563",
      inputText: "#f9fafb",
      inputPlaceholder: "#94a3b8",
      priceBg: "#3f6212",
      priceText: "#ecfccb",
      error: "#fda4af",
    }),
  },
  {
    id: "midnight-royal",
    name: "Midnight Royal",
    description: "Deep navy surfaces with vivid cobalt highlights and crisp text.",
    preview: {
      canvas: "linear-gradient(135deg, #0b1220 0%, #111827 100%)",
      surface: "#172033",
      border: "#334155",
      text: "#f8fafc",
      accent: "#3b82f6",
      button: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(180deg, #0b1220 0%, #111827 45%)",
      surfaceBg: "#172033",
      border: "#334155",
      text: "#f8fafc",
      surfaceText: "#f8fafc",
      mutedText: "#cbd5e1",
      selectedText: "#dbeafe",
      primary: "#3b82f6",
      primaryText: "#ffffff",
      primaryHover: "#2563eb",
      accent: "#60a5fa",
      accentSoft: "#1e2e4e",
      selectedBg: "#1e3a8a",
      selectedBorder: "#3b82f6",
      inputBg: "#0f172a",
      inputBorder: "#475569",
      inputText: "#f8fafc",
      inputPlaceholder: "#94a3b8",
      priceBg: "#1d4ed8",
      priceText: "#dbeafe",
      error: "#fda4af",
    }),
  },
  {
    id: "sandstone-sage",
    name: "Sandstone Sage",
    description: "Warm neutral cards with earthy green accents and soft contrast.",
    preview: {
      canvas: "linear-gradient(135deg, #f8f5ef 0%, #efe9dc 100%)",
      surface: "#fffdf8",
      border: "#d6c8ac",
      text: "#3f3a2d",
      accent: "#6b8f71",
      button: "linear-gradient(135deg, #6b8f71 0%, #4d6b53 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(180deg, #f8f5ef 0%, #fffdf8 48%)",
      surfaceBg: "#fffdf8",
      border: "#d6c8ac",
      text: "#3f3a2d",
      surfaceText: "#3f3a2d",
      mutedText: "#6b6351",
      selectedText: "#2f4f39",
      primary: "#6b8f71",
      primaryText: "#f8fafc",
      primaryHover: "#4d6b53",
      accent: "#5f7f66",
      accentSoft: "#edf4e8",
      selectedBg: "#edf4e8",
      selectedBorder: "#6b8f71",
      inputBg: "#ffffff",
      inputBorder: "#c7b795",
      inputText: "#3f3a2d",
      inputPlaceholder: "#8a7f67",
      priceBg: "#e8e0cf",
      priceText: "#4b5f3d",
      error: "#b91c1c",
    }),
  },
  {
    id: "aurora-mint",
    name: "Aurora Mint",
    description: "Fresh mint and sky palette with clean contrast and airy surfaces.",
    preview: {
      canvas: "linear-gradient(135deg, #ecfeff 0%, #f0fdf4 100%)",
      surface: "#ffffff",
      border: "#a7f3d0",
      text: "#134e4a",
      accent: "#0ea5a4",
      button: "linear-gradient(135deg, #0ea5a4 0%, #14b8a6 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(180deg, #ecfeff 0%, #f0fdf4 52%)",
      surfaceBg: "#ffffff",
      border: "#a7f3d0",
      text: "#134e4a",
      surfaceText: "#134e4a",
      mutedText: "#0f766e",
      selectedText: "#115e59",
      primary: "#0ea5a4",
      primaryText: "#f8fafc",
      primaryHover: "#0f766e",
      accent: "#14b8a6",
      accentSoft: "#ecfdf5",
      selectedBg: "#ccfbf1",
      selectedBorder: "#14b8a6",
      inputBg: "#ffffff",
      inputBorder: "#99f6e4",
      inputText: "#134e4a",
      inputPlaceholder: "#0f766e",
      priceBg: "#ccfbf1",
      priceText: "#115e59",
      error: "#be123c",
    }),
  },
  {
    id: "rosewood-ink",
    name: "Rosewood Ink",
    description: "Elegant deep rose accents on soft ink surfaces with warm neutrals.",
    preview: {
      canvas: "linear-gradient(135deg, #faf5ff 0%, #fff1f2 100%)",
      surface: "#ffffff",
      border: "#e9d5ff",
      text: "#3b0d2e",
      accent: "#be185d",
      button: "linear-gradient(135deg, #be185d 0%, #9d174d 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(180deg, #faf5ff 0%, #fff1f2 50%)",
      surfaceBg: "#ffffff",
      border: "#e9d5ff",
      text: "#3b0d2e",
      surfaceText: "#3b0d2e",
      mutedText: "#6b2d4b",
      selectedText: "#831843",
      primary: "#be185d",
      primaryText: "#fff7fb",
      primaryHover: "#9d174d",
      accent: "#db2777",
      accentSoft: "#fdf2f8",
      selectedBg: "#fce7f3",
      selectedBorder: "#be185d",
      inputBg: "#ffffff",
      inputBorder: "#f5d0fe",
      inputText: "#3b0d2e",
      inputPlaceholder: "#9d174d",
      priceBg: "#fce7f3",
      priceText: "#9d174d",
      error: "#b91c1c",
    }),
  },
  {
    id: "neo-brutalism",
    name: "Neo Brutalism",
    description: "Bold, high-contrast blocks with heavy borders and unapologetic color.",
    preview: {
      canvas: "#fef08a",
      surface: "#ffffff",
      border: "#111827",
      text: "#111827",
      accent: "#ff2d55",
      button: "linear-gradient(135deg, #ff2d55 0%, #ff7a00 100%)",
    },
    css: buildThemeCss({
      containerBg: "#fef08a",
      surfaceBg: "#ffffff",
      border: "#111827",
      text: "#111827",
      surfaceText: "#111827",
      mutedText: "#1f2937",
      selectedText: "#111827",
      primary: "#ff2d55",
      primaryText: "#ffffff",
      primaryHover: "#e11d48",
      accent: "#ff7a00",
      accentSoft: "#fff7ed",
      selectedBg: "#fde68a",
      selectedBorder: "#111827",
      inputBg: "#ffffff",
      inputBorder: "#111827",
      inputText: "#111827",
      inputPlaceholder: "#374151",
      priceBg: "#86efac",
      priceText: "#14532d",
      error: "#b91c1c",
    }) + `
#autobidder-form,
#autobidder-form .ab-question-card,
#autobidder-form .ab-calendar-container,
#autobidder-form .ab-pricing-card,
#autobidder-form .ab-input,
#autobidder-form .ab-select,
#autobidder-form .ab-textarea,
#autobidder-form .ab-service-card,
#autobidder-form .ab-multiple-choice,
#autobidder-form .ab-upsell-card,
#autobidder-form .ab-discount-card,
#autobidder-form .ab-button {
  border-width: 3px !important;
  border-style: solid !important;
  border-color: #111827 !important;
  box-shadow: 6px 6px 0 #111827 !important;
  border-radius: 0 !important;
}
`,
  },
  {
    id: "violet-citrus",
    name: "Violet Citrus",
    description: "Vibrant purple surfaces with energetic orange highlights and warm contrast.",
    preview: {
      canvas: "linear-gradient(135deg, #f5f3ff 0%, #ffedd5 100%)",
      surface: "#ffffff",
      border: "#ddd6fe",
      text: "#3b0764",
      accent: "#f97316",
      button: "linear-gradient(135deg, #7c3aed 0%, #f97316 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(180deg, #f5f3ff 0%, #ffedd5 58%)",
      surfaceBg: "#ffffff",
      border: "#ddd6fe",
      text: "#3b0764",
      surfaceText: "#3b0764",
      mutedText: "#6b21a8",
      selectedText: "#581c87",
      primary: "#7c3aed",
      primaryText: "#ffffff",
      primaryHover: "#6d28d9",
      accent: "#f97316",
      accentSoft: "#fff2e2",
      selectedBg: "#f3e8ff",
      selectedBorder: "#f97316",
      inputBg: "#ffffff",
      inputBorder: "#c4b5fd",
      inputText: "#3b0764",
      inputPlaceholder: "#7e22ce",
      priceBg: "#ffedd5",
      priceText: "#9a3412",
      error: "#dc2626",
    }),
  },
  {
    id: "forest-slate",
    name: "Forest Slate",
    description: "Moody slate panels grounded by deep green accents and balanced readability.",
    preview: {
      canvas: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      surface: "#1f2937",
      border: "#334155",
      text: "#e2e8f0",
      accent: "#22c55e",
      button: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(180deg, #0f172a 0%, #1e293b 50%)",
      surfaceBg: "#1f2937",
      border: "#334155",
      text: "#e2e8f0",
      surfaceText: "#e2e8f0",
      mutedText: "#94a3b8",
      selectedText: "#dcfce7",
      primary: "#16a34a",
      primaryText: "#ecfdf5",
      primaryHover: "#15803d",
      accent: "#22c55e",
      accentSoft: "#133327",
      selectedBg: "#14532d",
      selectedBorder: "#22c55e",
      inputBg: "#0f172a",
      inputBorder: "#475569",
      inputText: "#e2e8f0",
      inputPlaceholder: "#94a3b8",
      priceBg: "#14532d",
      priceText: "#dcfce7",
      error: "#fda4af",
    }),
  },
  {
    id: "frosted-glass",
    name: "Frosted Glass",
    description: "Soft translucent layers with blur, cool light, and subtle depth.",
    preview: {
      canvas: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #ede9fe 100%)",
      surface: "rgba(255,255,255,0.62)",
      border: "rgba(255,255,255,0.55)",
      text: "#0f172a",
      accent: "#2563eb",
      button: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    },
    css: buildThemeCss({
      containerBg: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #ede9fe 100%)",
      surfaceBg: "rgba(255, 255, 255, 0.62)",
      border: "rgba(255, 255, 255, 0.55)",
      text: "#0f172a",
      surfaceText: "#0f172a",
      mutedText: "#334155",
      selectedText: "#0f172a",
      primary: "#2563eb",
      primaryText: "#f8fafc",
      primaryHover: "#1d4ed8",
      accent: "#6366f1",
      accentSoft: "rgba(219, 234, 254, 0.6)",
      selectedBg: "rgba(191, 219, 254, 0.62)",
      selectedBorder: "rgba(96, 165, 250, 0.85)",
      inputBg: "rgba(255, 255, 255, 0.72)",
      inputBorder: "rgba(148, 163, 184, 0.5)",
      inputText: "#0f172a",
      inputPlaceholder: "#475569",
      priceBg: "rgba(199, 210, 254, 0.62)",
      priceText: "#1e3a8a",
      error: "#be123c",
    }) + `
#autobidder-form .ab-question-card,
#autobidder-form .ab-calendar-container,
#autobidder-form .ab-pricing-card,
#autobidder-form .ab-input,
#autobidder-form .ab-select,
#autobidder-form .ab-textarea,
#autobidder-form .ab-service-card,
#autobidder-form .ab-multiple-choice,
#autobidder-form .ab-upsell-card,
#autobidder-form .ab-discount-card {
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.42);
}
`,
  },
  {
    id: "neumorphism-cloud",
    name: "Neumorphism Cloud",
    description: "Soft tactile surfaces with gentle inset depth and calm blue-gray contrast.",
    preview: {
      canvas: "#e9eef5",
      surface: "#e9eef5",
      border: "#d6dee8",
      text: "#314056",
      accent: "#6d8db3",
      button: "linear-gradient(135deg, #f6f9fc 0%, #dbe4ef 100%)",
    },
    css: `
.ab-form-container,
.ab-form-container * {
  font-family: "Manrope", "Inter", sans-serif !important;
}

.ab-form-container {
  background: #e9eef5;
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: #314056;
  border-radius: 28px;
  box-shadow: 22px 22px 48px rgba(163, 177, 198, 0.38), -18px -18px 42px rgba(255, 255, 255, 0.94);
}

.ab-question-card,
.ab-calendar-container,
.ab-pricing-card,
.ab-service-accordion,
.ab-upsell-section,
.ab-discount-section,
.ab-pricing-disclaimer,
.ab-customer-summary,
.ab-upsell-selected-summary,
.ab-discount-savings {
  background: #e9eef5;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  color: #314056;
  box-shadow: 14px 14px 32px rgba(163, 177, 198, 0.32), -12px -12px 28px rgba(255, 255, 255, 0.9);
}

.ab-button,
.ab-button-primary {
  background: linear-gradient(145deg, #f6f9fc 0%, #dbe4ef 100%);
  color: #314056;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  font-weight: 700;
  box-shadow: 10px 10px 22px rgba(163, 177, 198, 0.3), -8px -8px 18px rgba(255, 255, 255, 0.92);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.ab-button:hover,
.ab-button-primary:hover {
  transform: translateY(-1px);
  box-shadow: 13px 13px 26px rgba(163, 177, 198, 0.32), -10px -10px 20px rgba(255, 255, 255, 0.95);
}
.ab-button:active,
.ab-button-primary:active {
  transform: translateY(0);
  box-shadow: inset 6px 6px 14px rgba(163, 177, 198, 0.34), inset -6px -6px 14px rgba(255, 255, 255, 0.92);
}

.ab-input,
.ab-number-input,
.ab-text-input,
.ab-textarea,
.ab-select,
.ab-address-input,
.ab-file-input,
.ab-select-content {
  background: #e9eef5;
  color: #314056;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 16px;
  caret-color: #314056;
  box-shadow: inset 6px 6px 12px rgba(163, 177, 198, 0.26), inset -6px -6px 12px rgba(255, 255, 255, 0.9);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.ab-input:focus,
.ab-number-input:focus,
.ab-text-input:focus,
.ab-textarea:focus,
.ab-select:focus,
.ab-address-input:focus,
.ab-file-input:focus {
  outline: none;
  border-color: rgba(109, 141, 179, 0.55);
  box-shadow: inset 5px 5px 12px rgba(163, 177, 198, 0.24), inset -5px -5px 12px rgba(255, 255, 255, 0.95), 0 0 0 4px rgba(109, 141, 179, 0.12);
}
.ab-input::placeholder,
.ab-number-input::placeholder,
.ab-text-input::placeholder,
.ab-textarea::placeholder,
.ab-address-input::placeholder {
  color: #66758c;
  opacity: 1;
}

.ab-checkbox,
.ab-slider {
  accent-color: #6d8db3;
}

.ab-slider-value,
.ab-slider-unit,
.ab-progress-percentage,
.ab-upsell-price,
.ab-discount-percent,
.ab-discount-savings-total,
.ab-upsell-selected-total,
.ab-pricing-total-value,
.ab-label,
.ab-question-label,
.ab-address-input-label,
.ab-upsell-heading,
.ab-upsell-title,
.ab-discount-title,
.ab-customer-summary-title,
.ab-pricing-disclaimer-label,
.ab-discount-savings-title,
.ab-discount-name,
.ab-service-title,
.ab-form-title,
.ab-progress-label,
.ab-pricing-section-title,
.ab-pricing-breakdown-title,
.ab-pricing-line-item-name,
.ab-pricing-line-item-value,
.ab-pricing-subtotal-label,
.ab-pricing-subtotal-value,
.ab-pricing-tax-label,
.ab-pricing-tax-value,
.ab-pricing-total-label,
.ab-pricing-card-title,
.ab-pricing-card-description,
.ab-pricing-card-bullet-text,
.ab-service-accordion-text,
.ab-multiple-choice-label,
.ab-calendar-month-title,
.ab-calendar-day-header {
  color: #314056;
}

.ab-form-subtitle,
.ab-pricing-cart-status,
.ab-upsell-subtitle,
.ab-upsell-description,
.ab-upsell-tooltip,
.ab-discount-subtitle,
.ab-discount-description,
.ab-pricing-disclaimer-text,
.ab-customer-summary-line,
.ab-discount-line-label,
.ab-discount-line-value,
.ab-discount-savings-row,
.ab-calendar-legend-label,
.ab-calendar-date .ab-calendar-date-meta,
.ab-time-slot .ab-time-slot-meta {
  color: #66758c;
}

.ab-progress-track {
  background: #e9eef5;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  box-shadow: inset 5px 5px 12px rgba(163, 177, 198, 0.26), inset -5px -5px 12px rgba(255, 255, 255, 0.9);
}
.ab-progress-fill {
  background: linear-gradient(90deg, #6d8db3 0%, #8ea9c8 100%);
}

.ab-service-card,
.ab-multiple-choice,
.ab-multichoice-card,
.ab-upsell-card,
.ab-discount-card,
.ab-calendar-nav,
.ab-calendar-nav-prev,
.ab-calendar-nav-next,
.ab-calendar-date,
.ab-time-slot {
  background: #e9eef5;
  border: 1px solid rgba(255, 255, 255, 0.86);
  color: #314056;
  border-radius: 18px;
  box-shadow: 10px 10px 22px rgba(163, 177, 198, 0.28), -8px -8px 18px rgba(255, 255, 255, 0.94);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.ab-service-card:hover,
.ab-multiple-choice:hover,
.ab-multichoice-card:hover,
.ab-upsell-card:hover,
.ab-discount-card:hover,
.ab-calendar-date.ab-calendar-date-available:hover,
.ab-time-slot.ab-time-slot-available:hover {
  transform: translateY(-1px);
  box-shadow: 13px 13px 26px rgba(163, 177, 198, 0.3), -10px -10px 20px rgba(255, 255, 255, 0.96);
}
.ab-service-card.selected,
.ab-multiple-choice.selected,
.ab-upsell-card-selected,
.ab-discount-card.selected,
.ab-calendar-date.selected,
.ab-time-slot.selected {
  background: linear-gradient(145deg, #dbe4ef 0%, #eef3f9 100%);
  border-color: rgba(109, 141, 179, 0.5);
  box-shadow: inset 7px 7px 14px rgba(163, 177, 198, 0.28), inset -7px -7px 14px rgba(255, 255, 255, 0.92);
}

.ab-pricing-card-price,
.ab-upsell-popular-badge,
.ab-discount-applied,
.ab-pricing-card-bullet-icon {
  background: linear-gradient(145deg, #d7e5f4 0%, #edf3f8 100%);
  color: #314056;
  border: 1px solid rgba(255, 255, 255, 0.88);
  box-shadow: 8px 8px 18px rgba(163, 177, 198, 0.24), -7px -7px 16px rgba(255, 255, 255, 0.94);
}

.ab-calendar-date.ab-calendar-date-unavailable,
.ab-calendar-date.ab-calendar-date-past,
.ab-calendar-date:disabled,
.ab-time-slot:disabled,
.ab-time-slot.disabled,
.disabled {
  opacity: 0.5;
  box-shadow: inset 4px 4px 10px rgba(163, 177, 198, 0.2), inset -4px -4px 10px rgba(255, 255, 255, 0.82);
}

.ab-error {
  color: #b42318;
  font-weight: 700;
}
`,
  },
  {
    id: "hardware-punch",
    name: "Hardware Punch",
    description: "Chunky outlined cards with playful pink buttons and bold offset shadows.",
    preview: {
      canvas: "#fff7f7",
      surface: "#ffffff",
      border: "#0A3953",
      text: "#0A3953",
      accent: "#F9ABAC",
      button: "#F9ABAC",
    },
    css: `
.ab-form-container,
.ab-form-container * {
  font-family: DDCHardware, sans-serif, sans-serif !important;
}
.ab-form-container {
  background: #ffffff;
  border: 2px solid #0A3953;
  color: #0A3953;
  border-radius: 16px;
  box-shadow: 8px 8px 0px #0A3953;
}

.ab-question-card,
.ab-calendar-container,
.ab-pricing-card,
.ab-service-accordion,
.ab-upsell-section,
.ab-discount-section,
.ab-pricing-disclaimer,
.ab-customer-summary,
.ab-upsell-selected-summary,
.ab-discount-savings {
  background: #ffffff;
  border: 2px solid #0A3953;
  border-radius: 14px;
  color: #0A3953;
  box-shadow: 6px 6px 0px #0A3953;
}

.ab-button,
.ab-button-primary {
  background: #F9ABAC;
  color: #0A3953;
  border: 2px solid #0A3953;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 4px 4px 0px #0A3953;
  transition: all 0.15s ease;
}
.ab-button:hover,
.ab-button-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #0A3953;
}
.ab-button:active,
.ab-button-primary:active {
  transform: translate(4px, 4px);
  box-shadow: none;
}

.ab-input,
.ab-number-input,
.ab-text-input,
.ab-textarea,
.ab-select,
.ab-address-input,
.ab-file-input {
  background: #ffffff;
  color: #0A3953;
  border: 2px solid #0A3953;
  border-radius: 10px;
  caret-color: #0A3953;
  box-shadow: 4px 4px 0px #0A3953;
  transition: all 0.15s ease;
}
.ab-select-content {
  background: #ffffff;
  border: 2px solid #0A3953;
  color: #0A3953;
}
.ab-input:focus,
.ab-number-input:focus,
.ab-text-input:focus,
.ab-textarea:focus,
.ab-select:focus,
.ab-address-input:focus,
.ab-file-input:focus {
  outline: none;
  border-color: #0A3953;
  box-shadow: 0 0 0 3px rgba(249, 171, 172, 0.45), 4px 4px 0px #0A3953;
}
.ab-input::placeholder,
.ab-number-input::placeholder,
.ab-text-input::placeholder,
.ab-textarea::placeholder,
.ab-address-input::placeholder {
  color: #0A3953;
  opacity: 0.65;
}

.ab-checkbox,
.ab-slider {
  accent-color: #F9ABAC;
}
.ab-slider-value,
.ab-slider-unit,
.ab-progress-percentage,
.ab-upsell-price,
.ab-discount-percent,
.ab-discount-savings-total,
.ab-upsell-selected-total,
.ab-pricing-total-value {
  color: #0A3953;
  font-weight: 700;
}
.ab-slider-min,
.ab-slider-max,
.ab-form-subtitle,
.ab-pricing-cart-status,
.ab-upsell-subtitle,
.ab-upsell-description,
.ab-upsell-tooltip,
.ab-discount-subtitle,
.ab-discount-description,
.ab-pricing-disclaimer-text,
.ab-customer-summary-line,
.ab-discount-line-label,
.ab-discount-line-value,
.ab-discount-savings-row,
.ab-calendar-legend-label,
.ab-calendar-date .ab-calendar-date-meta,
.ab-time-slot .ab-time-slot-meta {
  color: #0A3953;
  opacity: 0.8;
}

.ab-label,
.ab-question-label,
.ab-address-input-label,
.ab-upsell-heading,
.ab-upsell-title,
.ab-discount-title,
.ab-customer-summary-title,
.ab-pricing-disclaimer-label,
.ab-discount-savings-title,
.ab-discount-name,
.ab-service-title,
.ab-form-title,
.ab-progress-label,
.ab-pricing-section-title,
.ab-pricing-breakdown-title,
.ab-pricing-line-item-name,
.ab-pricing-line-item-value,
.ab-pricing-subtotal-label,
.ab-pricing-subtotal-value,
.ab-pricing-tax-label,
.ab-pricing-tax-value,
.ab-pricing-total-label,
.ab-pricing-card-title,
.ab-pricing-card-description,
.ab-pricing-card-bullet-text,
.ab-service-accordion-text,
.ab-multiple-choice-label,
.ab-calendar-month-title,
.ab-calendar-day-header {
  color: #0A3953;
  font-weight: 700;
}

.ab-progress-track {
  background: #ffffff;
  border: 2px solid #0A3953;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 3px 3px 0px #0A3953 inset;
}
.ab-progress-fill {
  background: #F9ABAC;
}

.ab-service-card {
  background: #ffffff;
  border: 2px solid #0A3953;
  border-radius: 12px;
  color: #0A3953;
  box-shadow: 4px 4px 0px #0A3953;
  transition: all 0.15s ease;
  cursor: pointer;
}
.ab-service-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #0A3953;
}
.ab-service-card.selected {
  background: #F9ABAC;
  border-color: #0A3953;
  box-shadow: none;
  transform: translate(4px, 4px);
}

.ab-multiple-choice,
.ab-multichoice-card,
.ab-upsell-card,
.ab-discount-card {
  background: #ffffff;
  border: 2px solid #0A3953;
  border-radius: 12px;
  color: #0A3953;
  box-shadow: 4px 4px 0px #0A3953;
  transition: all 0.15s ease;
}
.ab-multiple-choice:hover,
.ab-multichoice-card:hover,
.ab-upsell-card:hover,
.ab-discount-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #0A3953;
}
.ab-multiple-choice.selected,
.ab-upsell-card-selected,
.ab-discount-card.selected {
  background: #F9ABAC;
  border-color: #0A3953;
  box-shadow: none;
  transform: translate(4px, 4px);
}

.ab-service-card.selected,
.ab-multiple-choice.selected,
.ab-upsell-card-selected,
.ab-discount-card.selected,
.selected {
  color: #0A3953 !important;
}
.ab-service-card.selected .ab-service-title,
.ab-multiple-choice.selected .ab-multiple-choice-label,
.ab-upsell-card-selected .ab-upsell-title,
.ab-upsell-card-selected .ab-upsell-description,
.ab-discount-card.selected .ab-discount-name,
.ab-discount-card.selected .ab-discount-description {
  color: #0A3953 !important;
}

.ab-pricing-card {
  box-shadow: 6px 6px 0px #0A3953;
}
.ab-pricing-card-price {
  background: #F9ABAC;
  color: #0A3953;
  border: 2px solid #0A3953;
  border-radius: 999px;
  font-weight: 800;
  box-shadow: 3px 3px 0px #0A3953;
}
.ab-pricing-card-icon {
  background: #ffffff;
  border: 2px solid #0A3953;
  color: #0A3953;
  box-shadow: 3px 3px 0px #0A3953;
}
.ab-pricing-card-bullet-icon {
  background: #F9ABAC;
  color: #0A3953;
  border: 2px solid #0A3953;
}
.ab-upsell-section,
.ab-discount-section,
.ab-pricing-disclaimer,
.ab-customer-summary,
.ab-upsell-selected-summary,
.ab-discount-savings {
  background: #fff7f7;
}
.ab-upsell-grid,
.ab-discount-grid {
  gap: 10px;
}
.ab-upsell-popular-badge,
.ab-discount-applied {
  background: #F9ABAC;
  color: #0A3953;
  border: 2px solid #0A3953;
  box-shadow: 2px 2px 0px #0A3953;
}
.ab-discount-line {
  border-top: 2px dashed #0A3953;
}

.ab-calendar-nav,
.ab-calendar-nav-prev,
.ab-calendar-nav-next {
  background: #ffffff;
  border: 2px solid #0A3953;
  color: #0A3953;
  box-shadow: 3px 3px 0px #0A3953;
}
.ab-calendar-date {
  background: #ffffff;
  border: 2px solid #0A3953;
  color: #0A3953;
  box-shadow: 3px 3px 0px #0A3953;
  transition: all 0.15s ease;
}
.ab-calendar-date.ab-calendar-date-available {
  background: #ffffff;
  border-color: #0A3953;
}
.ab-calendar-date.ab-calendar-date-available:hover {
  background: #fff3f3;
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px #0A3953;
}
.ab-calendar-date.ab-calendar-date-unavailable,
.ab-calendar-date.ab-calendar-date-past,
.ab-calendar-date:disabled {
  background: #f7f7f7;
  border: 2px dashed #0A3953;
  color: #0A3953;
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  filter: grayscale(0.1);
}
.ab-time-slot {
  background: #ffffff;
  border: 2px solid #0A3953;
  color: #0A3953;
  box-shadow: 3px 3px 0px #0A3953;
  transition: all 0.15s ease;
}
.ab-time-slot.ab-time-slot-available:hover {
  background: #fff3f3;
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px #0A3953;
}
.ab-calendar-date.selected,
.ab-time-slot.selected {
  background: #F9ABAC;
  border-color: #0A3953;
  color: #0A3953;
  box-shadow: none;
  transform: translate(3px, 3px);
}
.ab-time-slot:disabled,
.ab-time-slot.disabled {
  background: #f7f7f7;
  border: 2px dashed #0A3953;
  color: #0A3953;
  opacity: 0.5;
  box-shadow: none;
}
.ab-calendar-legend-swatch-available {
  background: #ffffff;
  border: 2px solid #0A3953;
}
.ab-calendar-legend-swatch-selected {
  background: #F9ABAC;
  border: 2px solid #0A3953;
}
.ab-calendar-legend-swatch-unavailable {
  background: #f7f7f7;
  border: 2px dashed #0A3953;
}
.ab-calendar-date.selected .ab-calendar-date-meta,
.ab-time-slot.selected .ab-time-slot-meta {
  color: #0A3953;
  opacity: 1;
}

.ab-address-nav-button,
.ab-address-back-button,
.ab-address-skip-button {
  color: #0A3953;
  font-weight: 700;
}
.ab-address-nav-button:hover,
.ab-address-back-button:hover,
.ab-address-skip-button:hover {
  color: #0A3953;
  opacity: 0.75;
}

.selected {
  border-color: #0A3953 !important;
}
.disabled {
  opacity: 0.55;
  filter: grayscale(0.1);
  pointer-events: none;
  box-shadow: none !important;
}

.ab-error {
  color: #b42318;
  font-weight: 700;
}
`,
  },
];

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

#design-css-preview #autobidder-form .ab-service-card.service-selector {
  min-height: 130px;
  cursor: pointer;
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

#design-css-preview #autobidder-form .ab-select.ab-dropdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

#design-css-preview #autobidder-form .ab-select-content {
  border-radius: 0.75rem;
  border: 1px solid var(--ab-input-border-color, #D1D5DB);
  background: var(--ab-input-bg, #FFFFFF);
  box-shadow: 0 10px 20px -10px rgb(15 23 42 / 0.28);
}

#design-css-preview #autobidder-form .ab-select-content .preview-select-item {
  border-radius: 0.5rem;
  padding: 7px 9px;
  color: var(--ab-input-text-color, #1F2937);
}

#design-css-preview #autobidder-form .ab-select-content .preview-select-item + .preview-select-item {
  margin-top: 3px;
}

#design-css-preview #autobidder-form .ab-select-content .preview-select-item.active {
  background: rgb(59 130 246 / 0.12);
  color: var(--ab-primary-color, #2563EB);
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

#design-css-preview #autobidder-form .ab-multiple-choice.multiple-choice {
  min-height: 120px;
  cursor: pointer;
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

#design-css-preview #autobidder-form .ab-calendar-container {
  background-color: var(--ab-calendar-container-bg, var(--ab-question-card-bg, #FFFFFF));
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

#design-css-preview #autobidder-form .ab-service-accordion {
  width: 100%;
  border: 1px solid rgb(203 213 225 / 0.85);
  border-radius: 0.75rem;
  background: rgb(248 250 252 / 0.92);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-align: left;
}

#design-css-preview #autobidder-form .ab-service-accordion-text {
  color: var(--ab-service-accordion-text-color, var(--ab-text-color, #1F2937));
}

#design-css-preview .preview-service-icon {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--ab-primary-color, #2563EB);
  background: rgb(59 130 246 / 0.14);
  border: 1px solid rgb(59 130 246 / 0.28);
}

#design-css-preview #autobidder-form .ab-service-card.selected .preview-service-icon {
  color: #ffffff;
  background: var(--ab-primary-color, #2563EB);
  border-color: var(--ab-primary-color, #2563EB);
}

#design-css-preview .preview-service-description {
  color: rgb(100 116 139);
}

.dark #design-css-preview .preview-service-description {
  color: rgb(203 213 225);
}

#design-css-preview .preview-choice-icon {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.84rem;
  color: rgb(71 85 105);
  background: rgb(148 163 184 / 0.24);
}

#design-css-preview #autobidder-form .ab-multiple-choice.selected .preview-choice-icon {
  color: #ffffff;
  background: rgb(255 255 255 / 0.2);
}

#design-css-preview .preview-choice-helper {
  font-size: 0.73rem;
  opacity: 0.84;
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

/* Upsell styles */
#design-css-preview #autobidder-form .ab-upsell-section {
  border-radius: 0.85rem;
  border: 1px solid rgb(251 191 36 / 0.4);
  background: rgb(255 247 237);
  padding: 0.9rem;
}

.dark #design-css-preview #autobidder-form .ab-upsell-section {
  border-color: rgb(217 119 6 / 0.55);
  background: rgb(67 20 7 / 0.28);
}

#design-css-preview #autobidder-form .ab-upsell-subtitle {
  color: rgb(120 53 15);
}

.dark #design-css-preview #autobidder-form .ab-upsell-subtitle {
  color: rgb(253 230 138);
}

#design-css-preview #autobidder-form .ab-upsell-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.7rem;
}

#design-css-preview #autobidder-form .ab-upsell-card {
  border: 2px solid rgb(229 231 235);
  border-radius: 0.75rem;
  background: rgb(255 255 255);
  padding: 0.75rem;
  cursor: pointer;
  transition: border-color 150ms ease, background-color 150ms ease, transform 150ms ease;
}

.dark #design-css-preview #autobidder-form .ab-upsell-card {
  border-color: rgb(71 85 105 / 0.8);
  background: rgb(15 23 42 / 0.7);
}

#design-css-preview #autobidder-form .ab-upsell-card:hover {
  transform: translateY(-1px);
  border-color: rgb(251 146 60);
}

#design-css-preview #autobidder-form .ab-upsell-card-selected {
  border-color: rgb(249 115 22);
  background: rgb(255 237 213);
}

.dark #design-css-preview #autobidder-form .ab-upsell-card-selected {
  background: rgb(124 45 18 / 0.42);
}

#design-css-preview #autobidder-form .ab-upsell-icon-fallback {
  width: 2rem;
  height: 2rem;
  border-radius: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(254 215 170);
  color: rgb(194 65 12);
  font-weight: 700;
}

#design-css-preview #autobidder-form .ab-upsell-title {
  color: var(--ab-text-color, #1F2937);
}

#design-css-preview #autobidder-form .ab-upsell-popular-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
  background: rgb(255 237 213);
  color: rgb(194 65 12);
  font-size: 0.68rem;
  font-weight: 600;
}

#design-css-preview #autobidder-form .ab-upsell-description {
  color: rgb(82 82 91);
}

.dark #design-css-preview #autobidder-form .ab-upsell-description {
  color: rgb(203 213 225);
}

#design-css-preview #autobidder-form .ab-upsell-price {
  color: rgb(234 88 12);
}

#design-css-preview #autobidder-form .ab-upsell-added {
  color: rgb(194 65 12);
}

#design-css-preview #autobidder-form .ab-upsell-tooltip {
  color: rgb(120 53 15);
}

#design-css-preview #autobidder-form .ab-upsell-selected-summary {
  border-radius: 0.65rem;
  border: 1px solid rgb(253 186 116 / 0.8);
  background: rgb(255 237 213 / 0.65);
  padding: 0.6rem;
}

#design-css-preview #autobidder-form .ab-upsell-selected-row,
#design-css-preview #autobidder-form .ab-upsell-selected-total {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
}

#design-css-preview #autobidder-form .ab-upsell-selected-total {
  border-top: 1px dashed rgb(251 146 60 / 0.7);
  margin-top: 0.35rem;
  padding-top: 0.35rem;
  font-weight: 700;
}

#design-css-preview #autobidder-form .ab-calendar-nav,
#design-css-preview #autobidder-form .ab-calendar-date,
#design-css-preview #autobidder-form .ab-time-slot {
  border: 1px solid rgb(226 232 240);
}

#design-css-preview #autobidder-form .ab-calendar-nav {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

#design-css-preview #autobidder-form .ab-calendar-month-title {
  font-weight: 600;
}

#design-css-preview #autobidder-form .ab-calendar-day-header {
  text-align: center;
  font-size: 0.75rem;
  color: rgb(107 114 128);
  font-weight: 500;
  padding: 0.5rem 0;
}

#design-css-preview #autobidder-form .ab-calendar-date {
  aspect-ratio: 1 / 1;
  border-radius: 0.5rem;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
}

#design-css-preview #autobidder-form .ab-calendar-date.ab-calendar-date-available {
  background: var(--ab-service-selector-active-bg, #EFF6FF);
  border-color: var(--ab-service-selector-active-border-color, #3B82F6);
}

#design-css-preview #autobidder-form .ab-calendar-date.ab-calendar-date-unavailable,
#design-css-preview #autobidder-form .ab-calendar-date.ab-calendar-date-past,
#design-css-preview #autobidder-form .ab-calendar-date:disabled,
#design-css-preview #autobidder-form .ab-time-slot:disabled {
  background: var(--ab-input-bg, #F3F4F6);
  color: var(--ab-input-placeholder-color, #9CA3AF);
  border-style: dashed;
  cursor: not-allowed;
}

#design-css-preview #autobidder-form .ab-time-slot {
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: #fff;
  transition: all 0.2s ease;
}

#design-css-preview #autobidder-form .ab-time-slot.ab-time-slot-available:hover {
  border-color: var(--ab-primary-color, #2563EB);
  background: var(--ab-service-selector-active-bg, #EFF6FF);
}

#design-css-preview #autobidder-form .ab-calendar-date.selected,
#design-css-preview #autobidder-form .ab-time-slot.selected {
  background: var(--ab-primary-color, #2563EB);
  color: #ffffff;
  border-color: var(--ab-primary-color, #2563EB);
}

#design-css-preview #autobidder-form .ab-calendar-date .ab-calendar-date-meta,
#design-css-preview #autobidder-form .ab-time-slot .ab-time-slot-meta {
  color: var(--ab-label-color, #64748b);
}

#design-css-preview #autobidder-form .ab-calendar-date.selected .ab-calendar-date-meta,
#design-css-preview #autobidder-form .ab-time-slot.selected .ab-time-slot-meta {
  color: rgb(219 234 254);
}

#design-css-preview #autobidder-form .ab-calendar-legend-label {
  color: var(--ab-label-color, #64748b);
}

#design-css-preview #autobidder-form .ab-calendar-legend-swatch-available {
  background: var(--ab-service-selector-active-bg, #EFF6FF);
  border-color: var(--ab-service-selector-active-border-color, #3B82F6);
}

#design-css-preview #autobidder-form .ab-calendar-legend-swatch-selected {
  background: var(--ab-primary-color, #2563EB);
  border-color: var(--ab-primary-color, #2563EB);
}

#design-css-preview #autobidder-form .ab-calendar-legend-swatch-unavailable {
  background: var(--ab-input-bg, #F3F4F6);
  border-color: var(--ab-input-border-color, #D1D5DB);
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
const defaultStyling = {
  containerWidth: 700,
  containerHeight: 850,
  containerBorderRadius: 16,
  containerShadow: 'xl',
  containerBorderWidth: 0,
  containerBorderColor: '#E5E7EB',
  containerPadding: 5,
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
} as StylingOptions;

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

const sanitizeCommentValue = (value: string): string => value.replace(/\*\//g, '').trim();

const cssHasSelectorBlock = (css: string, selector: string): boolean => {
  if (!css.trim() || !selector.trim()) return false;
  const normalizedSelector = selector.trim();
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectorBlockRegex = /(^|})\s*([^{]+)\{/g;
  let match: RegExpExecArray | null = selectorBlockRegex.exec(cssWithoutComments);

  while (match) {
    const selectors = match[2]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (selectors.includes(normalizedSelector)) {
      return true;
    }
    match = selectorBlockRegex.exec(cssWithoutComments);
  }

  return false;
};

const ensureSelectorBlockInCSS = (css: string, selector: string, label: string): { css: string; added: boolean } => {
  if (cssHasSelectorBlock(css, selector)) {
    return { css, added: false };
  }

  const safeLabel = sanitizeCommentValue(label || selector);
  const starterBlock = `${selector} {\n  /* ${safeLabel} */\n}\n`;
  const cssWithSeedBlock = css.trim() ? `${css.trimEnd()}\n\n${starterBlock}` : starterBlock;
  return { css: cssWithSeedBlock, added: true };
};

type EditCSSOptions = {
  sourceCSS?: string;
  clearInput?: boolean;
  successTitle?: string;
  successDescription?: string;
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
  const [isTargetedEditModalOpen, setIsTargetedEditModalOpen] = useState(false);
  const [hoveredPreviewTarget, setHoveredPreviewTarget] = useState<PreviewTarget | null>(null);
  const [previewTooltipPosition, setPreviewTooltipPosition] = useState<{ x: number; y: number } | null>(null);
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

  const selectedTargetHasCustomBlock = useMemo(() => {
    if (!selectedPreviewTarget) return false;
    return cssHasSelectorBlock(customCSS, selectedPreviewTarget.selector);
  }, [customCSS, selectedPreviewTarget]);

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

  const handleApplyCssThemePreset = useCallback((preset: CssThemePreset) => {
    const currentCSS = customCSS.trim();
    const nextCSS = formatCustomCSS(preset.css);

    if (currentCSS && currentCSS !== nextCSS) {
      const shouldOverride = window.confirm(
        "Applying this theme will replace your existing Custom CSS. Continue?"
      );
      if (!shouldOverride) return;
    }

    handleCustomCSSChange(nextCSS);
    toast({
      title: "Theme CSS applied",
      description: `${preset.name} has been added to the Custom CSS editor.`,
    });
  }, [customCSS, handleCustomCSSChange, toast]);


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
  const handleEditCSS = useCallback(async (editDescription: string, options: EditCSSOptions = {}): Promise<boolean> => {
    const {
      sourceCSS,
      clearInput = true,
      successTitle = "CSS Edited!",
      successDescription = "AI has updated your CSS based on your request.",
    } = options;

    setIsGeneratingCSS(true);
    setAiCSSError('');
    
    try {
      const response = await apiRequest("POST", "/api/design-settings/edit-css", {
        currentCSS: sourceCSS ?? customCSS,
        editDescription
      });
      const data = await response.json();
      
      if (data.css) {
        setCustomCSS(formatCustomCSS(data.css));
        setHasUnsavedChanges(true);
        toast({
          title: successTitle,
          description: successDescription,
        });
        if (clearInput) {
          const input = document.querySelector('[data-testid="input-ai-css-edit"]') as HTMLInputElement;
          if (input) input.value = '';
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('CSS editing error:', error);
      setAiCSSError(error instanceof Error ? error.message : 'Failed to edit CSS. Please try again.');
      toast({
        title: "Edit Failed",
        description: error instanceof Error ? error.message : "Failed to edit CSS. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsGeneratingCSS(false);
    }
  }, [customCSS, toast]);

  const handlePreviewPointerMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const hoverTarget = (event.target as HTMLElement).closest<HTMLElement>('[data-css-target]');
    if (!hoverTarget || !previewSurfaceRef.current?.contains(hoverTarget)) {
      setHoveredPreviewTarget(null);
      setPreviewTooltipPosition(null);
      return;
    }

    const selector = hoverTarget.dataset.cssTarget;
    if (!selector) {
      setHoveredPreviewTarget(null);
      setPreviewTooltipPosition(null);
      return;
    }

    const viewportPadding = 16;
    const tooltipOffset = 16;
    const tooltipWidth = 260;
    const tooltipHeight = 92;
    const maxX = window.innerWidth - tooltipWidth - viewportPadding;
    const maxY = window.innerHeight - tooltipHeight - viewportPadding;
    setPreviewTooltipPosition({
      x: Math.min(event.clientX + tooltipOffset, Math.max(viewportPadding, maxX)),
      y: Math.min(event.clientY + tooltipOffset, Math.max(viewportPadding, maxY)),
    });

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

    const nextTarget = {
      selector,
      label: selectedElement.dataset.cssLabel || selector,
    };
    setSelectedPreviewTarget(nextTarget);
    setAiCSSError('');
    setTargetedEditPrompt('');
    setIsTargetedEditModalOpen(true);
  }, []);

  const handleTargetedEdit = useCallback(async () => {
    if (!selectedPreviewTarget || !targetedEditPrompt.trim() || isGeneratingCSS) return;

    const { css: seededCSS, added } = ensureSelectorBlockInCSS(
      customCSS,
      selectedPreviewTarget.selector,
      selectedPreviewTarget.label
    );
    const scopedEditPrompt = [
      `Target selector: ${selectedPreviewTarget.selector}`,
      `Element description: ${selectedPreviewTarget.label}`,
      `Request: ${targetedEditPrompt.trim()}`,
      `Only add or change CSS rules for ${selectedPreviewTarget.selector} and direct state variants of it (for example :hover or :focus).`,
      'Keep all unrelated existing CSS untouched.',
      'Return complete CSS.',
    ].join('\n');

    const didApply = await handleEditCSS(scopedEditPrompt, {
      sourceCSS: seededCSS,
      clearInput: false,
      successTitle: "Element Updated",
      successDescription: added
        ? `${selectedPreviewTarget.selector} was added and updated with your request.`
        : `${selectedPreviewTarget.selector} was updated with your request.`,
    });

    if (didApply) {
      setTargetedEditPrompt('');
      setIsTargetedEditModalOpen(false);
    }
  }, [selectedPreviewTarget, targetedEditPrompt, isGeneratingCSS, customCSS, handleEditCSS]);

  const handleTogglePreviewLab = useCallback(() => {
    const nextState = !isPreviewLabOpen;
    setIsPreviewLabOpen(nextState);
    if (!nextState) {
      setHoveredPreviewTarget(null);
      setPreviewTooltipPosition(null);
      setSelectedPreviewTarget(null);
      setTargetedEditPrompt('');
      setIsTargetedEditModalOpen(false);
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
    setPreviewTooltipPosition(null);
    setSelectedPreviewTarget(null);
    setTargetedEditPrompt('');
    setIsTargetedEditModalOpen(false);
    setHasUnsavedChanges(true);
    toast({
      title: "Design Reset",
      description: "All design settings have been reset to defaults.",
    });
  }, [toast]);

  const previewPricingCardLayout = (((styling as any).pricingCardLayout || 'classic') as 'classic' | 'modern' | 'minimal' | 'compact');
  const previewPricingBullets = [
    'HEPA vacuum + allergen wipe down',
    'Kitchen appliance detail',
    'Bathroom polish + sanitizing',
  ];

  const renderPreviewPricingBullets = (compact = false) => (
    <ul className={compact ? "space-y-1.5" : "space-y-1 text-sm"}>
      {previewPricingBullets.slice(0, compact ? 2 : 3).map((bullet) => (
        <li key={bullet} className="flex items-center gap-2">
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
            {bullet}
          </span>
        </li>
      ))}
    </ul>
  );

  const renderPreviewPricingCard = () => {
    switch (previewPricingCardLayout) {
      case 'modern':
        return (
          <div
            className="ab-pricing-card text-center space-y-3"
            {...previewTargetAttributes('.ab-pricing-card', 'Pricing card')}
          >
            <div
              className="ab-pricing-card-price text-3xl font-bold"
              {...previewTargetAttributes('.ab-pricing-card-price', 'Pricing badge')}
            >
              $499
            </div>
            <p
              className="ab-pricing-card-icon text-xs font-semibold"
              {...previewTargetAttributes('.ab-pricing-card-icon', 'Pricing icon')}
            >
              Premium Tier
            </p>
            <h4
              className="ab-pricing-card-title text-lg font-semibold"
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
            <div className="text-left">
              {renderPreviewPricingBullets()}
            </div>
          </div>
        );

      case 'minimal':
        return (
          <div
            className="ab-pricing-card space-y-3"
            {...previewTargetAttributes('.ab-pricing-card', 'Pricing card')}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
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
                className="ab-pricing-card-price text-sm font-semibold px-3 py-1 rounded-full"
                {...previewTargetAttributes('.ab-pricing-card-price', 'Pricing badge')}
              >
                $499
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {previewPricingBullets.map((bullet) => (
                <span key={bullet} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs">
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
                    {bullet}
                  </span>
                </span>
              ))}
            </div>
          </div>
        );

      case 'compact':
        return (
          <div
            className="ab-pricing-card space-y-2"
            {...previewTargetAttributes('.ab-pricing-card', 'Pricing card')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <h4
                  className="ab-pricing-card-title text-sm font-semibold"
                  {...previewTargetAttributes('.ab-pricing-card-title', 'Pricing title')}
                >
                  Whole Home Detail
                </h4>
                <p
                  className="ab-pricing-card-description text-xs"
                  {...previewTargetAttributes('.ab-pricing-card-description', 'Pricing description')}
                >
                  2,100 sq ft · biweekly
                </p>
              </div>
              <span
                className="ab-pricing-card-price text-sm font-semibold"
                {...previewTargetAttributes('.ab-pricing-card-price', 'Pricing badge')}
              >
                $499
              </span>
            </div>
            {renderPreviewPricingBullets(true)}
          </div>
        );

      default:
        return (
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
            {renderPreviewPricingBullets()}
          </div>
        );
    }
  };


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center mb-3">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          </div>
          <p className="text-sm text-gray-400">Loading design settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes design-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .design-stagger-1 { animation: design-fade-up 0.5s ease-out both; animation-delay: 0.05s; }
        .design-stagger-2 { animation: design-fade-up 0.5s ease-out both; animation-delay: 0.1s; }
      `}</style>
      <div className="p-4 sm:p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">

        {/* Hero Header */}
        <div className="design-stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800/80 dark:via-gray-900 dark:to-gray-800/60 border border-amber-200/40 dark:border-amber-500/10 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200/40 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-200/30 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          <div className="relative flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600/70 dark:text-amber-400/60 font-semibold">Customization</p>
                <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Design Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Customize your calculator's appearance and styling</p>
              </div>
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleReset} className="flex-1 sm:flex-none rounded-xl border-gray-200/80 dark:border-gray-700/60 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 hover:border-amber-200 transition-colors">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="relative flex-1 sm:flex-none rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/25 px-6"
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
            <div className="relative mt-4 bg-amber-100/60 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-xl p-3">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                You have unsaved changes. Click "Save Changes" to apply your updates.
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="design-stagger-2 w-full">
          {/* Editor Panel - Full Width */}
          <div className="w-full">
            <Tabs defaultValue="components" className="w-full">
              <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="inline-flex w-auto min-w-fit rounded-full bg-amber-50/80 dark:bg-gray-800/70 p-1 shadow-sm ring-1 ring-amber-200/50 dark:ring-gray-700/70 backdrop-blur">
                  <TabsTrigger
                    value="components"
                    className="h-10 rounded-full px-5 text-sm font-medium text-gray-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-amber-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Components
                  </TabsTrigger>
                  <TabsTrigger
                    value="themes"
                    className="h-10 rounded-full px-5 text-sm font-medium text-gray-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-amber-300"
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Theme Picker
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom-css"
                    className="h-10 rounded-full px-5 text-sm font-medium text-gray-500 dark:text-gray-300 transition-all data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900/80 dark:data-[state=active]:text-amber-300"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Custom CSS
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="components" className="mt-6">
                <div className="space-y-6">
                  {/* Form Container Design */}
                  <Card className="mb-4 rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm shadow-none">
                    <CardHeader className="pb-2 pt-0">
                      <div
                        className="flex items-center justify-between cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/10 p-2 -m-2 rounded-xl transition-colors"
                        onClick={() => setIsFormContainerExpanded(!isFormContainerExpanded)}
                      >
                        <div className="flex items-center space-x-3">
                          {isFormContainerExpanded ? (
                            <ChevronDown className="h-4 w-4 text-amber-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <div className="flex flex-col justify-center">
                            <CardTitle className="text-base" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Form Container</CardTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Customize the main form container spacing and appearance</p>
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
                                  value={[styling.containerPadding || 5]}
                                  onValueChange={(value) => handleStylingChange({ containerPadding: value[0] })}
                                  max={100}
                                  min={0}
                                  step={1}
                                  className="flex-1"
                                />
                                <span className="min-w-[50px] text-center text-xs text-gray-500">
                                  {styling.containerPadding || 5}px
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
                <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      CSS Theme Picker
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose a starter CSS style. This writes directly to the Custom CSS editor.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                      Selecting a theme replaces existing Custom CSS content if present.
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {CSS_THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyCssThemePreset(preset)}
                          className="text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/50 p-4 hover:border-amber-300 hover:shadow-sm transition-all"
                          data-testid={`button-theme-preset-${preset.id}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{preset.name}</p>
                            <Badge variant="secondary" className="text-[10px]">Apply</Badge>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{preset.description}</p>
                          <div
                            className="mt-3 rounded-lg border p-2"
                            style={{
                              background: preset.preview.canvas,
                              borderColor: preset.preview.border,
                            }}
                          >
                            <div
                              className="rounded-md border p-2 space-y-2"
                              style={{
                                background: preset.preview.surface,
                                borderColor: preset.preview.border,
                              }}
                            >
                              <div className="h-2 rounded w-2/3" style={{ backgroundColor: preset.preview.text, opacity: 0.85 }} />
                              <div className="h-2 rounded w-1/2" style={{ backgroundColor: preset.preview.text, opacity: 0.45 }} />
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="h-5 w-5 rounded-full" style={{ backgroundColor: preset.preview.accent, opacity: 0.85 }} />
                                <div
                                  className="h-6 w-20 rounded-full border"
                                  style={{
                                    background: preset.preview.button,
                                    borderColor: preset.preview.border,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tip: after applying a preset, fine-tune it in the <span className="font-semibold">Custom CSS</span> tab.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom-css" className="mt-6">
                <div className="space-y-6">
                  <Card className="rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Custom CSS</CardTitle>
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
                              Full demo form with all stages visible. Hover to inspect a class, then click an element to open AI edit modal for that selector.
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
                                  onMouseLeave={() => {
                                    setHoveredPreviewTarget(null);
                                    setPreviewTooltipPosition(null);
                                  }}
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
                                          className="ab-service-card service-selector selected cursor-pointer transition-all duration-200 hover:scale-105 relative border"
                                          {...previewTargetAttributes('.ab-service-card', 'Service card')}
                                        >
                                          <div className="flex flex-col items-center text-center h-full pt-1 pb-2 px-2">
                                            <div className="preview-service-icon">WH</div>
                                            <h4
                                              className="ab-service-title font-black leading-tight mt-2"
                                              {...previewTargetAttributes('.ab-service-title', 'Service card title')}
                                            >
                                              Whole Home Cleaning
                                            </h4>
                                            <p className="preview-service-description mt-2 text-xs leading-snug">
                                              Great for quarterly deep resets.
                                            </p>
                                          </div>
                                        </button>
                                        <button
                                          type="button"
                                          className="ab-service-card service-selector cursor-pointer transition-all duration-200 hover:scale-105 relative border"
                                          {...previewTargetAttributes('.ab-service-card', 'Service card')}
                                        >
                                          <div className="flex flex-col items-center text-center h-full pt-1 pb-2 px-2">
                                            <div className="preview-service-icon">MO</div>
                                            <h4
                                              className="ab-service-title font-black leading-tight mt-2"
                                              {...previewTargetAttributes('.ab-service-title', 'Service card title')}
                                            >
                                              Move-Out Detail
                                            </h4>
                                            <p className="preview-service-description mt-2 text-xs leading-snug">
                                              Top-to-bottom prep before handoff.
                                            </p>
                                          </div>
                                        </button>
                                        <button
                                          type="button"
                                          className="ab-service-card service-selector cursor-pointer transition-all duration-200 hover:scale-105 relative border"
                                          {...previewTargetAttributes('.ab-service-card', 'Service card')}
                                        >
                                          <div className="flex flex-col items-center text-center h-full pt-1 pb-2 px-2">
                                            <div className="preview-service-icon">OF</div>
                                            <h4
                                              className="ab-service-title font-black leading-tight mt-2"
                                              {...previewTargetAttributes('.ab-service-title', 'Service card title')}
                                            >
                                              Office Refresh
                                            </h4>
                                            <p className="preview-service-description mt-2 text-xs leading-snug">
                                              Evening service for teams and studios.
                                            </p>
                                          </div>
                                        </button>
                                      </div>
                                      <div className="mt-3 space-y-2">
                                        <button
                                          type="button"
                                          className="ab-service-accordion text-sm"
                                          {...previewTargetAttributes('.ab-service-accordion', 'Service accordion header')}
                                        >
                                          <span
                                            className="ab-service-accordion-text font-medium"
                                            {...previewTargetAttributes('.ab-service-accordion-text', 'Accordion text')}
                                          >
                                            What is included in each package?
                                          </span>
                                          <ChevronDown className="h-4 w-4 shrink-0" />
                                        </button>
                                        <p
                                          className="ab-service-accordion-text text-sm leading-relaxed px-4"
                                          {...previewTargetAttributes('.ab-service-accordion-text', 'Accordion text')}
                                        >
                                          Every package includes insured pros, a detailed checklist, and quality-control follow-up after service.
                                        </p>
                                      </div>
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
                                            className="ab-select ab-dropdown dropdown text-left"
                                            {...previewTargetAttributes('.ab-select', 'Dropdown trigger')}
                                          >
                                            <span>Residential · Single Family</span>
                                            <span className="text-xs opacity-70">▼</span>
                                          </button>
                                          <div
                                            className="ab-select-content mt-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs"
                                            {...previewTargetAttributes('.ab-select-content', 'Dropdown menu content')}
                                          >
                                            <div className="preview-select-item active">Residential · Condo</div>
                                            <div className="preview-select-item">Townhome</div>
                                            <div className="preview-select-item">Commercial Office</div>
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="ab-question-label text-xs font-medium">Cleaning Frequency</label>
                                          <button
                                            type="button"
                                            className="ab-select ab-dropdown dropdown text-left"
                                            {...previewTargetAttributes('.ab-select', 'Dropdown trigger')}
                                          >
                                            <span>Every 2 weeks</span>
                                            <span className="text-xs opacity-70">▼</span>
                                          </button>
                                          <div
                                            className="ab-select-content mt-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs"
                                            {...previewTargetAttributes('.ab-select-content', 'Dropdown menu content')}
                                          >
                                            <div className="preview-select-item">One time</div>
                                            <div className="preview-select-item active">Weekly</div>
                                            <div className="preview-select-item">Biweekly</div>
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
                                            className="ab-multiple-choice ab-multichoice-card multiple-choice border-2 cursor-pointer transition-all rounded-lg hover:shadow-sm selected p-3 text-center flex flex-col h-full justify-center"
                                            {...previewTargetAttributes('.ab-multiple-choice', 'Multiple choice card')}
                                          >
                                            <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                                              <span className="preview-choice-icon">FR</span>
                                              <span
                                                className="ab-multiple-choice-label font-medium text-sm"
                                                {...previewTargetAttributes('.ab-multiple-choice-label', 'Multiple choice card text')}
                                              >
                                                Inside Fridge Cleaning
                                              </span>
                                              <span className="preview-choice-helper">+15 min</span>
                                            </div>
                                          </button>
                                          <button
                                            type="button"
                                            className="ab-multiple-choice ab-multichoice-card multiple-choice border-2 cursor-pointer transition-all rounded-lg hover:shadow-sm p-3 text-center flex flex-col h-full justify-center"
                                            {...previewTargetAttributes('.ab-multichoice-card', 'Multiple choice card (alt selector)')}
                                          >
                                            <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                                              <span className="preview-choice-icon">GA</span>
                                              <span
                                                className="ab-multiple-choice-label font-medium text-sm"
                                                {...previewTargetAttributes('.ab-multiple-choice-label', 'Multiple choice card text')}
                                              >
                                                Garage Sweep + Organize
                                              </span>
                                              <span className="preview-choice-helper">+30 min</span>
                                            </div>
                                          </button>
                                          <button
                                            type="button"
                                            className="ab-multiple-choice ab-multichoice-card multiple-choice border-2 cursor-pointer transition-all rounded-lg hover:shadow-sm p-3 text-center flex flex-col h-full justify-center"
                                            {...previewTargetAttributes('.ab-multiple-choice', 'Multiple choice card')}
                                          >
                                            <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                                              <span className="preview-choice-icon">PH</span>
                                              <span
                                                className="ab-multiple-choice-label font-medium text-sm"
                                                {...previewTargetAttributes('.ab-multiple-choice-label', 'Multiple choice card text')}
                                              >
                                                Pet Hair Extra Pass
                                              </span>
                                              <span className="preview-choice-helper">+10 min</span>
                                            </div>
                                          </button>
                                          <button
                                            type="button"
                                            className="ab-multiple-choice ab-multichoice-card multiple-choice border-2 cursor-pointer transition-all rounded-lg hover:shadow-sm p-3 text-center flex flex-col h-full justify-center"
                                            {...previewTargetAttributes('.ab-multichoice-card', 'Multiple choice card (alt selector)')}
                                          >
                                            <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                                              <span className="preview-choice-icon">EC</span>
                                              <span
                                                className="ab-multiple-choice-label font-medium text-sm"
                                                {...previewTargetAttributes('.ab-multiple-choice-label', 'Multiple choice card text')}
                                              >
                                                Eco Product Upgrade
                                              </span>
                                              <span className="preview-choice-helper">+$18</span>
                                            </div>
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="preview-stage">
                                      <p className="preview-stage-title">Stage 4 · Pricing + Summary</p>
                                      {renderPreviewPricingCard()}

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
                                      <p className="preview-stage-title">Stage 5 · Upsell Add-Ons</p>
                                      <div
                                        className="ab-upsell-section space-y-3"
                                        {...previewTargetAttributes('.ab-upsell-section', 'Upsell section')}
                                      >
                                        <h4
                                          className="ab-upsell-heading text-sm font-semibold"
                                          {...previewTargetAttributes('.ab-upsell-heading', 'Upsell heading')}
                                        >
                                          ⭐ Recommended Add-Ons
                                        </h4>
                                        <p
                                          className="ab-upsell-subtitle text-xs"
                                          {...previewTargetAttributes('.ab-upsell-subtitle', 'Upsell subtitle')}
                                        >
                                          Enhance your services with these popular add-ons
                                        </p>
                                        <div
                                          className="ab-upsell-grid"
                                          {...previewTargetAttributes('.ab-upsell-grid', 'Upsell grid')}
                                        >
                                          <button
                                            type="button"
                                            className="ab-upsell-card ab-upsell-card-selected text-left"
                                            {...previewTargetAttributes('.ab-upsell-card-selected', 'Upsell card (selected)')}
                                          >
                                            <div className="ab-upsell-content flex items-start gap-3">
                                              <div
                                                className="ab-upsell-icon"
                                                {...previewTargetAttributes('.ab-upsell-icon', 'Upsell icon wrapper')}
                                              >
                                                <div
                                                  className="ab-upsell-icon-fallback"
                                                  {...previewTargetAttributes('.ab-upsell-icon-fallback', 'Upsell fallback icon')}
                                                >
                                                  +
                                                </div>
                                              </div>
                                              <div className="ab-upsell-main flex-1 min-w-0">
                                                <div className="ab-upsell-header flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <div
                                                      className="ab-upsell-title-row flex items-center gap-2 flex-wrap"
                                                      {...previewTargetAttributes('.ab-upsell-title-row', 'Upsell title row')}
                                                    >
                                                      <h5
                                                        className="ab-upsell-title text-sm font-medium"
                                                        {...previewTargetAttributes('.ab-upsell-title', 'Upsell title')}
                                                      >
                                                        Window Track Detail
                                                      </h5>
                                                      <span
                                                        className="ab-upsell-popular-badge"
                                                        {...previewTargetAttributes('.ab-upsell-popular-badge', 'Upsell popular badge')}
                                                      >
                                                        Popular
                                                      </span>
                                                    </div>
                                                    <p
                                                      className="ab-upsell-description text-xs mt-1"
                                                      {...previewTargetAttributes('.ab-upsell-description', 'Upsell description')}
                                                    >
                                                      Deep edge clean for high-traffic windows.
                                                    </p>
                                                  </div>
                                                  <div className="ab-upsell-price-wrap text-right">
                                                    <p
                                                      className="ab-upsell-price text-sm font-bold"
                                                      {...previewTargetAttributes('.ab-upsell-price', 'Upsell price')}
                                                    >
                                                      +$32
                                                    </p>
                                                    <p
                                                      className="ab-upsell-added text-xs mt-1"
                                                      {...previewTargetAttributes('.ab-upsell-added', 'Upsell added state')}
                                                    >
                                                      ✓ Added
                                                    </p>
                                                  </div>
                                                </div>
                                                <p
                                                  className="ab-upsell-tooltip text-[11px] mt-2 italic"
                                                  {...previewTargetAttributes('.ab-upsell-tooltip', 'Upsell tooltip')}
                                                >
                                                  💡 Great add-on for homes with pets.
                                                </p>
                                              </div>
                                            </div>
                                          </button>

                                          <button
                                            type="button"
                                            className="ab-upsell-card text-left"
                                            {...previewTargetAttributes('.ab-upsell-card', 'Upsell card')}
                                          >
                                            <div className="ab-upsell-content flex items-start gap-3">
                                              <div className="ab-upsell-icon">
                                                <div className="ab-upsell-icon-fallback">+</div>
                                              </div>
                                              <div className="ab-upsell-main flex-1 min-w-0">
                                                <div className="ab-upsell-header flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <h5 className="ab-upsell-title text-sm font-medium">Appliance Pull-Out Clean</h5>
                                                    <p className="ab-upsell-description text-xs mt-1">
                                                      Behind-stove and fridge debris removal.
                                                    </p>
                                                  </div>
                                                  <div className="ab-upsell-price-wrap text-right">
                                                    <p className="ab-upsell-price text-sm font-bold">+$24</p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </button>
                                        </div>

                                        <div
                                          className="ab-upsell-selected-summary"
                                          {...previewTargetAttributes('.ab-upsell-selected-summary', 'Upsell selected summary')}
                                        >
                                          <p
                                            className="ab-upsell-selected-title text-xs font-semibold"
                                            {...previewTargetAttributes('.ab-upsell-selected-title', 'Upsell selected title')}
                                          >
                                            Add-ons Selected
                                          </p>
                                          <div
                                            className="ab-upsell-selected-row text-xs"
                                            {...previewTargetAttributes('.ab-upsell-selected-row', 'Upsell selected row')}
                                          >
                                            <span
                                              className="ab-upsell-selected-name"
                                              {...previewTargetAttributes('.ab-upsell-selected-name', 'Upsell selected name')}
                                            >
                                              Window Track Detail
                                            </span>
                                            <span
                                              className="ab-upsell-selected-price"
                                              {...previewTargetAttributes('.ab-upsell-selected-price', 'Upsell selected price')}
                                            >
                                              +$32
                                            </span>
                                          </div>
                                          <div
                                            className="ab-upsell-selected-total text-xs"
                                            {...previewTargetAttributes('.ab-upsell-selected-total', 'Upsell selected total')}
                                          >
                                            <span>Total Add-ons</span>
                                            <span>+$32</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="preview-stage">
                                      <p className="preview-stage-title">Stage 6 · Booking + Final CTA</p>
                                      <div
                                        className="ab-calendar-container space-y-4"
                                        {...previewTargetAttributes('.ab-calendar-container', 'Calendar container')}
                                      >
                                        <div>
                                          <h4 className="text-sm font-medium mb-4">Select Date</h4>
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <button
                                                type="button"
                                                className="ab-calendar-nav ab-calendar-nav-prev h-8 w-8 p-0 text-xs"
                                                {...previewTargetAttributes('.ab-calendar-nav-prev', 'Calendar previous button')}
                                              >
                                                &#8249;
                                              </button>
                                              <p
                                                className="ab-calendar-month-title text-lg font-semibold"
                                                {...previewTargetAttributes('.ab-calendar-month-title', 'Calendar month title')}
                                              >
                                                March 2026
                                              </p>
                                              <button
                                                type="button"
                                                className="ab-calendar-nav ab-calendar-nav-next h-8 w-8 p-0 text-xs"
                                                {...previewTargetAttributes('.ab-calendar-nav-next', 'Calendar next button')}
                                              >
                                                &#8250;
                                              </button>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                <span
                                                  key={day}
                                                  className="ab-calendar-day-header text-center text-xs font-medium py-2"
                                                  {...previewTargetAttributes('.ab-calendar-day-header', 'Calendar day header')}
                                                >
                                                  {day}
                                                </span>
                                              ))}
                                            </div>

                                            <div className="grid grid-cols-7 gap-1">
                                              {[
                                                null, null, '1', '2', '3', '4', '5',
                                                '6', '7', '8', '9', '10', '11', '12',
                                                '13', '14', '15', '16', '17', '18', '19',
                                                '20', '21', '22', '23', '24', '25', '26',
                                                '27', '28', '29', '30', '31',
                                              ].map((value, index) => (
                                                value ? (
                                                  <button
                                                    key={`${value}-${index}`}
                                                    type="button"
                                                    className={`ab-calendar-date aspect-square rounded-lg border transition-all relative ${value === '10' ? 'selected shadow-lg scale-105' : value === '8' ? 'ab-calendar-date-past' : value === '12' ? 'ab-calendar-date-unavailable' : 'ab-calendar-date-available'}`}
                                                    {...previewTargetAttributes('.ab-calendar-date', 'Calendar date button')}
                                                  >
                                                    <div className="flex flex-col items-center justify-center h-full">
                                                      <span className="text-sm font-medium">{value}</span>
                                                      {value === '10' && <span className="ab-calendar-date-meta text-[10px]">2 left</span>}
                                                      {value === '12' && <span className="ab-calendar-date-meta text-[10px]">full</span>}
                                                    </div>
                                                  </button>
                                                ) : (
                                                  <div key={`empty-${index}`} className="aspect-square" />
                                                )
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="ab-calendar-legend flex flex-wrap gap-3 text-[11px]">
                                          <span className="ab-calendar-legend-item inline-flex items-center gap-1.5">
                                            <span className="ab-calendar-legend-swatch ab-calendar-legend-swatch-available h-3 w-3 rounded-sm border" />
                                            <span className="ab-calendar-legend-label">Available</span>
                                          </span>
                                          <span className="ab-calendar-legend-item inline-flex items-center gap-1.5">
                                            <span className="ab-calendar-legend-swatch ab-calendar-legend-swatch-selected h-3 w-3 rounded-sm border" />
                                            <span className="ab-calendar-legend-label">Selected</span>
                                          </span>
                                          <span className="ab-calendar-legend-item inline-flex items-center gap-1.5">
                                            <span className="ab-calendar-legend-swatch ab-calendar-legend-swatch-unavailable h-3 w-3 rounded-sm border" />
                                            <span className="ab-calendar-legend-label">Unavailable / Past</span>
                                          </span>
                                        </div>

                                        <div>
                                          <h4 className="text-sm font-medium mb-2">Available Times for March 10, 2026</h4>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                            <button
                                              type="button"
                                              className="ab-time-slot selected flex items-center justify-center p-3 h-auto text-xs"
                                              {...previewTargetAttributes('.ab-time-slot', 'Time slot')}
                                            >
                                              <div className="flex flex-col items-center">
                                                <span className="font-medium">9:00 AM</span>
                                                <span className="ab-time-slot-meta text-[10px]">10:00 AM</span>
                                              </div>
                                            </button>
                                            <button
                                              type="button"
                                              className="ab-time-slot ab-time-slot-available flex items-center justify-center p-3 h-auto text-xs"
                                              {...previewTargetAttributes('.ab-time-slot', 'Time slot')}
                                            >
                                              <div className="flex flex-col items-center">
                                                <span className="font-medium">11:30 AM</span>
                                                <span className="ab-time-slot-meta text-[10px]">12:30 PM</span>
                                              </div>
                                            </button>
                                            <button
                                              type="button"
                                              className="ab-time-slot flex items-center justify-center p-3 h-auto text-xs"
                                              disabled
                                              {...previewTargetAttributes('.ab-time-slot', 'Time slot')}
                                            >
                                              <div className="flex flex-col items-center">
                                                <span className="font-medium">2:00 PM</span>
                                                <span className="ab-time-slot-meta text-[10px]">Booked</span>
                                              </div>
                                            </button>
                                          </div>
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

                                {hoveredPreviewTarget && previewTooltipPosition && (
                                  <div
                                    className="pointer-events-none fixed z-[120] w-[250px] rounded-xl border border-blue-200 dark:border-blue-800 bg-white/95 dark:bg-slate-900/95 px-3 py-2 shadow-xl"
                                    style={{ left: previewTooltipPosition.x, top: previewTooltipPosition.y }}
                                  >
                                    <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Hover target</p>
                                    <p className="mt-1 font-mono text-[11px] text-blue-700 dark:text-blue-300">{hoveredPreviewTarget.selector}</p>
                                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                      Click to open the AI edit modal for this element.
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
                                    Selected <span className="font-mono">{selectedPreviewTarget.selector}</span> ({selectedPreviewTarget.label})
                                  </p>
                                ) : (
                                  <p className="text-xs text-blue-800 dark:text-blue-200">
                                    Click any preview element to open the element edit modal.
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  disabled={!selectedPreviewTarget}
                                  onClick={() => {
                                    if (!selectedPreviewTarget) return;
                                    setAiCSSError('');
                                    setIsTargetedEditModalOpen(true);
                                  }}
                                >
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Edit Selected Element
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={!selectedPreviewTarget}
                                  onClick={() => {
                                    setSelectedPreviewTarget(null);
                                    setTargetedEditPrompt('');
                                    setAiCSSError('');
                                    setIsTargetedEditModalOpen(false);
                                  }}
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <Dialog
                        open={isTargetedEditModalOpen}
                        onOpenChange={(open) => {
                          setIsTargetedEditModalOpen(open);
                          if (!open) {
                            setTargetedEditPrompt('');
                          }
                        }}
                      >
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-base">Edit Selected Element</DialogTitle>
                            <DialogDescription className="text-xs">
                              Describe the visual change and AI will update only this selector block in your custom CSS.
                            </DialogDescription>
                          </DialogHeader>

                          {selectedPreviewTarget ? (
                            <div className="space-y-3">
                              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Target</p>
                                <p className="mt-1 font-mono text-xs text-blue-700 dark:text-blue-300">
                                  {selectedPreviewTarget.selector}
                                </p>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                  {selectedPreviewTarget.label}
                                </p>
                              </div>

                              {!selectedTargetHasCustomBlock && (
                                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                                  No CSS snippet exists for this selector yet. A new block will be added automatically.
                                </div>
                              )}

                              <div className="space-y-1.5">
                                <Label htmlFor="targeted-css-request" className="text-xs font-medium">
                                  Change request
                                </Label>
                                <Textarea
                                  id="targeted-css-request"
                                  value={targetedEditPrompt}
                                  onChange={(event) => setTargetedEditPrompt(event.target.value)}
                                  placeholder={`e.g. Make ${selectedPreviewTarget.label.toLowerCase()} rounded with a softer shadow and subtle hover lift`}
                                  className="min-h-[110px] text-sm"
                                  disabled={isGeneratingCSS}
                                  onKeyDown={(event) => {
                                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                                      event.preventDefault();
                                      handleTargetedEdit();
                                    }
                                  }}
                                />
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Tip: press Ctrl/Cmd + Enter to apply quickly.
                                </p>
                              </div>

                              {aiCSSError && (
                                <p className="text-xs text-red-600">{aiCSSError}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Click a preview element first to target a selector.
                            </p>
                          )}

                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsTargetedEditModalOpen(false);
                                setTargetedEditPrompt('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleTargetedEdit}
                              disabled={!selectedPreviewTarget || !targetedEditPrompt.trim() || isGeneratingCSS}
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
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

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
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-form-title</span> - Step/page titles</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-form-subtitle</span> - Step/page subtitles</div>
                              </div>
                            </div>
                            {/* Progress */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Progress:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-progress</span> - Progress wrapper</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-progress-label</span> - Step label text</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-progress-percentage</span> - Percent text</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-progress-track</span> - Progress track</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-progress-fill</span> - Progress fill</div>
                              </div>
                            </div>
                            {/* Buttons */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Buttons:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-button</span> - All buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-button-primary</span> - Primary buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-address-nav-button</span> - Address nav text buttons</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-address-back-button</span> - Address back button</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-address-skip-button</span> - Address skip button</div>
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
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-address-input-label</span> - Address field label</div>
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
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-service-accordion-text</span> - Accordion text</div>
                              </div>
                            </div>
                            {/* Multiple Choice */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Multiple Choice:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-multiple-choice</span> - Choice cards</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-multichoice-card</span> - Choice cards (alt)</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-multiple-choice-label</span> - Choice card text</div>
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
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-section-title</span> - Packages heading</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-breakdown-title</span> - Breakdown heading</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-pricing-total-value</span> - Final total amount</div>
                              </div>
                            </div>
                            {/* Upsell Cards */}
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Upsell Cards:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-section</span> - Upsell section wrapper</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-heading</span> - Upsell section title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-subtitle</span> - Upsell helper text</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-grid</span> - Upsell card grid</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-card</span> - Upsell card</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-card-selected</span> - Selected upsell card</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-title</span> - Upsell title</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-description</span> - Upsell description</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-price</span> - Upsell price</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-popular-badge</span> - Popular badge</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-tooltip</span> - Upsell tooltip</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-selected-summary</span> - Selected upsell summary</div>
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-upsell-selected-total</span> - Selected upsell total</div>
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
                                <div><span className="text-blue-600 dark:text-blue-400">.ab-calendar-container</span> - Calendar wrapper card</div>
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
                              <div><span className="text-green-600 dark:text-green-400">--ab-service-accordion-text-color</span></div>
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
                            wrap="off"
                            spellCheck={false}
                            autoCapitalize="off"
                            autoCorrect="off"
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
                              Describe changes you want to make to your existing CSS. For element-specific changes, click an element in the Preview Lab.
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
