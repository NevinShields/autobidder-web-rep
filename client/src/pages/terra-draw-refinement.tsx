import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map } from "lucide-react";
import MeasureMapTerraImproved from "@/components/measure-map-terra-improved";
import { GoogleMapsLoader } from "@/components/google-maps-loader";

interface Measurement {
  value: number;
  unit: string;
}

export default function TerraDrawRefinement() {
  const [measurement, setMeasurement] = useState<Measurement>({ value: 0, unit: 'sqft' });

  const handleMeasurementComplete = (newMeasurement: Measurement) => {
    setMeasurement(newMeasurement);
  };

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Map className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Terra Draw Measurement Test</h1>
            </div>
            <p className="text-gray-600">
              Simplified testing environment for Terra Draw measurement functionality
            </p>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Essential Components Only
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Map Component */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5" />
                Terra Draw Measurement Map
              </CardTitle>
              <CardDescription>
                Draw shapes to measure areas and distances using Terra Draw
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <MeasureMapTerraImproved
                onMeasurementComplete={handleMeasurementComplete}
                measurementType="area"
                unit="sqft"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </GoogleMapsLoader>
  );
}