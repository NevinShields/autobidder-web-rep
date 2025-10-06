import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RgbaColorPicker } from 'react-colorful';
import { 
  ChevronDown, 
  ChevronRight, 
  Move, 
  Maximize2, 
  Settings,
  Eye,
  EyeOff,
  MousePointer2,
  Palette,
  Type,
  Image,
  Droplet
} from 'lucide-react';

interface ComponentStyle {
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  shadow: string;
  height: number;
  width: string;
  padding: number;
  margin: number;
  borderRadius: number;
  customCSS?: string;
  fontSize?: string;
  textColor?: string;
}

interface VisualComponentEditorProps {
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  componentType: 'service-selector' | 'text-input' | 'dropdown' | 'multiple-choice' | 'slider' | 'question-card' | 'question-container' | 'pricing-card' | 'button';
  style: ComponentStyle;
  onStyleChange: (updates: Partial<ComponentStyle>) => void;
  onRealTimeChange?: (updates: Partial<ComponentStyle>) => void;
  // Service selector specific props
  styling?: any;
  onStylingChange?: (key: any, value: any) => void;
}

const shadowOptions = [
  { label: 'None', value: 'none' },
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
  { label: 'Extra Large', value: 'xl' },
  { label: '2X Large', value: '2xl' }
];

const widthOptions = [
  { label: 'Full Width', value: 'full' },
  { label: '75%', value: '3/4' },
  { label: '50%', value: '1/2' },
  { label: '33%', value: '1/3' },
  { label: '25%', value: '1/4' },
  { label: 'Auto', value: 'auto' }
];

const iconPositionOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' }
];

const iconSizeUnitOptions = [
  { label: 'Preset Size', value: 'preset' },
  { label: 'Pixels', value: 'pixels' },
  { label: 'Percentage', value: 'percent' }
];

const iconPresetSizeOptions = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
  { label: 'Extra Large', value: 'xl' }
];

