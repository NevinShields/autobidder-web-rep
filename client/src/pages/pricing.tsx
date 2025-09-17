import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, X, Star, Calculator, Users, BarChart3, Palette, Globe, Shield, Zap, Crown } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const plans = [
    {
      name: "Starter",
      price: 49,
      yearlyPrice: 41.42, // $497/year = $41.42/month
      badge: null,
      description: "Perfect for small businesses getting started with pricing calculators",
      icon: Calculator,
      color: "blue",
      features: [
        { name: "Up to 5 pricing calculators", included: true },
        { name: "Basic customization options", included: true },
        { name: "Lead capture forms", included: true },
        { name: "Email notifications", included: true },
        { name: "Basic analytics", included: true },
        { name: "Embed codes for websites", included: true },
        { name: "24/7 email support", included: true },
        { name: "Custom branding", included: false },
        { name: "Advanced analytics", included: false },
        { name: "Team collaboration", included: false },
        { name: "API access", included: false },
        { name: "Priority support", included: false }
      ]
    },
    {
      name: "Professional",
      price: 97,
      yearlyPrice: 80.83, // $970/year = $80.83/month
      badge: "Most Popular",
      description: "Ideal for growing businesses that need advanced features and customization",
      icon: Zap,
      color: "purple",
      features: [
        { name: "Unlimited pricing calculators", included: true },
        { name: "Full customization suite", included: true },
        { name: "Advanced lead management", included: true },
        { name: "Email & SMS notifications", included: true },
        { name: "Advanced analytics & reports", included: true },
        { name: "Custom branding & styling", included: true },
        { name: "Multi-service calculators", included: true },
        { name: "Team collaboration (up to 5 users)", included: true },
        { name: "Calendar integration", included: true },
        { name: "24/7 priority support", included: true },
        { name: "API access", included: false },
        { name: "White-label solution", included: false }
      ]
    },
    {
      name: "Enterprise",
      price: 297,
      yearlyPrice: 247.50, // $2970/year = $247.50/month
      badge: "Best Value",
      description: "For large organizations requiring maximum flexibility and dedicated support",
      icon: Crown,
      color: "gold",
      features: [
        { name: "Unlimited everything", included: true },
        { name: "White-label solution", included: true },
        { name: "Full API access", included: true },
        { name: "Advanced integrations", included: true },
        { name: "Custom development", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Unlimited team members", included: true },
        { name: "Advanced security features", included: true },
        { name: "SLA guarantee", included: true },
        { name: "Training & onboarding", included: true },
        { name: "Custom reporting", included: true },
        { name: "24/7 phone support", included: true }
      ]
    }
  ];

  const getColorClasses = (color: string, isPrimary: boolean = false) => {
    if (isPrimary) {
      switch (color) {
        case "blue": return "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800";
        case "purple": return "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800";
        case "gold": return "from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700";
        default: return "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800";
      }
    }
    switch (color) {
      case "blue": return "border-blue-200 bg-blue-50";
      case "purple": return "border-purple-200 bg-purple-50";
      case "gold": return "border-yellow-200 bg-yellow-50";
      default: return "border-blue-200 bg-blue-50";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue": return "text-blue-600";
      case "purple": return "text-purple-600";
      case "gold": return "text-yellow-600";
      default: return "text-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img 
                src={autobidderLogo} 
                alt="Autobidder" 
                className="h-10 w-10"
              />
              <span className="text-xl font-bold text-gray-900">Autobidder</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
          Simple, Transparent Pricing
        </Badge>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose the Perfect Plan for Your Business
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Start capturing more leads with professional pricing calculators. 
          All plans include our core features with no setup fees.
        </p>
        
        {/* Billing Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-blue-600 flex-shrink-0"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 whitespace-nowrap">
            Save up to 20%
          </Badge>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-gray-600">
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-600 mr-2" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-600 mr-2" />
            <span>No setup fees</span>
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-600 mr-2" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isPopular = plan.badge === "Most Popular";
            
            return (
              <Card 
                key={index} 
                className={`relative p-6 ${isPopular ? 'ring-2 ring-purple-500 shadow-2xl scale-105' : 'shadow-lg'} 
                          border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-200`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={`px-4 py-1 text-sm font-medium ${
                      isPopular 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                        : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                    }`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${getColorClasses(plan.color)}`}>
                    <Icon className={`h-8 w-8 ${getIconColor(plan.color)}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${isYearly ? plan.yearlyPrice : plan.price}
                      </span>
                      <span className="text-gray-600">
                        /{isYearly ? 'month' : 'month'}
                      </span>
                    </div>
                    {isYearly && (
                      <div className="text-center mt-1">
                        <span className="text-sm text-gray-500 line-through">
                          ${plan.price}/month
                        </span>
                        <span className="text-sm text-green-600 ml-2 font-medium">
                          Save ${(plan.price * 12) - (plan.yearlyPrice * 12)}/year
                        </span>
                      </div>
                    )}
                    {isYearly && (
                      <div className="text-xs text-gray-500 text-center mt-1">
                        Billed annually (${plan.yearlyPrice * 12}/year)
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Link href="/signup">
                    <Button 
                      className={`w-full h-12 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r ${getColorClasses(plan.color, true)}`}
                    >
                      Start Free Trial
                    </Button>
                  </Link>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm">What's included:</h4>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="grid gap-8 text-left">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I change plans at any time?
                </h3>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                  and we'll prorate any billing differences.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What happens during the free trial?
                </h3>
                <p className="text-gray-600">
                  You get full access to all features of your chosen plan for 14 days. No credit card required. 
                  After the trial, you can choose to continue with a paid plan or cancel.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600">
                  We offer a 30-day money-back guarantee. If you're not satisfied with Autobidder, 
                  contact us within 30 days for a full refund.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is there a setup fee?
                </h3>
                <p className="text-gray-600">
                  No setup fees, ever. The price you see is what you pay. We believe in transparent, 
                  straightforward pricing with no hidden costs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Converting More Visitors?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Autobidder to capture leads 
            and grow their revenue.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6">
              Start Your Free Trial
            </Button>
          </Link>
          <p className="text-blue-100 text-sm mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src={autobidderLogo} 
                alt="Autobidder" 
                className="h-8 w-8 filter brightness-0 invert"
              />
              <span className="text-xl font-bold">Autobidder</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Autobidder. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}