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
        
        // Service Selector styling
        serviceSelectorBackgroundColor: theme.colors.background,
        serviceSelectorActiveBackgroundColor: theme.colors.primary,
        serviceSelectorHoverBackgroundColor: theme.colors.accent,
        serviceSelectorBorderColor: '#E5E7EB',
        serviceSelectorActiveBorderColor: theme.colors.primary,
        serviceSelectorHoverBorderColor: '#D1D5DB',
        serviceSelectorTextColor: theme.colors.text,
        serviceSelectorSelectedTextColor: '#FFFFFF',
        
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
        
        // Card backgrounds
        questionCardBackgroundColor: theme.colors.background,
        pricingCardBackgroundColor: theme.colors.background
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
                <div className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors bg-white">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex space-x-1">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm border" 
                        style={{ backgroundColor: theme.colors.background }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    <h3 className="font-semibold text-sm">{theme.name}</h3>
                  </div>
                  <div 
                    className="h-12 rounded-md border flex items-center px-3 text-xs"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.primary,
                      color: theme.colors.text
                    }}
                  >
                    <div 
                      className="w-16 h-6 rounded text-white flex items-center justify-center text-xs mr-2"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      Button
                    </div>
                    Sample text
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

      {/* Typography - Titles & Headings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Typography - Titles & Headings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Title Font Family</Label>
              <Select
                value={styling.titleFontFamily || styling.fontFamily || 'inter'}
                onValueChange={(value) => handleStylingChange('titleFontFamily', value)}
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
              <Label className="text-sm font-medium">Title Font Size</Label>
              <Select
                value={styling.titleFontSize || styling.fontSize || 'xl'}
                onValueChange={(value) => handleStylingChange('titleFontSize', value)}
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
            <Label className="text-sm font-medium">Title Font Weight</Label>
            <Select
              value={styling.titleFontWeight || styling.fontWeight || 'semibold'}
              onValueChange={(value) => handleStylingChange('titleFontWeight', value)}
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

      {/* Typography - Question Inputs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Type className="h-5 w-5" />
            <span>Typography - Question Inputs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Input Font Family</Label>
              <Select
                value={styling.inputFontFamily || styling.fontFamily || 'inter'}
                onValueChange={(value) => handleStylingChange('inputFontFamily', value)}
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
              <Label className="text-sm font-medium">Input Font Size</Label>
              <Select
                value={styling.inputFontSize || styling.fontSize || 'base'}
                onValueChange={(value) => handleStylingChange('inputFontSize', value)}
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
            <Label className="text-sm font-medium">Input Font Weight</Label>
            <Select
              value={styling.inputFontWeight || styling.fontWeight || 'normal'}
              onValueChange={(value) => handleStylingChange('inputFontWeight', value)}
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
                fontFamily: styling.titleFontFamily === 'inter' ? 'Inter, sans-serif' : styling.titleFontFamily || 'Inter, sans-serif',
                fontSize: styling.titleFontSize === 'xl' ? '1.25rem' : 
                          styling.titleFontSize === '2xl' ? '1.5rem' :
                          styling.titleFontSize === 'lg' ? '1.125rem' : 
                          styling.titleFontSize === 'base' ? '1rem' :
                          styling.titleFontSize === 'sm' ? '0.875rem' :
                          styling.titleFontSize === 'xs' ? '0.75rem' : '1.25rem',
                fontWeight: styling.titleFontWeight === 'light' ? '300' :
                           styling.titleFontWeight === 'normal' ? '400' :
                           styling.titleFontWeight === 'medium' ? '500' :
                           styling.titleFontWeight === 'semibold' ? '600' :
                           styling.titleFontWeight === 'bold' ? '700' :
                           styling.titleFontWeight === 'extrabold' ? '800' : '600'
              }}
            >
              Sample Title/Heading
            </h3>
            
            <h4 
              className="text-lg font-medium"
              style={{
                fontFamily: styling.titleFontFamily === 'inter' ? 'Inter, sans-serif' : styling.titleFontFamily || 'Inter, sans-serif',
                fontSize: styling.titleFontSize === 'xl' ? '1.125rem' : 
                          styling.titleFontSize === '2xl' ? '1.25rem' :
                          styling.titleFontSize === 'lg' ? '1rem' : 
                          styling.titleFontSize === 'base' ? '0.875rem' :
                          styling.titleFontSize === 'sm' ? '0.75rem' :
                          styling.titleFontSize === 'xs' ? '0.625rem' : '1.125rem',
                fontWeight: styling.titleFontWeight === 'light' ? '300' :
                           styling.titleFontWeight === 'normal' ? '400' :
                           styling.titleFontWeight === 'medium' ? '500' :
                           styling.titleFontWeight === 'semibold' ? '600' :
                           styling.titleFontWeight === 'bold' ? '700' :
                           styling.titleFontWeight === 'extrabold' ? '800' : '500'
              }}
            >
              Sample Subtitle
            </h4>
            
            <p className="text-sm mb-4">Preview of how your titles and subtitles will look.</p>
            
            <div className="space-y-2">
              <label 
                className="block text-sm font-medium"
                style={{
                  fontFamily: styling.inputFontFamily === 'inter' ? 'Inter, sans-serif' : styling.inputFontFamily || 'Inter, sans-serif',
                  fontSize: styling.inputFontSize === 'base' ? '0.875rem' : 
                            styling.inputFontSize === 'lg' ? '1rem' :
                            styling.inputFontSize === 'xl' ? '1.125rem' :
                            styling.inputFontSize === '2xl' ? '1.25rem' :
                            styling.inputFontSize === 'sm' ? '0.75rem' :
                            styling.inputFontSize === 'xs' ? '0.625rem' : '0.875rem',
                  fontWeight: styling.inputFontWeight === 'light' ? '300' :
                             styling.inputFontWeight === 'normal' ? '400' :
                             styling.inputFontWeight === 'medium' ? '500' :
                             styling.inputFontWeight === 'semibold' ? '600' :
                             styling.inputFontWeight === 'bold' ? '700' :
                             styling.inputFontWeight === 'extrabold' ? '800' : '400'
                }}
              >
                Sample Question Label
              </label>
              <div 
                className="p-3 rounded border"
                style={{ 
                  backgroundColor: styling.inputBackgroundColor || '#FFFFFF',
                  borderColor: styling.inputBorderColor || '#D1D5DB',
                  fontFamily: styling.inputFontFamily === 'inter' ? 'Inter, sans-serif' : styling.inputFontFamily || 'Inter, sans-serif',
                  fontSize: styling.inputFontSize === 'base' ? '1rem' : 
                            styling.inputFontSize === 'lg' ? '1.125rem' :
                            styling.inputFontSize === 'xl' ? '1.25rem' :
                            styling.inputFontSize === '2xl' ? '1.5rem' :
                            styling.inputFontSize === 'sm' ? '0.875rem' :
                            styling.inputFontSize === 'xs' ? '0.75rem' : '1rem',
                  fontWeight: styling.inputFontWeight === 'light' ? '300' :
                             styling.inputFontWeight === 'normal' ? '400' :
                             styling.inputFontWeight === 'medium' ? '500' :
                             styling.inputFontWeight === 'semibold' ? '600' :
                             styling.inputFontWeight === 'bold' ? '700' :
                             styling.inputFontWeight === 'extrabold' ? '800' : '400'
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