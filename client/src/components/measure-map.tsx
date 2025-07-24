import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Ruler, Trash2, RotateCcw, Search } from 'lucide-react';

interface MeasureMapProps {
  onMeasurement: (area: number, unit: string) => void;
  defaultAddress?: string;
  measurementType?: 'area' | 'distance';
  unit?: 'sqft' | 'sqm' | 'ft' | 'm';
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MeasureMap({ 
  onMeasurement, 
  defaultAddress = '', 
  measurementType = 'area',
  unit = 'sqft' 
}: MeasureMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [drawingManager, setDrawingManager] = useState<any>(null);
  const [currentPolygon, setCurrentPolygon] = useState<any>(null);
  const [currentPolyline, setCurrentPolyline] = useState<any>(null);
  const [address, setAddress] = useState(defaultAddress);
  const [currentMeasurement, setCurrentMeasurement] = useState<number>(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      zoom: 18,
      mapTypeId: 'satellite',
      styles: [
        {
          featureType: 'all',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    });

    const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#2563EB',
        fillOpacity: 0.3,
        strokeColor: '#2563EB',
        strokeWeight: 2,
        clickable: false,
        editable: true,
        draggable: false
      },
      polylineOptions: {
        strokeColor: '#2563EB',
        strokeWeight: 3,
        clickable: false,
        editable: true,
        draggable: false
      }
    });

    drawingManagerInstance.setMap(mapInstance);

    // Handle drawing completion
    window.google.maps.event.addListener(drawingManagerInstance, 'polygoncomplete', (polygon: any) => {
      if (currentPolygon) {
        currentPolygon.setMap(null);
      }
      setCurrentPolygon(polygon);
      drawingManagerInstance.setDrawingMode(null);
      
      const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
      const areaInSqFt = area * 10.764; // Convert sq meters to sq feet
      const finalArea = unit === 'sqm' ? area : areaInSqFt;
      
      setCurrentMeasurement(finalArea);
      onMeasurement(finalArea, unit);

      // Listen for path changes
      window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
        updatePolygonMeasurement(polygon);
      });
      window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
        updatePolygonMeasurement(polygon);
      });
    });

    window.google.maps.event.addListener(drawingManagerInstance, 'polylinecomplete', (polyline: any) => {
      if (currentPolyline) {
        currentPolyline.setMap(null);
      }
      setCurrentPolyline(polyline);
      drawingManagerInstance.setDrawingMode(null);
      
      const distance = window.google.maps.geometry.spherical.computeLength(polyline.getPath());
      const distanceInFt = distance * 3.28084; // Convert meters to feet
      const finalDistance = unit === 'm' ? distance : distanceInFt;
      
      setCurrentMeasurement(finalDistance);
      onMeasurement(finalDistance, unit);

      // Listen for path changes
      window.google.maps.event.addListener(polyline.getPath(), 'set_at', () => {
        updatePolylineMeasurement(polyline);
      });
      window.google.maps.event.addListener(polyline.getPath(), 'insert_at', () => {
        updatePolylineMeasurement(polyline);
      });
    });

    setMap(mapInstance);
    setDrawingManager(drawingManagerInstance);
    setIsMapLoaded(true);

    // Search for default address if provided
    if (defaultAddress) {
      searchAddress(defaultAddress, mapInstance);
    }
  };

  const updatePolygonMeasurement = (polygon: any) => {
    const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
    const areaInSqFt = area * 10.764;
    const finalArea = unit === 'sqm' ? area : areaInSqFt;
    setCurrentMeasurement(finalArea);
    onMeasurement(finalArea, unit);
  };

  const updatePolylineMeasurement = (polyline: any) => {
    const distance = window.google.maps.geometry.spherical.computeLength(polyline.getPath());
    const distanceInFt = distance * 3.28084;
    const finalDistance = unit === 'm' ? distance : distanceInFt;
    setCurrentMeasurement(finalDistance);
    onMeasurement(finalDistance, unit);
  };

  const startDrawing = () => {
    if (!drawingManager) return;
    
    if (measurementType === 'area') {
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    } else {
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYLINE);
    }
  };

  const clearDrawing = () => {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
    }
    if (currentPolyline) {
      currentPolyline.setMap(null);
      setCurrentPolyline(null);
    }
    setCurrentMeasurement(0);
    onMeasurement(0, unit);
  };

  const searchAddress = (searchAddress: string, mapInstance?: any) => {
    const targetMap = mapInstance || map;
    if (!targetMap || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchAddress }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        targetMap.setCenter(results[0].geometry.location);
        targetMap.setZoom(20);
      }
    });
  };

  const handleAddressSearch = () => {
    if (address.trim()) {
      searchAddress(address.trim());
    }
  };

  const formatMeasurement = (value: number) => {
    if (measurementType === 'area') {
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unit}`;
    } else {
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          Property Measurement Tool
        </CardTitle>
        <p className="text-sm text-gray-600">
          Draw on the satellite map to measure your property for accurate pricing
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Search */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter property address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
            className="flex-1"
          />
          <Button onClick={handleAddressSearch} variant="outline" size="sm">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative rounded-lg overflow-hidden border">
          <div 
            ref={mapRef} 
            className="w-full h-96"
            style={{ minHeight: '384px' }}
          />
          
          {/* Controls Overlay */}
          {isMapLoaded && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex gap-2">
                  <Button
                    onClick={startDrawing}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Ruler className="w-4 h-4 mr-1" />
                    Draw {measurementType === 'area' ? 'Area' : 'Distance'}
                  </Button>
                  <Button
                    onClick={clearDrawing}
                    size="sm"
                    variant="outline"
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                
                {currentMeasurement > 0 && (
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    {formatMeasurement(currentMeasurement)}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium mb-1">How to use:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter your property address above and click search</li>
            <li>Click "Draw {measurementType === 'area' ? 'Area' : 'Distance'}" to start measuring</li>
            <li>{measurementType === 'area' 
              ? 'Click around the area you want to measure to create a shape' 
              : 'Click along the path you want to measure'}</li>
            <li>The measurement will appear automatically and update your calculator</li>
          </ol>
        </div>

        {currentMeasurement > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">
                Measured {measurementType}: {formatMeasurement(currentMeasurement)}
              </span>
              <Badge variant="outline" className="text-green-600 border-green-300">
                Ready for calculation
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}