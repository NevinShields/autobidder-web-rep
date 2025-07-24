import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  UserPlus, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Star,
  Calculator,
  Palette,
  Users,
  Globe
} from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
}

interface BusinessInfo {
  businessName: string;
  industry: string;
  businessType: string;
  phone?: string;
  website?: string;
  description?: string;
}

export default function SignupFlow() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: "",
    firstName: "",
    lastName: ""
  });
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: "",
    industry: "",
    businessType: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const steps = [
    {
      step: 1,
      title: "Welcome to PriceBuilder Pro",
      description: "Join thousands of contractors who've transformed their pricing process",
      icon: Rocket
    },
    {
      step: 2, 
      title: "Create your account",
      description: "Let's start with your basic information",
      icon: UserPlus
    },
    {
      step: 3,
      title: "Tell us about your business",
      description: "Help us customize your experience",
      icon: Building2
    },
    {
      step: 4,
      title: "You're all set!",
      description: "Account created successfully - let's get started",
      icon: CheckCircle2
    }
  ];

  const industries = [
    "Construction & Home Improvement",
    "Cleaning Services", 
    "Landscaping & Lawn Care",
    "HVAC & Plumbing",
    "Electrical Services",
    "Roofing",
    "Painting",
    "Automotive",
    "Professional Services",
    "Technology",
    "Other"
  ];

  const businessTypes = [
    "Sole Proprietorship",
    "Partnership", 
    "LLC",
    "Corporation",
    "Franchise",
    "Other"
  ];

  const createAccountMutation = useMutation({
    mutationFn: async (data: { userInfo: UserInfo; businessInfo: BusinessInfo }) => {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to PriceBuilder Pro. Redirecting to your dashboard...",
      });
      setTimeout(() => {
        setLocation(`/onboarding?userId=${data.user.id}`);
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Account Creation Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep === 2) {
      // Validate user info
      if (!userInfo.email || !userInfo.firstName || !userInfo.lastName) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields to continue.",
          variant: "destructive",
        });
        return;
      }
      
      if (!userInfo.email.includes("@")) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 3) {
      // Validate business info
      if (!businessInfo.businessName || !businessInfo.industry) {
        toast({
          title: "Missing Information",
          description: "Please provide your business name and industry to continue.",
          variant: "destructive",
        });
        return;
      }

      // Create the account
      createAccountMutation.mutate({ userInfo, businessInfo });
      setCurrentStep(4);
      return;
    }

    setCurrentStep(Math.min(currentStep + 1, steps.length));
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleLoginRedirect = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={autobidderLogo} 
                alt="PriceBuilder Pro" 
                className="h-10 w-10"
              />
              <span className="text-xl font-bold text-gray-900">PriceBuilder Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                Step {currentStep} of {steps.length}
              </Badge>
              <Button 
                variant="outline" 
                onClick={handleLoginRedirect}
                className="text-sm"
              >
                Already have an account?
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((step) => (
              <div 
                key={step.step}
                className={`flex flex-col items-center ${
                  step.step <= currentStep ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step.step < currentStep 
                      ? 'bg-green-500 text-white' 
                      : step.step === currentStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.step < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.step
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-1 text-center max-w-16">
                  {step.title.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current step content */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {React.createElement(steps[currentStep - 1]?.icon, {
                className: "w-12 h-12 text-blue-500"
              })}
            </div>
            <CardTitle className="text-2xl">{steps[currentStep - 1]?.title}</CardTitle>
            <p className="text-gray-600 mt-2">{steps[currentStep - 1]?.description}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="text-center space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <Calculator className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Smart Calculators</h3>
                    <p className="text-sm text-gray-600">AI-powered pricing tools for any service</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <Palette className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Custom Branding</h3>
                    <p className="text-sm text-gray-600">Match your brand with custom styling</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Lead Generation</h3>
                    <p className="text-sm text-gray-600">Capture and manage customer inquiries</p>
                  </div>
                </div>
                
                {/* Social proof */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                  <div className="flex justify-center items-center space-x-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Join 1000+ contractors</h3>
                  <p className="opacity-90">"Increased qualified leads by 300% in the first month!"</p>
                  <p className="text-sm opacity-75 mt-1">- Sarah K., Cleaning Business Owner</p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={userInfo.firstName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={userInfo.lastName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Free Account Benefits</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Unlimited pricing calculators</li>
                    <li>• Custom branding and styling</li>
                    <li>• Lead capture and management</li>
                    <li>• Calendar booking integration</li>
                  </ul>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessInfo.businessName}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Your Business Name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry">Industry *</Label>
                    <Select
                      value={businessInfo.industry}
                      onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select
                      value={businessInfo.businessType}
                      onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, businessType: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={businessInfo.phone || ""}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={businessInfo.website || ""}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Business Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={businessInfo.description || ""}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell us about your business and the services you offer..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <div className="bg-green-50 p-8 rounded-lg">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Account Created Successfully!</h3>
                  <p className="text-gray-600 mb-4">
                    Welcome to PriceBuilder Pro, {userInfo.firstName}! We're excited to help you transform your pricing process.
                  </p>
                  
                  {createAccountMutation.isPending && (
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Setting up your account...</span>
                    </div>
                  )}
                  
                  {createAccountMutation.isSuccess && (
                    <div className="space-y-4">
                      <div className="text-green-600 font-medium">
                        ✓ Account created successfully
                      </div>
                      <p className="text-sm text-gray-500">
                        Redirecting you to complete your setup...
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">What's Next?</h3>
                  <div className="text-sm space-y-2 opacity-90">
                    <p>• Create your first pricing calculator</p>
                    <p>• Customize your brand styling</p>
                    <p>• Get your embed code</p>
                    <p>• Start capturing leads!</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || currentStep === 4}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep < 4 && (
            <Button
              onClick={handleNext}
              disabled={createAccountMutation.isPending}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600"
            >
              <span>
                {currentStep === 3 ? "Create Account" : "Next"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          
          {currentStep === 4 && createAccountMutation.isSuccess && (
            <Button
              onClick={() => setLocation("/onboarding")}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600"
            >
              <span>Continue Setup</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}