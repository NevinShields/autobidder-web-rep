import { StylingOptions } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface DesignPanelProps {
  styling: StylingOptions;
  onChange: (key: keyof StylingOptions, value: any) => void;
}

export default function DesignPanel({ styling, onChange }: DesignPanelProps) {
  const shadowOptions = [
    { label: 'None', value: 'none' },
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
    { label: 'Extra Large', value: 'xl' }
  ];

  const fontOptions = [
    { label: 'Inter', value: 'inter' },
    { label: 'Roboto', value: 'roboto' },
    { label: 'Open Sans', value: 'open-sans' },
    { label: 'Lato', value: 'lato' },
    { label: 'Montserrat', value: 'montserrat' }
  ];

  const sizeOptions = [
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' }
  ];

  const textSizeOptions = [
    { label: 'Small', value: 'sm' },
    { label: 'Base', value: 'base' },
    { label: 'Large', value: 'lg' }
  ];

  const fontWeightOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Medium', value: 'medium' },
    { label: 'Semi Bold', value: 'semibold' },
    { label: 'Bold', value: 'bold' }
  ];

  const buttonStyleOptions = [
    { label: 'Rounded', value: 'rounded' },
    { label: 'Square', value: 'square' },
    { label: 'Pill', value: 'pill' }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Design Customization</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="container" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="container">Container</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
          </TabsList>

          <TabsContent value="container" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Dimensions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Width (px)</Label>
                    <Slider
                      value={[styling.containerWidth]}
                      onValueChange={(value) => onChange('containerWidth', value[0])}
                      max={800}
                      min={300}
                      step={10}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-500">{styling.containerWidth}px</span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Height (px)</Label>
                    <Slider
                      value={[styling.containerHeight]}
                      onValueChange={(value) => onChange('containerHeight', value[0])}
                      max={1200}
                      min={400}
                      step={10}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-500">{styling.containerHeight}px</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Appearance</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Background Color</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        type="color"
                        value={styling.backgroundColor}
                        onChange={(e) => onChange('backgroundColor', e.target.value)}
                        className="w-8 h-8 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={styling.backgroundColor}
                        onChange={(e) => onChange('backgroundColor', e.target.value)}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Shadow</Label>
                    <Select
                      value={styling.containerShadow}
                      onValueChange={(value) => onChange('containerShadow', value)}
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
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Border</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Radius</Label>
                    <Slider
                      value={[styling.containerBorderRadius]}
                      onValueChange={(value) => onChange('containerBorderRadius', value[0])}
                      max={50}
                      min={0}
                      step={1}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-500">{styling.containerBorderRadius}px</span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Width</Label>
                    <Slider
                      value={[styling.containerBorderWidth]}
                      onValueChange={(value) => onChange('containerBorderWidth', value[0])}
                      max={10}
                      min={0}
                      step={1}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-500">{styling.containerBorderWidth}px</span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Color</Label>
                    <div className="flex items-center space-x-1 mt-1">
                      <Input
                        type="color"
                        value={styling.containerBorderColor}
                        onChange={(e) => onChange('containerBorderColor', e.target.value)}
                        className="w-6 h-6 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={styling.containerBorderColor}
                        onChange={(e) => onChange('containerBorderColor', e.target.value)}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Font Settings</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Font Family</Label>
                    <Select
                      value={styling.fontFamily}
                      onValueChange={(value) => onChange('fontFamily', value)}
                    >
                      <SelectTrigger className="text-xs mt-1">
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
                    <Label className="text-xs text-gray-600">Font Size</Label>
                    <Select
                      value={styling.fontSize}
                      onValueChange={(value) => onChange('fontSize', value)}
                    >
                      <SelectTrigger className="text-xs mt-1">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Font Weight</Label>
                  <Select
                    value={styling.fontWeight}
                    onValueChange={(value) => onChange('fontWeight', value)}
                  >
                    <SelectTrigger className="text-xs mt-1">
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
                <div>
                  <Label className="text-xs text-gray-600">Text Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      type="color"
                      value={styling.textColor}
                      onChange={(e) => onChange('textColor', e.target.value)}
                      className="w-8 h-8 p-0 border-0"
                    />
                    <Input
                      type="text"
                      value={styling.textColor}
                      onChange={(e) => onChange('textColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="buttons" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Button Style</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Primary Color</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        type="color"
                        value={styling.primaryColor}
                        onChange={(e) => onChange('primaryColor', e.target.value)}
                        className="w-8 h-8 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={styling.primaryColor}
                        onChange={(e) => onChange('primaryColor', e.target.value)}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Button Style</Label>
                    <Select
                      value={styling.buttonStyle}
                      onValueChange={(value) => onChange('buttonStyle', value)}
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {buttonStyleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Button Appearance</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Border Radius</Label>
                    <Slider
                      value={[styling.buttonBorderRadius]}
                      onValueChange={(value) => onChange('buttonBorderRadius', value[0])}
                      max={50}
                      min={0}
                      step={1}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-500">{styling.buttonBorderRadius}px</span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Shadow</Label>
                    <Select
                      value={styling.buttonShadow}
                      onValueChange={(value) => onChange('buttonShadow', value)}
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">Padding</Label>
                  <Select
                    value={styling.buttonPadding}
                    onValueChange={(value) => onChange('buttonPadding', value)}
                  >
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Font Weight</Label>
                  <Select
                    value={styling.buttonFontWeight}
                    onValueChange={(value) => onChange('buttonFontWeight', value)}
                  >
                    <SelectTrigger className="text-xs mt-1">
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inputs" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Input Field Style</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Background Color</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        type="color"
                        value={styling.inputBackgroundColor}
                        onChange={(e) => onChange('inputBackgroundColor', e.target.value)}
                        className="w-8 h-8 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={styling.inputBackgroundColor}
                        onChange={(e) => onChange('inputBackgroundColor', e.target.value)}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Padding</Label>
                    <Select
                      value={styling.inputPadding}
                      onValueChange={(value) => onChange('inputPadding', value)}
                    >
                      <SelectTrigger className="text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Border Settings</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Radius</Label>
                    <Slider
                      value={[styling.inputBorderRadius]}
                      onValueChange={(value) => onChange('inputBorderRadius', value[0])}
                      max={50}
                      min={0}
                      step={1}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-500">{styling.inputBorderRadius}px</span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Width</Label>
                    <Slider
                      value={[styling.inputBorderWidth]}
                      onValueChange={(value) => onChange('inputBorderWidth', value[0])}
                      max={5}
                      min={1}
                      step={1}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-500">{styling.inputBorderWidth}px</span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Color</Label>
                    <div className="flex items-center space-x-1 mt-1">
                      <Input
                        type="color"
                        value={styling.inputBorderColor}
                        onChange={(e) => onChange('inputBorderColor', e.target.value)}
                        className="w-6 h-6 p-0 border-0"
                      />
                      <Input
                        type="text"
                        value={styling.inputBorderColor}
                        onChange={(e) => onChange('inputBorderColor', e.target.value)}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Focus Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="color"
                    value={styling.inputFocusColor}
                    onChange={(e) => onChange('inputFocusColor', e.target.value)}
                    className="w-8 h-8 p-0 border-0"
                  />
                  <Input
                    type="text"
                    value={styling.inputFocusColor}
                    onChange={(e) => onChange('inputFocusColor', e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="space-y-3">
          <Label className="text-sm font-medium">Features</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-breakdown"
                checked={styling.showPriceBreakdown}
                onCheckedChange={(checked) => onChange('showPriceBreakdown', checked)}
              />
              <Label htmlFor="show-breakdown" className="text-xs">
                Show price breakdown
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-lead"
                checked={styling.includeLedCapture}
                onCheckedChange={(checked) => onChange('includeLedCapture', checked)}
              />
              <Label htmlFor="include-lead" className="text-xs">
                Include lead capture form
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}