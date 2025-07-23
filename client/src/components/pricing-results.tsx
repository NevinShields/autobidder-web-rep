import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Percent, Receipt, Calendar } from "lucide-react";
import BookingCalendar from "@/components/booking-calendar";
import type { Formula, StylingOptions } from "@shared/schema";

interface ServicePricing {
  formulaId: number;
  formulaName: string;
  variables: Record<string, any>;
  calculatedPrice: number;
  icon?: string;
}

interface PricingResultsProps {
  servicePricing: ServicePricing[];
  formulas: Formula[];
  styling: StylingOptions;
  onSubmitLead: () => void;
  isSubmitting?: boolean;
}

export default function PricingResults({
  servicePricing,
  formulas,
  styling,
  onSubmitLead,
  isSubmitting = false
}: PricingResultsProps) {
  const [showBooking, setShowBooking] = useState(false);
  const [bookedSlotId, setBookedSlotId] = useState<number | null>(null);
  const getServiceIcon = (formula: Formula) => {
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


  const subtotal = servicePricing.reduce((sum, service) => sum + (service.calculatedPrice || 0), 0);
  
  // Calculate bundle discount if applicable
  const bundleDiscount = styling.showBundleDiscount && servicePricing.length > 1 
    ? Math.round(subtotal * (styling.bundleDiscountPercent / 100))
    : 0;
  
  const discountedSubtotal = subtotal - bundleDiscount;
  
  // Calculate tax if enabled
  const taxAmount = styling.enableSalesTax 
    ? Math.round(discountedSubtotal * (styling.salesTaxRate / 100))
    : 0;
  
  const totalAmount = discountedSubtotal + taxAmount;

  const shadowClasses = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  };

  const paddingClasses = {
    'sm': 'px-3 py-2',
    'md': 'px-4 py-3',
    'lg': 'px-6 py-4'
  };

  const buttonStyles = {
    backgroundColor: styling.primaryColor,
    borderRadius: styling.buttonStyle === 'pill' ? '9999px' : 
                  styling.buttonStyle === 'square' ? '0px' : 
                  `${styling.buttonBorderRadius}px`,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mr-2" />
          <h2 className="text-lg sm:text-xl font-semibold" style={{ color: styling.textColor }}>
            Your Quote is Ready!
          </h2>
        </div>
        <p className="text-xs sm:text-sm opacity-70">
          Here's your personalized pricing breakdown
        </p>
      </div>

      {/* Individual Service Cards */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium" style={{ color: styling.textColor }}>
          Selected Services
        </h3>
        
        {servicePricing.map((service) => {
          const formula = formulas.find(f => f.id === service.formulaId);
          if (!formula) return null;

          return (
            <Card 
              key={service.formulaId}
              className={`${shadowClasses[styling.containerShadow] || 'shadow-sm'}`}
              style={{
                borderRadius: `${styling.containerBorderRadius}px`,
                backgroundColor: styling.backgroundColor,
                borderColor: styling.containerBorderColor,
              }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Service Icon */}
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-lg"
                      style={{ 
                        backgroundColor: `${styling.primaryColor}20`,
                        color: styling.primaryColor 
                      }}
                    >
                      {getServiceIcon(formula)}
                    </div>
                    
                    {/* Service Details */}
                    <div>
                      <h4 className="font-medium text-sm sm:text-base" style={{ color: styling.textColor }}>
                        {service.formulaName}
                      </h4>
                      {formula.title && (
                        <p className="text-xs sm:text-sm opacity-70">{formula.title}</p>
                      )}
                      
                      {/* Show key variables selected */}
                      <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                        {Object.entries(service.variables).slice(0, 3).map(([key, value]) => {
                          if (!value || value === '') return null;
                          const variable = formula.variables.find(v => v.id === key);
                          if (!variable) return null;
                          
                          return (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {variable.name}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                            </Badge>
                          );
                        })}
                        {Object.keys(service.variables).length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{Object.keys(service.variables).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="text-right">
                    <div className="text-base sm:text-xl font-bold" style={{ color: styling.textColor }}>
                      ${(service.calculatedPrice || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pricing Summary */}
      <Card 
        className={`${shadowClasses[styling.containerShadow] || 'shadow-md'} border-2`}
        style={{
          borderRadius: `${styling.containerBorderRadius}px`,
          backgroundColor: styling.backgroundColor,
          borderColor: styling.primaryColor + '40',
        }}
      >
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ color: styling.textColor }}>
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm sm:text-base">
            <span>Subtotal ({servicePricing.length} services)</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>

          {/* Bundle Discount */}
          {bundleDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Bundle Discount ({styling.bundleDiscountPercent}% off)
              </span>
              <span>-${bundleDiscount.toLocaleString()}</span>
            </div>
          )}

          {/* Tax */}
          {taxAmount > 0 && (
            <>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Subtotal after discount</span>
                <span>${discountedSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{styling.salesTaxLabel} ({styling.salesTaxRate}%)</span>
                <span>${taxAmount.toLocaleString()}</span>
              </div>
            </>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-base sm:text-lg font-bold pt-1 sm:pt-2" style={{ color: styling.textColor }}>
            <span>Total</span>
            <span>${totalAmount.toLocaleString()}</span>
          </div>

          {/* Savings callout */}
          {bundleDiscount > 0 && (
            <div 
              className="text-center p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium"
              style={{ 
                backgroundColor: styling.primaryColor + '10',
                color: styling.primaryColor 
              }}
            >
              You saved ${bundleDiscount.toLocaleString()} with our bundle discount! 🎉
            </div>
          )}

          {/* Accept Bid and Book Button */}
          {!showBooking ? (
            <Button
              onClick={() => setShowBooking(true)}
              disabled={isSubmitting}
              className={`w-full text-white font-medium mt-4 ${paddingClasses[styling.buttonPadding]} flex items-center justify-center gap-2`}
              style={buttonStyles}
            >
              <Calendar className="w-4 h-4" />
              Accept Bid and Book
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm sm:text-base font-semibold mb-2">Schedule Your Service</h3>
                <p className="text-xs sm:text-sm opacity-70">Select a date and time for your ${totalAmount.toLocaleString()} service</p>
              </div>
              
              <BookingCalendar 
                onBookingConfirmed={(slotId: number) => {
                  setBookedSlotId(slotId);
                  // Call the original submit function after booking
                  onSubmitLead();
                }}
              />
              
              <Button
                onClick={() => setShowBooking(false)}
                variant="outline"
                className="w-full"
              >
                Back to Quote
              </Button>
            </div>
          )}

          {!showBooking && (
            <p className="text-xs text-center opacity-60 mt-2">
              Choose your preferred date and time for service
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}