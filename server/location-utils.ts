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

// Geocode an address to lat/lng using Google Maps Geocoding API
export async function geocodeAddress(address: string): Promise<{
  latitude: number;
  longitude: number;
  formattedAddress: string;
} | null> {
  try {
    const { Client } = require('@googlemaps/google-maps-services-js');
    const client = new Client({});
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.log('Google Maps API key not configured, skipping geocoding');
      return null;
    }

    const response = await client.geocode({
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }
    
    console.log(`No geocoding results for address: ${address}`);
    return null;
  } catch (error) {
    console.error(`Geocoding error for address ${address}:`, error);
    return null;
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