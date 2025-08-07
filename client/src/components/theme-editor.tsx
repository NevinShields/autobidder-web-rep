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
import type { StylingOptions } from '@shared/schema';

interface ThemeEditorProps {
  styling: StylingOptions;
  onChange: (key: keyof StylingOptions, value: any) => void;
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

export default function ThemeEditor({ styling, onChange }: ThemeEditorProps) {
  const applyThemePreset = (theme: typeof themePresets[0]) => {
    onChange('primaryColor', theme.colors.primary);
    onChange('backgroundColor', theme.colors.background);
    onChange('textColor', theme.colors.text);
    onChange('backgroundColor', theme.colors.accent);
    onChange('inputBackgroundColor', theme.colors.background);
    onChange('questionCardBackgroundColor', theme.colors.background);
    onChange('serviceSelectorBackgroundColor', theme.colors.background);
    onChange('pricingCardBackgroundColor', theme.colors.background);
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
          <div className="grid grid-cols-3 gap-3">
            {themePresets.map((theme) => (
              <Button
                key={theme.value}
                variant="outline"
                className="h-auto p-3 flex flex-col items-center space-y-2 hover:shadow-md transition-all"
                onClick={() => applyThemePreset(theme)}
              >
                <div className="flex space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: theme.colors.primary }} 
                  />
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: theme.colors.background, border: '1px solid #e5e7eb' }} 
                  />
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: theme.colors.accent }} 
                  />
                </div>
                <span className="text-xs font-medium">{theme.name}</span>
              </Button>
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
                  value={styling.primaryColor}
                  onChange={(e) => onChange('primaryColor', e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={styling.primaryColor}
                  onChange={(e) => onChange('primaryColor', e.target.value)}
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
                  value={styling.backgroundColor}
                  onChange={(e) => onChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={styling.backgroundColor}
                  onChange={(e) => onChange('backgroundColor', e.target.value)}
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
                  value={styling.textColor}
                  onChange={(e) => onChange('textColor', e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={styling.textColor}
                  onChange={(e) => onChange('textColor', e.target.value)}
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
                  value={styling.pricingAccentColor}
                  onChange={(e) => onChange('pricingAccentColor', e.target.value)}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={styling.pricingAccentColor}
                  onChange={(e) => onChange('pricingAccentColor', e.target.value)}
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
                value={styling.fontFamily}
                onValueChange={(value) => onChange('fontFamily', value)}
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
              <Label className="text-sm font-medium">Font Size</Label>
              <Select
                value={styling.fontSize}
                onValueChange={(value) => onChange('fontSize', value)}
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
            <Label className="text-sm font-medium">Font Weight</Label>
            <Select
              value={styling.fontWeight}
              onValueChange={(value) => onChange('fontWeight', value)}
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
              backgroundColor: styling.backgroundColor,
              borderColor: styling.primaryColor,
              color: styling.textColor,
              fontFamily: styling.fontFamily === 'inter' ? 'Inter, sans-serif' : styling.fontFamily
            }}
          >
            <h3 className="text-xl font-semibold">Sample Heading</h3>
            <p className="text-sm">This is how your text will appear with the current theme settings.</p>
            <div 
              className="inline-block px-4 py-2 rounded text-white text-sm font-medium"
              style={{ backgroundColor: styling.primaryColor }}
            >
              Sample Button
            </div>
            <div 
              className="p-3 rounded border"
              style={{ 
                backgroundColor: styling.inputBackgroundColor,
                borderColor: styling.inputBorderColor 
              }}
            >
              Sample Input Field
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}