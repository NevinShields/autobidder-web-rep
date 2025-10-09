import { useState } from 'react';
import { GoogleMapsLoader } from '@/components/google-maps-loader';
import MeasureMapTerraImproved from '@/components/measure-map-terra-improved';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Ruler, SquareIcon } from 'lucide-react';
import { Link } from 'wouter';

export default function MeasureMapTool() {
  const [measurementType, setMeasurementType] = useState<'area' | 'distance'>('area');
  const [unit, setUnit] = useState<'sqft' | 'sqm' | 'ft' | 'm'>('sqft');
  const [lastMeasurement, setLastMeasurement] = useState<{ value: number; unit: string } | null>(null);

  const handleMeasurementComplete = (measurement: { value: number; unit: string }) => {
    setLastMeasurement(measurement);
    console.log('Measurement complete:', measurement);
  };

  const handleTypeChange = (type: 'area' | 'distance') => {
    setMeasurementType(type);
    // Auto-adjust unit based on type
    if (type === 'area' && (unit === 'ft' || unit === 'm')) {
      setUnit(unit === 'ft' ? 'sqft' : 'sqm');
    } else if (type === 'distance' && (unit === 'sqft' || unit === 'sqm')) {
      setUnit(unit === 'sqft' ? 'ft' : 'm');
    }
  };

  const handleUnitChange = (newUnit: 'sqft' | 'sqm' | 'ft' | 'm') => {
    setUnit(newUnit);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Map className="w-8 h-8 text-blue-600" />
                Measure Map Tool
              </h1>
              <p className="text-gray-600 mt-1">
                Development environment for the measure map tool
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Measurement Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                {/* Measurement Type */}
                <div className="flex gap-2">
                  <Button
                    variant={measurementType === 'area' ? 'default' : 'outline'}
                    onClick={() => handleTypeChange('area')}
                    data-testid="button-type-area"
                  >
                    <SquareIcon className="w-4 h-4 mr-2" />
                    Area
                  </Button>
                  <Button
                    variant={measurementType === 'distance' ? 'default' : 'outline'}
                    onClick={() => handleTypeChange('distance')}
                    data-testid="button-type-distance"
                  >
                    <Ruler className="w-4 h-4 mr-2" />
                    Distance
                  </Button>
                </div>

                {/* Unit Selection */}
                <div className="flex gap-2">
                  {measurementType === 'area' ? (
                    <>
                      <Button
                        variant={unit === 'sqft' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUnitChange('sqft')}
                        data-testid="button-unit-sqft"
                      >
                        sq ft
                      </Button>
                      <Button
                        variant={unit === 'sqm' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUnitChange('sqm')}
                        data-testid="button-unit-sqm"
                      >
                        sq m
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant={unit === 'ft' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUnitChange('ft')}
                        data-testid="button-unit-ft"
                      >
                        ft
                      </Button>
                      <Button
                        variant={unit === 'm' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUnitChange('m')}
                        data-testid="button-unit-m"
                      >
                        m
                      </Button>
                    </>
                  )}
                </div>

                {/* Last Measurement Display */}
                {lastMeasurement && (
                  <div className="ml-auto">
                    <Badge variant="secondary" className="text-lg px-4 py-2" data-testid="badge-last-measurement">
                      Last: {lastMeasurement.value.toLocaleString()} {lastMeasurement.unit}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Tool */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <GoogleMapsLoader>
            <MeasureMapTerraImproved
              measurementType={measurementType}
              unit={unit}
              onMeasurementComplete={handleMeasurementComplete}
              defaultAddress=""
            />
          </GoogleMapsLoader>
        </div>

        {/* Development Notes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Development Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>This is a standalone development page for the measure map tool</li>
              <li>Use this page to test and refine the map functionality before integrating into forms</li>
              <li>Measurement type and units can be changed dynamically</li>
              <li>The tool supports both area (sqft/sqm) and distance (ft/m) measurements</li>
              <li>Last measurement is displayed in the badge above</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
