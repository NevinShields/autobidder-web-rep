/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from './google-maps-loader';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface Lead {
  id: number;
  name?: string;
  address: string | null;
  addressLatitude: string | null;
  addressLongitude: string | null;
  distanceFromBusiness?: number | null;
  createdAt: Date;
}

interface LeadsMapViewProps {
  leads: Lead[];
  height?: string;
}

export function LeadsMapView({ leads, height = '400px' }: LeadsMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const { isLoaded, isLoading, error } = useGoogleMaps();
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || error) {
      return;
    }

    if (leads.length === 0) {
      return;
    }

    try {
      if (!mapInstanceRef.current) {
        const defaultCenter = { lat: 39.8283, lng: -98.5795 };
        
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 4,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
      }

      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      const bounds = new window.google.maps.LatLngBounds();
      let hasValidMarkers = false;

      leads.forEach((lead) => {
        if (lead.addressLatitude && lead.addressLongitude) {
          const lat = parseFloat(lead.addressLatitude);
          const lng = parseFloat(lead.addressLongitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            const position = { lat, lng };
            
            const marker = new window.google.maps.Marker({
              position,
              map: mapInstanceRef.current,
              title: lead.name || 'Lead',
              animation: window.google.maps.Animation.DROP,
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 150px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${lead.name || 'Anonymous Lead'}</div>
                  <div style="font-size: 12px; color: #666;">${lead.address || 'No address'}</div>
                  ${lead.distanceFromBusiness ? `<div style="font-size: 11px; color: #888; margin-top: 4px;">${lead.distanceFromBusiness} miles from business</div>` : ''}
                  <div style="font-size: 11px; color: #888; margin-top: 4px;">${new Date(lead.createdAt).toLocaleDateString()}</div>
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(mapInstanceRef.current, marker);
            });

            markersRef.current.push(marker);
            bounds.extend(position);
            hasValidMarkers = true;
          }
        }
      });

      if (hasValidMarkers && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds);
        
        const listener = window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
          const zoom = mapInstanceRef.current?.getZoom();
          if (zoom && zoom > 15) {
            mapInstanceRef.current?.setZoom(15);
          }
        });
      }

    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError('Failed to initialize map');
    }

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isLoaded, leads, error]);

  if (error) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-red-500" />
          <p className="text-sm text-red-600">Map failed to load</p>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No location data available</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-red-500" />
          <p className="text-sm text-red-600">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height }}
      className="rounded-lg overflow-hidden border border-gray-200"
      data-testid="map-leads-location"
    />
  );
}
