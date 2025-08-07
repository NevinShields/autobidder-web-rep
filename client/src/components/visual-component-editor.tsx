import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Move, 
  Maximize2, 
  Settings,
  Eye,
  EyeOff,
  MousePointer2,
  Palette
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
}

interface VisualComponentEditorProps {
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  componentType: 'service-selector' | 'text-input' | 'dropdown' | 'multiple-choice' | 'slider' | 'question-card' | 'question-container' | 'pricing-card';
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
  const componentRef = useRef<HTMLDivElement>(null);

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
              height: `${currentStyle.height}px`,
              padding: `${currentStyle.padding}px`,
              margin: `${currentStyle.margin}px`,
            }}
          >
            <h3 className="text-lg font-semibold mb-3">Question Title</h3>
            <p className="text-gray-600 mb-4">Question description goes here...</p>
            <input className="w-full p-2 border rounded" placeholder="Your answer" />
            
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
      <CardHeader className="pb-2">
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
            <div>
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
          {/* Visual Preview */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Preview</Label>
            <div className="border rounded-lg p-4 bg-gray-50 min-h-24 relative">
              {renderExampleComponent()}
            </div>
          </div>

          {/* Style Controls */}
          <div className="space-y-4">
            {/* Border Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium">Border Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="color"
                    value={style.borderColor || '#E5E7EB'}
                    onChange={(e) => {
                      handleRealTimeUpdate({ borderColor: e.target.value });
                      handleFinalUpdate({ borderColor: e.target.value });
                    }}
                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={style.borderColor || '#E5E7EB'}
                    onChange={(e) => {
                      handleRealTimeUpdate({ borderColor: e.target.value });
                      handleFinalUpdate({ borderColor: e.target.value });
                    }}
                    className="flex-1 text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Border Width</Label>
                <Slider
                  value={[style.borderWidth ?? 1]}
                  onValueChange={([value]) => handleRealTimeUpdate({ borderWidth: value })}
                  onPointerUp={() => handleFinalUpdate({ borderWidth: previewStyle.borderWidth ?? style.borderWidth ?? 1 })}
                  max={10}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <span className="text-xs text-gray-500">{previewStyle.borderWidth ?? style.borderWidth ?? 1}px</span>
              </div>
              <div>
                <Label className="text-xs font-medium">Border Radius</Label>
                <Slider
                  value={[style.borderRadius ?? 8]}
                  onValueChange={([value]) => handleRealTimeUpdate({ borderRadius: value })}
                  onPointerUp={() => handleFinalUpdate({ borderRadius: previewStyle.borderRadius ?? style.borderRadius ?? 8 })}
                  max={50}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <span className="text-xs text-gray-500">{previewStyle.borderRadius ?? style.borderRadius ?? 8}px</span>
              </div>
            </div>

            {/* Background & Shadow */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Background Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="color"
                    value={style.backgroundColor || '#FFFFFF'}
                    onChange={(e) => {
                      handleRealTimeUpdate({ backgroundColor: e.target.value });
                      handleFinalUpdate({ backgroundColor: e.target.value });
                    }}
                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={style.backgroundColor || '#FFFFFF'}
                    onChange={(e) => {
                      handleRealTimeUpdate({ backgroundColor: e.target.value });
                      handleFinalUpdate({ backgroundColor: e.target.value });
                    }}
                    className="flex-1 text-xs"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Shadow</Label>
                <Select
                  value={style.shadow || 'sm'}
                  onValueChange={(value) => {
                    handleRealTimeUpdate({ shadow: value });
                    handleFinalUpdate({ shadow: value });
                  }}
                >
                  <SelectTrigger className="text-xs mt-1">
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
            </div>

            {/* Dimensions - Only for non-slider components */}
            {componentType !== 'slider' && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium">Height</Label>
                  <Slider
                    value={[style.height ?? 40]}
                    onValueChange={([value]) => handleRealTimeUpdate({ height: value })}
                    onPointerUp={() => handleFinalUpdate({ height: previewStyle.height ?? style.height ?? 40 })}
                    max={200}
                    min={32}
                    step={4}
                    className="mt-2"
                  />
                  <span className="text-xs text-gray-500">{previewStyle.height ?? style.height ?? 40}px</span>
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
                    <SelectTrigger className="text-xs mt-1">
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
                <div>
                  <Label className="text-xs font-medium">Padding</Label>
                  <Slider
                    value={[style.padding ?? 12]}
                    onValueChange={([value]) => handleRealTimeUpdate({ padding: value })}
                    onPointerUp={() => handleFinalUpdate({ padding: previewStyle.padding ?? style.padding ?? 12 })}
                    max={32}
                    min={0}
                    step={2}
                    className="mt-2"
                  />
                  <span className="text-xs text-gray-500">{previewStyle.padding ?? style.padding ?? 12}px</span>
                </div>
              </div>
            )}

            {/* Margin */}
            <div className="w-1/3">
              <Label className="text-xs font-medium">Margin</Label>
              <Slider
                value={[style.margin ?? 4]}
                onValueChange={([value]) => handleRealTimeUpdate({ margin: value })}
                onPointerUp={() => handleFinalUpdate({ margin: previewStyle.margin ?? style.margin ?? 4 })}
                max={32}
                min={0}
                step={2}
                className="mt-2"
              />
              <span className="text-xs text-gray-500">{previewStyle.margin ?? style.margin ?? 4}px</span>
            </div>

            {/* Custom CSS */}
            <div>
              <Label className="text-xs font-medium">Custom CSS</Label>
              <Textarea
                value={style.customCSS || ''}
                onChange={(e) => {
                  handleRealTimeUpdate({ customCSS: e.target.value });
                  handleFinalUpdate({ customCSS: e.target.value });
                }}
                className="text-xs mt-1 font-mono"
                placeholder="/* Custom CSS rules */&#10;color: #333;&#10;font-weight: bold;"
                rows={3}
              />
            </div>

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

                {/* Service Selector Layout */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                    <Maximize2 className="h-4 w-4" />
                    <span>Layout Settings</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Service Selector Width */}
                    <div>
                      <Label className="text-xs font-medium">Container Width (pixels)</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Slider
                          value={[styling.serviceSelectorWidth || 900]}
                          onValueChange={([value]) => onStylingChange('serviceSelectorWidth', value)}
                          max={1200}
                          min={400}
                          step={50}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-500 min-w-16">
                          {styling.serviceSelectorWidth || 900}px
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Selector Colors */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span>Colors & States</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Default Background Color */}
                    <div>
                      <Label className="text-xs font-medium">Default Background Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.serviceSelectorBackgroundColor || '#FFFFFF'}
                          onChange={(e) => onStylingChange('serviceSelectorBackgroundColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.serviceSelectorBackgroundColor || '#FFFFFF'}
                          onChange={(e) => onStylingChange('serviceSelectorBackgroundColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    {/* Active Background Color */}
                    <div>
                      <Label className="text-xs font-medium">Active Background Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.serviceSelectorActiveBackgroundColor || '#3B82F6'}
                          onChange={(e) => onStylingChange('serviceSelectorActiveBackgroundColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.serviceSelectorActiveBackgroundColor || '#3B82F6'}
                          onChange={(e) => onStylingChange('serviceSelectorActiveBackgroundColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    {/* Active Border Color */}
                    <div>
                      <Label className="text-xs font-medium">Active Border Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.serviceSelectorActiveBorderColor || '#2563EB'}
                          onChange={(e) => onStylingChange('serviceSelectorActiveBorderColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.serviceSelectorActiveBorderColor || '#2563EB'}
                          onChange={(e) => onStylingChange('serviceSelectorActiveBorderColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#2563EB"
                        />
                      </div>
                    </div>

                    {/* Hover Background Color */}
                    <div>
                      <Label className="text-xs font-medium">Hover Background Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.serviceSelectorHoverBackgroundColor || '#F3F4F6'}
                          onChange={(e) => onStylingChange('serviceSelectorHoverBackgroundColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.serviceSelectorHoverBackgroundColor || '#F3F4F6'}
                          onChange={(e) => onStylingChange('serviceSelectorHoverBackgroundColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#F3F4F6"
                        />
                      </div>
                    </div>

                    {/* Hover Border Color */}
                    <div>
                      <Label className="text-xs font-medium">Hover Border Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.serviceSelectorHoverBorderColor || '#D1D5DB'}
                          onChange={(e) => onStylingChange('serviceSelectorHoverBorderColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.serviceSelectorHoverBorderColor || '#D1D5DB'}
                          onChange={(e) => onStylingChange('serviceSelectorHoverBorderColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#D1D5DB"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Multiple Choice Specific Controls */}
            {componentType === 'multiple-choice' && onStylingChange && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                    <MousePointer2 className="h-4 w-4" />
                    <span>Active & Hover States</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Active Background Color */}
                    <div>
                      <Label className="text-xs font-medium">Active Background Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.multipleChoiceActiveBackgroundColor || '#3B82F6'}
                          onChange={(e) => onStylingChange('multipleChoiceActiveBackgroundColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.multipleChoiceActiveBackgroundColor || '#3B82F6'}
                          onChange={(e) => onStylingChange('multipleChoiceActiveBackgroundColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    {/* Active Border Color */}
                    <div>
                      <Label className="text-xs font-medium">Active Border Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.multipleChoiceActiveBorderColor || '#2563EB'}
                          onChange={(e) => onStylingChange('multipleChoiceActiveBorderColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.multipleChoiceActiveBorderColor || '#2563EB'}
                          onChange={(e) => onStylingChange('multipleChoiceActiveBorderColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#2563EB"
                        />
                      </div>
                    </div>

                    {/* Hover Background Color */}
                    <div>
                      <Label className="text-xs font-medium">Hover Background Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.multipleChoiceHoverBackgroundColor || '#F3F4F6'}
                          onChange={(e) => onStylingChange('multipleChoiceHoverBackgroundColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.multipleChoiceHoverBackgroundColor || '#F3F4F6'}
                          onChange={(e) => onStylingChange('multipleChoiceHoverBackgroundColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#F3F4F6"
                        />
                      </div>
                    </div>

                    {/* Hover Border Color */}
                    <div>
                      <Label className="text-xs font-medium">Hover Border Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="color"
                          value={styling.multipleChoiceHoverBorderColor || '#D1D5DB'}
                          onChange={(e) => onStylingChange('multipleChoiceHoverBorderColor', e.target.value)}
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={styling.multipleChoiceHoverBorderColor || '#D1D5DB'}
                          onChange={(e) => onStylingChange('multipleChoiceHoverBorderColor', e.target.value)}
                          className="flex-1 text-xs"
                          placeholder="#D1D5DB"
                        />
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