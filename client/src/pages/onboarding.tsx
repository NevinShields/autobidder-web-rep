import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

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
  templatesPrepopulated?: boolean;
}

interface OnboardingStep {
  step: number;
  title: string;
  label: string;
  description: string;
  completed: boolean;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: "",
    firstName: "",
    lastName: "",
    password: ""
  });
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const userId = (user as any)?.id;

  const { data: progress, isLoading } = useQuery({
    queryKey: [`/api/onboarding/${userId}`],
    enabled: !!userId,
  });

  const { data: templateCategories = [], isLoading: categoriesLoading } = useQuery<{ id: number; name: string; displayOrder: number }[]>({
    queryKey: ['/api/template-categories'],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: { userInfo: UserInfo; businessInfo: BusinessInfo }) => {
      const payload = {
        email: data.userInfo.email,
        firstName: data.userInfo.firstName,
        lastName: data.userInfo.lastName,
        password: data.userInfo.password,
        businessName: data.businessInfo.businessName
      };
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to Autobidder. Your 14-day trial has started!",
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (businessInfo.industry && businessInfo.industry !== 'Other' && !businessInfo.templatesPrepopulated) {
        prepopulateTemplatesMutation.mutate(businessInfo.industry);
        setBusinessInfo(prev => ({ ...prev, templatesPrepopulated: true }));
      }
      
      setCurrentStep(4);
      
      setTimeout(() => {
        setLocation("/dashboard?signup_success=true");
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

  const updateStepMutation = useMutation({
    mutationFn: async ({ step, businessInfo }: { step: number; businessInfo?: BusinessInfo }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await fetch(`/api/onboarding/${userId}/step`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, businessInfo }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
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

  const prepopulateTemplatesMutation = useMutation({
    mutationFn: async (industry: string) => {
      const response = await fetch("/api/prepopulate-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ industry }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      if (data.count > 0) {
        toast({
          title: "Templates Added!",
          description: `${data.count} calculator template${data.count > 1 ? 's' : ''} added to your account.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/formulas"] });
    },
    onError: (error: any) => {
      console.error("Failed to prepopulate templates:", error);
    },
  });

  useEffect(() => {
    if (isAuthenticated && user && !createAccountMutation.isPending) {
      const step = (user as any).onboardingStep || 2;
      if (step >= 3 && currentStep !== 4) {
        setLocation("/dashboard");
        return;
      }
      if (currentStep < 4) {
        setCurrentStep(step);
      }
      if ((user as any).businessInfo) {
        setBusinessInfo((user as any).businessInfo);
      }
    }
  }, [isAuthenticated, user, createAccountMutation.isPending, setLocation, currentStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const industries = React.useMemo(() => {
    const categoryNames = templateCategories
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(cat => cat.name);
    return [...categoryNames, "Other"];
  }, [templateCategories]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const steps: OnboardingStep[] = isAuthenticated ? [
    {
      step: 1,
      title: "Welcome to Autobidder",
      label: "Welcome",
      description: "Let's get you set up in just a few simple steps. It'll only take a minute.",
      completed: ((user as any)?.onboardingStep || 1) > 1
    },
    {
      step: 2,
      title: "Tell us about your business",
      label: "Business",
      description: "Help us customize your experience by sharing some details.",
      completed: ((user as any)?.onboardingStep || 1) > 2
    },
    {
      step: 3,
      title: "You're all set!",
      label: "Finish",
      description: "Your account is ready - let's start building your first calculator.",
      completed: ((user as any)?.onboardingStep || 1) > 3
    }
  ] : [
    {
      step: 1,
      title: "Welcome to Autobidder",
      label: "Welcome",
      description: "Let's get you set up in just a few simple steps. It'll only take a minute.",
      completed: currentStep > 1
    },
    {
      step: 2,
      title: "Create your account",
      label: "Account",
      description: "Let's start with your basic information.",
      completed: currentStep > 2
    },
    {
      step: 3,
      title: "Tell us about your business",
      label: "Business",
      description: "Help us customize your experience.",
      completed: currentStep > 3
    },
    {
      step: 4,
      title: "You're all set!",
      label: "Finish",
      description: "Your 14-day trial has started - let's build your first calculator.",
      completed: currentStep > 4
    }
  ];

  const currentStepDetails = steps.find(s => s.step === currentStep) || steps[0];

  const handleNext = async () => {
    if (!isAuthenticated) {
      if (currentStep === 1) {
        setCurrentStep(2);
        return;
      }
      
      if (currentStep === 2) {
        if (!userInfo.email || !userInfo.firstName || !userInfo.lastName || !userInfo.password) {
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

        if (userInfo.password.length < 8) {
          toast({
            title: "Password Too Short",
            description: "Password must be at least 8 characters long.",
            variant: "destructive",
          });
          return;
        }
        
        setCurrentStep(3);
        return;
      }

      if (currentStep === 3) {
        if (!businessInfo.businessName || !businessInfo.industry) {
          toast({
            title: "Missing Information",
            description: "Please provide your business name and industry to continue.",
            variant: "destructive",
          });
          return;
        }

        createAccountMutation.mutate({ userInfo, businessInfo });
        return;
      }

      if (currentStep === 4) {
        setLocation("/dashboard");
        return;
      }
    } else {
      if (currentStep === 2) {
        if (!businessInfo.businessName || !businessInfo.industry) {
          toast({
            title: "Missing Information",
            description: "Please provide your business name and industry to continue.",
            variant: "destructive",
          });
          return;
        }
      }

      if (currentStep === steps.length) {
        updateStepMutation.mutate({ 
          step: steps.length + 1,
          businessInfo: undefined 
        });
        
        toast({
          title: "Welcome to Autobidder!",
          description: "Your onboarding is complete. You can now start building amazing pricing calculators!",
        });
        setLocation("/dashboard");
        return;
      }

      const nextStep = Math.min(currentStep + 1, steps.length);
      
      try {
        await updateStepMutation.mutateAsync({ 
          step: nextStep, 
          businessInfo: currentStep === 2 ? businessInfo : undefined 
        });
        
        if (currentStep === 2 && businessInfo.industry && businessInfo.industry !== 'Other' && !businessInfo.templatesPrepopulated) {
          prepopulateTemplatesMutation.mutate(businessInfo.industry);
          setBusinessInfo(prev => ({ ...prev, templatesPrepopulated: true }));
        }
        
        setCurrentStep(nextStep);
      } catch (error) {
        console.error("Onboarding step update failed:", error);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const businessTypes = [
    "Sole Proprietorship",
    "Partnership", 
    "LLC",
    "Corporation",
    "Franchise",
    "Other"
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="bg-[#12121a] border border-[#1e1e2d] rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-white font-medium">Getting Started</span>
            </div>
            <span className="text-blue-400 text-sm">Step {currentStep} of {steps.length}</span>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-blue-400" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {currentStepDetails.title}
            </h1>
            <p className="text-gray-400">
              {currentStepDetails.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleSkipToStep(step.step)}
                    disabled={step.step > currentStep}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step.completed
                        ? 'bg-blue-500 text-white'
                        : step.step === currentStep
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#1e1e2d] text-gray-500'
                    }`}
                    data-testid={`step-indicator-${step.step}`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      step.step
                    )}
                  </button>
                  <span className={`text-xs mt-2 ${
                    step.step <= currentStep ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-[2px] mx-2 mb-6 ${
                    step.completed ? 'bg-blue-500' : 'bg-[#1e1e2d]'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {currentStep === 1 && (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">
                  Join thousands of contractors who've transformed their pricing process with Autobidder.
                </p>
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>14-day free trial included</span>
                </div>
              </div>
            )}

            {currentStep === 2 && !isAuthenticated && (
              <>
                <div>
                  <Label htmlFor="firstName" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={userInfo.firstName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    className="bg-[#1a1a24] border-[#2a2a3a] text-white placeholder:text-gray-600 focus:border-blue-500/50 h-12"
                    data-testid="input-firstName"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={userInfo.lastName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Smith"
                    className="bg-[#1a1a24] border-[#2a2a3a] text-white placeholder:text-gray-600 focus:border-blue-500/50 h-12"
                    data-testid="input-lastName"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="bg-[#1a1a24] border-[#2a2a3a] text-white placeholder:text-gray-600 focus:border-blue-500/50 h-12"
                    data-testid="input-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={userInfo.password}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    className="bg-[#1a1a24] border-[#2a2a3a] text-white placeholder:text-gray-600 focus:border-blue-500/50 h-12"
                    data-testid="input-password"
                  />
                </div>
              </>
            )}

            {((currentStep === 2 && isAuthenticated) || (currentStep === 3 && !isAuthenticated)) && (
              <>
                <div>
                  <Label htmlFor="businessName" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    value={businessInfo.businessName || ""}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your Business Name"
                    className="bg-[#1a1a24] border-[#2a2a3a] text-white placeholder:text-gray-600 focus:border-blue-500/50 h-12"
                    data-testid="input-businessName"
                  />
                </div>
                
                <div>
                  <Label htmlFor="industry" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    Industry
                  </Label>
                  <Select
                    value={businessInfo.industry || ""}
                    onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger 
                      className="bg-[#1a1a24] border-[#2a2a3a] text-white h-12 focus:border-blue-500/50"
                      data-testid="select-industry"
                    >
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
                  <Label htmlFor="businessType" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    Business Type
                  </Label>
                  <Select
                    value={businessInfo.businessType || ""}
                    onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, businessType: value }))}
                  >
                    <SelectTrigger 
                      className="bg-[#1a1a24] border-[#2a2a3a] text-white h-12 focus:border-blue-500/50"
                      data-testid="select-businessType"
                    >
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
                  <Label htmlFor="phone" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone || ""}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="bg-[#1a1a24] border-[#2a2a3a] text-white placeholder:text-gray-600 focus:border-blue-500/50 h-12"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-gray-400 uppercase text-xs tracking-wider block mb-2">
                    Website (Optional)
                  </Label>
                  <Input
                    id="website"
                    value={businessInfo.website || ""}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    className="bg-[#1a1a24] border-[#2a2a3a] text-white placeholder:text-gray-600 focus:border-blue-500/50 h-12"
                    data-testid="input-website"
                  />
                </div>
              </>
            )}

            {prepopulateTemplatesMutation.isPending && (
              <div className="flex items-center justify-center space-x-3 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                <p className="text-gray-400">Setting up your calculators...</p>
              </div>
            )}

            {((currentStep === 3 && isAuthenticated) || (currentStep === 4 && !isAuthenticated)) && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Welcome to Autobidder!</h3>
                <p className="text-gray-400 mb-4">
                  {!isAuthenticated ? "Your account has been created and your 14-day trial has started!" : "Your business profile is complete!"}
                </p>
                <p className="text-gray-500 text-sm">
                  You're now ready to start building amazing pricing calculators.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1e1e2d]">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="bg-transparent border-[#2a2a3a] text-white hover:bg-[#1e1e2d] hover:text-white px-6"
              data-testid="button-back"
            >
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={updateStepMutation.isPending || createAccountMutation.isPending || prepopulateTemplatesMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8"
              data-testid="button-continue"
            >
              {(updateStepMutation.isPending || createAccountMutation.isPending || prepopulateTemplatesMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>
                    {createAccountMutation.isPending ? "Creating..." : prepopulateTemplatesMutation.isPending ? "Setting up..." : "Saving..."}
                  </span>
                </div>
              ) : (
                currentStep === steps.length ? "Go to Dashboard" : "Continue"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
