import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckCircle, Circle, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    serviceSelectorBorderRadius?: number;
    serviceSelectorShadow?: string;
    serviceSelectorBackgroundColor?: string;
    serviceSelectorBorderWidth?: number;
    serviceSelectorBorderColor?: string;
    serviceSelectorHoverBgColor?: string;
    serviceSelectorHoverBorderColor?: string;
    serviceSelectorSelectedBgColor?: string;
    serviceSelectorSelectedBorderColor?: string;
    serviceSelectorTitleFontSize?: string;
    serviceSelectorDescriptionFontSize?: string;
    serviceSelectorIconSize?: string;
    serviceSelectorPadding?: string;
    serviceSelectorGap?: string;
  };
}

interface ServiceWithIcon extends Formula {
  icon?: string;
  description?: string;
}

export default function EnhancedServiceSelector({
  formulas,
  selectedServices,
  onServiceToggle,
  onServiceEdit,
  onContinue,
  styling = {}
}: EnhancedServiceSelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
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
    // Use custom icon if provided
    if (formula.iconUrl) {
      // Check if it's an emoji (single character or unicode emoji)
      if (formula.iconUrl.length <= 4 || /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(formula.iconUrl)) {
        return formula.iconUrl;
      }
      // It's a URL, return as image
      return (
        <img 
          src={formula.iconUrl} 
          alt={formula.name}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            // Fallback to default icon on error
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    
    // Default icons based on service name for demo
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold" style={{ color: styling.textColor }}>
            Choose Your Services
          </h2>
          <p className="text-xs sm:text-sm opacity-70">
            Select the services you need for your project
          </p>
        </div>
        {selectedServices.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            {selectedServices.length} selected
          </Badge>
        )}
      </div>

      {formulas.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Plus className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Services Available</h3>
          <p className="text-gray-600 mb-4">
            Add your first service calculator to get started
          </p>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </Card>
      ) : (
        <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gapClasses[styling.serviceSelectorGap || 'md']}`}>
          {formulas.map((formula) => {
            const isSelected = selectedServices.includes(formula.id);
            
            return (
              <Card 
                key={formula.id} 
                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${shadowClasses[styling.serviceSelectorShadow || 'lg']}`}
                style={{
                  borderRadius: `${styling.serviceSelectorBorderRadius || 16}px`,
                  borderWidth: `${styling.serviceSelectorBorderWidth || 0}px`,
                  borderColor: isSelected 
                    ? styling.serviceSelectorSelectedBorderColor || styling.primaryColor 
                    : styling.serviceSelectorBorderColor,
                  backgroundColor: isSelected 
                    ? styling.serviceSelectorSelectedBgColor || '#EFF6FF'
                    : styling.serviceSelectorBackgroundColor || '#FFFFFF',
                  maxWidth: `${styling.serviceSelectorWidth || 900}px`
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = styling.serviceSelectorHoverBgColor || '#F8FAFC';
                    e.currentTarget.style.borderColor = styling.serviceSelectorHoverBorderColor || '#C7D2FE';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = styling.serviceSelectorBackgroundColor || '#FFFFFF';
                    e.currentTarget.style.borderColor = styling.serviceSelectorBorderColor || '#E5E7EB';
                  }
                }}
                onClick={() => onServiceToggle(formula.id)}
              >
                <CardContent className={`${paddingClasses[styling.serviceSelectorPadding || 'lg']} p-2 sm:p-4 lg:p-6 relative`}>
                  {/* Mobile Layout: Large icon with selection indicator in top left */}
                  <div className="block md:hidden">
                    {/* Selection Indicator - Top Left */}
                    <div className="absolute top-2 left-2 z-10">
                      {isSelected ? (
                        <CheckCircle 
                          className="w-6 h-6" 
                          style={{ color: styling.primaryColor }} 
                        />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Large Icon taking 80% of space */}
                    <div className="flex flex-col items-center text-center h-full">
                      <div 
                        className="w-full aspect-square max-w-[80%] text-6xl rounded-lg flex items-center justify-center mb-2"
                        style={{ 
                          backgroundColor: isSelected ? styling.primaryColor : '#f3f4f6',
                          color: isSelected ? 'white' : styling.textColor 
                        }}
                      >
                        {getServiceIcon(formula)}
                      </div>
                      
                      {/* Large Bold Service Name */}
                      <h3 
                        className="font-black text-lg leading-tight"
                        style={{ color: styling.textColor }}
                      >
                        {formula.name}
                      </h3>
                    </div>
                  </div>

                  {/* Desktop Layout: Clean design like mobile */}
                  <div className="hidden md:block">
                    {/* Selection Indicator - Top Left */}
                    <div className="absolute top-2 left-2 z-10">
                      {isSelected ? (
                        <CheckCircle 
                          className="w-7 h-7" 
                          style={{ color: styling.primaryColor }} 
                        />
                      ) : (
                        <Circle className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Large Icon taking 80% of space */}
                    <div className="flex flex-col items-center text-center h-full">
                      <div 
                        className="w-full aspect-square max-w-[80%] text-5xl lg:text-6xl rounded-lg flex items-center justify-center mb-3"
                        style={{ 
                          backgroundColor: isSelected ? styling.primaryColor : '#f3f4f6',
                          color: isSelected ? 'white' : styling.textColor 
                        }}
                      >
                        {getServiceIcon(formula)}
                      </div>
                      
                      {/* Large Bold Service Name */}
                      <h3 
                        className="font-black text-xl lg:text-2xl leading-tight"
                        style={{ color: styling.textColor }}
                      >
                        {formula.name}
                      </h3>
                    </div>
                  </div>


                </CardContent>
              </Card>
            );
          })}

          {/* Add New Service Card */}
          <Card 
            className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-dashed border-gray-300 hover:border-gray-400"
            style={{
              borderRadius: `${styling.containerBorderRadius || 8}px`,
            }}
            onClick={() => setShowAddDialog(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-gray-400 mb-4"
                style={{ backgroundColor: '#f3f4f6' }}
              >
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-gray-600 mb-2">Add New Service</h3>
              <p className="text-sm text-gray-500">
                Create a new pricing calculator
              </p>
            </CardContent>
          </Card>
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
                      <span>{getServiceIcon(formula)}</span>
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
            <Button 
              style={{ backgroundColor: styling.primaryColor }}
              className={`text-white ${styling.buttonPadding || 'px-4 py-3'}`}
              onClick={onContinue}
            >
              Configure Services ({selectedServices.length})
            </Button>
          </div>
        </Card>
      )}

      {/* Add Service Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              To add a new service, create a new formula in the Formula Builder.
            </p>
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  window.open('/formula/new', '_blank');
                  setShowAddDialog(false);
                }}
                style={{ backgroundColor: styling.primaryColor }}
                className="text-white"
              >
                Create New Formula
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}