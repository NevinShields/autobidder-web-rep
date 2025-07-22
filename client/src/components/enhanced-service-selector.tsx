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
          <h2 className="text-xl font-semibold" style={{ color: styling.textColor }}>
            Choose Your Services
          </h2>
          <p className="text-sm opacity-70">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formulas.map((formula) => {
            const isSelected = selectedServices.includes(formula.id);
            
            return (
              <Card 
                key={formula.id} 
                className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 ${
                  isSelected 
                    ? 'border-current ring-2 ring-current ring-opacity-20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderRadius: `${styling.containerBorderRadius || 8}px`,
                  borderColor: isSelected ? styling.primaryColor : undefined,
                  backgroundColor: styling.backgroundColor
                }}
                onClick={() => onServiceToggle(formula.id)}
              >
                <CardContent className="p-6">
                  {/* Header with icon and selection indicator */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {/* Service Icon */}
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ 
                          backgroundColor: isSelected ? styling.primaryColor : '#f3f4f6',
                          color: isSelected ? 'white' : styling.textColor 
                        }}
                      >
                        {getServiceIcon(formula)}
                      </div>
                      
                      {/* Selection Indicator */}
                      <div>
                        {isSelected ? (
                          <CheckCircle 
                            className="w-6 h-6" 
                            style={{ color: styling.primaryColor }} 
                          />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="space-y-2">
                    <h3 
                      className="font-semibold text-lg leading-tight"
                      style={{ color: styling.textColor }}
                    >
                      {formula.name}
                    </h3>
                    
                    {formula.title && (
                      <p className="text-sm opacity-70 line-clamp-2">
                        {formula.title}
                      </p>
                    )}

                    <p className="text-xs opacity-60">
                      {getServiceDescription(formula)}
                    </p>
                  </div>

                  {/* Service Features */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formula.variables.length} options</span>
                      <span>Interactive calculator</span>
                    </div>
                  </div>

                  {/* Action on hover */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      style={{ color: styling.primaryColor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onServiceEdit) {
                          onServiceEdit(formula.id);
                        }
                      }}
                    >
                      Configure
                    </Button>
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