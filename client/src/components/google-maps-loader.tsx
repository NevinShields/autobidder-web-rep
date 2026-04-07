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
let googleMapsApiKeyPromise: Promise<string | null> | null = null;
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
    let isCancelled = false;

    const initialize = async () => {
      try {
        if (isScriptLoaded && window.google?.maps?.Map) {
          await ensureRequiredGoogleMapsLibraries();
          if (!isCancelled) {
            setIsLoaded(true);
            setIsLoading(false);
          }
          return;
        }

        const apiKey = await getGoogleMapsApiKey();
        if (!apiKey) {
          throw new Error('Google Maps API key is not configured');
        }

        if (!googleMapsPromise) {
          googleMapsPromise = loadGoogleMaps(apiKey);
        }

        await googleMapsPromise;
        isScriptLoaded = true;

        if (!isCancelled) {
          setIsLoaded(true);
          setIsLoading(false);
        }
      } catch (err) {
        googleMapsPromise = null;
        const normalizedError = err instanceof Error ? err : new Error(String(err));
        if (!isCancelled) {
          setError(normalizedError.message);
          setLoadError(normalizedError);
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, isLoading, error, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

async function getGoogleMapsApiKey(): Promise<string | null> {
  if (!googleMapsApiKeyPromise) {
    const configPromise = fetch('/api/config')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load config (${response.status})`);
        }

        return response.json();
      });

    googleMapsApiKeyPromise = configPromise
      .then((config) => {
        const apiKey = typeof config?.googleMapsApiKey === 'string' ? config.googleMapsApiKey.trim() : '';
        return apiKey || null;
      })
      .catch((fetchError) => {
        console.error('Failed to fetch Google Maps API key from /api/config:', fetchError);
        const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (typeof envApiKey === 'string' && envApiKey.trim()) {
          return envApiKey.trim();
        }
        return null;
      });

  }

  return googleMapsApiKeyPromise;
}

async function ensureRequiredGoogleMapsLibraries(): Promise<void> {
  if (!window.google?.maps?.Map) {
    throw new Error('Google Maps API script loaded, but Map is unavailable');
  }

  const importLibrary = (window.google.maps as any).importLibrary;
  if (typeof importLibrary === 'function') {
    await Promise.all([
      importLibrary('geometry'),
      importLibrary('places'),
    ]);
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      if (window.google?.maps?.Map) {
        ensureRequiredGoogleMapsLibraries().then(resolve).catch(reject);
        return;
      }

      const cleanupPolling = pollForGoogleMaps(() => {
        ensureRequiredGoogleMapsLibraries().then(resolve).catch(reject);
      });

      const handleScriptLoad = () => {
        cleanup();
        ensureRequiredGoogleMapsLibraries().then(resolve).catch(reject);
      };

      const handleScriptError = () => {
        cleanup();
        reject(new Error('Failed to load existing Google Maps script'));
      };

      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('Timed out waiting for existing Google Maps script'));
      }, 15000);

      const cleanup = () => {
        cleanupPolling();
        window.clearTimeout(timeout);
        existingScript.removeEventListener('load', handleScriptLoad);
        existingScript.removeEventListener('error', handleScriptError);
      };

      existingScript.addEventListener('load', handleScriptLoad, { once: true });
      existingScript.addEventListener('error', handleScriptError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;

    const callbackName = `initGoogleMaps_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];

      ensureRequiredGoogleMapsLibraries()
        .then(resolve)
        .catch((error) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    };

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&callback=${callbackName}&loading=async&v=weekly`;

    script.onerror = () => {
      delete (window as any)[callbackName];
      reject(new Error('Failed to load Google Maps API script'));
    };

    const timeout = window.setTimeout(() => {
      delete (window as any)[callbackName];
      reject(new Error('Google Maps API loading timeout'));
    }, 15000);

    const originalCallback = (window as any)[callbackName];
    (window as any)[callbackName] = () => {
      window.clearTimeout(timeout);
      originalCallback();
    };

    document.head.appendChild(script);
  });
}

function pollForGoogleMaps(onReady: () => void) {
  let intervalId: number | null = null;

  const check = () => {
    if (window.google?.maps?.Map) {
      cleanup();
      onReady();
    }
  };

  intervalId = window.setInterval(check, 250);
  check();

  const cleanup = () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };

  return cleanup;
}
