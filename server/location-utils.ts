/**
 * Location utilities for distance-based pricing calculations
 */

// Haversine formula to calculate distance between two lat/lng points in miles
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(deg: number): number {
  return deg * (Math.PI / 180);
}

// City-based geocoding fallback with approximate coordinates
function geocodeAddressFromCity(address: string): {
  latitude: number;
  longitude: number;
  formattedAddress: string;
} | null {
  const cleanAddr = address.toLowerCase();
  
  // City coordinates (approximate city centers)
  const cityCoords: Record<string, { lat: number; lng: number; name: string }> = {
    'philadelphia': { lat: 39.9526, lng: -75.1652, name: 'Philadelphia, PA' },
    'harrisburg': { lat: 40.2732, lng: -76.8867, name: 'Harrisburg, PA' },
    'lemoyne': { lat: 40.2409, lng: -76.8939, name: 'Lemoyne, PA' },
    'pittsburgh': { lat: 40.4406, lng: -79.9959, name: 'Pittsburgh, PA' },
    'baltimore': { lat: 39.2904, lng: -76.6122, name: 'Baltimore, MD' },
    'washington': { lat: 38.9072, lng: -77.0369, name: 'Washington, DC' },
    'newyork': { lat: 40.7128, lng: -74.0060, name: 'New York, NY' }
  };
  
  // Try to match city
  for (const [key, coords] of Object.entries(cityCoords)) {
    if (cleanAddr.includes(key) || 
        (key === 'philadelphia' && cleanAddr.includes('philly')) ||
        (key === 'washington' && cleanAddr.includes('dc')) ||
        (key === 'newyork' && cleanAddr.includes('new york'))) {
      console.log(`📍 Using city-based geocoding for ${coords.name}`);
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        formattedAddress: `${coords.name} (estimated)`
      };
    }
  }
  
  console.log(`⚠️ Could not geocode address using city fallback: ${address}`);
  return null;
}

// Geocode an address to lat/lng using Google Maps Geocoding API
export async function geocodeAddress(
  address: string,
  extraComputations?: 'BUILDING_AND_ENTRANCES'[]
): Promise<{
  latitude: number;
  longitude: number;
  formattedAddress: string;
  buildings?: any[]; // Add buildings to the return type
} | null> {
  try {
    const { Client } = await import('@googlemaps/google-maps-services-js');
    const client = new Client({});
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.log('Google Maps API key not configured, using city-based geocoding fallback');
      return geocodeAddressFromCity(address);
    }

    const params: any = {
      address: address,
      key: process.env.GOOGLE_MAPS_API_KEY,
    };

    if (extraComputations) {
      params.extra_computations = extraComputations;
    }

    const response = await client.geocode({ params });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const buildings = (response.data as any).buildings;

      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        buildings: buildings,
      };
    }
    
    console.log(`No geocoding results for address: ${address}, trying city-based fallback`);
    return geocodeAddressFromCity(address);
  } catch (error) {
    console.error(`Geocoding error for address ${address}:`, error);
    console.log('Attempting city-based geocoding fallback...');
    return geocodeAddressFromCity(address);
  }
}

// Calculate distance fee based on business settings
export function calculateDistanceFee(
  distanceInMiles: number,
  serviceRadius: number,
  pricingType: string,
  pricingRate: number,
  basePrice: number
): number {
  if (distanceInMiles <= serviceRadius) {
    return 0; // Within service radius, no additional fee
  }

  const extraMiles = distanceInMiles - serviceRadius;
  
  if (pricingType === "dollar") {
    // pricingRate is in cents per mile
    return Math.round(extraMiles * pricingRate);
  } else if (pricingType === "percent") {
    // pricingRate is in basis points (1% = 100 basis points)
    const percentagePerMile = pricingRate / 10000; // Convert basis points to decimal percentage
    return Math.round(basePrice * percentagePerMile * extraMiles);
  }

  return 0;
}

// Validate if an address is within service area
export function isWithinServiceArea(
  distanceInMiles: number,
  serviceRadius: number,
  enableDistancePricing: boolean
): boolean {
  if (!enableDistancePricing) {
    return true; // If distance pricing is disabled, all addresses are accepted
  }
  
  // If distance pricing is enabled, we accept all addresses but charge extra for those outside radius
  return true;
}

// Format distance for display
export function formatDistance(miles: number): string {
  if (miles < 1) {
    return `${Math.round(miles * 10) / 10} mi`;
  }
  return `${Math.round(miles)} mi`;
}

// Format currency for display
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}