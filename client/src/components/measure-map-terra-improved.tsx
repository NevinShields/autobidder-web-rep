import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Ruler, Trash2, RotateCcw, Search, AlertCircle, RefreshCw, Square, Minus, Edit3, Hand, Box, ChevronDown, ChevronUp, Maximize, Minimize } from 'lucide-react';
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
  hasCustomCSS?: boolean;
  styling?: any;
  componentStyles?: any;
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
  hasCustomCSS = false,
  styling = {},
  componentStyles,
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
  const locationPinRef = useRef<any>(null);
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);
  
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

  const getShadowValue = (shadow: string) => {
    switch (shadow) {
      case 'none': return 'none';
      case 'sm': return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      case 'md': return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      case 'lg': return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      case 'xl': return '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      case '2xl': return '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
      default: return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    }
  };

  const getFontSizeValue = (fontSize: string): string => {
    switch (fontSize) {
      case 'xs': return '0.75rem';
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      case 'xl': return '1.25rem';
      case 'base':
      default: return '1rem';
    }
  };

  const getButtonPadding = (padding: string | undefined) => {
    switch (padding) {
      case 'sm': return '0.5rem 0.875rem';
      case 'lg': return '0.875rem 1.5rem';
      case 'xl': return '1rem 1.75rem';
      case 'md':
      default: return '0.75rem 1.25rem';
    }
  };

  const getInputStyles = useCallback(() => {
    const textInputStyles = componentStyles?.textInput;

    if (textInputStyles) {
      return {
        backgroundColor: textInputStyles.backgroundColor || '#FFFFFF',
        borderRadius: `${textInputStyles.borderRadius || 8}px`,
        borderWidth: `${textInputStyles.borderWidth || 1}px`,
        borderColor: textInputStyles.borderColor || '#E5E7EB',
        borderStyle: 'solid' as const,
        padding: `${textInputStyles.padding || 12}px`,
        boxShadow: getShadowValue(textInputStyles.shadow || 'sm'),
        fontSize: getFontSizeValue(textInputStyles.fontSize || 'base'),
        color: textInputStyles.textColor || '#374151',
        height: `${textInputStyles.height || 40}px`,
      };
    }

    return {
      backgroundColor: styling?.inputBackgroundColor || '#FFFFFF',
      borderRadius: `${styling?.inputBorderRadius || 4}px`,
      borderWidth: `${styling?.inputBorderWidth || 1}px`,
      borderColor: styling?.inputBorderColor || '#D1D5DB',
      borderStyle: 'solid' as const,
      padding: styling?.inputPadding === 'sm' ? '0.375rem' :
        styling?.inputPadding === 'lg' ? '0.75rem' : '0.5rem',
      boxShadow: getShadowValue(styling?.inputShadow || 'none'),
      fontSize: getFontSizeValue(styling?.inputFontSize || 'base'),
      color: styling?.inputTextColor || '#374151',
      height: `${styling?.inputHeight || 40}px`,
    };
  }, [componentStyles, styling]);

  const getButtonStyles = useCallback(() => {
    const buttonStyles = componentStyles?.button;

    return {
      borderRadius: `${buttonStyles?.borderRadius || styling?.buttonBorderRadius || 12}px`,
      padding: buttonStyles?.padding ? `${buttonStyles.padding}px` : getButtonPadding(styling?.buttonPadding),
      fontSize: buttonStyles?.fontSize ? getFontSizeValue(buttonStyles.fontSize) : '1rem',
      fontWeight: buttonStyles?.fontWeight || styling?.buttonFontWeight || '600',
      borderWidth: `${Math.max(buttonStyles?.borderWidth || styling?.buttonBorderWidth || 0, 0)}px`,
      borderStyle: 'solid' as const,
      boxShadow: getShadowValue(buttonStyles?.shadow || styling?.buttonShadow || 'md'),
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer' as const,
      height: buttonStyles?.height ? `${buttonStyles.height}px` : 'auto',
      backgroundColor: buttonStyles?.backgroundColor || styling?.buttonBackgroundColor || styling?.primaryColor || '#2563EB',
      color: buttonStyles?.textColor || styling?.buttonTextColor || '#FFFFFF',
      borderColor: buttonStyles?.borderColor || styling?.buttonBorderColor || buttonStyles?.backgroundColor || styling?.buttonBackgroundColor || styling?.primaryColor || '#2563EB',
    };
  }, [componentStyles, styling]);

  const addressInputStyle = hasCustomCSS ? {} : getInputStyles();
  const searchButtonStyle = hasCustomCSS ? { transition: 'all 0.2s ease-in-out', cursor: 'pointer' as const } : getButtonStyles();

  const setLocationPin = useCallback((position: { lat: number; lng: number } | null, targetMap?: any) => {
    const activeMap = targetMap || map;

    if (!window.google?.maps || !activeMap) {
      return;
    }

    if (!position) {
      if (locationPinRef.current) {
        locationPinRef.current.setMap(null);
        locationPinRef.current = null;
      }
      return;
    }

    if (!locationPinRef.current) {
      locationPinRef.current = new window.google.maps.Marker({
        map: activeMap,
        position,
        title: 'Measured property',
        animation: window.google.maps.Animation.DROP,
        zIndex: 1000,
      });
      return;
    }

    locationPinRef.current.setMap(activeMap);
    locationPinRef.current.setPosition(position);
  }, [map]);

  const getFeaturePinPosition = useCallback((feature: any) => {
    if (!window.google?.maps || !feature?.geometry) {
      return null;
    }

    if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates?.[0]?.length) {
      const bounds = new window.google.maps.LatLngBounds();
      feature.geometry.coordinates[0].forEach(([lng, lat]: [number, number]) => {
        bounds.extend({ lat, lng });
      });
      const center = bounds.getCenter();
      return { lat: center.lat(), lng: center.lng() };
    }

    if (feature.geometry.type === 'LineString' && feature.geometry.coordinates?.length) {
      const bounds = new window.google.maps.LatLngBounds();
      feature.geometry.coordinates.forEach(([lng, lat]: [number, number]) => {
        bounds.extend({ lat, lng });
      });
      const center = bounds.getCenter();
      return { lat: center.lat(), lng: center.lng() };
    }

    if (feature.geometry.type === 'Point' && feature.geometry.coordinates?.length === 2) {
      const [lng, lat] = feature.geometry.coordinates;
      return { lat, lng };
    }

    return null;
  }, []);

  const syncLocationPinToFeatures = useCallback((features: any[], targetMap?: any) => {
    const latestDrawableFeature = [...features].reverse().find((feature) =>
      feature?.geometry?.type === 'Polygon' ||
      feature?.geometry?.type === 'LineString' ||
      feature?.geometry?.type === 'Point'
    );

    if (!latestDrawableFeature) {
      return;
    }

    const position = getFeaturePinPosition(latestDrawableFeature);
    if (position) {
      setLocationPin(position, targetMap);
    }
  }, [getFeaturePinPosition, setLocationPin]);

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

  useEffect(() => {
    return () => {
      if (locationPinRef.current) {
        locationPinRef.current.setMap(null);
        locationPinRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setCurrentUnit(unit);
  }, [unit]);

  const getAreaValueForUnit = useCallback((squareMeters: number) => {
    return currentUnit === 'sqm' ? squareMeters : squareMeters * 10.764;
  }, [currentUnit]);

  const getDistanceValueForUnit = useCallback((meters: number) => {
    return currentUnit === 'm' ? meters : meters * 3.28084;
  }, [currentUnit]);

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
        // Use 'cooperative' on mobile for better drawing experience (requires two fingers to pan)
        // Use 'greedy' on desktop (allows single-finger/mouse pan)
        gestureHandling: isTouchDevice ? 'cooperative' : 'greedy',
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
              pointerDistance: isTouchDevice ? 18 : 30,
              styles: isTouchDevice ? {
                selectedPointWidth: 8,
                selectedPointOutlineWidth: 2,
                selectionPointWidth: 8,
                selectionPointOutlineWidth: 2,
                midPointWidth: 12,
                midPointOutlineWidth: 3,
              } : undefined,
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
                      value = getAreaValueForUnit(area);
                    }
                    type = 'area';
                  } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates) {
                    // For linestrings
                    if (window.google?.maps?.geometry?.spherical) {
                      // Use Google Maps spherical geometry for accurate calculations
                      const path = feature.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
                      const distance = window.google.maps.geometry.spherical.computeLength(path);
                      value = getDistanceValueForUnit(distance);
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
            syncLocationPinToFeatures(features, mapInstance);
            
            // Calculate total
            const total = newMeasurements.reduce((sum, m) => sum + m.value, 0);
            setTotalMeasurement(roundMeasurementValue(total));
            
            // Call the callback with the most recent measurement
            if (newMeasurements.length > 0) {
              const lastMeasurement = newMeasurements[newMeasurements.length - 1];
              onMeasurementComplete({
                value: roundMeasurementValue(lastMeasurement.value),
                unit: lastMeasurement.type === 'area' ? (currentUnit === 'sqm' ? 'sq m' : 'sq ft') : (currentUnit === 'm' ? 'm' : 'ft')
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
              const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              };
              mapInstance.setCenter(location);
              mapInstance.setZoom(20);
              setAddress(place.formatted_address || '');
              setLocationPin(location, mapInstance);
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
  }, [defaultAddress, defaultStyles, currentUnit, onMeasurementComplete, setLocationPin, syncLocationPinToFeatures, isTouchDevice, getAreaValueForUnit, getDistanceValueForUnit]);

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
    
    return getAreaValueForUnit(areaInSquareMeters);
  }, [getAreaValueForUnit]);

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
    
    return getDistanceValueForUnit(totalDistance);
  }, [getDistanceValueForUnit]);

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
                value = getAreaValueForUnit(area);
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
                value = getDistanceValueForUnit(distance);
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
      syncLocationPinToFeatures(features);
      
      // Calculate total (separate totals for area and distance)
      const areaTotal = newMeasurements
        .filter(m => m.type === 'area')
        .reduce((sum, m) => sum + m.value, 0);
      const distanceTotal = newMeasurements
        .filter(m => m.type === 'distance')
        .reduce((sum, m) => sum + m.value, 0);
      
      // Use the total based on current measurement type
      const total = measurementType === 'area' ? areaTotal : distanceTotal;
      setTotalMeasurement(roundMeasurementValue(total));
      
      // Call the callback with the most recent measurement
      if (newMeasurements.length > 0) {
        const lastMeasurement = newMeasurements[newMeasurements.length - 1];
        onMeasurementComplete({
          value: roundMeasurementValue(lastMeasurement.value),
          unit: lastMeasurement.type === 'area' ? (currentUnit === 'sqm' ? 'sq m' : 'sq ft') : (currentUnit === 'm' ? 'm' : 'ft')
        });
      }
    } catch (error) {
      console.error('Error updating measurements:', error);
    }
  }, [draw, calculatePolygonArea, calculateLinestringDistance, measurementType, currentUnit, onMeasurementComplete, syncLocationPinToFeatures, getAreaValueForUnit, getDistanceValueForUnit]);

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
          setLocationPin(location, targetMap);
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
  }, [map, setLocationPin]);

  const retryInitialization = useCallback(() => {
    setMapError(null);
    setIsMapInitialized(false);
    if (isGoogleMapsLoaded) {
      initializeMap();
    }
  }, [isGoogleMapsLoaded, initializeMap]);

  const roundMeasurementValue = (value: number) => Math.round(value);

  const formatMeasurement = (value: number, measurementType?: 'area' | 'distance'): string => {
    const roundedValue = roundMeasurementValue(value);
    
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
      <Card className="w-full bg-transparent border-0 shadow-none">
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
      <Card className="w-full bg-transparent border-0 shadow-none">
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
    <Card className="w-full bg-transparent border-0 shadow-none rounded-none">
      <CardHeader className="hidden lg:block">
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
        {isTouchDevice && (
          <p className="text-xs text-blue-700">
            Mobile tip: zoom in before editing and use Edit to reshape your selection.
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Address Search */}
        <div className="flex flex-col sm:flex-row gap-2 px-0 pt-0 lg:px-6 lg:pt-6">
          <Input
            ref={addressInputRef}
            type="text"
            placeholder="Start typing an address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchAddress(address)}
            className="ab-input ab-address-input ab-text-input text-input flex-1"
            style={addressInputStyle}
          />
          <Button 
            onClick={() => searchAddress(address)} 
            variant={hasCustomCSS ? 'default' : 'outline'} 
            size="sm"
            className="ab-button ab-button-primary button sm:w-auto w-full"
            style={searchButtonStyle}
          >
            <Search className="w-4 h-4 sm:mr-0 mr-2" />
            <span className="sm:hidden">Search Address</span>
          </Button>
        </div>

        {/* Mobile Controls - Above Map */}
        {isMapInitialized && (
          <div className="hidden px-6">
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
                  className="h-10 min-w-[84px] text-sm leading-none border-0 bg-transparent hover:bg-white rounded-md px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentTool === 'linestring' ? (
                    <>
                      <option value="ft">Ft</option>
                      <option value="m">M</option>
                    </>
                  ) : (
                    <>
                      <option value="sqft">FT²</option>
                      <option value="sqm">M²</option>
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
                      className="h-10 min-w-[84px] text-sm leading-none border-0 bg-transparent hover:bg-gray-100 rounded-md px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="h-10 min-w-[84px] text-sm leading-none border-0 bg-transparent hover:bg-gray-100 rounded-md px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Mobile Controls - Below Map */}
        {isMapInitialized && !isExpanded && (
          <div className="block lg:hidden px-0">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-2">
              <div className="flex items-center justify-center gap-1 flex-wrap">
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
                  className="h-10 min-w-[84px] text-sm leading-none border-0 bg-transparent hover:bg-white rounded-md px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentTool === 'linestring' ? (
                    <>
                      <option value="ft">Ft</option>
                      <option value="m">M</option>
                    </>
                  ) : (
                    <>
                      <option value="sqft">FT²</option>
                      <option value="sqm">M²</option>
                    </>
                  )}
                </select>

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
