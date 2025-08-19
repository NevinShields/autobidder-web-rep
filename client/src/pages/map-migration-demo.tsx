import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Map, Zap, ArrowRight, Settings } from 'lucide-react';
import { Link } from 'wouter';
import MeasureMap from '@/components/measure-map';
import MeasureMapTerra from '@/components/measure-map-terra';

export default function MapMigrationDemo() {
  const [selectedVersion, setSelectedVersion] = useState<'old' | 'new' | 'both'>('both');
  const [oldMeasurement, setOldMeasurement] = useState({ value: 0, unit: 'sqft' });
  const [newMeasurement, setNewMeasurement] = useState({ value: 0, unit: 'sqft' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Map Drawing Library Migration Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            Google Maps Drawing Library is being phased out (August 2025) and fully removed (May 2026). 
            We've migrated to Terra Draw for a better, future-proof mapping experience.
          </p>
          
          {/* Migration Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center text-yellow-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Google Maps Drawing Library Deprecation</span>
            </div>
            <p className="text-yellow-700 mt-2 text-sm">
              Phase out: August 2025 • Complete removal: May 2026 • Action required for continued functionality
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex justify-center space-x-4 mb-6">
            <Link href="/terra-draw-refinement">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Terra Draw Refinement Lab
              </Button>
            </Link>
          </div>

          {/* Version Selector */}
          <div className="flex justify-center space-x-4 mb-8">
            <Button
              onClick={() => setSelectedVersion('old')}
              variant={selectedVersion === 'old' ? 'default' : 'outline'}
              className="relative"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Old Version (Deprecated)
              <Badge variant="destructive" className="ml-2 text-xs">
                Will Stop Working
              </Badge>
            </Button>
            <Button
              onClick={() => setSelectedVersion('new')}
              variant={selectedVersion === 'new' ? 'default' : 'outline'}
              className="relative"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              New Version (Terra Draw)
              <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                Future Ready
              </Badge>
            </Button>
            <Button
              onClick={() => setSelectedVersion('both')}
              variant={selectedVersion === 'both' ? 'default' : 'outline'}
            >
              <Map className="w-4 h-4 mr-2" />
              Compare Side by Side
            </Button>
          </div>
        </div>

        {/* Feature Comparison */}
        <Card className="mb-8 max-w-5xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-3">Google Maps Drawing</h3>
                <Badge variant="destructive" className="mb-4">Deprecated</Badge>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>✓ Google Maps only</li>
                  <li>✓ Basic drawing tools</li>
                  <li>✗ Limited editing features</li>
                  <li>✗ Will stop working May 2026</li>
                  <li>✗ No future updates</li>
                </ul>
              </div>
              
              <div className="flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-blue-600" />
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-3">Terra Draw</h3>
                <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800">Future Ready</Badge>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>✓ Works with multiple map providers</li>
                  <li>✓ Advanced drawing and editing</li>
                  <li>✓ GeoJSON standard output</li>
                  <li>✓ Actively maintained</li>
                  <li>✓ Modern architecture</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Components */}
        <div className="max-w-7xl mx-auto">
          {selectedVersion === 'both' && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Old Version</h2>
                  <Badge variant="destructive">Google Maps Drawing Library</Badge>
                  <p className="text-sm text-gray-600 mt-2">Uses deprecated DrawingManager class</p>
                  {oldMeasurement.value > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <span className="text-red-800 font-medium">
                        Total: {Math.round(oldMeasurement.value).toLocaleString()} {oldMeasurement.unit}
                      </span>
                    </div>
                  )}
                </div>
                <MeasureMap
                  onMeasurementComplete={setOldMeasurement}
                  measurementType="area"
                  unit="sqft"
                />
              </div>
              
              <div>
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">New Version</h2>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Terra Draw</Badge>
                  <p className="text-sm text-gray-600 mt-2">Modern, cross-platform drawing library</p>
                  {newMeasurement.value > 0 && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-green-800 font-medium">
                        Total: {Math.round(newMeasurement.value).toLocaleString()} {newMeasurement.unit}
                      </span>
                    </div>
                  )}
                </div>
                <MeasureMapTerra
                  onMeasurementComplete={setNewMeasurement}
                  measurementType="area"
                  unit="sqft"
                />
              </div>
            </div>
          )}

          {selectedVersion === 'old' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Old Version (Deprecated)</h2>
                <Badge variant="destructive">Google Maps Drawing Library</Badge>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                  <p className="text-red-800 text-sm">
                    This version uses Google's deprecated Drawing Library and will stop working in May 2026.
                  </p>
                </div>
                {oldMeasurement.value > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <span className="text-red-800 font-medium text-lg">
                      Total: {Math.round(oldMeasurement.value).toLocaleString()} {oldMeasurement.unit}
                    </span>
                  </div>
                )}
              </div>
              <MeasureMap
                onMeasurementComplete={setOldMeasurement}
                measurementType="area"
                unit="sqft"
              />
            </div>
          )}

          {selectedVersion === 'new' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">New Version (Recommended)</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Terra Draw - Future Ready</Badge>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 text-sm">
                    This version uses Terra Draw, a modern drawing library that will continue working beyond 2026.
                  </p>
                </div>
                {newMeasurement.value > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <span className="text-green-800 font-medium text-lg">
                      Total: {Math.round(newMeasurement.value).toLocaleString()} {newMeasurement.unit}
                    </span>
                  </div>
                )}
              </div>
              <MeasureMapTerra
                onMeasurementComplete={setNewMeasurement}
                measurementType="area"
                unit="sqft"
              />
            </div>
          )}
        </div>

        {/* Migration Timeline */}
        <Card className="mt-12 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Migration Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div>
                  <strong>August 2025:</strong> Google begins phasing out Drawing Library
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div>
                  <strong>May 2026:</strong> Drawing Library completely removed from Maps JavaScript API
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <strong>Today:</strong> Terra Draw migration ready and fully functional
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Card className="mt-8 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <strong>Terra Draw Benefits:</strong>
                <ul className="mt-2 space-y-1 text-gray-600 ml-4">
                  <li>• Cross-platform compatibility (Google Maps, Mapbox, OpenLayers, Leaflet)</li>
                  <li>• Standard GeoJSON output for better data portability</li>
                  <li>• Advanced editing features (vertex manipulation, shape transformation)</li>
                  <li>• Active development and community support</li>
                  <li>• Better performance and modern architecture</li>
                </ul>
              </div>
              
              <div>
                <strong>Migration Status:</strong>
                <ul className="mt-2 space-y-1 text-gray-600 ml-4">
                  <li>• ✅ Terra Draw library installed and configured</li>
                  <li>• ✅ Google Maps adapter integrated</li>
                  <li>• ✅ Area and distance measurement features implemented</li>
                  <li>• ✅ Address search and Places autocomplete working</li>
                  <li>• ✅ Same measurement accuracy as original implementation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}