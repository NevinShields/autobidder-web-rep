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
  businessOwnerId?: string;
  leadId?: number;
}

export default function PricingResults({
  servicePricing,
  formulas,
  styling,
  onSubmitLead,
  isSubmitting = false,
  businessOwnerId,
  leadId
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

  const getShadowValue = (shadow: string) => {
    const shadowClasses = {
      'none': '',
      'sm': 'shadow-sm',
      'md': 'shadow-md', 
      'lg': 'shadow-lg',
      'xl': 'shadow-xl'
    };
    return shadowClasses[shadow as keyof typeof shadowClasses] || '';
  };

  const pricingCardStyle = {
    borderRadius: `${styling.pricingCardBorderRadius || 12}px`,
    borderWidth: `${styling.pricingCardBorderWidth || 0}px`,
    borderColor: styling.pricingCardBorderColor || '#E5E7EB',
    backgroundColor: styling.pricingCardBackgroundColor || '#FFFFFF',
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

      {/* Individual Service Cards - Subscription Style */}
      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8" style={{ color: styling.textColor }}>
          Your Service Packages
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {servicePricing.map((service) => {
            const formula = formulas.find(f => f.id === service.formulaId);
            if (!formula) return null;

            // Get service variables for features list
            const serviceFeatures = Object.entries(service.variables)
              .filter(([key, value]) => {
                if (!value || value === '') return false;
                const variable = formula.variables.find(v => v.id === key);
                return variable && variable.type !== 'text'; // Exclude basic text inputs
              })
              .map(([key, value]) => {
                const variable = formula.variables.find(v => v.id === key);
                if (!variable) return null;
                
                let displayValue = value;
                if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else if (variable.type === 'multiple-choice' || variable.type === 'dropdown') {
                  const option = variable.options?.find(opt => opt.value === value);
                  if (option) displayValue = option.label;
                }
                
                return {
                  name: variable.name,
                  value: displayValue
                };
              })
              .filter(Boolean);

            return (
              <Card 
                key={service.formulaId}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${getShadowValue(styling.pricingCardShadow || 'xl')}`}
                style={{
                  ...pricingCardStyle,
                  borderRadius: '16px',
                  backgroundColor: styling.pricingCardBackgroundColor || '#FFFFFF',
                  borderWidth: '1px',
                  borderColor: styling.pricingCardBorderColor || '#E5E7EB'
                }}
              >
                {/* Header with service name and standard badge */}
                <CardHeader className="text-center pb-4 relative">
                  <div className="absolute top-4 right-4">
                    <Badge 
                      className="text-xs font-medium px-3 py-1"
                      style={{
                        backgroundColor: styling.primaryColor,
                        color: '#FFFFFF',
                        borderRadius: '20px'
                      }}
                    >
                      Standard
                    </Badge>
                  </div>
                  
                  <div className="mt-2">
                    <h4 className="text-lg sm:text-xl font-bold mb-1" style={{ color: styling.textColor }}>
                      {service.formulaName}
                    </h4>
                    {formula.title && (
                      <p className="text-sm text-gray-600 mb-3">{formula.title}</p>
                    )}
                    
                    {/* Price Display */}
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span 
                          className="text-4xl sm:text-5xl font-bold"
                          style={{ color: styling.textColor }}
                        >
                          ${(service.calculatedPrice || 0).toLocaleString()}
                        </span>
                        <span className="text-lg text-gray-500 ml-1">total</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Based on your selections
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    <p className="text-sm font-semibold text-gray-700">
                      What's included:
                    </p>
                    
                    {serviceFeatures.length > 0 ? (
                      <ul className="space-y-2">
                        {serviceFeatures.slice(0, 6).map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">
                              <span className="font-medium">{feature.name}:</span> {feature.value}
                            </span>
                          </li>
                        ))}
                        
                        {/* Standard service features */}
                        <li className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Professional service</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Quality guarantee</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Free consultation</span>
                        </li>
                      </ul>
                    ) : (
                      <ul className="space-y-2">
                        <li className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Professional {formula.name.toLowerCase()} service</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Quality materials and workmanship</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Free consultation</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">Satisfaction guarantee</span>
                        </li>
                      </ul>
                    )}
                  </div>

                  {/* Service Details Button */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    style={{
                      borderColor: styling.primaryColor,
                      color: styling.primaryColor,
                      borderRadius: `${styling.buttonBorderRadius || 8}px`
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pricing Summary */}
      <Card 
        className={`${getShadowValue(styling.pricingCardShadow || 'lg')} border-2`}
        style={{
          ...pricingCardStyle,
          borderColor: styling.pricingAccentColor || styling.primaryColor,
          borderWidth: '2px',
        }}
      >
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ color: styling.pricingTextColor || styling.textColor }}>
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
          <div className="flex justify-between text-base sm:text-lg font-bold pt-1 sm:pt-2">
            <span style={{ color: styling.pricingTextColor || styling.textColor }}>Total</span>
            <span style={{ color: styling.pricingAccentColor || styling.primaryColor }}>
              ${totalAmount.toLocaleString()}
            </span>
          </div>

          {/* Disclaimer */}
          {styling.enableDisclaimer && styling.disclaimerText && (
            <div className="text-center mt-2 mb-2">
              <p className="text-xs text-gray-500 italic">
                {styling.disclaimerText}
              </p>
            </div>
          )}

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
              className={`w-full text-white font-semibold mt-6 py-4 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg`}
              style={{
                ...buttonStyles,
                background: `linear-gradient(135deg, ${styling.primaryColor}, ${styling.primaryColor}dd)`,
                fontSize: '16px'
              }}
            >
              <Calendar className="w-5 h-5" />
              Accept Quote & Book Service
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
                businessOwnerId={businessOwnerId}
                leadId={leadId}
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