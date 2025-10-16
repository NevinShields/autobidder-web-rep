import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Circle, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Formula } from "@shared/schema";

interface EnhancedServiceSelectorProps {
  formulas: Formula[];
  selectedServices: number[];
  onServiceToggle: (formulaId: number) => void;
  onServiceEdit?: (formulaId: number) => void;
  onContinue?: () => void;
  hasCustomCSS?: boolean;
  styling?: {
    containerBorderRadius?: number;
    containerShadow?: string;
    primaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    buttonPadding?: string;
    buttonBorderRadius?: number;
    buttonFontWeight?: string;
    buttonShadow?: string;
    serviceSelectorWidth?: number;
    serviceSelectorCardSize?: string;
    serviceSelectorCardsPerRow?: string;
    serviceSelectorBorderRadius?: number;
    serviceSelectorShadow?: string;
    serviceSelectorBackgroundColor?: string;
    serviceSelectorBorderWidth?: number;
    serviceSelectorBorderColor?: string;

    serviceSelectorSelectedBgColor?: string;
    serviceSelectorSelectedBorderColor?: string;
    serviceSelectorTitleFontSize?: string;
    serviceSelectorDescriptionFontSize?: string;
    serviceSelectorTitleLineHeight?: string;
    serviceSelectorDescriptionLineHeight?: string;
    serviceSelectorTitleLetterSpacing?: string;
    serviceSelectorDescriptionLetterSpacing?: string;
    serviceSelectorIconSize?: string;
    serviceSelectorIconPosition?: string;
    serviceSelectorMaxHeight?: number;
    serviceSelectorPadding?: string;
    serviceSelectorGap?: string;
    serviceSelectorContentAlignment?: string;
    // New active/hover state properties
    serviceSelectorActiveBackgroundColor?: string;
    serviceSelectorActiveBackgroundColorAlpha?: number;
    serviceSelectorActiveBorderColor?: string;
    serviceSelectorActiveBorderColorAlpha?: number;
    serviceSelectorHoverBackgroundColor?: string;
    serviceSelectorHoverBackgroundColorAlpha?: number;
    serviceSelectorHoverBorderColor?: string;
    serviceSelectorHoverBorderColorAlpha?: number;
    // Typography properties
    serviceSelectorFontSize?: string;
    serviceSelectorTextColor?: string;
    serviceSelectorTextColorAlpha?: number;
    serviceSelectorSelectedTextColor?: string;
    serviceSelectorSelectedTextColorAlpha?: number;
    serviceSelectorBackgroundColorAlpha?: number;
    serviceSelectorBorderColorAlpha?: number;
  };
  componentStyles?: {
    serviceSelector?: {
      borderRadius?: number;
      borderWidth?: number;
      borderColor?: string;
      backgroundColor?: string;
      activeBackgroundColor?: string;
      activeBorderColor?: string;
      hoverBackgroundColor?: string;
      hoverBorderColor?: string;
      fontSize?: string;
      textColor?: string;
      selectedTextColor?: string;
    };
    button?: {
      backgroundColor?: string;
      backgroundColorAlpha?: number;
      textColor?: string;
      textColorAlpha?: number;
      borderColor?: string;
      borderColorAlpha?: number;
      borderRadius?: number;
      borderWidth?: number;
      padding?: string | number;
      fontSize?: string;
      fontWeight?: string;
      shadow?: string;
      height?: number;
    };
  };
}

interface ServiceWithIcon extends Formula {
  icon?: string;
}

// Helper function to convert hex color + alpha to rgba
function hexToRgba(hex: string, alpha: number = 100): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Convert alpha from 0-100 to 0-1
  const a = alpha / 100;
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Helper function for button padding
function getButtonPadding(padding?: string | number): string {
  if (typeof padding === 'number') return `${padding}px`;
  switch (padding) {
    case 'sm': return '8px 16px';
    case 'md': return '12px 24px';
    case 'lg': return '16px 32px';
    case 'xl': return '20px 40px';
    default: return '12px 24px';
  }
}

// Helper function for shadow values
function getShadowValue(shadowSize?: string): string {
  switch (shadowSize) {
    case 'none': return 'none';
    case 'sm': return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    case 'md': return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    case 'lg': return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    case 'xl': return '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    default: return '0 1px 3px rgba(0, 0, 0, 0.1)';
  }
}

