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
  styling?: {
    containerBorderRadius?: number;
    containerShadow?: string;
    primaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    buttonPadding?: string;
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
    serviceSelectorActiveBorderColor?: string;
    serviceSelectorHoverBackgroundColor?: string;
    serviceSelectorHoverBorderColor?: string;
    // Typography properties
    serviceSelectorFontSize?: string;
    serviceSelectorTextColor?: string;
    serviceSelectorSelectedTextColor?: string;
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
  };
}

interface ServiceWithIcon extends Formula {
  icon?: string;
}

export default function EnhancedServiceSelector({
  formulas,
  selectedServices,
  onServiceToggle,
  onServiceEdit,
  onContinue,
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
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
      case 'md':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
      case 'lg':
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 'xl':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3';
      case '2xl':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2';
      default:
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  // Card size classes
  const getCardSizeClasses = () => {
    const cardSize = styling.serviceSelectorCardSize || 'lg';
    switch (cardSize) {
      case 'sm':
        return 'min-h-[120px]';
      case 'md':
        return 'min-h-[140px]';
      case 'lg':
        return 'min-h-[160px]';
      case 'xl':
        return 'min-h-[180px]';
      case '2xl':
        return 'min-h-[200px]';
      default:
        return 'min-h-[160px]';
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
    // Priority 1: Use icon from icon library if iconId is set
    if (formula.iconId && formula.iconUrl) {
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="w-full h-full object-contain"
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
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="w-full h-full object-contain"
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
    const varCount = formula.variables.length;
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
        <div className={`grid ${getGridClasses()} ${gapClasses[styling.serviceSelectorGap as keyof typeof gapClasses] || gapClasses.md}`}>
          {formulas.map((formula) => {
            const isSelected = selectedServices.includes(formula.id);
            
            return (
              <Card 
                key={formula.id} 
                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${getCardSizeClasses()} ${shadowClasses[styling.serviceSelectorShadow as keyof typeof shadowClasses] || shadowClasses.lg}`}
                style={{
                  borderRadius: `${componentStyles?.serviceSelector?.borderRadius || styling.serviceSelectorBorderRadius || 16}px`,
                  borderWidth: `${componentStyles?.serviceSelector?.borderWidth || styling.serviceSelectorBorderWidth || (isSelected ? 2 : 1)}px`,
                  borderColor: isSelected 
                    ? componentStyles?.serviceSelector?.activeBorderColor || styling.serviceSelectorActiveBorderColor || styling.primaryColor 
                    : componentStyles?.serviceSelector?.borderColor || styling.serviceSelectorBorderColor || '#E5E7EB',
                  backgroundColor: isSelected 
                    ? componentStyles?.serviceSelector?.activeBackgroundColor || styling.serviceSelectorActiveBackgroundColor || '#3B82F6'
                    : componentStyles?.serviceSelector?.backgroundColor || styling.serviceSelectorBackgroundColor || '#FFFFFF',
                  maxWidth: `${styling.serviceSelectorWidth || 900}px`,
                  maxHeight: `${styling.serviceSelectorMaxHeight || 300}px`
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = componentStyles?.serviceSelector?.hoverBackgroundColor || styling.serviceSelectorHoverBackgroundColor || '#F3F4F6';
                    e.currentTarget.style.borderColor = componentStyles?.serviceSelector?.hoverBorderColor || styling.serviceSelectorHoverBorderColor || '#D1D5DB';
                    e.currentTarget.style.borderWidth = `${componentStyles?.serviceSelector?.borderWidth || styling.serviceSelectorBorderWidth || 1}px`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = componentStyles?.serviceSelector?.backgroundColor || styling.serviceSelectorBackgroundColor || '#FFFFFF';
                    e.currentTarget.style.borderColor = componentStyles?.serviceSelector?.borderColor || styling.serviceSelectorBorderColor || '#E5E7EB';
                    e.currentTarget.style.borderWidth = `${componentStyles?.serviceSelector?.borderWidth || styling.serviceSelectorBorderWidth || 1}px`;
                  }
                }}
                onClick={() => onServiceToggle(formula.id)}
              >
                <CardContent className={`${paddingClasses[styling.serviceSelectorPadding as keyof typeof paddingClasses] || paddingClasses.lg} relative h-full overflow-hidden`}>
                  {/* Flexible Layout Based on Icon Position */}
                  <div className={`flex h-full ${
                    styling.serviceSelectorIconPosition === 'top' ? 'flex-col items-center text-center' :
                    styling.serviceSelectorIconPosition === 'bottom' ? 'flex-col-reverse items-center text-center' :
                    styling.serviceSelectorIconPosition === 'left' ? 'flex-row items-center text-left' :
                    'flex-row-reverse items-center text-right'
                  } ${
                    styling.serviceSelectorContentAlignment === 'top' ? 'justify-start' :
                    styling.serviceSelectorContentAlignment === 'bottom' ? 'justify-end' :
                    'justify-center'
                  }`}>
                    
                    {/* Service Name */}
                    <h3 
                      className={`font-black flex-1 ${
                        styling.serviceSelectorIconPosition === 'top' || styling.serviceSelectorIconPosition === 'bottom' ? '' : 
                        styling.serviceSelectorIconPosition === 'left' ? 'ml-3' : 'mr-3'
                      } ${fontSizeClasses[(componentStyles?.serviceSelector?.fontSize || styling.serviceSelectorFontSize || styling.serviceSelectorTitleFontSize || 'base') as keyof typeof fontSizeClasses] || 'text-sm md:text-base lg:text-lg'}`}
                      style={{ 
                        color: isSelected 
                          ? componentStyles?.serviceSelector?.selectedTextColor || styling.serviceSelectorSelectedTextColor || styling.textColor
                          : componentStyles?.serviceSelector?.textColor || styling.serviceSelectorTextColor || styling.textColor,
                        lineHeight: styling.serviceSelectorLineHeight ? `${styling.serviceSelectorLineHeight}px` : undefined
                      }}

                    >
                      {formula.name}
                    </h3>
                    
                    {/* Icon */}
                    <div 
                      className={`${iconSizeClasses[styling.serviceSelectorIconSize as keyof typeof iconSizeClasses] || iconSizeClasses.lg} flex items-center justify-center flex-shrink-0 ${
                        styling.serviceSelectorIconPosition === 'top' ? 'mt-3' :
                        styling.serviceSelectorIconPosition === 'bottom' ? 'mb-3' : ''
                      }`}
                      style={{ 
                        color: isSelected ? styling.primaryColor : styling.textColor 
                      }}
                    >
                      {getServiceIcon(formula)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}


        </div>
      )}

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <Card 
          className="p-4"
          style={{
            borderRadius: `${styling.containerBorderRadius || 8}px`,
            backgroundColor: styling.backgroundColor
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium" style={{ color: styling.textColor }}>
                Selected Services ({selectedServices.length})
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedServices.map((serviceId) => {
                  const formula = formulas.find(f => f.id === serviceId);
                  if (!formula) return null;
                  
                  return (
                    <Badge 
                      key={serviceId} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span className="w-4 h-4 flex items-center justify-center text-sm">{getServiceIcon(formula)}</span>
                      {formula.name}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:bg-gray-200 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          onServiceToggle(serviceId);
                        }}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}


    </div>
  );
}