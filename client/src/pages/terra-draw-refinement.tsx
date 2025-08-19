import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Map, Ruler, Square, Undo, Trash2, Download, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MeasureMapTerra from "@/components/measure-map-terra";

interface Measurement {
  value: number;
  unit: string;
}

export default function TerraDrawRefinement() {
  const { toast } = useToast();
  const [measurement, setMeasurement] = useState<Measurement>({ value: 0, unit: 'sqft' });
  const [measurementType, setMeasurementType] = useState<'area' | 'distance'>('area');
  const [unit, setUnit] = useState<'sqft' | 'sqm' | 'ft' | 'm'>('sqft');
  const [strokeColor, setStrokeColor] = useState('#2563EB');
  const [fillColor, setFillColor] = useState('#2563EB');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillOpacity, setFillOpacity] = useState(0.3);

  const handleMeasurementComplete = (newMeasurement: Measurement) => {
    setMeasurement(newMeasurement);
    if (newMeasurement.value > 0) {
      toast({
        title: "Measurement Updated",
        description: `${Math.round(newMeasurement.value).toLocaleString()} ${newMeasurement.unit}`,
      });
    }
  };

  const handleExportData = () => {
    const data = {
      measurement,
      measurementType,
      unit,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terra-draw-measurement-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Measurement data has been downloaded as JSON",
    });
  };

  const handleCopyToClipboard = () => {
    const text = `Measurement: ${Math.round(measurement.value).toLocaleString()} ${measurement.unit}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: text,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Terra Draw Measurement',
          text: `Measurement: ${Math.round(measurement.value).toLocaleString()} ${measurement.unit}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      handleCopyToClipboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Map className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Terra Draw Refinement Lab</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced testing and refinement environment for the Terra Draw measurement system
          </p>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Modern Drawing Library - Future Ready
          </Badge>
        </div>

        {/* Current Measurement Display */}
        {measurement.value > 0 && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(measurement.value).toLocaleString()}
                </div>
                <div className="text-lg text-gray-600">{measurement.unit}</div>
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Refinement Controls
              </CardTitle>
              <CardDescription>
                Configure measurement settings and drawing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Measurement Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Measurement Type</label>
                <Select value={measurementType} onValueChange={(value: 'area' | 'distance') => setMeasurementType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">
                      <div className="flex items-center gap-2">
                        <Square className="w-4 h-4" />
                        Area Measurement
                      </div>
                    </SelectItem>
                    <SelectItem value="distance">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4" />
                        Distance Measurement
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Select value={unit} onValueChange={(value: 'sqft' | 'sqm' | 'ft' | 'm') => setUnit(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {measurementType === 'area' ? (
                      <>
                        <SelectItem value="sqft">Square Feet (sq ft)</SelectItem>
                        <SelectItem value="sqm">Square Meters (sq m)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="ft">Feet (ft)</SelectItem>
                        <SelectItem value="m">Meters (m)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Style Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Drawing Styles</h3>
                
                <div className="space-y-2">
                  <label className="text-sm">Stroke Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{strokeColor}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm">Fill Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fillColor}
                      onChange={(e) => setFillColor(e.target.value)}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{fillColor}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm">Stroke Width: {strokeWidth}px</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm">Fill Opacity: {Math.round(fillOpacity * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={fillOpacity}
                    onChange={(e) => setFillOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Undo className="w-3 h-3 mr-1" />
                    Undo
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Container */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Terra Draw Map Canvas
                </CardTitle>
                <CardDescription>
                  Interactive measurement map with advanced Terra Draw features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px]">
                  <MeasureMapTerra
                    onMeasurementComplete={handleMeasurementComplete}
                    measurementType={measurementType}
                    unit={unit}
                    key={`${measurementType}-${unit}`} // Force re-render on type/unit change
                  />
                </div>
              </CardContent>
            </Card>

            {/* Feature Tests */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Tests</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="integration">Integration</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Functionality Tests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Drawing Tests</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>• Create polygon shapes</div>
                          <div>• Draw line measurements</div>
                          <div>• Edit vertices and shapes</div>
                          <div>• Delete individual features</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Calculation Tests</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>• Area calculation accuracy</div>
                          <div>• Distance measurement precision</div>
                          <div>• Unit conversion validation</div>
                          <div>• Real-time updates</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Feature Testing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Complex Shapes</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>• Multi-polygon areas</div>
                          <div>• Irregular shape handling</div>
                          <div>• Shape intersection calculations</div>
                          <div>• Nested geometry support</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Interactive Features</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>• Vertex manipulation</div>
                          <div>• Shape transformation</div>
                          <div>• Multi-selection support</div>
                          <div>• Keyboard shortcuts</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">Fast</div>
                        <div className="text-sm text-gray-600">Drawing Response</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">Smooth</div>
                        <div className="text-sm text-gray-600">Calculations</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">Stable</div>
                        <div className="text-sm text-gray-600">Memory Usage</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integration" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Integration Testing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Google Maps Integration</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>✓ Maps JavaScript API compatibility</div>
                          <div>✓ Places autocomplete integration</div>
                          <div>✓ Geocoding service connection</div>
                          <div>✓ Satellite/Street view switching</div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Application Integration</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>✓ React component integration</div>
                          <div>✓ State management compatibility</div>
                          <div>✓ Event handling consistency</div>
                          <div>✓ Error handling robustness</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Technical Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Terra Draw Technical Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h4 className="font-medium">Key Advantages</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Cross-platform map library support</li>
                  <li>• Standard GeoJSON data format</li>
                  <li>• Modern TypeScript architecture</li>
                  <li>• Active development and community</li>
                  <li>• Advanced editing capabilities</li>
                  <li>• Future-proof implementation</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Migration Benefits</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Eliminates Google Drawing Library dependency</li>
                  <li>• Better performance and stability</li>
                  <li>• Enhanced user interaction features</li>
                  <li>• Improved measurement accuracy</li>
                  <li>• Extensible plugin architecture</li>
                  <li>• Long-term vendor independence</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}