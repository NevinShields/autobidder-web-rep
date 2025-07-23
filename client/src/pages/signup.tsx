import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, Calculator, Users, BarChart3, Palette, Globe, Shield } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function Signup() {
  const handleSignup = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: Calculator,
      title: "Unlimited Calculators",
      description: "Create pricing calculators for any service type"
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "Customize colors, fonts, and styling to match your brand"
    },
    {
      icon: Globe,
      title: "Easy Integration",
      description: "Embed calculators on any website with simple iframe codes"
    },
    {
      icon: Users,
      title: "Lead Management",
      description: "Capture and organize customer inquiries automatically"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Track performance and optimize your pricing strategies"
    },
    {
      icon: Shield,
      title: "Team Collaboration",
      description: "Invite team members with role-based permissions"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <img 
                src={autobidderLogo} 
                alt="PriceBuilder Pro" 
                className="h-12 w-12"
              />
              <span className="text-2xl font-bold text-gray-900">PriceBuilder Pro</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <div className="space-y-8">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
                Professional Pricing Platform
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Create Professional Pricing Calculators in Minutes
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Build interactive pricing tools that capture leads and grow your business. 
                No coding required.
              </p>
            </div>

            <div className="grid gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Get Started Free
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Start building professional pricing calculators today
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Signup Button */}
                  <Button 
                    onClick={handleSignup}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Create Account with Replit
                  </Button>

                  {/* What's included */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-900 text-center mb-4">
                      ✨ What's included:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 mr-3 text-green-600 flex-shrink-0" />
                        <span>Unlimited pricing calculators</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 mr-3 text-green-600 flex-shrink-0" />
                        <span>Lead capture & management</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 mr-3 text-green-600 flex-shrink-0" />
                        <span>Custom branding & styling</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 mr-3 text-green-600 flex-shrink-0" />
                        <span>Website embed codes</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 mr-3 text-green-600 flex-shrink-0" />
                        <span>Analytics & insights</span>
                      </div>
                    </div>
                  </div>

                  {/* Login Link */}
                  <div className="pt-4 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trust indicators */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 mb-2">Trusted by contractors and service businesses</p>
                <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
                  <span>🔒 Secure</span>
                  <span>⚡ Fast Setup</span>
                  <span>📱 Mobile Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}