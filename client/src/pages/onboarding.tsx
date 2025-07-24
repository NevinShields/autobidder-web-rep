import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building, 
  Calculator, 
  Palette, 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Rocket,
  Users,
  Target
} from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

interface BusinessInfo {
  businessName?: string;
  businessType?: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  description?: string;
  servicesOffered?: string[];
  targetMarket?: string;
  yearsInBusiness?: number;
}

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID - in production this would come from authentication
  const userId = "user1";

  const { data: progress, isLoading } = useQuery({
    queryKey: [`/api/onboarding/${userId}`],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/profile"],
  }) as { data: any };

  const updateStepMutation = useMutation({
    mutationFn: async ({ step, businessInfo }: { step: number; businessInfo?: BusinessInfo }) => {
      return await apiRequest(`/api/onboarding/${userId}/step`, "PATCH", { step, businessInfo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/onboarding/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error) => {
      console.error("Failed to update onboarding step:", error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest(`/api/onboarding/${userId}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/onboarding/${userId}`] });
    },
    onError: (error) => {
      console.error("Failed to update onboarding progress:", error);
    },
  });

  useEffect(() => {
    if (progress && user) {
      setCurrentStep(user.onboardingStep || 1);
      if (user.businessInfo) {
        setBusinessInfo(user.businessInfo);
      }
    }
  }, [progress, user]);

  const steps: OnboardingStep[] = [
    {
      step: 1,
      title: "Welcome to PriceBuilder Pro",
      description: "Let's get you set up with everything you need to start creating pricing calculators",
      icon: Rocket,
      completed: (user?.onboardingStep || 1) > 1
    },
    {
      step: 2,
      title: "Tell us about your business",
      description: "Help us customize your experience by sharing some details about your business",
      icon: Building,
      completed: (user?.onboardingStep || 1) > 2
    },
    {
      step: 3,
      title: "Create your first calculator",
      description: "Build a pricing calculator for one of your services",
      icon: Calculator,
      completed: (progress as any)?.firstCalculatorCreated || false
    },
    {
      step: 4,
      title: "Customize your design",
      description: "Make your calculators match your brand with custom styling",
      icon: Palette,
      completed: (progress as any)?.designCustomized || false
    },
    {
      step: 5,
      title: "Get your embed code",
      description: "Add your calculator to your website and start collecting leads",
      icon: Globe,
      completed: (progress as any)?.embedCodeGenerated || false
    }
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleNext = async () => {
    if (currentStep === 2) {
      // Validate business info
      if (!businessInfo.businessName || !businessInfo.industry) {
        toast({
          title: "Missing Information",
          description: "Please provide your business name and industry to continue.",
          variant: "destructive",
        });
        return;
      }
    }

    const nextStep = Math.min(currentStep + 1, steps.length);
    
    try {
      await updateStepMutation.mutateAsync({ 
        step: nextStep, 
        businessInfo: currentStep === 2 ? businessInfo : undefined 
      });
      
      setCurrentStep(nextStep);
      
      if (nextStep > steps.length) {
        toast({
          title: "Welcome to PriceBuilder Pro!",
          description: "Your onboarding is complete. You can now start building amazing pricing calculators!",
        });
        setLocation("/dashboard");
      }
    } catch (error) {
      console.error("Onboarding step update failed:", error);
      // Error is already handled in mutation onError
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSkipToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

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
            <Badge variant="secondary" className="text-sm">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Getting Started</h1>
            <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div 
                key={step.step}
                className={`flex flex-col items-center cursor-pointer transition-all ${
                  step.step <= currentStep ? 'opacity-100' : 'opacity-50'
                }`}
                onClick={() => handleSkipToStep(step.step)}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : step.step === currentStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.completed ? (
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
                    <h3 className="font-semibold mb-2">Create Calculators</h3>
                    <p className="text-sm text-gray-600">Build unlimited pricing calculators for any service</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <Palette className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Custom Branding</h3>
                    <p className="text-sm text-gray-600">Match your brand with custom colors and styling</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Capture Leads</h3>
                    <p className="text-sm text-gray-600">Automatically collect customer information and requests</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Ready to get started?</h3>
                  <p className="opacity-90">Let's set up your account and create your first calculator in just a few minutes!</p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={businessInfo.businessName || ""}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                        placeholder="Your Business Name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="industry">Industry *</Label>
                      <Select
                        value={businessInfo.industry || ""}
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

                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select
                        value={businessInfo.businessType || ""}
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
                  </div>

                  <div className="space-y-4">
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

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={businessInfo.website || ""}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="yearsInBusiness">Years in Business</Label>
                      <Input
                        id="yearsInBusiness"
                        type="number"
                        value={businessInfo.yearsInBusiness || ""}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, yearsInBusiness: parseInt(e.target.value) }))}
                        placeholder="5"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Business Description</Label>
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

            {currentStep === 3 && (
              <div className="text-center space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Target className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to create your first calculator?</h3>
                  <p className="text-gray-600 mb-4">
                    Choose from our pre-built templates or create a custom calculator from scratch.
                  </p>
                  <Button 
                    onClick={() => setLocation("/formula-builder")}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Create Calculator
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold mb-2">Use a Template</h4>
                    <p className="text-gray-600">Start with proven formulas for common services like cleaning, landscaping, or construction.</p>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-semibold mb-2">Build Custom</h4>
                    <p className="text-gray-600">Create a completely custom calculator tailored to your specific business needs.</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <div className="bg-purple-50 p-6 rounded-lg">
                  <Palette className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Make it yours with custom design</h3>
                  <p className="text-gray-600 mb-4">
                    Customize colors, fonts, and styling to match your brand perfectly.
                  </p>
                  <Button 
                    onClick={() => setLocation("/design-dashboard")}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    Customize Design
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-4 rounded border text-center">
                    <div className="w-8 h-8 bg-blue-500 rounded mx-auto mb-2"></div>
                    <h4 className="font-semibold">Colors</h4>
                  </div>
                  <div className="bg-white p-4 rounded border text-center">
                    <div className="font-bold text-lg mb-2">Aa</div>
                    <h4 className="font-semibold">Typography</h4>
                  </div>
                  <div className="bg-white p-4 rounded border text-center">
                    <div className="w-8 h-4 bg-gray-200 rounded mx-auto mb-2 shadow"></div>
                    <h4 className="font-semibold">Shadows</h4>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="text-center space-y-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <Globe className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Get your calculators online</h3>
                  <p className="text-gray-600 mb-4">
                    Copy the embed code and add your calculators to any website to start collecting leads.
                  </p>
                  <Button 
                    onClick={() => setLocation("/dashboard")}
                    className="bg-green-500 hover:green-600"
                  >
                    View Dashboard
                  </Button>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">🎉 You're all set!</h3>
                  <p className="opacity-90">Your PriceBuilder Pro account is ready. Start creating amazing pricing experiences for your customers!</p>
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
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-3">
            {currentStep < steps.length && (
              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="text-gray-600"
              >
                Skip Setup
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={updateStepMutation.isPending}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600"
            >
              <span>{currentStep === steps.length ? "Complete Setup" : "Next"}</span>
              {currentStep < steps.length && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}