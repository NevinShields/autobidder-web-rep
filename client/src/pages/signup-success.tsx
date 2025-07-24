import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Rocket, ArrowRight } from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function SignupSuccess() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Auto-redirect to onboarding after 5 seconds
    const timer = setTimeout(() => {
      setLocation("/onboarding");
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleContinue = () => {
    setLocation("/onboarding");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <img 
                src={autobidderLogo} 
                alt="PriceBuilder Pro" 
                className="h-10 w-10"
              />
              <span className="text-xl font-bold text-gray-900">PriceBuilder Pro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome to PriceBuilder Pro!
                </h1>
                <p className="text-lg text-gray-600">
                  Your payment was successful and your account is now active.
                </p>
              </div>

              {/* Features Preview */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">You now have access to:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p>✓ Unlimited pricing calculators</p>
                    <p>✓ Custom branding & styling</p>
                    <p>✓ Lead capture & management</p>
                  </div>
                  <div className="space-y-2">
                    <p>✓ Calendar booking integration</p>
                    <p>✓ Analytics & reporting</p>
                    <p>✓ Priority customer support</p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">What's Next?</h3>
                <div className="text-left space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                    <span className="text-gray-700">Complete your business setup</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                    <span className="text-gray-700">Create your first pricing calculator</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">3</div>
                    <span className="text-gray-700">Customize your brand styling</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">4</div>
                    <span className="text-gray-700">Get your embed code and start capturing leads</span>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleContinue}
                className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg font-semibold"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Continue to Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-sm text-gray-500">
                Redirecting automatically in 5 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}