import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Palette,
  Type,
  Sparkles,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import type { DesignSettings } from '@shared/schema';

interface ThemeEditorProps {
  designSettings: Pick<DesignSettings, 'styling' | 'componentStyles'>;
  onChange: (updates: Partial<Pick<DesignSettings, 'styling' | 'componentStyles'>>) => void;
}

const themePresets = [
  { 
    name: 'Modern', 
    value: 'modern',
    colors: {
      primary: '#2563EB',
      background: '#FFFFFF',
      text: '#1F2937',
      accent: '#F3F4F6'
    },
    typography: {
      titleFontFamily: 'inter',
      titleFontSize: 'xl',
      titleFontWeight: 'semibold',
      inputFontFamily: 'inter',
      inputFontSize: 'base',
      inputFontWeight: 'normal'
    },
    components: {
      questionCard: { borderRadius: 12, borderWidth: 1, shadow: 'md' },
      pricingCard: { borderRadius: 12, borderWidth: 1, shadow: 'lg' },
      button: { borderRadius: 8, borderWidth: 0, shadow: 'sm', height: 44 },
      textInput: { borderRadius: 8, borderWidth: 1, shadow: 'none', height: 44 },
      dropdown: { borderRadius: 8, borderWidth: 1, shadow: 'none', height: 44 },
      slider: { borderRadius: 999, borderWidth: 0, shadow: 'none' },
      serviceSelector: { borderRadius: 8, borderWidth: 2, shadow: 'sm' }
    }
  },
  { 
    name: 'Professional', 
    value: 'professional',
    colors: {
      primary: '#059669',
      background: '#F9FAFB',
      text: '#111827',
      accent: '#ECFDF5'
    },
    typography: {
      titleFontFamily: 'roboto',
      titleFontSize: 'lg',
      titleFontWeight: 'bold',
      inputFontFamily: 'roboto',
      inputFontSize: 'sm',
      inputFontWeight: 'normal'
    },
    components: {
      questionCard: { borderRadius: 6, borderWidth: 2, shadow: 'sm' },
      pricingCard: { borderRadius: 6, borderWidth: 2, shadow: 'md' },
      button: { borderRadius: 6, borderWidth: 0, shadow: 'md', height: 40 },
      textInput: { borderRadius: 4, borderWidth: 2, shadow: 'none', height: 40 },
      dropdown: { borderRadius: 4, borderWidth: 2, shadow: 'none', height: 40 },
      slider: { borderRadius: 999, borderWidth: 0, shadow: 'none' },
      serviceSelector: { borderRadius: 6, borderWidth: 2, shadow: 'sm' }
    }
  },
  { 
    name: 'Vibrant', 
    value: 'vibrant',
    colors: {
      primary: '#DC2626',
      background: '#FFFFFF',
      text: '#1F2937',
      accent: '#FEF2F2'
    },
    typography: {
      titleFontFamily: 'montserrat',
      titleFontSize: '2xl',
      titleFontWeight: 'extrabold',
      inputFontFamily: 'opensans',
      inputFontSize: 'base',
      inputFontWeight: 'medium'
    },
    components: {
      questionCard: { borderRadius: 16, borderWidth: 3, shadow: 'lg' },
      pricingCard: { borderRadius: 20, borderWidth: 3, shadow: 'xl' },
      button: { borderRadius: 999, borderWidth: 0, shadow: 'lg', height: 48 },
      textInput: { borderRadius: 12, borderWidth: 2, shadow: 'sm', height: 48 },
      dropdown: { borderRadius: 12, borderWidth: 2, shadow: 'sm', height: 48 },
      slider: { borderRadius: 999, borderWidth: 0, shadow: 'sm' },
      serviceSelector: { borderRadius: 16, borderWidth: 3, shadow: 'md' }
    }
  },
  { 
    name: 'Minimal', 
    value: 'minimal',
    colors: {
      primary: '#6B7280',
      background: '#FFFFFF',
      text: '#374151',
      accent: '#F9FAFB'
    },
    typography: {
      titleFontFamily: 'system',
      titleFontSize: 'lg',
      titleFontWeight: 'medium',
      inputFontFamily: 'system',
      inputFontSize: 'base',
      inputFontWeight: 'light'
    },
    components: {
      questionCard: { borderRadius: 0, borderWidth: 0, shadow: 'none' },
      pricingCard: { borderRadius: 0, borderWidth: 1, shadow: 'none' },
      button: { borderRadius: 0, borderWidth: 2, shadow: 'none', height: 40 },
      textInput: { borderRadius: 0, borderWidth: 1, shadow: 'none', height: 40 },
      dropdown: { borderRadius: 0, borderWidth: 1, shadow: 'none', height: 40 },
      slider: { borderRadius: 0, borderWidth: 0, shadow: 'none' },
      serviceSelector: { borderRadius: 0, borderWidth: 1, shadow: 'none' }
    }
  },
  { 
    name: 'Elegant', 
    value: 'elegant',
    colors: {
      primary: '#7C3AED',
      background: '#FEFEFE',
      text: '#1F2937',
      accent: '#F5F3FF'
    },
    typography: {
      titleFontFamily: 'georgia',
      titleFontSize: 'xl',
      titleFontWeight: 'semibold',
      inputFontFamily: 'lato',
      inputFontSize: 'base',
      inputFontWeight: 'normal'
    },
    components: {
      questionCard: { borderRadius: 10, borderWidth: 1, shadow: 'sm' },
      pricingCard: { borderRadius: 14, borderWidth: 1, shadow: 'md' },
      button: { borderRadius: 24, borderWidth: 0, shadow: 'md', height: 42 },
      textInput: { borderRadius: 10, borderWidth: 1, shadow: 'sm', height: 42 },
      dropdown: { borderRadius: 10, borderWidth: 1, shadow: 'sm', height: 42 },
      slider: { borderRadius: 999, borderWidth: 0, shadow: 'none' },
      serviceSelector: { borderRadius: 10, borderWidth: 1, shadow: 'sm' }
    }
  },
  { 
    name: 'Dark', 
    value: 'dark',
    colors: {
      primary: '#3B82F6',
      background: '#111827',
      text: '#F9FAFB',
      accent: '#374151'
    },
    typography: {
      titleFontFamily: 'inter',
      titleFontSize: 'xl',
      titleFontWeight: 'bold',
      inputFontFamily: 'inter',
      inputFontSize: 'base',
      inputFontWeight: 'normal'
    },
    components: {
      questionCard: { borderRadius: 8, borderWidth: 1, shadow: 'lg' },
      pricingCard: { borderRadius: 8, borderWidth: 1, shadow: 'xl' },
      button: { borderRadius: 6, borderWidth: 0, shadow: 'lg', height: 44 },
      textInput: { borderRadius: 6, borderWidth: 1, shadow: 'md', height: 44 },
      dropdown: { borderRadius: 6, borderWidth: 1, shadow: 'md', height: 44 },
      slider: { borderRadius: 999, borderWidth: 0, shadow: 'sm' },
      serviceSelector: { borderRadius: 8, borderWidth: 1, shadow: 'md' }
    }
  }
];

