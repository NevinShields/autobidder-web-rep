import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Ruler, Trash2, RotateCcw, Search, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { TerraDraw } from 'terra-draw';
import { TerraDrawGoogleMapsAdapter } from 'terra-draw-google-maps-adapter';
import {
  TerraDrawSelectMode,
  TerraDrawPolygonMode,
  TerraDrawLineStringMode,
} from 'terra-draw';
import { useGoogleMaps } from './google-maps-loader';

interface MeasureMapProps {
  onMeasurementComplete: (measurement: { value: number; unit: string }) => void;
  defaultAddress?: string;
  measurementType?: 'area' | 'distance';
  unit?: 'sqft' | 'sqm' | 'ft' | 'm';
  styles?: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fillOpacity?: number;
  };
}

export default function MeasureMapTerraImproved({
  onMeasurementComplete,
  defaultAddress = '',
  measurementType = 'area',
  unit = 'sqft',
  styles = {}
}: MeasureMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [draw, setDraw] = useState<TerraDraw | null>(null);
  const [address, setAddress] = useState(defaultAddress);
  const [measurements, setMeasurements] = useState<Array<{id: string, value: number, type: 'area' | 'distance'}>>([]);
  const [totalMeasurement, setTotalMeasurement] = useState<number>(0);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  
  // Generate stable unique ID for the map container
  const mapId = useMemo(() => `terra-draw-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Use the improved Google Maps loader
  const { isLoaded: isGoogleMapsLoaded, isLoading: isGoogleMapsLoading, error: googleMapsError } = useGoogleMaps();

  const defaultStyles = {
    fillColor: '#2563EB',
    strokeColor: '#2563EB',
    strokeWidth: 2,
    fillOpacity: 0.3,
    ...styles
  };

  // Initialize map when Google Maps is loaded and component is mounted
  useEffect(() => {
    if (isGoogleMapsLoaded && !isMapInitialized && mapRef.current) {
      initializeMap();
    }
  }, [isGoogleMapsLoaded, isMapInitialized]);

  // Handle Google Maps loading error
  useEffect(() => {
    if (googleMapsError) {
      setMapError(googleMapsError);
    }
  }, [googleMapsError]);

  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !window.google?.maps) {
      setMapError('Google Maps not available');
      return;
    }

    try {
      // Clear any previous error
      setMapError(null);

      // Ensure the map container has dimensions
      const rect = mapRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Force container to have minimum dimensions
        mapRef.current.style.minHeight = '400px';
        mapRef.current.style.width = '100%';
      }

      console.log('Creating Google Maps instance with Terra Draw...');
      
      // Create map with optimized options
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 }, // New York City default
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.SATELLITE,
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        // Performance optimizations
        maxZoom: 22,
        minZoom: 3,
        restriction: {
          latLngBounds: {
            north: 85,
            south: -85,
            west: -180,
            east: 180,
          },
        },
      });

      console.log('Map instance created successfully');

      // Wait for map to be fully loaded
      await new Promise<void>((resolve) => {
        const listener = mapInstance.addListener('idle', () => {
          window.google.maps.event.removeListener(listener);
          resolve();
        });
      });

      // Initialize Terra Draw with error handling
      let terraDrawInstance: TerraDraw;
      try {
        terraDrawInstance = new TerraDraw({
          adapter: new TerraDrawGoogleMapsAdapter({
            lib: window.google.maps,
            map: mapInstance
          }),
          modes: [
            new TerraDrawSelectMode(),
            new TerraDrawPolygonMode({
              styles: {
                fillColor: defaultStyles.fillColor as any,
                fillOpacity: defaultStyles.fillOpacity,
                outlineColor: defaultStyles.strokeColor as any,
                outlineWidth: defaultStyles.strokeWidth,
              }
            }),
            new TerraDrawLineStringMode({
              styles: {
                lineStringColor: defaultStyles.strokeColor as any,
                lineStringWidth: defaultStyles.strokeWidth,
              }
            }),
          ]
        });

        console.log('Terra Draw instance created successfully');
        
        // Start Terra Draw
        terraDrawInstance.start();
        terraDrawInstance.setMode('select');

        // Listen for changes in drawn features
        terraDrawInstance.on('change', (changes) => {
          console.log('Terra Draw changes:', changes);
          updateMeasurements(terraDrawInstance);
        });

        console.log('Terra Draw initialized and started');

      } catch (terraError) {
        console.error('Terra Draw initialization error:', terraError);
        setMapError(`Terra Draw initialization failed: ${terraError instanceof Error ? terraError.message : 'Unknown error'}`);
        return;
      }

      setMap(mapInstance);
      setDraw(terraDrawInstance);
      setIsMapInitialized(true);

      // Set up Places Autocomplete with error handling
      try {
        if (addressInputRef.current && window.google.maps.places) {
          console.log('Setting up Places Autocomplete...');
          const autocompleteInstance = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            {
              types: ['address'],
              componentRestrictions: { country: 'us' },
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
      } catch (autocompleteError) {
        console.warn('Places Autocomplete setup failed:', autocompleteError);
        // Don't fail the entire map initialization for autocomplete issues
      }

      // Search for default address if provided
      if (defaultAddress) {
        await searchAddress(defaultAddress, mapInstance);
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMapError(`Failed to initialize map: ${errorMessage}`);
    }
  }, [defaultAddress, defaultStyles]);

  const updateMeasurements = useCallback((terraDrawInstance: TerraDraw) => {
    try {
      const snapshot = terraDrawInstance.getSnapshot();
      const newMeasurements: Array<{id: string, value: number, type: 'area' | 'distance'}> = [];

      snapshot.forEach((feature) => {
        if (!feature.properties?.id) return;

        const id = feature.properties.id;
        
        if (feature.geometry.type === 'Polygon') {
          // Calculate area for polygons
          const coordinates = feature.geometry.coordinates[0];
          const path = coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
          
          // Use Google's spherical geometry to calculate area
          const area = window.google.maps.geometry.spherical.computeArea(path);
          const areaInSqFt = area * 10.764; // Convert sq meters to sq feet
          const finalArea = unit === 'sqm' ? area : areaInSqFt;
          
          newMeasurements.push({
            id,
            value: finalArea,
            type: 'area'
          });
        } else if (feature.geometry.type === 'LineString') {
          // Calculate distance for line strings
          const coordinates = feature.geometry.coordinates;
          const path = coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
          
          // Use Google's spherical geometry to calculate distance
          const distance = window.google.maps.geometry.spherical.computeLength(path);
          const distanceInFt = distance * 3.28084; // Convert meters to feet
          const finalDistance = unit === 'm' ? distance : distanceInFt;
          
          newMeasurements.push({
            id,
            value: finalDistance,
            type: 'distance'
          });
        }
      });

      setMeasurements(newMeasurements);
      const total = newMeasurements.reduce((sum, m) => sum + m.value, 0);
      setTotalMeasurement(total);
      onMeasurementComplete({ value: total, unit });
    } catch (error) {
      console.error('Error updating measurements:', error);
    }
  }, [unit, onMeasurementComplete]);

  const startDrawing = useCallback(() => {
    if (!draw) return;
    
    if (measurementType === 'area') {
      draw.setMode('polygon');
    } else {
      draw.setMode('linestring');
    }
  }, [draw, measurementType]);

  const clearDrawing = useCallback(() => {
    if (!draw) return;
    
    try {
      draw.clear();
      setMeasurements([]);
      setTotalMeasurement(0);
      onMeasurementComplete({ value: 0, unit });
    } catch (error) {
      console.error('Error clearing drawing:', error);
    }
  }, [draw, unit, onMeasurementComplete]);

  const removeMeasurement = useCallback((measurementId: string) => {
    if (!draw) return;
    
    try {
      // Remove the specific feature from Terra Draw
      const snapshot = draw.getSnapshot();
      const featureToRemove = snapshot.find(f => f.properties?.id === measurementId);
      
      if (featureToRemove) {
        draw.removeFeatures([featureToRemove.properties.id]);
        updateMeasurements(draw);
      }
    } catch (error) {
      console.error('Error removing measurement:', error);
    }
  }, [draw, updateMeasurements]);

  const searchAddress = useCallback(async (searchAddress: string, mapInstance?: any) => {
    if (!searchAddress.trim()) return;

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(searchAddress)}`);
      const data = await response.json();
      
      if (data.success && data.location) {
        const { latitude, longitude, formattedAddress } = data.location;
        const location = { lat: latitude, lng: longitude };
        
        const targetMap = mapInstance || map;
        if (targetMap) {
          targetMap.setCenter(location);
          targetMap.setZoom(20);
          setAddress(formattedAddress);
        }
      } else {
        console.error('Geocoding failed:', data.error);
        setMapError(`Could not find location: ${searchAddress}`);
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setMapError('Error occurred while searching for the address');
    }
  }, [map]);

  const retryInitialization = useCallback(() => {
    setMapError(null);
    setIsMapInitialized(false);
    if (isGoogleMapsLoaded) {
      initializeMap();
    }
  }, [isGoogleMapsLoaded, initializeMap]);

  const formatMeasurement = (value: number): string => {
    const roundedValue = Math.round(value * 100) / 100;
    return `${roundedValue.toLocaleString()} ${unit}`;
  };

  // Show loading state
  if (isGoogleMapsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Terra Draw Measure Map
            <Badge variant="secondary" className="bg-green-100 text-green-800">Loading</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Loading Google Maps API...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (mapError || googleMapsError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Terra Draw Measure Map
            <Badge variant="destructive">Error</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{mapError || googleMapsError}</p>
            <div className="space-x-2">
              <Button onClick={retryInitialization} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Terra Draw Measure Map
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {isMapInitialized ? 'Ready' : 'Initializing'}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {measurementType === 'area' ? 'Area Mode' : 'Distance Mode'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Search */}
        <div className="flex space-x-2">
          <Input
            ref={addressInputRef}
            type="text"
            placeholder="Enter address to search..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchAddress(address);
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={() => searchAddress(address)}
            disabled={!address.trim()}
            size="icon"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Map Container */}
        <div
          ref={mapRef}
          id={mapId}
          className="w-full h-96 border border-gray-300 rounded-lg bg-gray-100"
          style={{ minHeight: '400px' }}
        />

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={startDrawing}
            disabled={!isMapInitialized}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Start {measurementType === 'area' ? 'Area' : 'Distance'} Drawing
          </Button>
          
          <Button
            onClick={clearDrawing}
            variant="outline"
            disabled={!isMapInitialized || measurements.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>

        {/* Measurements Display */}
        {measurements.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Measurements:</h4>
            <div className="space-y-1">
              {measurements.map((measurement, index) => (
                <div key={measurement.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">
                    {measurement.type === 'area' ? 'Area' : 'Distance'} {index + 1}: {formatMeasurement(measurement.value)}
                  </span>
                  <Button
                    onClick={() => removeMeasurement(measurement.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            {measurements.length > 1 && (
              <div className="font-medium text-sm pt-2 border-t">
                Total: {formatMeasurement(totalMeasurement)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}