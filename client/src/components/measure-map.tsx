import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Ruler, Trash2, RotateCcw, Search } from 'lucide-react';

interface MeasureMapProps {
  onMeasurementComplete: (measurement: { value: number; unit: string }) => void;
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
  onMeasurementComplete, 
  defaultAddress = '', 
  measurementType = 'area',
  unit = 'sqft' 
}: MeasureMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [drawingManager, setDrawingManager] = useState<any>(null);
  const [polygons, setPolygons] = useState<any[]>([]);
  const [polylines, setPolylines] = useState<any[]>([]);
  const [address, setAddress] = useState(defaultAddress);
  const [measurements, setMeasurements] = useState<Array<{id: string, value: number, type: 'area' | 'distance'}>>([]);
  const [totalMeasurement, setTotalMeasurement] = useState<number>(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);


  // Load Google Maps API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('API Key check:', apiKey ? 'Available' : 'Missing');
    
    if (!apiKey) {
      console.error('Google Maps API key is not configured');
      setMapError('Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY in environment variables.');
      setIsLoading(false);
      return;
    }

    if (!window.google) {
      console.log('Loading Google Maps API...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry,places&loading=async`;
      script.async = true;
      script.defer = true;
      
      // Add timeout for faster error detection
      const timeout = setTimeout(() => {
        console.error('Google Maps API loading timeout');
        setMapError('Google Maps API loading timeout. Please check your internet connection.');
        setIsLoading(false);
      }, 10000); // 10 second timeout
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('Google Maps API loaded successfully');
        setIsLoading(false);
        // Add small delay to ensure DOM is ready
        setTimeout(() => initializeMap(), 100);
      };
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Error loading Google Maps API:', error);
        setMapError('Failed to load Google Maps API. Please check your API key and internet connection.');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      console.log('Google Maps API already loaded');
      setIsLoading(false);
      // Add small delay to ensure DOM is ready
      setTimeout(() => initializeMap(), 100);
    }
  }, []);

  const initializeMap = (retryCount = 0) => {
    console.log('Initializing Google Maps..., retry:', retryCount);
    
    if (!mapRef.current) {
      if (retryCount < 3) {
        console.log('Map container not ready, retrying...');
        setTimeout(() => initializeMap(retryCount + 1), 200);
        return;
      }
      console.error('Map container not found after retries');
      setMapError('Map container not available');
      setIsLoading(false);
      return;
    }
    
    if (!window.google) {
      console.error('Google Maps API not loaded');
      setMapError('Google Maps API not available');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Creating Google Maps instance...');
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

      console.log('Map instance created successfully');

      // Check if required libraries are available
      if (!window.google.maps.drawing) {
        throw new Error('Google Maps Drawing library not loaded. Please enable the "Drawing API" in Google Cloud Console.');
      }
      if (!window.google.maps.geometry) {
        throw new Error('Google Maps Geometry library not loaded. Please enable the "Geometry API" in Google Cloud Console.');
      }
      if (!window.google.maps.places) {
        throw new Error('Google Maps Places library not loaded. Please enable the "Places API" in Google Cloud Console.');
      }

      console.log('Creating Drawing Manager...');
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

      console.log('Drawing Manager created successfully');
      drawingManagerInstance.setMap(mapInstance);

    // Handle drawing completion
    window.google.maps.event.addListener(drawingManagerInstance, 'polygoncomplete', (polygon: any) => {
      const polygonId = Date.now().toString();
      polygon.polygonId = polygonId;
      
      setPolygons(prev => [...prev, polygon]);
      drawingManagerInstance.setDrawingMode(null);
      
      const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
      const areaInSqFt = area * 10.764; // Convert sq meters to sq feet
      const finalArea = unit === 'sqm' ? area : areaInSqFt;
      
      // Add this measurement to the list
      const newMeasurement = { id: polygonId, value: finalArea, type: 'area' as const };
      setMeasurements(prev => {
        const updated = [...prev, newMeasurement];
        const total = updated.reduce((sum, m) => sum + m.value, 0);
        setTotalMeasurement(total);
        onMeasurementComplete({ value: total, unit });
        return updated;
      });

      // Listen for path changes
      window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
        updatePolygonMeasurement(polygon, polygonId);
      });
      window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
        updatePolygonMeasurement(polygon, polygonId);
      });
    });

    window.google.maps.event.addListener(drawingManagerInstance, 'polylinecomplete', (polyline: any) => {
      const polylineId = Date.now().toString();
      polyline.polylineId = polylineId;
      
      setPolylines(prev => [...prev, polyline]);
      drawingManagerInstance.setDrawingMode(null);
      
      const distance = window.google.maps.geometry.spherical.computeLength(polyline.getPath());
      const distanceInFt = distance * 3.28084; // Convert meters to feet
      const finalDistance = unit === 'm' ? distance : distanceInFt;
      
      // Add this measurement to the list
      const newMeasurement = { id: polylineId, value: finalDistance, type: 'distance' as const };
      setMeasurements(prev => {
        const updated = [...prev, newMeasurement];
        const total = updated.reduce((sum, m) => sum + m.value, 0);
        setTotalMeasurement(total);
        onMeasurementComplete({ value: total, unit });
        return updated;
      });

      // Listen for path changes
      window.google.maps.event.addListener(polyline.getPath(), 'set_at', () => {
        updatePolylineMeasurement(polyline, polylineId);
      });
      window.google.maps.event.addListener(polyline.getPath(), 'insert_at', () => {
        updatePolylineMeasurement(polyline, polylineId);
      });
    });

    setMap(mapInstance);
    setDrawingManager(drawingManagerInstance);
    setIsMapLoaded(true);

    // Set up Places Autocomplete
    if (addressInputRef.current && window.google.maps.places) {
      console.log('Setting up Places Autocomplete...');
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' }, // Restrict to US addresses
          fields: ['formatted_address', 'geometry']
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place.geometry && place.geometry.location) {
          mapInstance.setCenter(place.geometry.location);
          mapInstance.setZoom(20);
          setAddress(place.formatted_address || '');
        }
      });

      setAutocomplete(autocompleteInstance);
      console.log('Places Autocomplete set up successfully');
    }

    // Search for default address if provided
    if (defaultAddress) {
      searchAddress(defaultAddress, mapInstance);
    }
    } catch (error) {
      console.error('Error initializing map:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error details:', errorMessage);
      console.error('Google Maps APIs available:', {
        maps: !!window.google?.maps,
        drawing: !!window.google?.maps?.drawing,
        geometry: !!window.google?.maps?.geometry,
        places: !!window.google?.maps?.places
      });
      setMapError(`Failed to initialize Google Maps: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const updatePolygonMeasurement = (polygon: any, polygonId: string) => {
    const area = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
    const areaInSqFt = area * 10.764;
    const finalArea = unit === 'sqm' ? area : areaInSqFt;
    
    setMeasurements(prev => {
      const updated = prev.map(m => 
        m.id === polygonId ? { ...m, value: finalArea } : m
      );
      const total = updated.reduce((sum, m) => sum + m.value, 0);
      setTotalMeasurement(total);
      onMeasurementComplete({ value: total, unit });
      return updated;
    });
  };

  const updatePolylineMeasurement = (polyline: any, polylineId: string) => {
    const distance = window.google.maps.geometry.spherical.computeLength(polyline.getPath());
    const distanceInFt = distance * 3.28084;
    const finalDistance = unit === 'm' ? distance : distanceInFt;
    
    setMeasurements(prev => {
      const updated = prev.map(m => 
        m.id === polylineId ? { ...m, value: finalDistance } : m
      );
      const total = updated.reduce((sum, m) => sum + m.value, 0);
      setTotalMeasurement(total);
      onMeasurementComplete({ value: total, unit });
      return updated;
    });
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
    // Clear all polygons
    polygons.forEach(polygon => {
      polygon.setMap(null);
    });
    setPolygons([]);
    
    // Clear all polylines
    polylines.forEach(polyline => {
      polyline.setMap(null);
    });
    setPolylines([]);
    
    // Clear measurements
    setMeasurements([]);
    setTotalMeasurement(0);
    onMeasurementComplete({ value: 0, unit });
  };

  const removeMeasurement = (measurementId: string) => {
    const measurement = measurements.find(m => m.id === measurementId);
    if (!measurement) return;

    if (measurement.type === 'area') {
      const polygon = polygons.find(p => p.polygonId === measurementId);
      if (polygon) {
        polygon.setMap(null);
        setPolygons(prev => prev.filter(p => p.polygonId !== measurementId));
      }
    } else {
      const polyline = polylines.find(p => p.polylineId === measurementId);
      if (polyline) {
        polyline.setMap(null);
        setPolylines(prev => prev.filter(p => p.polylineId !== measurementId));
      }
    }

    setMeasurements(prev => {
      const updated = prev.filter(m => m.id !== measurementId);
      const total = updated.reduce((sum, m) => sum + m.value, 0);
      setTotalMeasurement(total);
      onMeasurementComplete({ value: total, unit });
      return updated;
    });
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

  // Show loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Property Measurement Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (mapError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Property Measurement Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border-2 border-red-200">
            <div className="text-center">
              <div className="text-red-600 mb-2">⚠️</div>
              <p className="text-red-700 font-medium">Failed to load Google Maps</p>
              <p className="text-red-600 text-sm mt-1">{mapError}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            ref={addressInputRef}
            type="text"
            placeholder="Start typing an address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleAddressSearch} 
            variant="outline" 
            size="sm"
            className="sm:w-auto w-full"
          >
            <Search className="w-4 h-4 sm:mr-0 mr-2" />
            <span className="sm:hidden">Search Address</span>
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative rounded-lg overflow-hidden border">
          <div 
            ref={mapRef} 
            className="w-full h-64 sm:h-96"
            style={{ minHeight: '256px' }}
          />
        </div>

        {/* Controls Below Map - Mobile Optimized */}
        {isMapLoaded && (
          <div className="bg-gray-900 text-white p-3 rounded-lg">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                <Button
                  onClick={startDrawing}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  Draw {measurementType === 'area' ? 'Area' : 'Distance'}
                </Button>
                <Button
                  onClick={clearDrawing}
                  size="sm"
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10 w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
              
              {/* Total Display */}
              {totalMeasurement > 0 && (
                <div className="flex justify-center sm:justify-end">
                  <Badge variant="secondary" className="bg-blue-600 text-white px-3 py-1">
                    Total: {formatMeasurement(totalMeasurement)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions - Mobile Optimized */}
        <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium mb-2 text-sm">How to use:</h4>
          <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
            <li className="pl-2">Type your property address and select from suggestions</li>
            <li className="pl-2">Tap "Draw {measurementType === 'area' ? 'Area' : 'Distance'}" to start measuring</li>
            <li className="pl-2">{measurementType === 'area' 
              ? 'Tap around the area to create a shape' 
              : 'Tap along the path you want to measure'}</li>
            <li className="pl-2">Repeat to measure multiple {measurementType === 'area' ? 'areas' : 'distances'}</li>
            <li className="pl-2">All measurements combine automatically</li>
          </ol>
        </div>

        {/* Individual Measurements List - Mobile Optimized */}
        {measurements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center justify-between">
              <span>Measurements ({measurements.length})</span>
              <Button
                onClick={clearDrawing}
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
              >
                Clear All
              </Button>
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {measurements.map((measurement, index) => (
                <div key={measurement.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 flex-1 mr-2">
                      {measurement.type === 'area' ? 'Area' : 'Distance'} {index + 1}:
                      <span className="font-medium ml-1">{formatMeasurement(measurement.value)}</span>
                    </span>
                    <Button
                      onClick={() => removeMeasurement(measurement.id)}
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 hover:bg-red-50 hover:border-red-300 flex-shrink-0"
                    >
                      <span className="text-red-500">×</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Measurement Summary - Mobile Optimized */}
        {totalMeasurement > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm font-medium text-green-800">
                Total {measurementType}: {formatMeasurement(totalMeasurement)}
              </span>
              <Badge variant="outline" className="text-green-600 border-green-300 self-start sm:self-auto">
                Ready for calculation
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}