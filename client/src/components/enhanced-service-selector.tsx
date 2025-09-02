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

  // Card size classes - matching primary form sizing
  const getCardSizeClasses = () => {
    const cardSize = styling.serviceSelectorCardSize || 'lg';
    switch (cardSize) {
      case 'sm':
        return 'min-h-[180px]';
      case 'md':
        return 'min-h-[220px]';
      case 'lg':
        return 'min-h-[260px]';
      case 'xl':
        return 'min-h-[300px]';
      case '2xl':
        return 'min-h-[340px]';
      default:
        return 'min-h-[260px]';
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
          className="w-full h-full object-contain min-w-[80px] min-h-[80px]"
          style={{ maxWidth: '120px', maxHeight: '120px' }}
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
          className="w-full h-full object-contain min-w-[80px] min-h-[80px]"
          style={{ maxWidth: '120px', maxHeight: '120px' }}
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
        <div className={`grid ${getGridClasses()} ${gapClasses[styling.serviceSelectorGap as keyof typeof gapClasses] || gapClasses.md}`}>
          {formulas.map((formula) => {
            const isSelected = selectedServices.includes(formula.id);
            


            return (
              <div 
                key={formula.id} 
                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${getCardSizeClasses()} ${shadowClasses[styling.serviceSelectorShadow as keyof typeof shadowClasses] || shadowClasses.lg} ${paddingClasses[styling.serviceSelectorPadding as keyof typeof paddingClasses] || paddingClasses.lg} relative overflow-hidden border`}
                style={{
                  borderRadius: `${styling.serviceSelectorBorderRadius || componentStyles?.serviceSelector?.borderRadius || 16}px`,
                  borderWidth: `${styling.serviceSelectorBorderWidth || componentStyles?.serviceSelector?.borderWidth || (isSelected ? 2 : 1)}px`,
                  borderColor: isSelected 
                    ? styling.serviceSelectorSelectedBorderColor || styling.primaryColor || '#3B82F6'
                    : styling.serviceSelectorBorderColor || componentStyles?.serviceSelector?.borderColor || '#E5E7EB',
                  backgroundColor: isSelected 
                    ? styling.serviceSelectorSelectedBgColor || styling.serviceSelectorActiveBackgroundColor || componentStyles?.serviceSelector?.activeBackgroundColor || '#EFF6FF'
                    : styling.serviceSelectorBackgroundColor || componentStyles?.serviceSelector?.backgroundColor || '#FFFFFF',
                  maxWidth: `${styling.serviceSelectorWidth || 900}px`,
                  maxHeight: `${styling.serviceSelectorMaxHeight || 400}px`
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = styling.serviceSelectorHoverBackgroundColor || componentStyles?.serviceSelector?.hoverBackgroundColor || '#F3F4F6';
                    e.currentTarget.style.borderColor = styling.serviceSelectorHoverBorderColor || componentStyles?.serviceSelector?.hoverBorderColor || '#D1D5DB';
                    e.currentTarget.style.borderWidth = `${styling.serviceSelectorBorderWidth || componentStyles?.serviceSelector?.borderWidth || 1}px`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = styling.serviceSelectorBackgroundColor || componentStyles?.serviceSelector?.backgroundColor || '#FFFFFF';
                    e.currentTarget.style.borderColor = styling.serviceSelectorBorderColor || componentStyles?.serviceSelector?.borderColor || '#E5E7EB';
                    e.currentTarget.style.borderWidth = `${styling.serviceSelectorBorderWidth || componentStyles?.serviceSelector?.borderWidth || 1}px`;
                  }
                }}
                onClick={() => onServiceToggle(formula.id)}
              >
                  {/* Enhanced Layout with proper spacing - matches primary form */}
                  <div className="flex flex-col items-center text-center h-full pt-10 pb-4 px-4 justify-center">
                    
                    {/* Service Name Above Icon - matching primary form */}
                    <h3 
                      className="font-black text-base lg:text-lg leading-[0.8] mb-4"
                      style={{ 
                        color: isSelected 
                          ? styling.serviceSelectorSelectedTextColor || componentStyles?.serviceSelector?.selectedTextColor || styling.textColor || '#1f2937'
                          : styling.serviceSelectorTextColor || componentStyles?.serviceSelector?.textColor || styling.textColor || '#374151'
                      }}
                    >
                      {formula.name}
                    </h3>
                    
                    {/* Icon with proper sizing */}
                    <div 
                      className="w-full aspect-square max-w-[90%] text-5xl lg:text-6xl flex items-center justify-center"
                      style={{ 
                        color: isSelected 
                          ? styling.primaryColor || '#3b82f6'
                          : styling.primaryColor || '#3b82f6'
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
                backgroundColor: styling.primaryColor || '#3b82f6',
                color: '#ffffff',
                borderRadius: `${styling.buttonBorderRadius || 8}px`,
                padding: styling.buttonPadding === 'sm' ? '8px 16px' :
                         styling.buttonPadding === 'md' ? '12px 24px' :
                         styling.buttonPadding === 'lg' ? '16px 32px' :
                         styling.buttonPadding === 'xl' ? '20px 40px' : '12px 24px',
                fontWeight: styling.buttonFontWeight || 'medium',
                boxShadow: styling.buttonShadow === 'none' ? 'none' :
                          styling.buttonShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' :
                          styling.buttonShadow === 'md' ? '0 4px 6px rgba(0,0,0,0.1)' :
                          styling.buttonShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)' :
                          styling.buttonShadow === 'xl' ? '0 20px 25px rgba(0,0,0,0.1)' : 
                          '0 1px 3px rgba(0,0,0,0.1)'
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