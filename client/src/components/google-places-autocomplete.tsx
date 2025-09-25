import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useGoogleMaps } from '@/components/google-maps-loader';

// Declare Google Maps types for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

declare const google: any;

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  types?: string[];
  fields?: string[];
  componentRestrictions?: { country: string | string[] };
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter address...",
  className,
  types = ['geocode'],
  fields = ['formatted_address', 'geometry'],
  componentRestrictions
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, error } = useGoogleMaps();
  const [internalValue, setInternalValue] = useState(value);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || error) {
      return;
    }

    try {
      // Initialize autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types,
        fields,
        componentRestrictions
      });

      autocompleteRef.current = autocomplete;

      // Handle place selection
      const placeChangedListener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.formatted_address) {
          setInternalValue(place.formatted_address);
          onChange(place.formatted_address);
        }
      });

      // Cleanup
      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  }, [isLoaded, error, types, fields, componentRestrictions, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  // If Google Maps failed to load, show regular input
  if (error) {
    return (
      <Input
        ref={inputRef}
        value={internalValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  // Show loading state or regular input while loading
  if (!isLoaded) {
    return (
      <Input
        ref={inputRef}
        value={internalValue}
        onChange={handleInputChange}
        placeholder={isLoaded ? placeholder : "Loading address suggestions..."}
        className={className}
        disabled={!isLoaded}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      value={internalValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
    />
  );
}