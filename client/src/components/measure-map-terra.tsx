import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, Ruler, Trash2, RotateCcw, Search, Plus } from 'lucide-react';
import { TerraDraw } from 'terra-draw';
import { TerraDrawGoogleMapsAdapter } from 'terra-draw-google-maps-adapter';
import {
  TerraDrawSelectMode,
  TerraDrawPolygonMode,
  TerraDrawLineStringMode,
} from 'terra-draw';

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
    initGoogleMaps?: () => void;
  }
}

export default function MeasureMapTerra({
  onMeasurementComplete,
  defaultAddress = '',
  measurementType = 'area',
  unit = 'sqft'
}: MeasureMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [draw, setDraw] = useState<TerraDraw | null>(null);
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

    // Check if Google Maps is already loaded (without drawing library)
    if (window.google?.maps?.Map && window.google?.maps?.geometry && window.google?.maps?.places) {
      console.log('Google Maps API already loaded');
      setIsLoading(false);
      setTimeout(() => initializeMap(), 100);
      return;
    }

    if (!window.google) {
      console.log('Loading Google Maps API...');
      const script = document.createElement('script');
      // Note: No longer loading drawing library - using Terra Draw instead
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Set up global callback function
      window.initGoogleMaps = () => {
        console.log('Google Maps callback fired');
        setTimeout(() => {
          if (window.google?.maps?.Map && window.google?.maps?.geometry && window.google?.maps?.places) {
            console.log('Google Maps libraries loaded successfully');
            setIsLoading(false);
            initializeMap();
          } else {
            console.error('Google Maps libraries not fully loaded after callback');
            setMapError('Google Maps libraries failed to load completely. Please refresh the page.');
            setIsLoading(false);
          }
        }, 500);
      };
      
      const timeout = setTimeout(() => {
        console.error('Google Maps API loading timeout');
        setMapError('Google Maps is taking longer than usual to load. This might be due to a slow internet connection. Please wait a moment and try refreshing the page.');
        setIsLoading(false);
      }, 30000);
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Error loading Google Maps API:', error);
        setMapError('Failed to load Google Maps API. Please check your API key and internet connection.');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
      
      return () => {
        clearTimeout(timeout);
        if (window.initGoogleMaps) {
          delete window.initGoogleMaps;
        }
      };
    } else {
      console.log('Google Maps API partially loaded, waiting for full initialization...');
      let retryCount = 0;
      const checkLibraries = () => {
        if (window.google?.maps?.Map && window.google?.maps?.geometry && window.google?.maps?.places) {
          console.log('Google Maps libraries now available');
          setIsLoading(false);
          setTimeout(() => initializeMap(), 100);
        } else if (retryCount < 30) {
          retryCount++;
          setTimeout(checkLibraries, 500);
        } else {
          console.error('Timeout waiting for Google Maps libraries');
          setMapError('Google Maps libraries failed to load. Please refresh the page.');
          setIsLoading(false);
        }
      };
      checkLibraries();
    }
  }, []);

  const initializeMap = (retryCount = 0) => {
    console.log('Initializing Google Maps with Terra Draw..., retry:', retryCount);
    
    if (!mapRef.current) {
      if (retryCount < 10) {
        console.log('Map container not ready, retrying...');
        setTimeout(() => initializeMap(retryCount + 1), 300);
        return;
      }
      console.error('Map container not found after retries');
      setMapError('Map container not available. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    const rect = mapRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      if (retryCount < 10) {
        console.log('Map container has no dimensions, retrying...');
        setTimeout(() => initializeMap(retryCount + 1), 300);
        return;
      }
      console.error('Map container has no dimensions after retries');
      setMapError('Map container is not properly sized. Please refresh the page.');
      setIsLoading(false);
      return;
    }
    
    if (!window.google?.maps) {
      console.error('Google Maps API not loaded');
      setMapError('Google Maps API not available');
      setIsLoading(false);
      return;
    }

    // Verify required libraries (no longer checking drawing library)
    if (!window.google.maps.Map) {
      console.error('Google Maps Map constructor not available');
      setMapError('Google Maps Map constructor not available. Please refresh the page.');
      setIsLoading(false);
      return;
    }
    
    if (!window.google.maps.geometry) {
      console.error('Google Maps Geometry library not loaded');
      setMapError('Google Maps Geometry library not loaded. Please enable the "Geometry API" in Google Cloud Console.');
      setIsLoading(false);
      return;
    }
    
    if (!window.google.maps.places) {
      console.error('Google Maps Places library not loaded');
      setMapError('Google Maps Places library not loaded. Please enable the "Places API" in Google Cloud Console.');
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

      // Initialize Terra Draw instead of Google Drawing Manager
      console.log('Creating Terra Draw instance...');
      const terraDrawInstance = new TerraDraw({
        adapter: new TerraDrawGoogleMapsAdapter({
          lib: window.google.maps,
          map: mapInstance
        }),
        modes: [
          new TerraDrawSelectMode(),
          new TerraDrawPolygonMode({
            styles: {
              fillColor: '#2563EB',
              fillOpacity: 0.3,
              outlineColor: '#2563EB',
              outlineWidth: 2,
            }
          }),
          new TerraDrawLineStringMode({
            styles: {
              lineStringColor: '#2563EB',
              lineStringWidth: 3,
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

      setMap(mapInstance);
      setDraw(terraDrawInstance);
      setIsMapLoaded(true);

      // Set up Places Autocomplete
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

      // Search for default address if provided
      if (defaultAddress) {
        searchAddress(defaultAddress, mapInstance);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMapError(`Failed to initialize Google Maps with Terra Draw: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  const updateMeasurements = (terraDrawInstance: TerraDraw) => {
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
  };

  const startDrawing = () => {
    if (!draw) return;
    
    if (measurementType === 'area') {
      draw.setMode('polygon');
    } else {
      draw.setMode('linestring');
    }
  };

  const clearDrawing = () => {
    if (!draw) return;
    
    draw.clear();
    setMeasurements([]);
    setTotalMeasurement(0);
    onMeasurementComplete({ value: 0, unit });
  };

  const removeMeasurement = (measurementId: string) => {
    if (!draw) return;
    
    // Remove the specific feature from Terra Draw
    const snapshot = draw.getSnapshot();
    const featureToRemove = snapshot.find(f => f.properties?.id === measurementId);
    
    if (featureToRemove) {
      draw.removeFeatures([featureToRemove.properties.id]);
      updateMeasurements(draw);
    }
  };

  const searchAddress = async (searchAddress: string, mapInstance?: any) => {
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
  };

  const formatMeasurement = (value: number): string => {
    const roundedValue = Math.round(value * 100) / 100;
    return `${roundedValue.toLocaleString()} ${unit}`;
  };

  if (mapError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Measure Map (Terra Draw)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{mapError}</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Measure Map (Terra Draw)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading Terra Draw mapping system...</p>
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
          Measure Map (Terra Draw - Future Ready!)
          <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
            Upgraded
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              ref={addressInputRef}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter property address..."
              className="w-full"
            />
          </div>
          <Button
            onClick={() => searchAddress(address)}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            <Search className="w-4 h-4 mr-1" />
            Search
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-[400px] sm:h-[500px] rounded-lg border overflow-hidden"
            style={{ minHeight: '400px' }}
          />
          
          {/* Drawing Controls Overlay */}
          {isMapLoaded && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Button
                onClick={startDrawing}
                className="shadow-lg"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Draw {measurementType === 'area' ? 'Area' : 'Distance'}
              </Button>
              
              <Button
                onClick={() => draw?.setMode('select')}
                variant="outline"
                className="shadow-lg bg-white"
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

          {/* Total Measurement Overlay */}
          {totalMeasurement > 0 && (
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
              <div className="text-sm font-medium text-gray-600">
                Total: {formatMeasurement(totalMeasurement)}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {isMapLoaded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">How to measure:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="pl-2">• Tap "Draw {measurementType === 'area' ? 'Area' : 'Distance'}" to start measuring</li>
              <li className="pl-2">• {measurementType === 'area' 
                ? 'Click to create points around the area, double-click to finish' 
                : 'Click along the path you want to measure, double-click to finish'}</li>
              <li className="pl-2">• Use "Select/Edit" mode to modify existing shapes</li>
              <li className="pl-2">• Repeat to measure multiple {measurementType === 'area' ? 'areas' : 'distances'}</li>
            </ul>
          </div>
        )}

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
                      <span className="font-medium ml-1">{formatMeasurement(measurement.value)}</span>
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

        {/* Total Measurement Summary */}
        {totalMeasurement > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-800">
                Total {measurementType}: {formatMeasurement(totalMeasurement)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}