const fontOptions = [
  { label: 'Inter (Default)', value: 'inter' },
  { label: 'System UI', value: 'system' },
  { label: 'Arial', value: 'arial' },
  { label: 'Helvetica', value: 'helvetica' },
  { label: 'Georgia', value: 'georgia' },
  { label: 'Times New Roman', value: 'times' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Open Sans', value: 'opensans' },
  { label: 'Lato', value: 'lato' },
  { label: 'Montserrat', value: 'montserrat' },
];

const textSizeOptions = [
  { label: 'Extra Small', value: 'xs' },
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'base' },
  { label: 'Large', value: 'lg' },
  { label: 'Extra Large', value: 'xl' },
  { label: '2X Large', value: '2xl' },
];

const fontWeightOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Normal', value: 'normal' },
  { label: 'Medium', value: 'medium' },
  { label: 'Semibold', value: 'semibold' },
  { label: 'Bold', value: 'bold' },
  { label: 'Extra Bold', value: 'extrabold' },
];

export default function ThemeEditor({ designSettings, onChange }: ThemeEditorProps) {
  const styling = designSettings?.styling || {};
  
  const handleStylingChange = (key: string, value: any) => {
    onChange({
      styling: {
        ...styling,
        [key]: value
      }
    });
  };

  const applyThemePreset = (theme: typeof themePresets[0]) => {
    onChange({
      styling: {
        ...styling,
        // Core theme colors
        primaryColor: theme.colors.primary,
        backgroundColor: theme.colors.background,
        textColor: theme.colors.text,
        pricingAccentColor: theme.colors.accent,
        
        // Typography (using base font settings from theme)
        fontFamily: theme.typography.titleFontFamily as any,
        fontSize: theme.typography.titleFontSize as any,
        fontWeight: theme.typography.titleFontWeight as any,
        
        // Service Selector styling with component-specific settings
        serviceSelectorBackgroundColor: theme.colors.background,
        serviceSelectorActiveBackgroundColor: theme.colors.primary,
        serviceSelectorHoverBackgroundColor: theme.colors.accent,
        serviceSelectorBorderColor: '#E5E7EB',
        serviceSelectorActiveBorderColor: theme.colors.primary,
        serviceSelectorHoverBorderColor: '#D1D5DB',
        serviceSelectorTextColor: theme.colors.text,
        serviceSelectorSelectedTextColor: '#FFFFFF',
        serviceSelectorBorderRadius: theme.components.serviceSelector.borderRadius,
        serviceSelectorBorderWidth: theme.components.serviceSelector.borderWidth,
        serviceSelectorShadow: theme.components.serviceSelector.shadow as any,
        
        // Input field styling
        inputBackgroundColor: theme.colors.background,
        inputBorderColor: '#E5E7EB',
        inputTextColor: theme.colors.text,
        inputPlaceholderColor: '#9CA3AF',
        
        // Multiple Choice styling
        multipleChoiceActiveBackgroundColor: theme.colors.primary,
        multipleChoiceActiveBorderColor: theme.colors.primary,
        multipleChoiceHoverBackgroundColor: theme.colors.accent,
        multipleChoiceHoverBorderColor: '#D1D5DB',
        
        // Button styling
        buttonBackgroundColor: theme.colors.primary,
        buttonTextColor: '#FFFFFF',
        buttonHoverBackgroundColor: theme.colors.primary,
        buttonHoverTextColor: '#FFFFFF',
        
        // Card styling
        questionCardBackgroundColor: theme.colors.background,
        questionCardBorderRadius: theme.components.questionCard.borderRadius,
        questionCardBorderWidth: theme.components.questionCard.borderWidth,
        questionCardBorderColor: '#E5E7EB',
        questionCardShadow: theme.components.questionCard.shadow as any,
        
        pricingCardBackgroundColor: theme.colors.background,
        pricingCardBorderRadius: theme.components.pricingCard.borderRadius,
        pricingCardBorderWidth: theme.components.pricingCard.borderWidth,
        pricingCardBorderColor: '#E5E7EB',
        pricingCardShadow: theme.components.pricingCard.shadow as any
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Theme Presets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {themePresets.map((theme) => (
              <div
                key={theme.value}
                className="relative cursor-pointer group"
                onClick={() => applyThemePreset(theme)}
              >
                <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors bg-white dark:bg-gray-800">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex space-x-1 flex-shrink-0">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm border dark:border-gray-600" 
                        style={{ backgroundColor: theme.colors.background }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    <h3 className="font-semibold text-sm truncate dark:text-white">{theme.name}</h3>
                  </div>
                  <div 
                    className="h-12 rounded-md border flex items-center px-3 text-xs overflow-hidden"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.primary,
                      color: theme.colors.text
                    }}
                  >
                    <div 
                      className="w-16 h-6 rounded text-white flex-shrink-0 flex items-center justify-center text-[10px] mr-2"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      Button
                    </div>
                    <span className="truncate">Sample text</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Colors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Primary Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  type="color"
                  value={styling.primaryColor || '#2563EB'}
                  onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={styling.primaryColor || '#2563EB'}
                  onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="#2563EB"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Background Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  type="color"
                  value={styling.backgroundColor || '#FFFFFF'}
                  onChange={(e) => handleStylingChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={styling.backgroundColor || '#FFFFFF'}
                  onChange={(e) => handleStylingChange('backgroundColor', e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Text Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  type="color"
                  value={styling.textColor || '#1F2937'}
                  onChange={(e) => handleStylingChange('textColor', e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={styling.textColor || '#1F2937'}
                  onChange={(e) => handleStylingChange('textColor', e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="#1F2937"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Accent Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  type="color"
                  value={styling.pricingAccentColor || '#2563EB'}
                  onChange={(e) => handleStylingChange('pricingAccentColor', e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={styling.pricingAccentColor || '#2563EB'}
                  onChange={(e) => handleStylingChange('pricingAccentColor', e.target.value)}
                  className="flex-1 text-sm"
                  placeholder="#2563EB"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Typography</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Font Family</Label>
              <Select
                value={styling.fontFamily || 'inter'}
                onValueChange={(value) => handleStylingChange('fontFamily', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="open-sans">Open Sans</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                  <SelectItem value="montserrat">Montserrat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Font Size</Label>
              <Select
                value={styling.fontSize || 'base'}
                onValueChange={(value) => handleStylingChange('fontSize', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="w-1/2">
            <Label className="text-sm font-medium">Font Weight</Label>
            <Select
              value={styling.fontWeight || 'medium'}
              onValueChange={(value) => handleStylingChange('fontWeight', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="semibold">Semibold</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Remove the duplicate Typography - Question Inputs card */}
      <Card style={{ display: 'none' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Typography - Question Inputs (Deprecated)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Input Font Family (Deprecated)</Label>
              <Select
                value={styling.fontFamily || 'inter'}
                onValueChange={(value) => handleStylingChange('fontFamily', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Input Font Size (Deprecated)</Label>
              <Select
                value={styling.fontSize || 'base'}
                onValueChange={(value) => handleStylingChange('fontSize', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {textSizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="w-1/2">
            <Label className="text-sm font-medium">Font Weight (Deprecated)</Label>
            <Select
              value={styling.fontWeight || 'normal'}
              onValueChange={(value) => handleStylingChange('fontWeight', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontWeightOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>Theme Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 rounded-lg border-2 space-y-4"
            style={{
              backgroundColor: styling.backgroundColor || '#FFFFFF',
              borderColor: styling.primaryColor || '#2563EB',
              color: styling.textColor || '#1F2937'
            }}
          >
            <h3 
              className="text-xl font-semibold"
              style={{
                fontFamily: styling.fontFamily === 'inter' ? 'Inter, sans-serif' : 
                          styling.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
                          styling.fontFamily === 'open-sans' ? 'Open Sans, sans-serif' :
                          styling.fontFamily === 'lato' ? 'Lato, sans-serif' :
                          styling.fontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
                          styling.fontFamily || 'Inter, sans-serif',
                fontSize: styling.fontSize === 'lg' ? '1.125rem' : 
                          styling.fontSize === 'base' ? '1rem' :
                          styling.fontSize === 'sm' ? '0.875rem' : '1rem',
                fontWeight: styling.fontWeight === 'normal' ? '400' :
                           styling.fontWeight === 'medium' ? '500' :
                           styling.fontWeight === 'semibold' ? '600' :
                           styling.fontWeight === 'bold' ? '700' : '500'
              }}
            >
              Sample Title/Heading
            </h3>
            
            <p className="text-sm mb-4">Preview of how your form text will look.</p>
            
            <div className="space-y-2">
              <label 
                className="block text-sm font-medium"
                style={{
                  fontFamily: styling.fontFamily === 'inter' ? 'Inter, sans-serif' : 
                            styling.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
                            styling.fontFamily === 'opensans' ? 'Open Sans, sans-serif' :
                            styling.fontFamily === 'lato' ? 'Lato, sans-serif' :
                            styling.fontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
                            styling.fontFamily || 'Inter, sans-serif',
                  fontSize: styling.fontSize === 'lg' ? '0.875rem' : 
                            styling.fontSize === 'base' ? '0.8125rem' :
                            styling.fontSize === 'sm' ? '0.75rem' : '0.8125rem',
                  fontWeight: styling.fontWeight === 'normal' ? '400' :
                             styling.fontWeight === 'medium' ? '500' :
                             styling.fontWeight === 'semibold' ? '600' :
                             styling.fontWeight === 'bold' ? '700' : '500'
                }}
              >
                Sample Question Label
              </label>
              <div 
                className="p-3 rounded border"
                style={{ 
                  backgroundColor: styling.inputBackgroundColor || '#FFFFFF',
                  borderColor: styling.inputBorderColor || '#D1D5DB',
                  fontFamily: styling.fontFamily === 'inter' ? 'Inter, sans-serif' : 
                            styling.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
                            styling.fontFamily === 'opensans' ? 'Open Sans, sans-serif' :
                            styling.fontFamily === 'lato' ? 'Lato, sans-serif' :
                            styling.fontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
                            styling.fontFamily || 'Inter, sans-serif',
                  fontSize: styling.fontSize === 'lg' ? '1rem' : 
                            styling.fontSize === 'base' ? '0.9375rem' :
                            styling.fontSize === 'sm' ? '0.875rem' : '0.9375rem',
                  fontWeight: styling.fontWeight === 'normal' ? '400' :
                             styling.fontWeight === 'medium' ? '500' :
                             styling.fontWeight === 'semibold' ? '600' :
                             styling.fontWeight === 'bold' ? '700' : '400'
                }}
              >
                Sample Input Field Text
              </div>
            </div>
            
            <div 
              className="inline-block px-4 py-2 rounded text-white text-sm font-medium"
              style={{ backgroundColor: styling.primaryColor || '#2563EB' }}
            >
              Sample Button
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}