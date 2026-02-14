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
import { SiGoogle } from "react-icons/si";

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
  serviceCity?: string;
  serviceState?: string;
  serviceLocation?: string;
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

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

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

  const parseServiceLocation = (location?: string) => {
    if (!location || !location.includes(",")) return { city: "", state: "" };
    const parts = location.split(",").map(part => part.trim()).filter(Boolean);
    if (parts.length < 2) return { city: "", state: "" };
    return {
      city: parts.slice(0, parts.length - 1).join(", "),
      state: parts[parts.length - 1],
    };
  };

  const normalizeBusinessInfo = (info: BusinessInfo): BusinessInfo => {
    const city = (info.serviceCity || "").trim();
    const state = (info.serviceState || "").trim();
    return {
      ...info,
      serviceCity: city,
      serviceState: state,
      serviceLocation: city && state ? `${city}, ${state}` : info.serviceLocation,
    };
  };

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
        businessName: data.businessInfo.businessName,
        industry: data.businessInfo.industry,
        serviceLocation: data.businessInfo.serviceLocation,
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
      const savedStep = (user as any).onboardingStep;
      
      // For authenticated users, step 3 is the final step (3 steps total)
      // If they've completed onboarding (step > 3), redirect to dashboard
      if (savedStep && savedStep > 3) {
        setLocation("/dashboard");
        return;
      }
      
      // Only set step from saved progress if they have actual progress
      // New Google OAuth users start at step 1
      if (savedStep && savedStep > 1) {
        setCurrentStep(savedStep);
      }
      
      if ((user as any).businessInfo) {
        const savedInfo = (user as any).businessInfo as BusinessInfo;
        const parsed = parseServiceLocation(savedInfo.serviceLocation);
        setBusinessInfo({
          ...savedInfo,
          serviceCity: savedInfo.serviceCity || parsed.city,
          serviceState: savedInfo.serviceState || parsed.state,
        });
      }
    }
  }, [isAuthenticated, user, createAccountMutation.isPending, setLocation]);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
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
        if (!businessInfo.businessName || !businessInfo.industry || !businessInfo.serviceCity || !businessInfo.serviceState) {
          toast({
            title: "Missing Information",
            description: "Please provide your business name, industry, city, and state to continue.",
            variant: "destructive",
          });
          return;
        }
        createAccountMutation.mutate({ userInfo, businessInfo: normalizeBusinessInfo(businessInfo) });
        return;
      }

      if (currentStep === 4) {
        setLocation("/dashboard");
        return;
      }
    } else {
      // For authenticated users (Google login), handle step 1 -> skip to business info
      if (currentStep === 1) {
        setCurrentStep(2);
        return;
      }
      
      if (currentStep === 2) {
        if (!businessInfo.businessName || !businessInfo.industry || !businessInfo.serviceCity || !businessInfo.serviceState) {
          toast({
            title: "Missing Information",
            description: "Please provide your business name, industry, city, and state to continue.",
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
          businessInfo: currentStep === 2 ? normalizeBusinessInfo(businessInfo) : undefined 
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-2 sm:p-4 onboarding-grain" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .onboarding-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.028'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="w-full max-w-xl">
        <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-700/70 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-slate-800 dark:text-slate-100 font-medium text-sm sm:text-base">Getting Started</span>
            </div>
            <span className="text-amber-700 dark:text-amber-300 text-xs sm:text-sm">Step {currentStep} of {steps.length}</span>
          </div>

          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-300" />
            </div>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {currentStepDetails.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base px-2">
              {currentStepDetails.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleSkipToStep(step.step)}
                    disabled={step.step > currentStep}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                      step.completed
                        ? 'bg-amber-500 text-white'
                        : step.step === currentStep
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                    data-testid={`step-indicator-${step.step}`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      step.step
                    )}
                  </button>
                  <span className={`text-[10px] sm:text-xs mt-1 sm:mt-2 ${
                    step.step <= currentStep ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-6 sm:w-12 h-[2px] mx-1 sm:mx-2 mb-5 sm:mb-6 ${
                    step.completed ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {currentStep === 1 && (
              <div className="text-center py-4">
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Join thousands of contractors who've transformed their pricing process with Autobidder.
                </p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>14-day free trial included</span>
                </div>
              </div>
            )}

            {currentStep === 2 && !isAuthenticated && (
              <>
                <div>
                  <Label htmlFor="firstName" className="text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider block mb-2">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={userInfo.firstName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    className="bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 h-12"
                    data-testid="input-firstName"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider block mb-2">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={userInfo.lastName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Smith"
                    className="bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 h-12"
                    data-testid="input-lastName"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider block mb-2">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 h-12"
                    data-testid="input-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider block mb-2">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={userInfo.password}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    className="bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 h-12"
                    data-testid="input-password"
                  />
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                  onClick={() => window.location.href = "/api/auth/google"}
                  data-testid="button-google-signup"
                >
                  <SiGoogle className="mr-2 h-5 w-5" />
                  Sign up with Google
                </Button>
              </>
            )}

            {((currentStep === 2 && isAuthenticated) || (currentStep === 3 && !isAuthenticated)) && (
              <>
                <div>
                  <Label htmlFor="businessName" className="text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider block mb-2">
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    value={businessInfo.businessName || ""}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your Business Name"
                    className="bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 h-12"
                    data-testid="input-businessName"
                  />
                </div>
                
                <div>
                  <Label htmlFor="industry" className="text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider block mb-2">
                    Industry
                  </Label>
                  <Select
                    value={businessInfo.industry || ""}
                    onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger 
                      className="bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-12 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceCity" className="text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider block mb-2">
                      City
                    </Label>
                    <Input
                      id="serviceCity"
                      value={businessInfo.serviceCity || ""}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, serviceCity: e.target.value }))}
                      placeholder="Austin"
                      className="bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 h-12"
                      data-testid="input-serviceCity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceState" className="text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider block mb-2">
                      State
                    </Label>
                    <Select
                      value={businessInfo.serviceState || ""}
                      onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, serviceState: value }))}
                    >
                      <SelectTrigger
                        id="serviceState"
                        className="bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-12 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                        data-testid="select-serviceState"
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {prepopulateTemplatesMutation.isPending && (
              <div className="flex items-center justify-center space-x-3 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                <p className="text-slate-600 dark:text-slate-300">Setting up your calculators...</p>
              </div>
            )}

            {((currentStep === 3 && isAuthenticated) || (currentStep === 4 && !isAuthenticated)) && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Welcome to Autobidder!</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {!isAuthenticated ? "Your account has been created and your 14-day trial has started!" : "Your business profile is complete!"}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  You're now ready to start building amazing pricing calculators.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="bg-transparent border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 sm:px-6 text-sm sm:text-base"
              data-testid="button-back"
            >
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={updateStepMutation.isPending || createAccountMutation.isPending || prepopulateTemplatesMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white px-6 sm:px-8 text-sm sm:text-base"
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