// Helper function for font sizes
function getFontSizeValue(fontSize?: string): string {
  switch (fontSize) {
    case 'xs': return '0.75rem';
    case 'sm': return '0.875rem';
    case 'lg': return '1.125rem';
    case 'xl': return '1.25rem';
    case 'base':
    default: return '1rem';
  }
}

export default function EnhancedServiceSelector({
  formulas,
  selectedServices,
  onServiceToggle,
  onServiceEdit,
  onContinue,
  hasCustomCSS = false,
  styling = {},
  componentStyles = {}
}: EnhancedServiceSelectorProps) {
  const [editingService, setEditingService] = useState<ServiceWithIcon | null>(null);
  const [newServiceIcon, setNewServiceIcon] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");

  const shadowClasses = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  };

  const fontSizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl'
  };

  const lineHeightClasses = {
    'tight': 'leading-tight',
    'snug': 'leading-snug',
    'normal': 'leading-normal',
    'relaxed': 'leading-relaxed',
    'loose': 'leading-loose'
  };

  const letterSpacingClasses = {
    'tighter': 'tracking-tighter',
    'tight': 'tracking-tight',
    'normal': 'tracking-normal',
    'wide': 'tracking-wide',
    'wider': 'tracking-wider',
    'widest': 'tracking-widest'
  };

  const iconSizeClasses = {
    'sm': 'w-12 h-12 text-2xl',
    'md': 'w-16 h-16 text-3xl',
    'lg': 'w-20 h-20 text-4xl',
    'xl': 'w-24 h-24 text-5xl'
  };

  const paddingClasses = {
    'sm': 'p-3',
    'md': 'p-4',
    'lg': 'p-6',
    'xl': 'p-8'
  };

  const gapClasses = {
    'sm': 'gap-2',
    'md': 'gap-4',
    'lg': 'gap-6',
    'xl': 'gap-8'
  };

  // Calculate grid classes based on card size and cards per row
  const getGridClasses = () => {
    const cardsPerRow = styling.serviceSelectorCardsPerRow || 'auto';
    const cardSize = styling.serviceSelectorCardSize || 'lg';
    
    if (cardsPerRow !== 'auto') {
      // Fixed number of cards per row
      const gridColsMap = {
        '1': 'grid-cols-1',
        '2': 'grid-cols-2',
        '3': 'grid-cols-3',
        '4': 'grid-cols-4'
      };
      return gridColsMap[cardsPerRow as keyof typeof gridColsMap] || 'grid-cols-3';
    }
    
    // Auto-responsive based on card size
    switch (cardSize) {
      case 'sm':
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';
      case 'md':
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
      case 'lg':
        return 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
      case 'xl':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4';
      case '2xl':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3';
      default:
        return 'grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
    }
  };

  // Card size classes - matching primary form sizing
  const getCardSizeClasses = () => {
    const cardSize = styling.serviceSelectorCardSize || 'lg';
    // Use auto height with flex to ensure uniform card heights and prevent icon cropping
    switch (cardSize) {
      case 'sm':
        return 'h-auto';
      case 'md':
        return 'h-auto';
      case 'lg':
        return 'h-auto';
      case 'xl':
        return 'h-auto';
      case '2xl':
        return 'h-auto';
      default:
        return 'h-auto';
    }
  };

  const handleIconUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewServiceIcon(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getServiceIcon = (formula: Formula) => {
    // Get image size for uploaded icons only
    const getImageSize = () => {
      // Use existing preset size property
      const presetSize = styling.serviceSelectorIconSize || 'md';
      switch (presetSize) {
        case 'sm': return { width: '32px', height: '32px' };
        case 'md': return { width: '48px', height: '48px' };
        case 'lg': return { width: '64px', height: '64px' };
        case 'xl': return { width: '80px', height: '80px' };
        default: return { width: '48px', height: '48px' };
      }
    };

    // Priority 1: Use icon from icon library if iconId is set
    if (formula.iconId && formula.iconUrl) {
      const imageSize = getImageSize();
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="object-contain"
          style={{ 
            width: imageSize.width, 
            height: imageSize.height,
            maxWidth: '80px',
            maxHeight: '80px'
          }}
          onError={(e) => {
            // Fallback to emoji on error
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.textContent = '⚙️';
            }
          }}
        />
      );
    }
    
    // Priority 2: Use custom icon URL if provided
    if (formula.iconUrl) {
      // Check if it's an emoji (single character or unicode emoji)
      if (formula.iconUrl.length <= 4) {
        return formula.iconUrl;
      }
      // It's a URL, return as image
      const imageSize = getImageSize();
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="object-contain"
          style={{ 
            width: imageSize.width, 
            height: imageSize.height,
            maxWidth: '80px',
            maxHeight: '80px'
          }}
          onError={(e) => {
            // Fallback to default icon on error
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.textContent = '⚙️';
            }
          }}
        />
      );
    }
    
    // Priority 3: Default icons based on service name
    const name = formula.name.toLowerCase();
    if (name.includes('kitchen') || name.includes('remodel')) return '🏠';
    if (name.includes('wash') || name.includes('clean')) return '🧽';
    if (name.includes('paint')) return '🎨';
    if (name.includes('landscape') || name.includes('garden')) return '🌿';
    if (name.includes('roof')) return '🏘️';
    if (name.includes('plumb')) return '🔧';
    if (name.includes('electric')) return '⚡';
    if (name.includes('hvac') || name.includes('air')) return '❄️';
    return '⚙️';
  };

  const getServiceDescription = (formula: Formula) => {
    // Generate descriptions based on variables
    const varCount = (formula.variables || []).length;
    if (varCount === 0) return "Simple pricing calculator";
    if (varCount <= 3) return `Basic calculator with ${varCount} options`;
    if (varCount <= 6) return `Detailed calculator with ${varCount} customization options`;
    return `Advanced calculator with ${varCount}+ configuration options`;
  };



  return (
    <div className="space-y-6">

      {formulas.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Circle className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Services Available</h3>
          <p className="text-gray-600 mb-4">
            Contact the business owner to add services
          </p>
        </Card>
      ) : (
        <div className={`grid ${getGridClasses()}`} style={{ gap: `${styling.serviceSelectorGapSize ?? 16}px` }}>
          {formulas.map((formula) => {
            const isSelected = selectedServices.includes(formula.id);
            


            return (
              <div 
                key={formula.id} 
                className={`service-selector cursor-pointer transition-all duration-200 hover:scale-105 ${getCardSizeClasses()} ${shadowClasses[styling.serviceSelectorShadow as keyof typeof shadowClasses] || shadowClasses.lg} ${paddingClasses[styling.serviceSelectorPadding as keyof typeof paddingClasses] || paddingClasses.lg} relative border`}
                style={!hasCustomCSS ? {
                  borderRadius: `${styling.serviceSelectorBorderRadius || componentStyles?.serviceSelector?.borderRadius || 16}px`,
                  borderWidth: `${styling.serviceSelectorBorderWidth || componentStyles?.serviceSelector?.borderWidth || (isSelected ? 2 : 1)}px`,
                  borderColor: isSelected 
                    ? hexToRgba(
                        styling.serviceSelectorActiveBorderColor || componentStyles?.serviceSelector?.activeBorderColor || styling.serviceSelectorSelectedBorderColor || styling.primaryColor || '#3B82F6',
                        styling.serviceSelectorActiveBorderColorAlpha ?? 100
                      )
                    : hexToRgba(
                        styling.serviceSelectorBorderColor || componentStyles?.serviceSelector?.borderColor || '#E5E7EB',
                        styling.serviceSelectorBorderColorAlpha ?? 100
                      ),
                  backgroundColor: isSelected 
                    ? hexToRgba(
                        styling.serviceSelectorActiveBackgroundColor || componentStyles?.serviceSelector?.activeBackgroundColor || styling.serviceSelectorSelectedBgColor || '#EFF6FF',
                        styling.serviceSelectorActiveBackgroundColorAlpha ?? 100
                      )
                    : hexToRgba(
                        styling.serviceSelectorBackgroundColor || componentStyles?.serviceSelector?.backgroundColor || '#FFFFFF',
                        styling.serviceSelectorBackgroundColorAlpha ?? 100
                      )
                } : {}}
                onMouseEnter={(e) => {
                  if (!isSelected && !hasCustomCSS) {
                    e.currentTarget.style.backgroundColor = hexToRgba(
                      styling.serviceSelectorHoverBackgroundColor || componentStyles?.serviceSelector?.hoverBackgroundColor || '#F3F4F6',
                      styling.serviceSelectorHoverBackgroundColorAlpha ?? 100
                    );
                    e.currentTarget.style.borderColor = hexToRgba(
                      styling.serviceSelectorHoverBorderColor || componentStyles?.serviceSelector?.hoverBorderColor || '#D1D5DB',
                      styling.serviceSelectorHoverBorderColorAlpha ?? 100
                    );
                    e.currentTarget.style.borderWidth = `${styling.serviceSelectorBorderWidth || componentStyles?.serviceSelector?.borderWidth || 1}px`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !hasCustomCSS) {
                    e.currentTarget.style.backgroundColor = hexToRgba(
                      styling.serviceSelectorBackgroundColor || componentStyles?.serviceSelector?.backgroundColor || '#FFFFFF',
                      styling.serviceSelectorBackgroundColorAlpha ?? 100
                    );
                    e.currentTarget.style.borderColor = hexToRgba(
                      styling.serviceSelectorBorderColor || componentStyles?.serviceSelector?.borderColor || '#E5E7EB',
                      styling.serviceSelectorBorderColorAlpha ?? 100
                    );
                    e.currentTarget.style.borderWidth = `${styling.serviceSelectorBorderWidth || componentStyles?.serviceSelector?.borderWidth || 1}px`;
                  }
                }}
                onClick={() => onServiceToggle(formula.id)}
              >
                  {/* Enhanced Layout with proper spacing */}
                  <div className="flex flex-col items-center text-center h-full pt-1 pb-2 px-2">
                    
                    {/* Service Name with smart dynamic sizing - always shows full text */}
                    <h3 
                      className="font-black leading-tight flex-shrink-0"
                      style={!hasCustomCSS ? { 
                        color: isSelected 
                          ? hexToRgba(
                              styling.serviceSelectorSelectedTextColor || componentStyles?.serviceSelector?.selectedTextColor || styling.textColor || '#1f2937',
                              styling.serviceSelectorSelectedTextColorAlpha ?? 100
                            )
                          : hexToRgba(
                              styling.serviceSelectorTextColor || componentStyles?.serviceSelector?.textColor || styling.textColor || '#374151',
                              styling.serviceSelectorTextColorAlpha ?? 100
                            ),
                        marginBottom: '8px',
                        fontSize: (() => {
                          // Smart font sizing with word wrapping allowed
                          const textLength = formula.name.length;
                          if (textLength <= 15) return '0.875rem'; // 14px - short text
                          if (textLength <= 25) return '0.8125rem'; // 13px - medium text  
                          if (textLength <= 35) return '0.75rem'; // 12px - long text
                          return '0.6875rem'; // 11px - very long text
                        })(),
                        lineHeight: '1.3',
                        wordBreak: 'normal',
                        overflowWrap: 'break-word',
                        hyphens: 'none',
                        fontFamily: styling.titleFontFamily === 'inter' ? 'Inter, sans-serif' :
                                   styling.titleFontFamily === 'arial' ? 'Arial, sans-serif' :
                                   styling.titleFontFamily === 'helvetica' ? 'Helvetica, sans-serif' :
                                   styling.titleFontFamily === 'georgia' ? 'Georgia, serif' :
                                   styling.titleFontFamily === 'times' ? 'Times New Roman, serif' :
                                   styling.titleFontFamily === 'roboto' ? 'Roboto, sans-serif' :
                                   styling.titleFontFamily === 'opensans' ? 'Open Sans, sans-serif' :
                                   styling.titleFontFamily === 'lato' ? 'Lato, sans-serif' :
                                   styling.titleFontFamily === 'montserrat' ? 'Montserrat, sans-serif' :
                                   styling.titleFontFamily === 'system' ? 'system-ui, sans-serif' :
                                   styling.titleFontFamily || (styling.fontFamily === 'times' ? 'Times New Roman, serif' : 'Inter, sans-serif'),
                        fontWeight: styling.titleFontWeight === 'light' ? '300' :
                                   styling.titleFontWeight === 'normal' ? '400' :
                                   styling.titleFontWeight === 'medium' ? '500' :
                                   styling.titleFontWeight === 'semibold' ? '600' :
                                   styling.titleFontWeight === 'bold' ? '700' :
                                   styling.titleFontWeight === 'extrabold' ? '800' : '900'
                      } : {}}
                    >
                      {formula.name}
                    </h3>
                    
                    {/* Icon with fixed sizing - no container scaling */}
                    <div 
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ 
                        color: isSelected 
                          ? styling.primaryColor || '#3b82f6'
                          : styling.primaryColor || '#3b82f6',
                        fontSize: (() => {
                          // Fixed icon sizing based on existing preset controls
                          const presetSize = styling.serviceSelectorIconSize || 'md';
                          switch (presetSize) {
                            case 'sm': return '2rem';
                            case 'md': return '2.5rem';
                            case 'lg': return '3rem';
                            case 'xl': return '3.5rem';
                            default: return '2.5rem';
                          }
                        })(),
                        width: (() => {
                          // Fixed width to prevent scaling
                          const presetSize = styling.serviceSelectorIconSize || 'md';
                          switch (presetSize) {
                            case 'sm': return '2rem';
                            case 'md': return '2.5rem';
                            case 'lg': return '3rem';
                            case 'xl': return '3.5rem';
                            default: return '2.5rem';
                          }
                        })(),
                        height: (() => {
                          // Fixed height to prevent scaling
                          const presetSize = styling.serviceSelectorIconSize || 'md';
                          switch (presetSize) {
                            case 'sm': return '2rem';
                            case 'md': return '2.5rem';
                            case 'lg': return '3rem';
                            case 'xl': return '3.5rem';
                            default: return '2.5rem';
                          }
                        })()
                      }}
                    >
                      {getServiceIcon(formula)}
                    </div>
                  </div>
              </div>
            );
          })}


        </div>
      )}

      {/* Selected Services Summary and Continue Button */}
      {selectedServices.length > 0 && (
        <div className="text-center pt-6 border-t border-opacity-20">
          <div className="mb-4">
            <Badge variant="secondary" className="px-4 py-2">
              {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
            </Badge>
          </div>
          {onContinue && (
            <Button
              onClick={onContinue}
              style={{
                backgroundColor: hexToRgba(
                  componentStyles.button?.backgroundColor || (styling as any).buttonBackgroundColor || styling.primaryColor || '#3b82f6',
                  componentStyles.button?.backgroundColorAlpha ?? 100
                ),
                color: hexToRgba(
                  componentStyles.button?.textColor || (styling as any).buttonTextColor || '#FFFFFF',
                  componentStyles.button?.textColorAlpha ?? 100
                ),
                borderRadius: `${componentStyles.button?.borderRadius || styling.buttonBorderRadius || 8}px`,
                padding: componentStyles.button?.padding 
                  ? (typeof componentStyles.button.padding === 'number' ? `${componentStyles.button.padding}px` : componentStyles.button.padding)
                  : getButtonPadding(styling.buttonPadding),
                fontWeight: componentStyles.button?.fontWeight || styling.buttonFontWeight || 'medium',
                fontSize: componentStyles.button?.fontSize ? getFontSizeValue(componentStyles.button.fontSize) : '1rem',
                boxShadow: getShadowValue(componentStyles.button?.shadow || styling.buttonShadow),
                borderWidth: `${Math.max(componentStyles.button?.borderWidth || (styling as any).buttonBorderWidth || 1, 1)}px`,
                borderStyle: 'solid' as const,
                borderColor: hexToRgba(
                  componentStyles.button?.borderColor || (styling as any).buttonBorderColor || componentStyles.button?.backgroundColor || (styling as any).buttonBackgroundColor || styling.primaryColor || '#3b82f6',
                  componentStyles.button?.borderColorAlpha ?? 100
                ),
                height: componentStyles.button?.height ? `${componentStyles.button.height}px` : 'auto',
                transition: 'all 0.2s ease-in-out',
              }}
              size="lg"
              className="text-white px-8"
            >
              Configure Services
            </Button>
          )}
        </div>
      )}


    </div>
  );
}