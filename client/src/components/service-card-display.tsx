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
      
      <div className={`grid gap-6 ${selectedServices.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : selectedServices.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {selectedServices.map((service, index) => (
          <div
            key={service.formula.id}
            className={`relative ${shadowClasses[styling.pricingCardShadow] || 'shadow-lg'} transition-all duration-300 hover:shadow-xl hover:scale-105 group`}
            style={{
              borderRadius: `${styling.pricingCardBorderRadius}px`,
              backgroundColor: styling.pricingCardBackgroundColor,
              borderWidth: styling.pricingCardBorderWidth > 0 ? `${styling.pricingCardBorderWidth}px` : 0,
              borderColor: styling.pricingCardBorderColor,
              borderStyle: 'solid'
            }}
          >
            {/* Card Header with Icon and Price */}
            <div 
              className="relative p-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${styling.pricingAccentColor}15 0%, ${styling.pricingAccentColor}05 100%)`,
                borderTopLeftRadius: `${styling.pricingCardBorderRadius}px`,
                borderTopRightRadius: `${styling.pricingCardBorderRadius}px`
              }}
            >
              {/* Service Icon */}
              <div className="flex justify-center mb-4">
                <div 
                  className="flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: styling.pricingAccentColor,
                    width: '80px',
                    height: '80px',
                    boxShadow: `0 8px 25px ${styling.pricingAccentColor}30`
                  }}
                >
                  {typeof getServiceIcon(service.formula) === 'string' ? (
                    <span className="text-3xl text-white">{getServiceIcon(service.formula)}</span>
                  ) : (
                    <div className="text-white text-3xl">
                      {getServiceIcon(service.formula)}
                    </div>
                  )}
                </div>
              </div>

              {/* Service Title */}
              <h4 className="text-xl font-bold mb-2" style={{ color: styling.pricingTextColor }}>
                {service.formula.name}
              </h4>
              
              {/* Service Subtitle */}
              {service.formula.title && (
                <p className="text-sm opacity-75 mb-4" style={{ color: styling.pricingTextColor }}>
                  {service.formula.title}
                </p>
              )}

              {/* Price Badge */}
              {showPricing && (
                <div className="inline-flex items-center justify-center">
                  <div 
                    className="px-6 py-3 rounded-full font-bold text-white text-2xl shadow-lg"
                    style={{ 
                      backgroundColor: styling.pricingAccentColor,
                      boxShadow: `0 4px 15px ${styling.pricingAccentColor}40`
                    }}
                  >
                    {service.calculatedPrice !== undefined && service.calculatedPrice !== null && !isNaN(service.calculatedPrice) 
                      ? `$${service.calculatedPrice.toLocaleString()}` 
                      : "$0"
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Service Description */}
              <p className="text-sm opacity-80 mb-6 leading-relaxed text-center" style={{ color: styling.pricingTextColor }}>
                {getServiceDescription(service.formula)}
              </p>

              {/* Features List */}
              <div>
                <h5 className="text-sm font-semibold mb-4 text-center" style={{ color: styling.pricingTextColor }}>
                  ✨ What's Included
                </h5>
                <div className="space-y-3">
                  {getServiceBenefits(service.formula).map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center gap-3">
                      <div 
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: styling.pricingAccentColor }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium" style={{ color: styling.pricingTextColor }}>
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Number Badge */}
            <div 
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: styling.pricingAccentColor }}
            >
              #{index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}