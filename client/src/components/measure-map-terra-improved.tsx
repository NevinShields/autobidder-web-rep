import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Ruler, Trash2, RotateCcw, Search, Plus, AlertCircle, RefreshCw, Square, Minus, Edit3, Hand, Box } from 'lucide-react';
import { TerraDraw } from 'terra-draw';
import { TerraDrawGoogleMapsAdapter } from 'terra-draw-google-maps-adapter';
import {
  TerraDrawSelectMode,
  TerraDrawPolygonMode,
  TerraDrawLineStringMode,
  TerraDrawFreehandMode,
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
  const [currentTool, setCurrentTool] = useState<'select' | 'polygon' | 'linestring' | 'freehand'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<'sqft' | 'ft' | 'sqm' | 'm'>(unit);
  const [is3DMode, setIs3DMode] = useState(false);
  
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
            new TerraDrawFreehandMode({
              styles: {
                fillColor: defaultStyles.fillColor as any,
                fillOpacity: defaultStyles.fillOpacity,
                outlineColor: defaultStyles.strokeColor as any,
                outlineWidth: defaultStyles.strokeWidth,
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
          console.log('Calling updateMeasurements...');
          
          // Call updateMeasurements directly here
          try {
            const features = terraDrawInstance.getSnapshot();
            console.log('Terra Draw features from onChange:', features);
            
            const newMeasurements: Array<{id: string, value: number, type: 'area' | 'distance'}> = [];
            
            features.forEach((feature: any) => {
              console.log('Processing feature:', feature);
              try {
                if (feature.geometry?.coordinates && feature.id) {
                  console.log('Feature has geometry and ID:', feature.geometry.type, feature.id);
                  let value = 0;
                  let type: 'area' | 'distance' = 'area';
                  
                  if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
                    // For polygons and freehand (which creates polygons)
                    if (window.google?.maps?.geometry?.spherical) {
                      // Use Google Maps spherical geometry for accurate calculations
                      const path = feature.geometry.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }));
                      const area = window.google.maps.geometry.spherical.computeArea(path);
                      value = currentUnit === 'sqft' ? area * 10.764 : area; // Convert to sq ft if needed
                    }
                    type = 'area';
                  } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates) {
                    // For linestrings
                    if (window.google?.maps?.geometry?.spherical) {
                      // Use Google Maps spherical geometry for accurate calculations
                      const path = feature.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
                      const distance = window.google.maps.geometry.spherical.computeLength(path);
                      value = currentUnit === 'sqft' ? distance * 3.28084 : distance; // Convert to ft if needed
                    }
                    type = 'distance';
                  }
                  
                  console.log('Calculated value:', value, 'for type:', type);
                  if (value > 0) {
                    newMeasurements.push({
                      id: feature.id,
                      value,
                      type
                    });
                    console.log('Added measurement:', { id: feature.id, value, type });
                  } else {
                    console.log('Value is 0, not adding measurement');
                  }
                }
              } catch (featureError) {
                console.warn('Error processing feature:', featureError, feature);
              }
            });
            
            console.log('Setting measurements:', newMeasurements);
            setMeasurements(newMeasurements);
            
            // Calculate total
            const total = newMeasurements.reduce((sum, m) => sum + m.value, 0);
            setTotalMeasurement(total);
            
            // Call the callback with the most recent measurement
            if (newMeasurements.length > 0) {
              const lastMeasurement = newMeasurements[newMeasurements.length - 1];
              onMeasurementComplete({
                value: lastMeasurement.value,
                unit: lastMeasurement.type === 'area' ? (currentUnit === 'sqft' ? 'sq ft' : 'sq m') : (currentUnit === 'sqft' ? 'ft' : 'm')
              });
            }
          } catch (error) {
            console.error('Error in onChange updateMeasurements:', error);
          }
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

  // Calculate area from polygon coordinates using shoelace formula
  const calculatePolygonArea = useCallback((coordinates: number[][]): number => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    
    area = Math.abs(area) / 2;
    
    // Convert from degrees to square meters (rough approximation)
    // 1 degree lat ≈ 111,320 meters, 1 degree lng ≈ 111,320 * cos(lat) meters
    const avgLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
    const latToMeters = 111320;
    const lngToMeters = 111320 * Math.cos(avgLat * Math.PI / 180);
    const areaInSquareMeters = area * latToMeters * lngToMeters;
    
    // Convert to square feet if needed
    return currentUnit === 'sqft' ? areaInSquareMeters * 10.7639 : areaInSquareMeters;
  }, [currentUnit]);

  // Calculate distance from linestring coordinates
  const calculateLinestringDistance = useCallback((coordinates: number[][]): number => {
    if (coordinates.length < 2) return 0;
    
    let totalDistance = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lng1, lat1] = coordinates[i];
      const [lng2, lat2] = coordinates[i + 1];
      
      // Haversine formula for distance calculation
      const R = 6371000; // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lng2 - lng1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      totalDistance += R * c;
    }
    
    // Convert to feet if needed
    return currentUnit === 'sqft' ? totalDistance * 3.28084 : totalDistance;
  }, [currentUnit]);

  // Update measurements based on drawn features with improved error handling
  const updateMeasurements = useCallback(() => {
    try {
      if (!draw) return;
      
      const features = draw.getSnapshot();
      console.log('Terra Draw features:', features);
      const newMeasurements: Array<{id: string, value: number, type: 'area' | 'distance'}> = [];
      
      features.forEach((feature: any) => {
        console.log('Processing feature:', feature);
        try {
          if (feature.geometry?.coordinates && feature.properties?.id) {
            console.log('Feature has geometry and ID:', feature.geometry.type, feature.properties.id);
            let value = 0;
            let type: 'area' | 'distance' = 'area';
            
            if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
              // For polygons and freehand (which creates polygons)
              if (window.google?.maps?.geometry?.spherical) {
                // Use Google Maps spherical geometry for accurate calculations
                const path = feature.geometry.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }));
                const area = window.google.maps.geometry.spherical.computeArea(path);
                value = currentUnit === 'sqm' ? area : area * 10.764; // Convert to sq ft if needed
              } else {
                value = calculatePolygonArea(feature.geometry.coordinates[0]);
              }
              type = 'area';
            } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates) {
              // For linestrings
              if (window.google?.maps?.geometry?.spherical) {
                // Use Google Maps spherical geometry for accurate calculations
                const path = feature.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
                const distance = window.google.maps.geometry.spherical.computeLength(path);
                value = currentUnit === 'sqm' ? distance : distance * 3.28084; // Convert to ft if needed
              } else {
                value = calculateLinestringDistance(feature.geometry.coordinates);
              }
              type = 'distance';
            }
            
            console.log('Calculated value:', value, 'for type:', type);
            if (value > 0) {
              newMeasurements.push({
                id: feature.properties.id,
                value,
                type
              });
              console.log('Added measurement:', { id: feature.properties.id, value, type });
            } else {
              console.log('Value is 0, not adding measurement');
            }
          }
        } catch (featureError) {
          console.warn('Error processing feature:', featureError, feature);
        }
      });
      
      console.log('Setting measurements:', newMeasurements);
      setMeasurements(newMeasurements);
      
      // Calculate total (separate totals for area and distance)
      const areaTotal = newMeasurements
        .filter(m => m.type === 'area')
        .reduce((sum, m) => sum + m.value, 0);
      const distanceTotal = newMeasurements
        .filter(m => m.type === 'distance')
        .reduce((sum, m) => sum + m.value, 0);
      
      // Use the total based on current measurement type
      const total = measurementType === 'area' ? areaTotal : distanceTotal;
      setTotalMeasurement(total);
      
      // Call the callback with the most recent measurement
      if (newMeasurements.length > 0) {
        const lastMeasurement = newMeasurements[newMeasurements.length - 1];
        onMeasurementComplete({
          value: lastMeasurement.value,
          unit: lastMeasurement.type === 'area' ? (currentUnit === 'sqft' ? 'sq ft' : 'sq m') : (currentUnit === 'sqft' ? 'ft' : 'm')
        });
      }
    } catch (error) {
      console.error('Error updating measurements:', error);
    }
  }, [draw, calculatePolygonArea, calculateLinestringDistance, measurementType, currentUnit, onMeasurementComplete]);

  // Tool switching functions
  const setTool = useCallback((tool: 'select' | 'polygon' | 'linestring' | 'freehand') => {
    if (!draw) return;
    
    setCurrentTool(tool);
    draw.setMode(tool);
    setIsDrawing(tool !== 'select');
  }, [draw]);

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

  const toggle3DMode = useCallback(() => {
    if (!map) return;
    
    try {
      if (is3DMode) {
        // Switch to 2D (satellite view)
        map.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
        map.setTilt(0);
      } else {
        // Switch to 3D (satellite view with tilt)
        map.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
        map.setTilt(45);
      }
      setIs3DMode(!is3DMode);
    } catch (error) {
      console.error('Error toggling 3D mode:', error);
    }
  }, [map, is3DMode]);

  const removeMeasurement = useCallback((measurementId: string) => {
    if (!draw) return;
    
    try {
      // Remove the specific feature from Terra Draw
      const snapshot = draw.getSnapshot();
      const featureToRemove = snapshot.find(f => f.properties?.id === measurementId);
      
      if (featureToRemove) {
        draw.removeFeatures([featureToRemove.properties.id]);
        updateMeasurements();
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

  const formatMeasurement = (value: number, measurementType?: 'area' | 'distance'): string => {
    const roundedValue = Math.round(value * 100) / 100;
    
    // Determine the appropriate unit based on measurement type
    let displayUnit = currentUnit;
    if (measurementType === 'area') {
      displayUnit = currentUnit === 'ft' || currentUnit === 'sqft' ? 'sqft' : 'sqm';
    } else if (measurementType === 'distance') {
      displayUnit = currentUnit === 'sqft' || currentUnit === 'ft' ? 'ft' : 'm';
    }
    
    return `${roundedValue.toLocaleString()} ${displayUnit}`;
  };

  const convertMeasurement = (value: number, fromUnit: string, toUnit: string): number => {
    // Area conversions
    if (fromUnit === 'sqft' && toUnit === 'sqm') {
      return value * 0.092903; // sqft to sqm
    } else if (fromUnit === 'sqm' && toUnit === 'sqft') {
      return value * 10.7639; // sqm to sqft
    }
    // Distance conversions  
    else if (fromUnit === 'ft' && toUnit === 'm') {
      return value * 0.3048; // ft to m
    } else if (fromUnit === 'm' && toUnit === 'ft') {
      return value * 3.28084; // m to ft
    }
    
    return value; // No conversion needed
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
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          Property Measurement Tool
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {isMapInitialized ? 'Ready' : 'Initializing'}
          </Badge>
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
            onKeyPress={(e) => e.key === 'Enter' && searchAddress(address)}
            className="flex-1"
          />
          <Button 
            onClick={() => searchAddress(address)} 
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
            id={mapId}
            ref={mapRef}
            className="w-full h-64 sm:h-96"
            style={{ minHeight: '256px' }}
          />
          
          {/* Drawing Controls Overlay */}
          {isMapInitialized && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Button
                onClick={() => setTool('linestring')}
                variant={currentTool === 'linestring' ? 'default' : 'outline'}
                className={`shadow-lg ${currentTool === 'linestring' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white'}`}
                size="sm"
              >
                <Minus className="w-4 h-4 mr-1" />
                Draw Line
              </Button>
              
              <Button
                onClick={() => setTool('polygon')}
                variant={currentTool === 'polygon' ? 'default' : 'outline'}
                className={`shadow-lg ${currentTool === 'polygon' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white'}`}
                size="sm"
              >
                <Square className="w-4 h-4 mr-1" />
                Draw Area
              </Button>
              
              <Button
                onClick={() => setTool('freehand')}
                variant={currentTool === 'freehand' ? 'default' : 'outline'}
                className={`shadow-lg ${currentTool === 'freehand' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white'}`}
                size="sm"
              >
                <Hand className="w-4 h-4 mr-1" />
                Freehand
              </Button>
              
              <Button
                onClick={() => setTool('select')}
                variant={currentTool === 'select' ? 'default' : 'outline'}
                className={`shadow-lg ${currentTool === 'select' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white'}`}
                size="sm"
              >
                Select/Edit
              </Button>
              
              <Button
                onClick={clearDrawing}
                variant="outline"
                className="shadow-lg bg-white"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}

          {/* Unit Selector and 3D Toggle Overlay */}
          {isMapInitialized && (
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                onClick={toggle3DMode}
                variant={is3DMode ? 'default' : 'outline'}
                className={`shadow-lg text-xs ${is3DMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white'}`}
                size="sm"
              >
                <Box className="w-4 h-4 mr-1" />
                {is3DMode ? '3D' : '2D'}
              </Button>
              
              <select 
                value={currentUnit} 
                onChange={(e) => setCurrentUnit(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white shadow-lg"
              >
                <option value="sqft">Sq Ft / Ft</option>
                <option value="sqm">Sq M / M</option>
              </select>
            </div>
          )}

          {/* Total Measurement Overlay */}
          {totalMeasurement > 0 && (
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
              <div className="text-sm font-medium text-gray-600">
                Total: {formatMeasurement(totalMeasurement)}
              </div>
            </div>
          )}
        </div>

        {/* Individual Measurements List */}
        {measurements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Measurements ({measurements.length})</span>
              <Button
                onClick={clearDrawing}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {measurements.map((measurement, index) => (
                <div key={measurement.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {measurement.type === 'area' ? 'Area' : 'Distance'} {index + 1}:
                      <span className="font-medium ml-1">{formatMeasurement(measurement.value, measurement.type)}</span>
                    </span>
                    <Button
                      onClick={() => removeMeasurement(measurement.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 h-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {isMapInitialized && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">How to measure:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="pl-2">• Select a drawing tool from the left overlay</li>
              <li className="pl-2">• For lines: Click along the path, double-click to finish</li>
              <li className="pl-2">• For areas: Click to create points around the area, double-click to finish</li>
              <li className="pl-2">• For freehand: Hold and drag to draw the area</li>
              <li className="pl-2">• Use "Select/Edit" mode to modify existing shapes</li>
              <li className="pl-2">• Switch units using the dropdown in the top-right</li>
            </ul>
          </div>
        )}

        {/* Total Measurement Summary */}
        {totalMeasurement > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-800">
                Total: {formatMeasurement(totalMeasurement)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}