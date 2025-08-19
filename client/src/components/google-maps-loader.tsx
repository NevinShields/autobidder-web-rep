import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadError: Error | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  isLoading: true,
  error: null,
  loadError: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

// Global state to prevent multiple script loads
let googleMapsPromise: Promise<void> | null = null;
let isScriptLoaded = false;

interface GoogleMapsLoaderProps {
  children: ReactNode;
}

export function GoogleMapsLoader({ children }: GoogleMapsLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key is not configured');
      setIsLoading(false);
      return;
    }

    // Check if already loaded
    if (isScriptLoaded && window.google?.maps?.Map && window.google?.maps?.geometry && window.google?.maps?.places) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Use existing promise if loading is in progress
    if (googleMapsPromise) {
      googleMapsPromise
        .then(() => {
          setIsLoaded(true);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoadError(err);
          setIsLoading(false);
        });
      return;
    }

    // Create new loading promise
    googleMapsPromise = loadGoogleMaps(apiKey);
    
    googleMapsPromise
      .then(() => {
        isScriptLoaded = true;
        setIsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoadError(err);
        setIsLoading(false);
        googleMapsPromise = null; // Allow retry
      });
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, isLoading, error, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      if (window.google?.maps?.Map && window.google?.maps?.geometry && window.google?.maps?.places) {
        resolve();
        return;
      }
      
      // Listen for existing script load/error
      existingScript.addEventListener('load', () => {
        if (window.google?.maps?.Map && window.google?.maps?.geometry && window.google?.maps?.places) {
          resolve();
        } else {
          reject(new Error('Google Maps libraries not fully loaded'));
        }
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load existing Google Maps script'));
      });
      return;
    }

    // Create new script with optimizations
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    
    // Generate unique callback name to avoid conflicts
    const callbackName = `initGoogleMaps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up callback
    (window as any)[callbackName] = () => {
      // Clean up callback
      delete (window as any)[callbackName];
      
      // Verify all required libraries are loaded
      if (window.google?.maps?.Map && window.google?.maps?.geometry && window.google?.maps?.places) {
        resolve();
      } else {
        reject(new Error('Google Maps libraries not fully loaded after callback'));
      }
    };

    // Optimized URL with loading=async for better performance
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&callback=${callbackName}&loading=async&v=weekly`;
    
    // Error handling
    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps API script'));
    };

    // Timeout handling
    const timeout = setTimeout(() => {
      delete (window as any)[callbackName];
      reject(new Error('Google Maps API loading timeout'));
    }, 15000); // Reduced from 30s to 15s for faster feedback

    // Clear timeout on success
    const originalCallback = (window as any)[callbackName];
    (window as any)[callbackName] = () => {
      clearTimeout(timeout);
      originalCallback();
    };

    // Add script to document
    document.head.appendChild(script);
  });
}