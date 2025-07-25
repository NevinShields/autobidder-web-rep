import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
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
      title: "Choose your plan",
      description: "Select the perfect plan for your business needs",
      icon: Star
    },
    {
      step: 5,
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
      // Transform data to match server API expectations
      const payload = {
        email: data.userInfo.email,
        firstName: data.userInfo.firstName,
        lastName: data.userInfo.lastName,
        businessInfo: data.businessInfo,
        planId: 'starter'
      };
      
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to PriceBuilder Pro. Now let's select your plan...",
      });
      setCreatedUserId(data.user.id);
      setTimeout(() => {
        setCurrentStep(4);
      }, 1500);
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
      return;
    }

    if (currentStep === 4) {
      // Handle plan selection and checkout
      handleCheckout();
      return;
    }

    if (currentStep === 5) {
      // Complete setup and redirect to dashboard
      setLocation("/onboarding");
      return;
    }

    setCurrentStep(Math.min(currentStep + 1, steps.length));
  };

  const handleCheckout = async () => {
    if (!createdUserId || !userInfo.email) {
      toast({
        title: "Error", 
        description: "User information missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          planId: selectedPlan,
          billingPeriod: 'monthly',
          userEmail: userInfo.email,
          userId: createdUserId
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: "Failed to start payment process. Please try again.",
        variant: "destructive",
      });
    }
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
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Choose Your Plan</h3>
                  <p className="text-gray-600">Select the perfect plan to grow your business</p>
                </div>

                <div className="grid gap-6">
                  {/* Starter Plan */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPlan === 'starter' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedPlan('starter')}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Starter</CardTitle>
                          <CardDescription>Perfect for small businesses</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$49</div>
                          <div className="text-sm text-gray-500">/month</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />5 pricing calculators</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />500 leads per month</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Basic customization</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Email support</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Professional Plan */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg relative ${
                      selectedPlan === 'professional' ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedPlan('professional')}
                  >
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                      Most Popular
                    </Badge>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Professional</CardTitle>
                          <CardDescription>Best for growing businesses</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$97</div>
                          <div className="text-sm text-gray-500">/month</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />25 pricing calculators</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />2,500 leads per month</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Advanced customization</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Calendar integration</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Priority support</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Enterprise Plan */}
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedPlan === 'enterprise' ? 'ring-2 ring-yellow-500' : ''
                    }`}
                    onClick={() => setSelectedPlan('enterprise')}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Enterprise</CardTitle>
                          <CardDescription>For large organizations</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$297</div>
                          <div className="text-sm text-gray-500">/month</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Unlimited calculators</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Unlimited leads</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />White-label branding</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Team collaboration</li>
                        <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Dedicated support</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center text-sm text-gray-500">
                  14-day free trial • Cancel anytime • No setup fees
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="text-center space-y-6">
                <div className="bg-green-50 p-8 rounded-lg">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to PriceBuilder Pro!</h3>
                  <p className="text-gray-600 mb-4">
                    Your account is ready and your subscription is active. Let's start building!
                  </p>
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
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={createAccountMutation.isPending || (currentStep === 5)}
            className="px-8 bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === 3 
              ? (createAccountMutation.isPending ? "Creating Account..." : "Create Account")
              : currentStep === 4 
                ? "Subscribe & Continue" 
                : currentStep === 5
                ? "Complete Setup"
                : "Continue"
            }
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}