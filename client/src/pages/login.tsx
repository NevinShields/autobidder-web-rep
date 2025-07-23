import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Shield, Users, Calculator } from "lucide-react";
import { Link } from "wouter";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={autobidderLogo} 
              alt="PriceBuilder Pro" 
              className="h-16 w-16"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your pricing calculators</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl font-semibold">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Login Button */}
            <Button 
              onClick={handleLogin}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Continue with Replit
            </Button>

            {/* Features */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 text-center mb-4">What you'll get access to:</p>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700">
                  <Calculator className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
                  <span>Create unlimited pricing calculators</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Users className="h-4 w-4 mr-3 text-purple-600 flex-shrink-0" />
                  <span>Manage leads and customer inquiries</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Shield className="h-4 w-4 mr-3 text-green-600 flex-shrink-0" />
                  <span>Secure team collaboration tools</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            New to PriceBuilder Pro?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}