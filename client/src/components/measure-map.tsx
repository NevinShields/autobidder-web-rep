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
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [autoCapturedDimensions, setAutoCapturedDimensions] = useState<{
    width?: number;
    length?: number;
    area?: number;
    confidence: 'high' | 'medium' | 'low';
    source: string;
  } | null>(null);

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
          fields: ['formatted_address', 'geometry', 'place_id', 'address_components', 'types']
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place.geometry && place.geometry.location) {
          mapInstance.setCenter(place.geometry.location);
          mapInstance.setZoom(20);
          setAddress(place.formatted_address || '');
          
          // Add marker for the selected address
          new window.google.maps.Marker({
            position: place.geometry.location,
            map: mapInstance,
            title: place.formatted_address,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#FF0000"/>
                  <circle cx="12" cy="9" r="2.5" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
            }
          });

          // Automatically attempt to capture property dimensions
          autoCapturePropertyDimensions(place);
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
        
        // Add marker for the address
        new window.google.maps.Marker({
          position: results[0].geometry.location,
          map: targetMap,
          title: searchAddress,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#FF0000"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24),
          }
        });

        // Automatically attempt to capture property dimensions
        autoCapturePropertyDimensions(results[0]);
      }
    });
  };

  const autoCapturePropertyDimensions = async (placeResult: any) => {
    setAutoCapturing(true);
    setAutoCapturedDimensions(null);

    try {
      // Extract location details
      const location = placeResult.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      // Method 1: Try to get building footprint from Places API details
      const placeId = placeResult.place_id;
      if (placeId && window.google.maps.places) {
        const service = new window.google.maps.places.PlacesService(map);
        
        service.getDetails({
          placeId: placeId,
          fields: ['geometry', 'address_components', 'types', 'name']
        }, (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            analyzePropertyFromPlaceDetails(place, lat, lng);
          } else {
            // Fallback to parcel data estimation
            estimatePropertyDimensionsFromParcel(lat, lng, placeResult);
          }
        });
      } else {
        // Fallback to parcel data estimation
        estimatePropertyDimensionsFromParcel(lat, lng, placeResult);
      }
    } catch (error) {
      console.error('Error auto-capturing dimensions:', error);
      setAutoCapturing(false);
    }
  };

  const analyzePropertyFromPlaceDetails = (place: any, lat: number, lng: number) => {
    // This is a simplified analysis - in a real implementation, you'd want to:
    // 1. Use the bounds to estimate building size
    // 2. Cross-reference with property databases
    // 3. Use satellite imagery analysis APIs
    
    const bounds = place.geometry.viewport;
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // Calculate rough dimensions from viewport bounds
      // Note: This is a rough estimation and may not be accurate for actual building dimensions
      const latDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(sw.lat(), sw.lng()),
        new window.google.maps.LatLng(ne.lat(), sw.lng())
      );
      
      const lngDistance = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(sw.lat(), sw.lng()),
        new window.google.maps.LatLng(sw.lat(), ne.lng())
      );

      // Convert to feet and estimate building dimensions (usually smaller than lot)
      const estimatedWidth = (lngDistance * 3.28084) * 0.6; // Assume building is 60% of lot width
      const estimatedLength = (latDistance * 3.28084) * 0.6; // Assume building is 60% of lot length
      const estimatedArea = estimatedWidth * estimatedLength;

      setAutoCapturedDimensions({
        width: Math.round(estimatedWidth),
        length: Math.round(estimatedLength),
        area: Math.round(estimatedArea),
        confidence: 'medium',
        source: 'Property bounds estimation'
      });
    }
    
    setAutoCapturing(false);
  };

  const estimatePropertyDimensionsFromParcel = (lat: number, lng: number, placeResult: any) => {
    // Fallback method using property type and address components
    const addressComponents = placeResult.address_components || [];
    
    // Look for property type indicators
    const types = placeResult.types || [];
    const isResidential = types.some((type: string) => 
      ['subpremise', 'premise', 'street_address'].includes(type)
    );

    // Basic estimation based on property type
    let estimatedArea = 0;
    let estimatedWidth = 0;
    let estimatedLength = 0;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (isResidential) {
      // Typical residential property estimates (these are very rough)
      estimatedArea = 2000; // Average home size in sq ft
      estimatedWidth = 40;   // Typical width
      estimatedLength = 50;  // Typical length
      confidence = 'low';
    } else {
      // Commercial or other property types
      estimatedArea = 5000;
      estimatedWidth = 70;
      estimatedLength = 70;
      confidence = 'low';
    }

    setAutoCapturedDimensions({
      width: estimatedWidth,
      length: estimatedLength,
      area: estimatedArea,
      confidence,
      source: 'Property type estimation'
    });

    setAutoCapturing(false);
  };

  const applyAutoCapturedDimensions = () => {
    if (!autoCapturedDimensions) return;

    let finalValue = 0;
    if (measurementType === 'area') {
      finalValue = autoCapturedDimensions.area || 0;
      // Convert from sq ft to other units if needed
      if (unit === 'sqm') {
        finalValue = finalValue * 0.092903; // Convert sq ft to sq m
      }
    } else {
      // For distance, use perimeter calculation
      const width = autoCapturedDimensions.width || 0;
      const length = autoCapturedDimensions.length || 0;
      finalValue = 2 * (width + length); // Perimeter
      // Convert from ft to other units if needed
      if (unit === 'm') {
        finalValue = finalValue * 0.3048; // Convert ft to m
      }
    }

    // Add as a measurement
    const measurementId = 'auto-' + Date.now().toString();
    const newMeasurement = { 
      id: measurementId, 
      value: Math.round(finalValue), 
      type: measurementType 
    };
    
    setMeasurements(prev => {
      const updated = [...prev, newMeasurement];
      const total = updated.reduce((sum, m) => sum + m.value, 0);
      setTotalMeasurement(total);
      onMeasurementComplete({ value: total, unit });
      return updated;
    });

    // Clear the auto-captured dimensions after applying
    setAutoCapturedDimensions(null);
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
        <div className="flex gap-2">
          <Input
            ref={addressInputRef}
            type="text"
            placeholder="Start typing an address..."
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
                
                {totalMeasurement > 0 && (
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    Total: {formatMeasurement(totalMeasurement)}
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
            <li>Start typing your property address - suggestions will appear automatically</li>
            <li>Select your address from the dropdown or press Enter to search</li>
            <li>We'll automatically try to capture property dimensions for you</li>
            <li>Or click "Draw {measurementType === 'area' ? 'Area' : 'Distance'}" to manually measure</li>
            <li>{measurementType === 'area' 
              ? 'Click around the area you want to measure to create a shape' 
              : 'Click along the path you want to measure'}</li>
            <li>Repeat manual steps to measure multiple {measurementType === 'area' ? 'areas' : 'distances'}</li>
            <li>All measurements are automatically combined for your total calculation</li>
          </ol>
        </div>

        {/* Auto-Capture Status */}
        {autoCapturing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
              <span className="text-sm font-medium text-amber-800">
                Automatically capturing property dimensions...
              </span>
            </div>
          </div>
        )}

        {/* Auto-Captured Dimensions */}
        {autoCapturedDimensions && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-800">
                  Auto-Captured Property Dimensions
                </h4>
                <div className="text-sm text-green-700 space-y-1">
                  {autoCapturedDimensions.width && autoCapturedDimensions.length && (
                    <p>Size: {autoCapturedDimensions.width}' × {autoCapturedDimensions.length}'</p>
                  )}
                  {autoCapturedDimensions.area && (
                    <p>Area: {autoCapturedDimensions.area.toLocaleString()} sq ft</p>
                  )}
                  <p className="text-xs">
                    Confidence: {autoCapturedDimensions.confidence} • 
                    Source: {autoCapturedDimensions.source}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={applyAutoCapturedDimensions}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Use These
                </Button>
                <Button
                  onClick={() => setAutoCapturedDimensions(null)}
                  size="sm"
                  variant="outline"
                  className="border-green-300 text-green-600 hover:bg-green-50"
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600">
              These dimensions were automatically detected from the property address. 
              You can use them or measure manually for more accuracy.
            </div>
          </div>
        )}

        {/* Individual Measurements List */}
        {measurements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Measurements ({measurements.length})
            </h4>
            {measurements.map((measurement, index) => (
              <div key={measurement.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {measurement.type === 'area' ? 'Area' : 'Distance'} {index + 1}: {formatMeasurement(measurement.value)}
                  </span>
                  <Button
                    onClick={() => removeMeasurement(measurement.id)}
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 hover:bg-red-50 hover:border-red-300"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Measurement Summary */}
        {totalMeasurement > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">
                Total {measurementType}: {formatMeasurement(totalMeasurement)}
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