import { Check } from "lucide-react";
import { Formula, StylingOptions } from "@shared/schema";

interface ServiceCardDisplayProps {
  selectedServices: { formula: Formula; calculatedPrice: number; variables: Record<string, any> }[];
  styling: StylingOptions;
  showPricing: boolean;
}

export default function ServiceCardDisplay({
  selectedServices,
  styling,
  showPricing
}: ServiceCardDisplayProps) {
  const shadowClasses = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  };

  const getServiceIcon = (formula: Formula) => {
    if (formula.iconUrl) {
      // Check if it's an emoji (single character or unicode emoji)
      if (formula.iconUrl.length <= 4) {
        return formula.iconUrl;
      } else {
        // It's a URL - return as image
        return (
          <img 
            src={formula.iconUrl} 
            alt={formula.name} 
            className="w-12 h-12 object-cover rounded-lg"
          />
        );
      }
    }
    
    // Default icons based on service name
    const name = formula.name.toLowerCase();
    if (name.includes('kitchen') || name.includes('remodel')) return '🏠';
    if (name.includes('wash') || name.includes('clean')) return '🧽';
    if (name.includes('paint')) return '🎨';
    if (name.includes('landscape') || name.includes('garden')) return '🌿';
    if (name.includes('roof')) return '🏘️';
    if (name.includes('plumb')) return '🔧';
    if (name.includes('electric')) return '⚡';
    if (name.includes('hvac') || name.includes('air')) return '❄️';
    if (name.includes('deck')) return '🪚';
    if (name.includes('flooring') || name.includes('floor')) return '🏗️';
    return '⚙️';
  };

  const getServiceDescription = (formula: Formula) => {
    // Use custom description if provided
    if (formula.description && formula.description.trim()) {
      return formula.description;
    }
    
    // Fall back to auto-generated descriptions based on service name
    const name = formula.name.toLowerCase();
    if (name.includes('kitchen')) {
      return "Complete kitchen renovation including cabinets, countertops, appliances, and finishes to transform your space.";
    }
    if (name.includes('bathroom')) {
      return "Full bathroom remodeling with modern fixtures, tiling, vanities, and plumbing upgrades.";
    }
    if (name.includes('wash') || name.includes('clean')) {
      return "Professional exterior cleaning service to restore your property's curb appeal and protect surfaces.";
    }
    if (name.includes('paint')) {
      return "High-quality interior and exterior painting with premium materials and expert craftsmanship.";
    }
    if (name.includes('landscape')) {
      return "Comprehensive landscaping design and installation to enhance your outdoor living space.";
    }
    if (name.includes('roof')) {
      return "Professional roofing services including repairs, replacements, and maintenance to protect your home.";
    }
    if (name.includes('deck')) {
      return "Custom deck construction with quality materials and professional installation for outdoor enjoyment.";
    }
    if (name.includes('flooring')) {
      return "Expert flooring installation with a variety of materials to suit your style and budget.";
    }
    if (name.includes('hvac')) {
      return "Complete HVAC services including installation, repair, and maintenance for year-round comfort.";
    }
    if (name.includes('electric')) {
      return "Licensed electrical work including installations, upgrades, and safety inspections.";
    }
    if (name.includes('plumb')) {
      return "Professional plumbing services for installations, repairs, and system upgrades.";
    }
    
    return `Professional ${formula.name.toLowerCase()} services delivered by experienced contractors with quality materials.`;
  };

  const getServiceBenefits = (formula: Formula) => {
    // Use custom bullet points if provided
    if (formula.bulletPoints && formula.bulletPoints.length > 0) {
      return formula.bulletPoints;
    }
    
    // Fall back to auto-generated benefits based on service name
    const name = formula.name.toLowerCase();
    
    if (name.includes('kitchen')) {
      return [
        "Increased home value",
        "Modern appliances & fixtures",
        "Custom storage solutions",
        "Professional design consultation"
      ];
    }
    if (name.includes('bathroom')) {
      return [
        "Updated plumbing & fixtures",
        "Water-efficient installations",
        "Custom tile work",
        "ADA compliant options"
      ];
    }
    if (name.includes('wash') || name.includes('clean')) {
      return [
        "Eco-friendly cleaning solutions",
        "Pressure washing equipment",
        "Mold & mildew removal",
        "Surface protection treatment"
      ];
    }
    if (name.includes('paint')) {
      return [
        "Premium paint & primer",
        "Color consultation included",
        "Surface preparation",
        "Clean-up & protection"
      ];
    }
    if (name.includes('landscape')) {
      return [
        "Native plant selection",
        "Irrigation system design",
        "Seasonal maintenance plan",
        "Hardscape integration"
      ];
    }
    if (name.includes('roof')) {
      return [
        "Weather-resistant materials",
        "Warranty coverage",
        "Storm damage assessment",
        "Gutter integration"
      ];
    }
    if (name.includes('deck')) {
      return [
        "Treated lumber construction",
        "Custom railings & features",
        "Building code compliance",
        "Structural engineering"
      ];
    }
    if (name.includes('flooring')) {
      return [
        "Subfloor inspection & prep",
        "Moisture barrier installation",
        "Trim & transition work",
        "Furniture protection"
      ];
    }
    if (name.includes('hvac')) {
      return [
        "Energy-efficient systems",
        "Indoor air quality improvement",
        "Ductwork optimization",
        "Smart thermostat integration"
      ];
    }
    if (name.includes('electric')) {
      return [
        "Licensed & insured work",
        "Code compliance guaranteed",
        "Safety inspections included",
        "Surge protection options"
      ];
    }
    if (name.includes('plumb')) {
      return [
        "Quality fixtures & fittings",
        "Water pressure optimization",
        "Leak detection & repair",
        "Emergency service available"
      ];
    }
    
    return [
      "Professional installation",
      "Quality materials used",
      "Licensed & insured",
      "Satisfaction guaranteed"
    ];
  };

  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-semibold mb-2" style={{ color: styling.pricingTextColor }}>
          Selected Services
        </h3>
        <p className="text-sm opacity-70" style={{ color: styling.pricingTextColor }}>
          Here are the services you've chosen for your project
        </p>
      </div>
      
      <div className={`grid gap-4 sm:gap-6 ${selectedServices.length === 1 ? 'grid-cols-1' : selectedServices.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {selectedServices.map((service, index) => (
          <div
            key={service.formula.id}
            className={`relative ${shadowClasses[styling.pricingCardShadow] || 'shadow-lg'} transition-all duration-200`}
            style={{
              borderRadius: `${styling.pricingCardBorderRadius}px`,
              backgroundColor: styling.pricingCardBackgroundColor,
              borderWidth: styling.pricingCardBorderWidth > 0 ? `${styling.pricingCardBorderWidth}px` : 0,
              borderColor: styling.pricingCardBorderColor,
              borderStyle: 'solid'
            }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Service Icon */}
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div 
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: styling.pricingAccentColor + '20',
                      width: '50px',
                      height: '50px'
                    }}
                  >
                    {typeof getServiceIcon(service.formula) === 'string' ? (
                      <span className="text-2xl sm:text-3xl">{getServiceIcon(service.formula)}</span>
                    ) : (
                      getServiceIcon(service.formula)
                    )}
                  </div>
                </div>

                {/* Service Content */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2 sm:gap-0">
                    <div className="flex-1">
                      <h4 className="text-lg sm:text-xl font-semibold" style={{ color: styling.pricingTextColor }}>
                        {service.formula.name}
                      </h4>
                      <p className="text-base sm:text-lg font-medium opacity-80" style={{ color: styling.pricingTextColor }}>
                        {service.formula.title}  
                      </p>
                    </div>
                    {showPricing && (
                      <div className="text-center sm:text-right">
                        <div 
                          className="text-xl sm:text-2xl font-bold"
                          style={{ color: styling.pricingAccentColor }}
                        >
                          {service.calculatedPrice !== undefined && service.calculatedPrice !== null && !isNaN(service.calculatedPrice) 
                            ? `$${service.calculatedPrice.toLocaleString()}` 
                            : "$0"
                          }
                        </div>
                        <div className="text-xs sm:text-sm opacity-60" style={{ color: styling.pricingTextColor }}>
                          Service #{index + 1}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Description */}
                  <p className="text-sm sm:text-base opacity-80 mb-4 leading-relaxed" style={{ color: styling.pricingTextColor }}>
                    {getServiceDescription(service.formula)}
                  </p>

                  {/* Benefits Checklist */}
                  <div>
                    <h5 className="text-sm font-medium mb-3 opacity-90" style={{ color: styling.pricingTextColor }}>
                      What's Included:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getServiceBenefits(service.formula).map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-start gap-2">
                          <Check 
                            className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" 
                            style={{ color: styling.pricingAccentColor }} 
                          />
                          <span className="text-xs sm:text-sm opacity-80 leading-relaxed" style={{ color: styling.pricingTextColor }}>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}