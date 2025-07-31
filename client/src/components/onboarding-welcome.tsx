import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  Rocket, 
  Calculator, 
  Palette, 
  Users, 
  Star,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

interface OnboardingWelcomeProps {
  onStartOnboarding: () => void;
  onSkip: () => void;
}

export default function OnboardingWelcome({ onStartOnboarding, onSkip }: OnboardingWelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <img 
              src={autobidderLogo} 
              alt="Autobidder" 
              className="h-16 w-16"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Autobidder!
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Let's get you set up to create amazing pricing calculators in just a few minutes.
          </p>
          <Badge variant="secondary" className="mx-auto mt-3">
            🎉 New Account Created
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* What you'll accomplish */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Rocket className="w-5 h-5 mr-2 text-blue-500" />
              What we'll set up together:
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Business Information</h4>
                  <p className="text-sm text-gray-600">Tell us about your business</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">First Calculator</h4>
                  <p className="text-sm text-gray-600">Build your pricing tool</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Custom Design</h4>
                  <p className="text-sm text-gray-600">Match your brand</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Go Live</h4>
                  <p className="text-sm text-gray-600">Get your embed code</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <Calculator className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-1">Smart Calculators</h4>
              <p className="text-sm text-gray-600">AI-powered formulas</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <Palette className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-1">Custom Branding</h4>
              <p className="text-sm text-gray-600">Match your style</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h4 className="font-semibold mb-1">Lead Generation</h4>
              <p className="text-sm text-gray-600">Capture customers</p>
            </div>
          </div>

          {/* Social proof */}
          <div className="text-center bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-center items-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-600">
              "Autobidder helped us increase qualified leads by 300% in the first month!"
            </p>
            <p className="text-xs text-gray-500 mt-1">- Sarah K., Cleaning Business Owner</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={onStartOnboarding}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              size="lg"
            >
              <span>Start Setup</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={onSkip}
              variant="outline"
              className="flex-1 text-gray-600"
              size="lg"
            >
              Skip for now
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            ⏱️ Takes about 5 minutes • You can always come back to finish setup later
          </p>
        </CardContent>
      </Card>
    </div>
  );
}