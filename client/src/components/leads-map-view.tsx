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
  onLeadClick?: (leadId: number) => void;
}

export function LeadsMapView({ leads, height = '400px', onLeadClick }: LeadsMapViewProps) {
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

    const initializeMap = async () => {
      try {
        if (!mapInstanceRef.current) {
          const defaultCenter = { lat: 39.8283, lng: -98.5795 };
          
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current!, {
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
        const geocoder = new window.google.maps.Geocoder();

        // Process leads with geocoding
        for (const lead of leads) {
          let position: { lat: number; lng: number } | null = null;

          // Try to use existing coordinates first
          if (lead.addressLatitude && lead.addressLongitude) {
            const lat = parseFloat(lead.addressLatitude);
            const lng = parseFloat(lead.addressLongitude);

            if (!isNaN(lat) && !isNaN(lng)) {
              position = { lat, lng };
            }
          }

          // If no coordinates but has address, geocode it
          if (!position && lead.address) {
            try {
              const result = await geocoder.geocode({ address: lead.address });
              if (result.results[0]) {
                position = {
                  lat: result.results[0].geometry.location.lat(),
                  lng: result.results[0].geometry.location.lng(),
                };
              }
            } catch (geocodeError) {
              console.error(`Failed to geocode address for lead ${lead.id}:`, geocodeError);
            }
          }

          // Create marker if we have a position
          if (position) {
            const marker = new window.google.maps.Marker({
              position,
              map: mapInstanceRef.current,
              title: lead.name || 'Lead',
              animation: window.google.maps.Animation.DROP,
            });

            // Create info window content with View Details button
            const infoWindowContent = document.createElement('div');
            infoWindowContent.style.cssText = `
              padding: 8px;
              min-width: 160px;
              max-width: 220px;
              font-family: system-ui, -apple-system, sans-serif;
              box-sizing: border-box;
            `;

            // Truncate long addresses for mobile
            const truncatedAddress = lead.address && lead.address.length > 40
              ? lead.address.substring(0, 40) + '...'
              : lead.address;

            infoWindowContent.innerHTML = `
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lead.name || 'Anonymous Lead'}</div>
              <div style="font-size: 12px; color: #4b5563; margin-bottom: 3px; line-height: 1.3;">${truncatedAddress || 'No address'}</div>
              ${lead.distanceFromBusiness ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">${lead.distanceFromBusiness} mi away</div>` : ''}
              <div style="font-size: 11px; color: #9ca3af; margin-bottom: 8px;">${new Date(lead.createdAt).toLocaleDateString()}</div>
            `;

            // Add View Details button if callback is provided
            if (onLeadClick) {
              const button = document.createElement('button');
              button.textContent = 'View Details';
              button.style.cssText = `
                display: block;
                width: 100%;
                padding: 6px 10px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                box-sizing: border-box;
              `;
              button.onmouseover = () => { button.style.background = '#1d4ed8'; };
              button.onmouseout = () => { button.style.background = '#2563eb'; };
              button.onclick = () => {
                onLeadClick(lead.id);
              };
              infoWindowContent.appendChild(button);
            }

            const infoWindow = new window.google.maps.InfoWindow({
              content: infoWindowContent,
            });

            marker.addListener('click', () => {
              infoWindow.open(mapInstanceRef.current, marker);
            });

            markersRef.current.push(marker);
            bounds.extend(position);
            hasValidMarkers = true;
          }
        }

        if (hasValidMarkers && mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds);
          
          window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'bounds_changed', () => {
            const zoom = mapInstanceRef.current?.getZoom();
            if (zoom && zoom > 15) {
              mapInstanceRef.current?.setZoom(15);
            }
          });
        } else {
          setMapError('No leads with valid addresses found');
        }

      } catch (err) {
        console.error('Error initializing map:', err);
        setMapError('Failed to initialize map');
      }
    };

    initializeMap();

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isLoaded, leads, error, onLeadClick]);

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
