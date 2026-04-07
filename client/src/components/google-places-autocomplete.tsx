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
  // Design system props
  styling?: any;
  componentStyles?: any;
  hasCustomCSS?: boolean;
}

type PlaceAddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

function getAddressComponent(
  components: PlaceAddressComponent[] | undefined,
  type: string,
  useShortName = false
): string {
  if (!components || !Array.isArray(components)) {
    return '';
  }
  const component = components.find((item) => Array.isArray(item.types) && item.types.includes(type));
  if (!component) {
    return '';
  }
  return (useShortName ? component.short_name : component.long_name) || '';
}

function extractFullAddress(place: any): string {
  if (!place || typeof place !== 'object') {
    return '';
  }

  if (typeof place.formatted_address === 'string' && place.formatted_address.trim()) {
    return place.formatted_address.trim();
  }

  const components = place.address_components as PlaceAddressComponent[] | undefined;
  if (!components || components.length === 0) {
    return typeof place.name === 'string' ? place.name.trim() : '';
  }

  const streetNumber = getAddressComponent(components, 'street_number');
  const route = getAddressComponent(components, 'route');
  const subpremise = getAddressComponent(components, 'subpremise');
  const city =
    getAddressComponent(components, 'locality') ||
    getAddressComponent(components, 'postal_town') ||
    getAddressComponent(components, 'sublocality_level_1');
  const state = getAddressComponent(components, 'administrative_area_level_1', true);
  const postalCode = getAddressComponent(components, 'postal_code');

  const line1Base = [streetNumber, route].filter(Boolean).join(' ').trim();
  const line1 = subpremise && line1Base ? `${line1Base}, ${subpremise}` : line1Base || subpremise;
  const cityStateZip = [city, [state, postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  return [line1, cityStateZip].filter(Boolean).join(', ').trim();
}

function getSafeAddressFontFamily(): string {
  return 'Inter, Arial, Helvetica, sans-serif';
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter address...",
  className,
  types = ['geocode'],
  fields = ['formatted_address', 'address_components', 'geometry', 'name'],
  componentRestrictions,
  styling = {},
  componentStyles,
  hasCustomCSS = false
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, error } = useGoogleMaps();
  const [localValue, setLocalValue] = useState(value);
  const ignoreNextPropUpdate = useRef(false);

  // Sync local value with prop changes from parent
  useEffect(() => {
    if (!ignoreNextPropUpdate.current) {
      setLocalValue(value);
    }
    ignoreNextPropUpdate.current = false;
  }, [value]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || error || autocompleteRef.current) {
      return;
    }

    try {
      // Initialize autocomplete ONCE
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types,
        fields,
        componentRestrictions
      });

      autocompleteRef.current = autocomplete;

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const fullAddress = extractFullAddress(place);

        if (fullAddress) {
          ignoreNextPropUpdate.current = true;
          setLocalValue(fullAddress);
          onChange(fullAddress);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }

    // Cleanup when component unmounts
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, error]);

  // Helper functions for styling (same as EnhancedVariableInput)
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

  const getFontSize = (size: string) => {
    switch (size) {
      case 'xs': return '0.75rem';
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      case 'xl': return '1.25rem';
      default: return '1rem'; // base
    }
  };

  const getWidthValue = (width: string) => {
    switch (width) {
      case 'sm': return '200px';
      case 'md': return '300px';
      case 'lg': return '400px';
      case 'xl': return '500px';
      case 'full': return '100%';
      default: return '100%';
    }
  };

  // Get input styles with priority to component styles
  const getInputStyle = () => {
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
        fontSize: getFontSize(textInputStyles.fontSize || 'base'),
        color: textInputStyles.textColor || '#374151',
        fontFamily: getSafeAddressFontFamily(),
        height: `${textInputStyles.height || 40}px`,
        width: getWidthValue(textInputStyles.width || 'full')
      };
    }
    
    // Fallback to original formula styling
    return {
      backgroundColor: styling?.inputBackgroundColor || '#FFFFFF',
      borderRadius: `${styling?.inputBorderRadius || 4}px`,
      borderWidth: `${styling?.inputBorderWidth || 1}px`,
      borderColor: styling?.inputBorderColor || '#D1D5DB',
      borderStyle: 'solid' as const,
      padding: styling?.inputPadding === 'sm' ? '0.375rem' : 
               styling?.inputPadding === 'lg' ? '0.75rem' : '0.5rem',
      boxShadow: getShadowValue(styling?.inputShadow || 'none'),
      fontSize: getFontSize(styling?.inputFontSize || 'base'),
      color: styling?.inputTextColor || '#374151',
      fontFamily: getSafeAddressFontFamily(),
      height: `${styling?.inputHeight || 40}px`,
      width: getWidthValue(styling?.inputWidth || 'full'),
      fontWeight: styling.inputFontWeight === 'light' ? '300' :
                 styling.inputFontWeight === 'normal' ? '400' :
                 styling.inputFontWeight === 'medium' ? '500' :
                 styling.inputFontWeight === 'semibold' ? '600' :
                 styling.inputFontWeight === 'bold' ? '700' :
                 styling.inputFontWeight === 'extrabold' ? '800' : '400'
    };
  };

  // Only apply inline styles when custom CSS is not being used
  const inputStyle = hasCustomCSS ? {} : getInputStyle();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  // If Google Maps failed to load, show regular input
  if (error) {
    return (
      <Input
        ref={inputRef}
        value={localValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-lpignore="true"
        className={`ab-input ab-address-input ${className || ''}`}
        style={inputStyle}
      />
    );
  }

  // Show loading state or regular input while loading
  if (!isLoaded) {
    return (
      <Input
        ref={inputRef}
        value={localValue}
        onChange={handleInputChange}
        placeholder={isLoaded ? placeholder : "Loading address suggestions..."}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-lpignore="true"
        className={`ab-input ab-address-input ${className || ''}`}
        disabled={!isLoaded}
        style={inputStyle}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      value={localValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      data-lpignore="true"
      className={`ab-input ab-address-input ${className || ''}`}
      style={inputStyle}
    />
  );
}
