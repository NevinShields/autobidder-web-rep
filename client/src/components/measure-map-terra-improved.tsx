import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Ruler, Trash2, RotateCcw, Search, Plus, AlertCircle, RefreshCw, Square, Minus, Edit3, Hand, Box, ChevronDown, ChevronUp, Maximize, Minimize, Home } from 'lucide-react';
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
  const [showInstructions, setShowInstructions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedContainerRef = useRef<HTMLDivElement>(null);
  
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
      
      // Detect if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      
      // Create map with optimized options
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 }, // New York City default
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.SATELLITE,
        // Use 'cooperative' on mobile for better drawing experience (requires two fingers to pan)
        // Use 'greedy' on desktop (allows single-finger/mouse pan)
        gestureHandling: isMobile ? 'cooperative' : 'greedy',
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
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
            new TerraDrawSelectMode({
              flags: {
                // Enable editing for polygons
                polygon: {
                  feature: {
                    draggable: true,
                    coordinates: {
                      draggable: true,
                      midpoints: true,
                      deletable: true
                    }
                  }
                },
                // Enable editing for linestrings
                linestring: {
                  feature: {
                    draggable: true,
                    coordinates: {
                      draggable: true,
                      midpoints: true,
                      deletable: true
                    }
                  }
                },
                // Enable editing for freehand drawings (they become polygons)
                freehand: {
                  feature: {
                    draggable: true,
                    coordinates: {
                      draggable: true,
                      midpoints: true,
                      deletable: true
                    }
                  }
                }
              }
            }),
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

      // Search for default address if provided (don't show error if it fails)
      if (defaultAddress) {
        await searchAddress(defaultAddress, mapInstance, true);
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
    
    // Auto-switch units based on measurement type
    if (tool === 'linestring') {
      // Drawing lines - switch to linear units
      setCurrentUnit(currentUnit === 'sqft' || currentUnit === 'ft' ? 'ft' : 'm');
    } else if (tool === 'polygon' || tool === 'freehand') {
      // Drawing areas - switch to area units  
      setCurrentUnit(currentUnit === 'ft' || currentUnit === 'sqft' ? 'sqft' : 'sqm');
    }
  }, [draw, currentUnit]);

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
        map.setHeading(0);
      } else {
        // Switch to 3D (satellite view with tilt)
        map.setMapTypeId(window.google.maps.MapTypeId.SATELLITE);
        map.setTilt(45);
        // Note: heading (rotation) can be controlled by user with rotate controls
      }
      setIs3DMode(!is3DMode);
    } catch (error) {
      console.error('Error toggling 3D mode:', error);
    }
  }, [map, is3DMode]);

  // Expanded view handlers
  const enterExpanded = useCallback(() => {
    console.log('Expanding map to fill container...');
    setIsExpanded(true);
  }, []);

  const exitExpanded = useCallback(() => {
    console.log('Collapsing map to normal size...');
    setIsExpanded(false);
  }, []);


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

  const searchAddress = useCallback(async (searchAddress: string, mapInstance?: any, isAutoSearch = false) => {
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
        // Only set error if this is a manual user search, not automatic
        if (!isAutoSearch) {
          setMapError(`Could not find location: ${searchAddress}`);
        }
      }
    } catch (error) {
      console.error('Error searching address:', error);
      // Only set error if this is a manual user search, not automatic
      if (!isAutoSearch) {
        setMapError('Error occurred while searching for the address');
      }
    }
  }, [map]);

  const detectBuilding = useCallback(async () => {
    if (!address.trim() || !draw) return;

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}&extra_computations=BUILDING_AND_ENTRANCES`);
      const data = await response.json();
      
      if (data.success && data.buildings && data.buildings.length > 0) {
        const building = data.buildings[0];
        if (building.outline && building.outline.polygon) {
          const polygon = building.outline.polygon;

          // TerraDraw expects features in GeoJSON format
          const newFeature = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: polygon.coordinates,
            },
            properties: {}
          };

          // The add method returns the ids of the features that were added
          const [newFeatureId] = draw.add([newFeature]);
          
          // Center the map on the new feature
          if (map && polygon.coordinates && polygon.coordinates[0]) {
            const bounds = new window.google.maps.LatLngBounds();
            polygon.coordinates[0].forEach((coord: [number, number]) => {
              bounds.extend(new window.google.maps.LatLng(coord[1], coord[0]));
            });
            map.fitBounds(bounds);
          }

          // Manually trigger an update to calculate measurement
          updateMeasurements();
        }
      } else {
        console.error('Building detection failed:', data.error || 'No building data returned');
        setMapError(`Could not detect building at location: ${address}`);
      }
    } catch (error) {
      console.error('Error detecting building:', error);
      setMapError('Error occurred while detecting the building outline');
    }
  }, [address, draw, map, updateMeasurements]);

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

      <CardContent className="p-0 space-y-4">
        {/* Address Search */}
        <div className="flex flex-col sm:flex-row gap-2 px-6 pt-6">
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
          <Button 
            onClick={detectBuilding} 
            variant="outline" 
            size="sm"
            className="sm:w-auto w-full"
          >
            <Home className="w-4 h-4 sm:mr-0 mr-2" />
            <span className="sm:hidden">Detect Building</span>
          </Button>
        </div>

        {/* Mobile Controls - Above Map */}
        {isMapInitialized && (
          <div className="block lg:hidden px-6">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-2 mb-4">
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {/* Drawing Tools */}
                <Button
                  onClick={() => setTool('polygon')}
                  variant="ghost"
                  size="sm"
                  className={`h-9 px-2 ${currentTool === 'polygon' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-white'}`}
                  title="Draw polygon area"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Area
                </Button>

                <Button
                  onClick={() => setTool('linestring')}
                  variant="ghost"
                  size="sm"
                  className={`h-9 px-2 ${currentTool === 'linestring' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-white'}`}
                  title="Draw line for distance"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Line
                </Button>

                <Button
                  onClick={() => setTool('freehand')}
                  variant="ghost"
                  size="sm"
                  className={`h-9 px-2 ${currentTool === 'freehand' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-white'}`}
                  title="Freehand drawing"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Free
                </Button>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300" />

                <Button
                  onClick={() => setTool('select')}
                  variant="ghost"
                  size="sm"
                  className={`h-9 px-2 ${currentTool === 'select' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-white'}`}
                  title="Select and edit shapes"
                >
                  <Hand className="w-4 h-4 mr-1" />
                  Edit
                </Button>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300" />

                <Button
                  onClick={toggle3DMode}
                  variant="ghost"
                  size="sm"
                  className={`h-9 px-2 ${is3DMode ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-white'}`}
                  title={is3DMode ? "Switch to 2D view" : "Switch to 3D view"}
                >
                  <Box className="w-4 h-4 mr-1" />
                  {is3DMode ? '3D' : '2D'}
                </Button>

                <select
                  value={currentUnit}
                  onChange={(e) => setCurrentUnit(e.target.value as any)}
                  className="h-9 text-sm border-0 bg-transparent hover:bg-white rounded-md px-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentTool === 'linestring' ? (
                    <>
                      <option value="ft">Ft</option>
                      <option value="m">M</option>
                    </>
                  ) : (
                    <>
                      <option value="sqft">Sq Ft</option>
                      <option value="sqm">Sq M</option>
                    </>
                  )}
                </select>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300" />

                <Button
                  onClick={clearDrawing}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Clear all drawings"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>

                {/* Expand button - tablet only */}
                <div className="hidden sm:block">
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                </div>
                <div className="hidden sm:block">
                  <Button
                    onClick={enterExpanded}
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 hover:bg-white"
                    title="Expand map to fullscreen"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div 
          ref={expandedContainerRef}
          className={`relative rounded-lg overflow-hidden border ${isExpanded ? 'fixed inset-0 z-[9999] bg-white' : ''}`}
          style={isExpanded ? { 
            width: '100vw', 
            height: '100vh', 
            top: '0', 
            left: '0',
            right: '0',
            bottom: '0',
            margin: '0',
            padding: '0',
            borderRadius: '0'
          } : {}}
        >
          <div 
            id={mapId}
            ref={mapRef}
            className={`w-full ${isExpanded ? 'h-full' : 'h-[640px] sm:h-[500px] lg:h-[600px]'}`}
            style={{ minHeight: isExpanded ? '100vh' : '640px' }}
          />
          
          {/* Desktop Controls - Bottom toolbar (hidden on mobile) */}
          {isMapInitialized && (
            <div className="hidden lg:block absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2 flex items-center gap-1">
                {/* Drawing Tools Group */}
                <div className="flex items-center gap-1 px-1">
                  <Button
                    onClick={() => setTool('polygon')}
                    variant="ghost"
                    size="sm"
                    className={`h-9 px-3 ${currentTool === 'polygon' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Draw polygon area"
                  >
                    <Square className="w-4 h-4 mr-1.5" />
                    Area
                  </Button>

                  <Button
                    onClick={() => setTool('linestring')}
                    variant="ghost"
                    size="sm"
                    className={`h-9 px-3 ${currentTool === 'linestring' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Draw line for distance"
                  >
                    <Minus className="w-4 h-4 mr-1.5" />
                    Line
                  </Button>

                  <Button
                    onClick={() => setTool('freehand')}
                    variant="ghost"
                    size="sm"
                    className={`h-9 px-3 ${currentTool === 'freehand' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Freehand drawing"
                  >
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    Free
                  </Button>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300" />

                {/* Edit/Select Tool */}
                <div className="flex items-center gap-1 px-1">
                  <Button
                    onClick={() => setTool('select')}
                    variant="ghost"
                    size="sm"
                    className={`h-9 px-3 ${currentTool === 'select' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Select and edit shapes"
                  >
                    <Hand className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300" />

                {/* View Options */}
                <div className="flex items-center gap-1 px-1">
                  <Button
                    onClick={toggle3DMode}
                    variant="ghost"
                    size="sm"
                    className={`h-9 px-3 ${is3DMode ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                    title={is3DMode ? "Switch to 2D view" : "Switch to 3D view"}
                  >
                    <Box className="w-4 h-4 mr-1.5" />
                    {is3DMode ? '3D' : '2D'}
                  </Button>

                  <select
                    value={currentUnit}
                    onChange={(e) => setCurrentUnit(e.target.value as any)}
                    className="h-9 text-sm border-0 bg-transparent hover:bg-gray-100 rounded-md px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Change measurement units"
                  >
                    {currentTool === 'linestring' ? (
                      <>
                        <option value="ft">Feet</option>
                        <option value="m">Meters</option>
                      </>
                    ) : (
                      <>
                        <option value="sqft">Sq Ft</option>
                        <option value="sqm">Sq M</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300" />

                {/* Actions */}
                <div className="flex items-center gap-1 px-1">
                  <Button
                    onClick={clearDrawing}
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                    title="Clear all drawings"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Expand Button - Top left, below Google's map type control */}
          {isMapInitialized && !isExpanded && (
            <div className="hidden lg:block absolute top-16 left-2.5 z-10">
              <Button
                onClick={enterExpanded}
                variant="outline"
                size="sm"
                className="h-9 bg-white/95 backdrop-blur-sm shadow-md border-gray-200 hover:bg-gray-50"
                title="Expand map to fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Expanded Mode Controls - Unified toolbar at bottom */}
          {isExpanded && (
            <>
              {/* Exit button - top left */}
              <div className="absolute top-4 left-4 z-10">
                <Button
                  onClick={exitExpanded}
                  variant="outline"
                  size="sm"
                  className="h-10 bg-white/95 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-gray-50"
                  title="Exit fullscreen"
                >
                  <Minimize className="w-4 h-4 mr-2" />
                  Exit
                </Button>
              </div>

              {/* Bottom toolbar - works for both mobile and desktop in expanded mode */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 w-[95%] max-w-2xl">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {/* Drawing Tools */}
                    <Button
                      onClick={() => setTool('polygon')}
                      variant="ghost"
                      size="sm"
                      className={`h-9 px-2 sm:px-3 ${currentTool === 'polygon' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                      title="Draw polygon area"
                    >
                      <Square className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Area</span>
                    </Button>

                    <Button
                      onClick={() => setTool('linestring')}
                      variant="ghost"
                      size="sm"
                      className={`h-9 px-2 sm:px-3 ${currentTool === 'linestring' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                      title="Draw line for distance"
                    >
                      <Minus className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Line</span>
                    </Button>

                    <Button
                      onClick={() => setTool('freehand')}
                      variant="ghost"
                      size="sm"
                      className={`h-9 px-2 sm:px-3 ${currentTool === 'freehand' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                      title="Freehand drawing"
                    >
                      <Edit3 className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Free</span>
                    </Button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <Button
                      onClick={() => setTool('select')}
                      variant="ghost"
                      size="sm"
                      className={`h-9 px-2 sm:px-3 ${currentTool === 'select' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                      title="Select and edit shapes"
                    >
                      <Hand className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <Button
                      onClick={toggle3DMode}
                      variant="ghost"
                      size="sm"
                      className={`h-9 px-2 sm:px-3 ${is3DMode ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'hover:bg-gray-100'}`}
                      title={is3DMode ? "Switch to 2D view" : "Switch to 3D view"}
                    >
                      <Box className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">{is3DMode ? '3D' : '2D'}</span>
                    </Button>

                    <select
                      value={currentUnit}
                      onChange={(e) => setCurrentUnit(e.target.value as any)}
                      className="h-9 text-sm border-0 bg-transparent hover:bg-gray-100 rounded-md px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {currentTool === 'linestring' ? (
                        <>
                          <option value="ft">Ft</option>
                          <option value="m">M</option>
                        </>
                      ) : (
                        <>
                          <option value="sqft">Sq Ft</option>
                          <option value="sqm">Sq M</option>
                        </>
                      )}
                    </select>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300 mx-1" />

                    <Button
                      onClick={clearDrawing}
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 sm:px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Clear all drawings"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Total Measurement Overlay */}
          {totalMeasurement > 0 && (
            <div className={`absolute ${isExpanded ? 'bottom-4 left-1/2 transform -translate-x-1/2' : 'bottom-4 right-4'} bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border`}>
              <div className="text-sm font-medium text-gray-600">
                Total: {formatMeasurement(totalMeasurement)}
              </div>
            </div>
          )}
        </div>

        {/* Individual Measurements List - Hidden in expanded mode */}
        {measurements.length > 0 && !isExpanded && (
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

        {/* Collapsible Instructions - Hidden in expanded mode */}
        {isMapInitialized && !isExpanded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-blue-100 transition-colors"
            >
              <h4 className="font-medium text-blue-800">How to use</h4>
              {showInstructions ? (
                <ChevronUp className="w-4 h-4 text-blue-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600" />
              )}
            </button>
            
            {showInstructions && (
              <div className="px-4 pb-4">
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="pl-2">• Select a drawing tool from the controls above (mobile) or left overlay (desktop)</li>
                  <li className="pl-2">• For lines: Click/tap along the path, double-click/double-tap to finish</li>
                  <li className="pl-2">• For areas: Click/tap to create points around the area, double-click/double-tap to finish</li>
                  <li className="pl-2">• For freehand: Hold and drag to draw the area</li>
                  <li className="pl-2">• Use "Select/Edit" mode to modify existing shapes:</li>
                  <li className="pl-4 text-blue-600">- Drag corner points to reshape the polygon</li>
                  <li className="pl-4 text-blue-600">- Click the small midpoints between corners to add new points</li>
                  <li className="pl-4 text-blue-600">- Drag the shape to move it entirely</li>
                  <li className="pl-2 font-semibold">• On mobile: Use two fingers to pan the map, one finger to draw</li>
                  <li className="pl-2">• Switch units and toggle 3D view using the controls</li>
                  <li className="pl-2">• Click "Expand" button for a larger view that fills your screen</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Total Measurement Summary - Hidden in expanded mode */}
        {totalMeasurement > 0 && !isExpanded && (
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