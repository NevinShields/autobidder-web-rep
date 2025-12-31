import { Check } from "lucide-react";
import { Formula, StylingOptions } from "@shared/schema";
import { useState } from "react";

interface ServiceCardDisplayProps {
  selectedServices: { formula: Formula; calculatedPrice: number; variables: Record<string, any> }[];
  styling: StylingOptions;
  showPricing: boolean;
  hasCustomCSS?: boolean;
}

// Component to handle image loading with fallback
function ServiceIcon({ iconUrl, altText, className, hasCustomCSS = false }: { iconUrl: string; altText: string; className: string; hasCustomCSS?: boolean }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <span className="ab-pricing-card-icon text-3xl text-white">⚙️</span>;
  }

  return (
    <img 
      src={iconUrl} 
      alt={altText} 
      className={`ab-pricing-card-icon ${hasCustomCSS ? '' : className}`}
      onError={() => setHasError(true)}
    />
  );
}

export default function ServiceCardDisplay({
  selectedServices,
  styling,
  showPricing,
  hasCustomCSS = false
}: ServiceCardDisplayProps) {
  const shadowClasses = {
    'none': '',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl'
  };

  const getServiceIcon = (formula: Formula) => {
    const imageSource = formula.iconUrl || formula.imageUrl;
    
    if (imageSource) {
      // Check if it's an emoji (single character or unicode emoji)
      if (imageSource.length <= 4) {
        return { type: 'emoji' as const, content: imageSource };
      } else {
        // It's a URL - return as image
        return { 
          type: 'image' as const, 
          content: (
            <ServiceIcon 
              iconUrl={imageSource} 
              altText={formula.name} 
              className="w-12 h-12 object-cover rounded-lg"
              hasCustomCSS={hasCustomCSS}
            />
          )
        };
      }
    }
    
    // Default icons based on service name
    const name = formula.name.toLowerCase();
    let emoji = '⚙️';
    if (name.includes('kitchen') || name.includes('remodel')) emoji = '🏠';
    else if (name.includes('wash') || name.includes('clean')) emoji = '🧽';
    else if (name.includes('paint')) emoji = '🎨';
    else if (name.includes('landscape') || name.includes('garden')) emoji = '🌿';
    else if (name.includes('roof')) emoji = '🏘️';
    else if (name.includes('plumb')) emoji = '🔧';
    else if (name.includes('electric')) emoji = '⚡';
    else if (name.includes('hvac') || name.includes('air')) emoji = '❄️';
    else if (name.includes('deck')) emoji = '🪚';
    else if (name.includes('flooring') || name.includes('floor')) emoji = '🏗️';
    
    return { type: 'emoji' as const, content: emoji };
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

  // Get text alignment classes
  const getTextAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'text-left';
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const textAlignmentClass = getTextAlignmentClass(styling.pricingTextAlignment || 'left');

  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className={textAlignmentClass}>
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
            className={`ab-pricing-card pricing-card relative ${shadowClasses[styling.pricingCardShadow] || 'shadow-lg'} transition-all duration-300 hover:shadow-xl hover:scale-105 group`}
            style={hasCustomCSS ? {} : {
              borderRadius: `${styling.pricingCardBorderRadius || 12}px`,
              backgroundColor: styling.pricingCardBackgroundColor || '#FFFFFF',
              borderWidth: (styling.pricingCardBorderWidth || 0) > 0 ? `${styling.pricingCardBorderWidth}px` : 0,
              borderColor: styling.pricingCardBorderColor || '#E5E7EB',
              borderStyle: 'solid',
              width: styling.pricingCardWidth || 'auto',
              minHeight: styling.pricingCardHeight ? `${styling.pricingCardHeight}px` : 'auto',
              margin: styling.pricingCardMargin ? `${styling.pricingCardMargin}px` : undefined
            }}
          >
            {/* Card Header with Icon and Price */}
            <div 
              className={`relative ${textAlignmentClass}`}
              style={{
                background: `linear-gradient(135deg, ${styling.pricingAccentColor}15 0%, ${styling.pricingAccentColor}05 100%)`,
                borderTopLeftRadius: `${styling.pricingCardBorderRadius || 12}px`,
                borderTopRightRadius: `${styling.pricingCardBorderRadius || 12}px`,
                padding: styling.pricingCardPadding ? `${styling.pricingCardPadding}px` : '24px'
              }}
            >
              {/* Service Icon */}
              {styling.pricingIconVisible !== false && (() => {
                const iconData = getServiceIcon(service.formula);
                return (
                  <div className={`flex ${styling.pricingTextAlignment === 'left' ? 'justify-start' : styling.pricingTextAlignment === 'right' ? 'justify-end' : 'justify-center'} mb-4`}>
                    <div 
                      className="flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                      style={hasCustomCSS ? {} : {
                        backgroundColor: styling.pricingAccentColor,
                        width: '80px',
                        height: '80px',
                        boxShadow: `0 8px 25px ${styling.pricingAccentColor}30`
                      }}
                    >
                      {iconData.type === 'emoji' ? (
                        <span className={`ab-pricing-card-icon ${hasCustomCSS ? '' : 'text-3xl text-white'}`}>{iconData.content}</span>
                      ) : (
                        <div className="text-white text-3xl">
                          {iconData.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Service Title */}
              <h4 className="ab-pricing-card-title text-xl font-bold mb-2" style={hasCustomCSS ? {} : { color: styling.pricingTextColor }}>
                {service.formula.name}
              </h4>
              
              {/* Service Subtitle */}
              {service.formula.title && (
                <p className="ab-pricing-card-description text-sm opacity-75 mb-4" style={hasCustomCSS ? {} : { color: styling.pricingTextColor }}>
                  {service.formula.title}
                </p>
              )}

              {/* Price Badge */}
              {showPricing && (
                <div className={`${styling.pricingTextAlignment === 'left' ? 'flex justify-start' : styling.pricingTextAlignment === 'right' ? 'flex justify-end' : 'inline-flex items-center justify-center'}`}>
                  <div 
                    className="ab-pricing-card-price px-6 py-3 rounded-full font-bold text-white text-2xl shadow-lg"
                    style={hasCustomCSS ? {} : { 
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
            <div style={{ padding: styling.pricingCardPadding ? `${styling.pricingCardPadding}px` : '24px' }}>
              {/* Service Description */}
              <p className={`ab-pricing-card-description text-sm opacity-80 mb-6 leading-relaxed ${textAlignmentClass}`} style={hasCustomCSS ? {} : { color: styling.pricingTextColor }}>
                {getServiceDescription(service.formula)}
              </p>

              {/* Features List */}
              <div>
                <div className="space-y-3">
                  {getServiceBenefits(service.formula).map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center gap-3">
                      <div 
                        className="ab-pricing-card-bullet-icon flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={hasCustomCSS ? {} : { backgroundColor: styling.pricingAccentColor }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="ab-pricing-card-bullet-text text-sm font-medium" style={hasCustomCSS ? {} : { color: styling.pricingTextColor }}>
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