export default function VisualComponentEditor({
  title,
  description,
  isExpanded,
  onToggle,
  componentType,
  style = {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadow: 'sm',
    height: 40,
    width: 'full',
    padding: 12,
    margin: 4,
    borderRadius: 8,
  },
  onStyleChange,
  onRealTimeChange,
  styling = {},
  onStylingChange
}: VisualComponentEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewStyle, setPreviewStyle] = useState<Partial<ComponentStyle>>({});
  const [showTransparency, setShowTransparency] = useState<Record<string, boolean>>({});
  const componentRef = useRef<HTMLDivElement>(null);

  const toggleTransparency = (field: string) => {
    setShowTransparency(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any color picker
      if (!target.closest('.color-picker-container')) {
        setShowTransparency({});
      }
    };

    if (Object.keys(showTransparency).some(key => showTransparency[key])) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTransparency]);

  // Helper functions to convert between hex+alpha and rgba
  const hexToRgba = (hex: string, alpha: number = 100) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b, a: alpha / 100 };
  };

  const rgbaToHex = (rgba: { r: number; g: number; b: number; a: number }) => {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  };

  const rgbaToAlpha = (rgba: { r: number; g: number; b: number; a: number }) => {
    return Math.round(rgba.a * 100);
  };

  // Real-time preview functionality
  const handleRealTimeUpdate = (updates: Partial<ComponentStyle>) => {
    setPreviewStyle(prev => ({ ...prev, ...updates }));
    onRealTimeChange?.(updates);
  };

  const handleFinalUpdate = (updates: Partial<ComponentStyle>) => {
    onStyleChange(updates);
    setPreviewStyle(prev => ({ ...prev, ...updates }));
  };

  // Drag and drop functionality for resizing
  const handleMouseDown = (e: React.MouseEvent, type: 'resize' | 'corner') => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (type === 'resize') {
        // Handle height/width adjustment
        const newHeight = Math.max(32, style.height + deltaY);
        handleRealTimeUpdate({ height: newHeight });
      } else if (type === 'corner') {
        // Handle border radius adjustment
        const radiusDelta = Math.round(deltaX / 5);
        const newRadius = Math.max(0, Math.min(50, style.borderRadius + radiusDelta));
        handleRealTimeUpdate({ borderRadius: newRadius });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Apply final changes
      if (type === 'resize') {
        handleFinalUpdate({ height: previewStyle.height || style.height });
      } else if (type === 'corner') {
        handleFinalUpdate({ borderRadius: previewStyle.borderRadius || style.borderRadius });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Get example component based on type
  const renderExampleComponent = () => {
    const defaultStyle = {
      borderColor: '#E5E7EB',
      borderWidth: 1,
      backgroundColor: '#FFFFFF',
      shadow: 'sm',
      height: 40,
      width: 'full',
      padding: 12,
      margin: 4,
      borderRadius: 8,
    };
    const currentStyle = { 
      ...defaultStyle,
      ...style, 
      ...previewStyle 
    };
    const commonClasses = `
      relative border-2 transition-all duration-200 cursor-pointer
      ${isDragging ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'}
    `;

    const shadowClass = {
      'none': 'shadow-none',
      'sm': 'shadow-sm',
      'md': 'shadow-md', 
      'lg': 'shadow-lg',
      'xl': 'shadow-xl',
      '2xl': 'shadow-2xl'
    }[currentStyle.shadow] || 'shadow-sm';

    const widthClass = {
      'full': 'w-full',
      '3/4': 'w-3/4',
      '1/2': 'w-1/2', 
      '1/3': 'w-1/3',
      '1/4': 'w-1/4',
      'auto': 'w-auto'
    }[currentStyle.width] || 'w-full';

    switch (componentType) {
      case 'service-selector':
        return (
          <div 
            ref={componentRef}
            className={`${commonClasses} ${shadowClass} ${widthClass} p-4 text-center`}
            style={{
              borderColor: currentStyle.borderColor,
              borderWidth: `${currentStyle.borderWidth}px`,
              backgroundColor: currentStyle.backgroundColor,
              borderRadius: `${currentStyle.borderRadius}px`,
              height: `${currentStyle.height}px`,
              padding: `${currentStyle.padding}px`,
              margin: `${currentStyle.margin}px`,
            }}
          >
            <div className="text-lg font-semibold mb-2">Example Service</div>
            <div className="text-sm text-gray-600">Service description here</div>
            
            {/* Resize handles */}
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              title="Drag to resize"
            />
            <div 
              className="absolute top-2 right-2 w-3 h-3 bg-green-500 cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full"
              onMouseDown={(e) => handleMouseDown(e, 'corner')}
              title="Drag to adjust border radius"
            />
          </div>
        );

      case 'text-input':
      case 'dropdown':
        return (
          <div className={`${widthClass}`}>
            <input
              className={`${commonClasses} ${shadowClass} w-full`}
              style={{
                borderColor: currentStyle.borderColor,
                borderWidth: `${currentStyle.borderWidth}px`,
                backgroundColor: currentStyle.backgroundColor,
                borderRadius: `${currentStyle.borderRadius}px`,
                height: `${currentStyle.height}px`,
                padding: `${currentStyle.padding}px`,
                margin: `${currentStyle.margin}px`,
              }}
              placeholder={componentType === 'text-input' ? 'Text input example' : 'Dropdown example'}
              disabled
            />
            
            {/* Resize handles */}
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              title="Drag to resize"
            />
            <div 
              className="absolute top-2 right-2 w-3 h-3 bg-green-500 cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full"
              onMouseDown={(e) => handleMouseDown(e, 'corner')}
              title="Drag to adjust border radius"
            />
          </div>
        );

      case 'multiple-choice':
        return (
          <div className={`${widthClass} space-y-2`}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`${commonClasses} ${shadowClass} flex items-center p-3`}
                style={{
                  borderColor: currentStyle.borderColor,
                  borderWidth: `${currentStyle.borderWidth}px`,
                  backgroundColor: currentStyle.backgroundColor,
                  borderRadius: `${currentStyle.borderRadius}px`,
                  padding: `${currentStyle.padding}px`,
                  margin: `${currentStyle.margin}px`,
                }}
              >
                <div className="w-4 h-4 bg-gray-300 rounded-full mr-3" />
                <span>Option {i}</span>
              </div>
            ))}
            
            {/* Resize handles */}
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              title="Drag to resize"
            />
            <div 
              className="absolute top-2 right-2 w-3 h-3 bg-green-500 cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full"
              onMouseDown={(e) => handleMouseDown(e, 'corner')}
              title="Drag to adjust border radius"
            />
          </div>
        );

      case 'slider':
        // Slider only shows color effects
        return (
          <div className={`${widthClass} p-4`}>
            <div 
              className="h-2 rounded-full"
              style={{ backgroundColor: currentStyle.backgroundColor }}
            />
            <div className="text-sm text-gray-600 mt-2">Slider value: 50</div>
          </div>
        );

      case 'question-card':
        return (
          <div 
            ref={componentRef}
            className={`${commonClasses} ${shadowClass} ${widthClass} p-4`}
            style={{
              borderColor: currentStyle.borderColor,
              borderWidth: `${currentStyle.borderWidth}px`,
              backgroundColor: currentStyle.backgroundColor,
              borderRadius: `${currentStyle.borderRadius}px`,
              padding: `${currentStyle.padding}px`,
              margin: `${currentStyle.margin}px`,
            }}
          >
            <h3 className="text-lg font-semibold mb-3">Question Title</h3>
            <p className="text-gray-600 mb-4">Question description goes here...</p>
            <input className="w-full p-2 border rounded" placeholder="Your answer" />
            
            {/* Border radius handle only */}
            <div 
              className="absolute top-2 right-2 w-3 h-3 bg-green-500 cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full"
              onMouseDown={(e) => handleMouseDown(e, 'corner')}
              title="Drag to adjust border radius"
            />
          </div>
        );

      case 'pricing-card':
        return (
          <div 
            ref={componentRef}
            className={`${commonClasses} ${shadowClass} ${widthClass} p-4 text-center`}
            style={{
              borderColor: currentStyle.borderColor,
              borderWidth: `${currentStyle.borderWidth}px`,
              backgroundColor: currentStyle.backgroundColor,
              borderRadius: `${currentStyle.borderRadius}px`,
              height: `${currentStyle.height}px`,
              padding: `${currentStyle.padding}px`,
              margin: `${currentStyle.margin}px`,
            }}
          >
            <div className="text-2xl font-bold text-green-600 mb-2">$1,250</div>
            <div className="text-sm text-gray-600">Total Project Cost</div>
            
            {/* Resize handles */}
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              title="Drag to resize"
            />
            <div 
              className="absolute top-2 right-2 w-3 h-3 bg-green-500 cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full"
              onMouseDown={(e) => handleMouseDown(e, 'corner')}
              title="Drag to adjust border radius"
            />
          </div>
        );

      case 'button':
        return (
          <div className={`${widthClass} flex justify-center`}>
            <button
              className={`${commonClasses} ${shadowClass} px-6 py-3 font-medium transition-colors`}
              style={{
                borderColor: currentStyle.borderColor,
                borderWidth: `${currentStyle.borderWidth}px`,
                backgroundColor: currentStyle.backgroundColor,
                borderRadius: `${currentStyle.borderRadius}px`,
                height: `${currentStyle.height}px`,
                padding: `${currentStyle.padding}px`,
                margin: `${currentStyle.margin}px`,
                color: currentStyle.textColor || '#ffffff',
                fontSize: currentStyle.fontSize === 'xs' ? '12px' :
                         currentStyle.fontSize === 'sm' ? '14px' :
                         currentStyle.fontSize === 'lg' ? '18px' :
                         currentStyle.fontSize === 'xl' ? '20px' : '16px'
              }}
            >
              Get Quote
            </button>
            
            {/* Resize handles */}
            <div 
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
              title="Drag to resize"
            />
            <div 
              className="absolute top-2 right-2 w-3 h-3 bg-green-500 cursor-pointer opacity-0 hover:opacity-100 transition-opacity rounded-full"
              onMouseDown={(e) => handleMouseDown(e, 'corner')}
              title="Drag to adjust border radius"
            />
          </div>
        );

      default:
        return (
          <div className={`${commonClasses} ${shadowClass} ${widthClass} p-4`}>
            <span>Component Preview</span>
          </div>
        );
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 pt-0">
        <div 
          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded"
          onClick={onToggle}
        >
          <div className="flex items-center space-x-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <div className="flex flex-col justify-center">
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {componentType}
          </Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2">
          {/* Visual Preview - Compact */}
          <div className="mb-4">
            <Label className="text-xs font-medium mb-1 block">Preview</Label>
            <div className="border rounded-lg p-3 bg-gray-50 min-h-20 relative">
              {renderExampleComponent()}
            </div>
          </div>

          {/* Style Controls - Compact Grid Layout */}
          <div className="space-y-3">
            {/* Colors & Border - All in one row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <Label className="text-xs font-medium">Border Color</Label>
                <div className="space-y-1 mt-1 relative color-picker-container">
                  <div className="flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTransparency('borderColor')}
                      className="h-6 w-6 p-0 rounded"
                      style={{ backgroundColor: style.borderColor || '#E5E7EB' }}
                      data-testid="button-color-picker-border"
                    >
                      <span className="sr-only">Pick color</span>
                    </Button>
                    <Input
                      type="text"
                      value={style.borderColor || '#E5E7EB'}
                      onChange={(e) => {
                        handleRealTimeUpdate({ borderColor: e.target.value });
                        handleFinalUpdate({ borderColor: e.target.value });
                      }}
                      className="flex-1 text-xs h-6"
                      placeholder="#E5E7EB"
                    />
                    <span className="text-xs text-gray-500 min-w-10">{style.borderColorAlpha ?? 100}%</span>
                  </div>
                  {showTransparency.borderColor && (
                    <div className="p-2 border rounded-md bg-white shadow-lg absolute z-50 top-8 left-0">
                      <RgbaColorPicker
                        color={hexToRgba(style.borderColor || '#E5E7EB', style.borderColorAlpha ?? 100)}
                        onChange={(color) => {
                          const hex = rgbaToHex(color);
                          const alpha = rgbaToAlpha(color);
                          handleRealTimeUpdate({ borderColor: hex, borderColorAlpha: alpha });
                          handleFinalUpdate({ borderColor: hex, borderColorAlpha: alpha });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Background</Label>
                <div className="space-y-1 mt-1 relative color-picker-container">
                  <div className="flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTransparency('backgroundColor')}
                      className="h-6 w-6 p-0 rounded"
                      style={{ backgroundColor: style.backgroundColor || '#FFFFFF' }}
                      data-testid="button-color-picker-background"
                    >
                      <span className="sr-only">Pick color</span>
                    </Button>
                    <Input
                      type="text"
                      value={style.backgroundColor || '#FFFFFF'}
                      onChange={(e) => {
                        if (componentType === 'button' && onStylingChange) {
                          onStylingChange('buttonBackgroundColor', e.target.value);
                        }
                        if (componentType === 'service-selector' && onStylingChange) {
                          onStylingChange('serviceSelectorBackgroundColor', e.target.value);
                        }
                        handleRealTimeUpdate({ backgroundColor: e.target.value });
                        handleFinalUpdate({ backgroundColor: e.target.value });
                      }}
                      className="flex-1 text-xs h-6"
                      placeholder="#FFFFFF"
                    />
                    <span className="text-xs text-gray-500 min-w-10">{style.backgroundColorAlpha ?? 100}%</span>
                  </div>
                  {showTransparency.backgroundColor && (
                    <div className="p-2 border rounded-md bg-white shadow-lg absolute z-50 top-8 left-0">
                      <RgbaColorPicker
                        color={hexToRgba(style.backgroundColor || '#FFFFFF', style.backgroundColorAlpha ?? 100)}
                        onChange={(color) => {
                          const hex = rgbaToHex(color);
                          const alpha = rgbaToAlpha(color);
                          if (componentType === 'button' && onStylingChange) {
                            onStylingChange('buttonBackgroundColor', hex);
                          }
                          if (componentType === 'service-selector' && onStylingChange) {
                            onStylingChange('serviceSelectorBackgroundColor', hex);
                          }
                          handleRealTimeUpdate({ backgroundColor: hex, backgroundColorAlpha: alpha });
                          handleFinalUpdate({ backgroundColor: hex, backgroundColorAlpha: alpha });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Border Width</Label>
                <div className="mt-1">
                  <Slider
                    value={[style.borderWidth ?? 1]}
                    onValueChange={([value]) => handleRealTimeUpdate({ borderWidth: value })}
                    onPointerUp={() => handleFinalUpdate({ borderWidth: previewStyle.borderWidth ?? style.borderWidth ?? 1 })}
                    max={10}
                    min={0}
                    step={1}
                    className="h-4"
                  />
                  <span className="text-xs text-gray-500">{previewStyle.borderWidth ?? style.borderWidth ?? 1}px</span>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Border Radius</Label>
                <div className="mt-1">
                  <Slider
                    value={[style.borderRadius ?? 8]}
                    onValueChange={([value]) => handleRealTimeUpdate({ borderRadius: value })}
                    onPointerUp={() => handleFinalUpdate({ borderRadius: previewStyle.borderRadius ?? style.borderRadius ?? 8 })}
                    max={50}
                    min={0}
                    step={1}
                    className="h-4"
                  />
                  <span className="text-xs text-gray-500">{previewStyle.borderRadius ?? style.borderRadius ?? 8}px</span>
                </div>
              </div>
            </div>

            {/* Shadow & Spacing - Compact Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <Label className="text-xs font-medium">Shadow</Label>
                <Select
                  value={style.shadow || 'sm'}
                  onValueChange={(value) => {
                    handleRealTimeUpdate({ shadow: value });
                    handleFinalUpdate({ shadow: value });
                  }}
                >
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shadowOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Padding</Label>
                <div>
                  <Slider
                    value={[style.padding ?? 12]}
                    onValueChange={([value]) => handleRealTimeUpdate({ padding: value })}
                    onPointerUp={() => handleFinalUpdate({ padding: previewStyle.padding ?? style.padding ?? 12 })}
                    max={32}
                    min={0}
                    step={2}
                    className="h-4 mt-1"
                  />
                  <span className="text-xs text-gray-500">{previewStyle.padding ?? style.padding ?? 12}px</span>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Margin</Label>
                <div>
                  <Slider
                    value={[style.margin ?? 4]}
                    onValueChange={([value]) => handleRealTimeUpdate({ margin: value })}
                    onPointerUp={() => handleFinalUpdate({ margin: previewStyle.margin ?? style.margin ?? 4 })}
                    max={32}
                    min={0}
                    step={2}
                    className="h-4 mt-1"
                  />
                  <span className="text-xs text-gray-500">{previewStyle.margin ?? style.margin ?? 4}px</span>
                </div>
              </div>
            </div>

            {/* Dimensions - Only for non-slider and non-question-card components */}
            {componentType !== 'slider' && componentType !== 'question-card' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* Service Selector uses specific properties */}
                {componentType === 'service-selector' ? (
                  <>
                    <div>
                      <Label className="text-xs font-medium">Card Size</Label>
                      <Select
                        value={styling.serviceSelectorCardSize || 'lg'}
                        onValueChange={(value) => {
                          if (onStylingChange) {
                            onStylingChange('serviceSelectorCardSize', value);
                          }
                        }}
                      >
                        <SelectTrigger className="text-xs h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small (120px)</SelectItem>
                          <SelectItem value="md">Medium (140px)</SelectItem>
                          <SelectItem value="lg">Large (160px)</SelectItem>
                          <SelectItem value="xl">Extra Large (180px)</SelectItem>
                          <SelectItem value="2xl">2X Large (200px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Card Spacing</Label>
                      <div>
                        <Slider
                          value={[styling.serviceSelectorGapSize ?? 16]}
                          onValueChange={([value]) => {
                            if (onStylingChange) {
                              onStylingChange('serviceSelectorGapSize', value);
                            }
                          }}
                          max={20}
                          min={0}
                          step={1}
                          className="h-4 mt-1"
                        />
                        <span className="text-xs text-gray-500">{styling.serviceSelectorGapSize ?? 16}px</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Max Width</Label>
                      <div>
                        <Slider
                          value={[styling.serviceSelectorWidth ?? 900]}
                          onValueChange={([value]) => {
                            if (onStylingChange) {
                              onStylingChange('serviceSelectorWidth', value);
                            }
                          }}
                          max={1200}
                          min={200}
                          step={50}
                          className="h-4 mt-1"
                        />
                        <span className="text-xs text-gray-500">{styling.serviceSelectorWidth ?? 900}px</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Max Height</Label>
                      <div>
                        <Slider
                          value={[styling.serviceSelectorMaxHeight ?? 300]}
                          onValueChange={([value]) => {
                            if (onStylingChange) {
                              onStylingChange('serviceSelectorMaxHeight', value);
                            }
                          }}
                          max={800}
                          min={100}
                          step={25}
                          className="h-4 mt-1"
                        />
                        <span className="text-xs text-gray-500">{styling.serviceSelectorMaxHeight ?? 300}px</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Line Height</Label>
                      <div>
                        <Slider
                          value={[styling.serviceSelectorLineHeight ?? 20]}
                          onValueChange={([value]) => {
                            if (onStylingChange) {
                              onStylingChange('serviceSelectorLineHeight', value);
                            }
                          }}
                          max={100}
                          min={0}
                          step={2}
                          className="h-4 mt-1"
                        />
                        <span className="text-xs text-gray-500">{styling.serviceSelectorLineHeight ?? 20}px</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs font-medium">Height</Label>
                      <div>
                        <Slider
                          value={[style.height ?? 40]}
                          onValueChange={([value]) => handleRealTimeUpdate({ height: value })}
                          onPointerUp={() => handleFinalUpdate({ height: previewStyle.height ?? style.height ?? 40 })}
                          max={200}
                          min={32}
                          step={4}
                          className="h-4 mt-1"
                        />
                        <span className="text-xs text-gray-500">{previewStyle.height ?? style.height ?? 40}px</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Width</Label>
                      <Select
                        value={style.width || 'full'}
                        onValueChange={(value) => {
                          handleRealTimeUpdate({ width: value });
                          handleFinalUpdate({ width: value });
                        }}
                      >
                        <SelectTrigger className="text-xs h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {widthOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Typography Controls - Compact */}
            {(componentType === 'text-input' || componentType === 'dropdown' || componentType === 'button') && (
              <div className="border-t pt-2 mt-2">
                <h4 className="text-xs font-medium mb-2 flex items-center space-x-1">
                  <Type className="h-3 w-3" />
                  <span>Typography</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium">Text Color</Label>
                    <div className="space-y-1 mt-1 relative color-picker-container">
                      <div className="flex items-center space-x-1">
                        <Input
                          type="color"
                          value={style.textColor || '#374151'}
                          onChange={(e) => {
                            handleRealTimeUpdate({ textColor: e.target.value });
                            handleFinalUpdate({ textColor: e.target.value });
                          }}
                          className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={style.textColor || '#374151'}
                          onChange={(e) => {
                            handleRealTimeUpdate({ textColor: e.target.value });
                            handleFinalUpdate({ textColor: e.target.value });
                          }}
                          className="flex-1 text-xs h-6"
                          placeholder="#374151"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTransparency('textColor')}
                          className="h-6 w-6 p-0"
                          data-testid="button-toggle-transparency-text"
                        >
                          <Droplet className="h-3 w-3" />
                        </Button>
                      </div>
                      {showTransparency.textColor && (
                        <div className="flex items-center space-x-2 pl-7">
                          <Slider
                            value={[style.textColorAlpha ?? 100]}
                            onValueChange={([value]) => {
                              handleRealTimeUpdate({ textColorAlpha: value });
                              handleFinalUpdate({ textColorAlpha: value });
                            }}
                            max={100}
                            min={0}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-500 min-w-10">{style.textColorAlpha ?? 100}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Font Size</Label>
                    <Select
                      value={style.fontSize || 'base'}
                      onValueChange={(value) => {
                        handleRealTimeUpdate({ fontSize: value });
                        handleFinalUpdate({ fontSize: value });
                      }}
                    >
                      <SelectTrigger className="text-xs h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xs">XS (12px)</SelectItem>
                        <SelectItem value="sm">SM (14px)</SelectItem>
                        <SelectItem value="base">Base (16px)</SelectItem>
                        <SelectItem value="lg">LG (18px)</SelectItem>
                        <SelectItem value="xl">XL (20px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Service Selector Specific Controls */}
            {componentType === 'service-selector' && onStylingChange && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Icon Design</span>
                  </h4>
                  
                  {/* Icon Position Control */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Icon Position</Label>
                      <Select
                        value={styling.serviceSelectorIconPosition || 'left'}
                        onValueChange={(value) => onStylingChange('serviceSelectorIconPosition', value)}
                      >
                        <SelectTrigger className="text-xs mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconPositionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Icon Size Controls */}
                    <div>
                      <Label className="text-xs font-medium">Icon Size Type</Label>
                      <Select
                        value={styling.serviceSelectorIconSizeUnit || 'preset'}
                        onValueChange={(value) => onStylingChange('serviceSelectorIconSizeUnit', value)}
                      >
                        <SelectTrigger className="text-xs mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconSizeUnitOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Conditional Size Controls */}
                    {styling.serviceSelectorIconSizeUnit === 'preset' && (
                      <div>
                        <Label className="text-xs font-medium">Preset Size</Label>
                        <Select
                          value={styling.serviceSelectorIconSize || 'md'}
                          onValueChange={(value) => onStylingChange('serviceSelectorIconSize', value)}
                        >
                          <SelectTrigger className="text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconPresetSizeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {styling.serviceSelectorIconSizeUnit === 'pixels' && (
                      <div>
                        <Label className="text-xs font-medium">Icon Size (Pixels)</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Slider
                            value={[styling.serviceSelectorIconPixelSize || 48]}
                            onValueChange={([value]) => onStylingChange('serviceSelectorIconPixelSize', value)}
                            max={120}
                            min={16}
                            step={4}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-500 min-w-12">
                            {styling.serviceSelectorIconPixelSize || 48}px
                          </span>
                        </div>
                      </div>
                    )}

                    {styling.serviceSelectorIconSizeUnit === 'percent' && (
                      <div>
                        <Label className="text-xs font-medium">Icon Size (Percentage)</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Slider
                            value={[styling.serviceSelectorIconPercentSize || 30]}
                            onValueChange={([value]) => onStylingChange('serviceSelectorIconPercentSize', value)}
                            max={80}
                            min={10}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-500 min-w-12">
                            {styling.serviceSelectorIconPercentSize || 30}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>



                {/* Active/Hover State Colors - Compact */}
                <div className="border-t pt-2 mt-2">
                  <h4 className="text-xs font-medium mb-2 flex items-center space-x-1">
                    <MousePointer2 className="h-3 w-3" />
                    <span>Active & Hover States</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {/* Active Colors Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-medium">Active Background</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.serviceSelectorActiveBackgroundColor || '#3B82F6'}
                              onChange={(e) => {
                                onStylingChange('serviceSelectorActiveBackgroundColor', e.target.value);
                                onStyleChange({
                                  activeBackgroundColor: e.target.value
                                });
                              }}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorActiveBackgroundColor || '#3B82F6'}
                              onChange={(e) => {
                                onStylingChange('serviceSelectorActiveBackgroundColor', e.target.value);
                                onStyleChange({
                                  activeBackgroundColor: e.target.value
                                });
                              }}
                              className="flex-1 text-xs h-6"
                              placeholder="#3B82F6"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('activeBackground')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-active-bg"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.activeBackground && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.serviceSelectorActiveBackgroundColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('serviceSelectorActiveBackgroundColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.serviceSelectorActiveBackgroundColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Active Border</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.serviceSelectorActiveBorderColor || '#2563EB'}
                              onChange={(e) => {
                                onStylingChange('serviceSelectorActiveBorderColor', e.target.value);
                                onStyleChange({
                                  activeBorderColor: e.target.value
                                });
                              }}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorActiveBorderColor || '#2563EB'}
                              onChange={(e) => {
                                onStylingChange('serviceSelectorActiveBorderColor', e.target.value);
                                onStyleChange({
                                  activeBorderColor: e.target.value
                                });
                              }}
                              className="flex-1 text-xs h-6"
                              placeholder="#2563EB"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('activeBorder')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-active-border"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.activeBorder && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.serviceSelectorActiveBorderColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('serviceSelectorActiveBorderColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.serviceSelectorActiveBorderColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hover Colors Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-medium">Hover Background</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.serviceSelectorHoverBackgroundColor || '#F3F4F6'}
                              onChange={(e) => onStylingChange('serviceSelectorHoverBackgroundColor', e.target.value)}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorHoverBackgroundColor || '#F3F4F6'}
                              onChange={(e) => onStylingChange('serviceSelectorHoverBackgroundColor', e.target.value)}
                              className="flex-1 text-xs h-6"
                              placeholder="#F3F4F6"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('hoverBackground')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-hover-bg"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.hoverBackground && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.serviceSelectorHoverBackgroundColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('serviceSelectorHoverBackgroundColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.serviceSelectorHoverBackgroundColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Hover Border</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.serviceSelectorHoverBorderColor || '#D1D5DB'}
                              onChange={(e) => onStylingChange('serviceSelectorHoverBorderColor', e.target.value)}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorHoverBorderColor || '#D1D5DB'}
                              onChange={(e) => onStylingChange('serviceSelectorHoverBorderColor', e.target.value)}
                              className="flex-1 text-xs h-6"
                              placeholder="#D1D5DB"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('hoverBorder')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-hover-border"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.hoverBorder && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.serviceSelectorHoverBorderColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('serviceSelectorHoverBorderColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.serviceSelectorHoverBorderColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Controls - Compact */}
                <div className="border-t pt-2 mt-2">
                  <h4 className="text-xs font-medium mb-2 flex items-center space-x-1">
                    <Type className="h-3 w-3" />
                    <span>Typography</span>
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {/* Font Size */}
                      <div>
                        <Label className="text-xs font-medium">Font Size</Label>
                        <Select
                          value={styling.serviceSelectorFontSize || 'base'}
                          onValueChange={(value) => onStylingChange('serviceSelectorFontSize', value)}
                        >
                          <SelectTrigger className="text-xs h-7">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xs">XS</SelectItem>
                            <SelectItem value="sm">SM</SelectItem>
                            <SelectItem value="base">Base</SelectItem>
                            <SelectItem value="lg">LG</SelectItem>
                            <SelectItem value="xl">XL</SelectItem>
                            <SelectItem value="2xl">2XL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Text Color */}
                      <div>
                        <Label className="text-xs font-medium">Text Color</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.serviceSelectorTextColor || styling.textColor || '#000000'}
                              onChange={(e) => onStylingChange('serviceSelectorTextColor', e.target.value)}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorTextColor || styling.textColor || '#000000'}
                              onChange={(e) => onStylingChange('serviceSelectorTextColor', e.target.value)}
                              className="flex-1 text-xs h-6"
                              placeholder="#000000"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('selectorTextColor')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-selector-text"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.selectorTextColor && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.serviceSelectorTextColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('serviceSelectorTextColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.serviceSelectorTextColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Text Color */}
                      <div>
                        <Label className="text-xs font-medium">Selected Color</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.serviceSelectorSelectedTextColor || styling.primaryColor || '#3B82F6'}
                              onChange={(e) => onStylingChange('serviceSelectorSelectedTextColor', e.target.value)}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.serviceSelectorSelectedTextColor || styling.primaryColor || '#3B82F6'}
                              onChange={(e) => onStylingChange('serviceSelectorSelectedTextColor', e.target.value)}
                              className="flex-1 text-xs h-6"
                              placeholder="#3B82F6"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('selectedTextColor')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-selected-text"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.selectedTextColor && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.serviceSelectorSelectedTextColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('serviceSelectorSelectedTextColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.serviceSelectorSelectedTextColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Multiple Choice Specific Controls */}
            {componentType === 'multiple-choice' && onStylingChange && (
              <>
                {/* Image Size Control */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                    <Image className="h-4 w-4" />
                    <span>Image Settings</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Image Size */}
                    <div>
                      <Label className="text-xs font-medium">Image Size</Label>
                      <div className="space-y-2">
                        <Select
                          value={typeof styling.multiChoiceImageSize === 'number' ? 'custom' : (styling.multiChoiceImageSize || 'lg')}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              onStylingChange('multiChoiceImageSize', 50); // Default to 50%
                            } else {
                              onStylingChange('multiChoiceImageSize', value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">Small - 24px × 24px</SelectItem>
                            <SelectItem value="md">Medium - 48px × 48px</SelectItem>
                            <SelectItem value="lg">Large - 64px × 64px</SelectItem>
                            <SelectItem value="xl">Extra Large - 96px × 96px</SelectItem>
                            <SelectItem value="custom">Custom Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {typeof styling.multiChoiceImageSize === 'number' && (
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Fill Percentage</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Slider
                                value={[styling.multiChoiceImageSize]}
                                onValueChange={([value]) => onStylingChange('multiChoiceImageSize', value)}
                                max={100}
                                min={10}
                                step={5}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-12">
                                {styling.multiChoiceImageSize}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Border Radius */}
                    <div>
                      <Label className="text-xs font-medium">Image Border Radius</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Slider
                          value={[styling.multiChoiceImageBorderRadius || 12]}
                          onValueChange={([value]) => onStylingChange('multiChoiceImageBorderRadius', value)}
                          max={50}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-500 min-w-12">
                          {styling.multiChoiceImageBorderRadius || 12}px
                        </span>
                      </div>
                    </div>

                    {/* Image Shadow */}
                    <div>
                      <Label className="text-xs font-medium">Image Shadow</Label>
                      <Select
                        value={styling.multiChoiceImageShadow || 'md'}
                        onValueChange={(value) => onStylingChange('multiChoiceImageShadow', value)}
                      >
                        <SelectTrigger className="w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-2 mt-2">
                  <h4 className="text-xs font-medium mb-2 flex items-center space-x-1">
                    <MousePointer2 className="h-3 w-3" />
                    <span>Active & Hover States</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {/* Active Colors Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-medium">Active Background</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.multipleChoiceActiveBackgroundColor || '#3B82F6'}
                              onChange={(e) => onStylingChange('multipleChoiceActiveBackgroundColor', e.target.value)}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.multipleChoiceActiveBackgroundColor || '#3B82F6'}
                              onChange={(e) => onStylingChange('multipleChoiceActiveBackgroundColor', e.target.value)}
                              className="flex-1 text-xs h-6"
                              placeholder="#3B82F6"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('mcActiveBackground')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-mc-active-bg"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.mcActiveBackground && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.multipleChoiceActiveBackgroundColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('multipleChoiceActiveBackgroundColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.multipleChoiceActiveBackgroundColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Active Border</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.multipleChoiceActiveBorderColor || '#2563EB'}
                              onChange={(e) => onStylingChange('multipleChoiceActiveBorderColor', e.target.value)}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.multipleChoiceActiveBorderColor || '#2563EB'}
                              onChange={(e) => onStylingChange('multipleChoiceActiveBorderColor', e.target.value)}
                              className="flex-1 text-xs h-6"
                              placeholder="#2563EB"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('mcActiveBorder')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-mc-active-border"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.mcActiveBorder && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.multipleChoiceActiveBorderColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('multipleChoiceActiveBorderColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.multipleChoiceActiveBorderColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hover Colors Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-medium">Hover Background</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.multipleChoiceHoverBackgroundColor || '#F3F4F6'}
                              onChange={(e) => onStylingChange('multipleChoiceHoverBackgroundColor', e.target.value)}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.multipleChoiceHoverBackgroundColor || '#F3F4F6'}
                              onChange={(e) => onStylingChange('multipleChoiceHoverBackgroundColor', e.target.value)}
                              className="flex-1 text-xs h-6"
                              placeholder="#F3F4F6"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('mcHoverBackground')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-mc-hover-bg"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.mcHoverBackground && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.multipleChoiceHoverBackgroundColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('multipleChoiceHoverBackgroundColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.multipleChoiceHoverBackgroundColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Hover Border</Label>
                        <div className="space-y-1 mt-1 relative color-picker-container">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="color"
                              value={styling.multipleChoiceHoverBorderColor || '#D1D5DB'}
                              onChange={(e) => onStylingChange('multipleChoiceHoverBorderColor', e.target.value)}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={styling.multipleChoiceHoverBorderColor || '#D1D5DB'}
                              onChange={(e) => onStylingChange('multipleChoiceHoverBorderColor', e.target.value)}
                              className="flex-1 text-xs h-6"
                              placeholder="#D1D5DB"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTransparency('mcHoverBorder')}
                              className="h-6 w-6 p-0"
                              data-testid="button-toggle-transparency-mc-hover-border"
                            >
                              <Droplet className="h-3 w-3" />
                            </Button>
                          </div>
                          {showTransparency.mcHoverBorder && (
                            <div className="flex items-center space-x-2 pl-7">
                              <Slider
                                value={[styling.multipleChoiceHoverBorderColorAlpha ?? 100]}
                                onValueChange={([value]) => {
                                  onStylingChange('multipleChoiceHoverBorderColorAlpha', value);
                                }}
                                max={100}
                                min={0}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-gray-500 min-w-10">{styling.multipleChoiceHoverBorderColorAlpha ?? 100}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}