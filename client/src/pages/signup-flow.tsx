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
  Globe,
  Clock
} from "lucide-react";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
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
    lastName: "",
    password: ""
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
      description: "Your 14-day trial has started - let's build your first calculator",
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
        password: data.userInfo.password,
        businessName: data.businessInfo.businessName
      };
      
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Essential for session cookies
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to PriceBuilder Pro. Your 14-day trial has started!",
      });
      setCreatedUserId(data.user.id);
      
      // Invalidate and refetch auth state immediately with correct query key
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Wait for auth state to update, then proceed to step 4
      const maxRetries = 10;
      let retries = 0;
      
      const checkAuthState = async () => {
        try {
          const result = await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
          const userData = result[0]?.data;
          
          if (userData && userData.id) {
            // User is authenticated, proceed to step 4
            setCurrentStep(4);
            return;
          }
        } catch (error) {
          console.log("Auth check failed, retrying...", error);
        }
        
        retries++;
        if (retries < maxRetries) {
          setTimeout(checkAuthState, 500);
        } else {
          // Fallback: force page reload
          console.log("Auth state check timed out, forcing page reload");
          window.location.href = "/dashboard";
        }
      };
      
      // Start checking auth state after a short delay to allow session cookie to be set
      setTimeout(checkAuthState, 500);
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

      // Create the account and start trial
      createAccountMutation.mutate({ userInfo, businessInfo });
      return;
    }

    if (currentStep === 4) {
      // Use client-side navigation since user is now authenticated
      setLocation("/dashboard");
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-br from-pink-500/30 to-yellow-500/30 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 backdrop-blur-lg bg-white/10 border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={autobidderLogo} 
                alt="PriceBuilder Pro" 
                className="h-10 w-10 drop-shadow-lg"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                PriceBuilder Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md">
                Step {currentStep} of {steps.length}
              </Badge>
              <Button 
                variant="outline" 
                onClick={handleLoginRedirect}
                className="glass-button border-white/30 text-white hover:bg-white/20 backdrop-blur-md"
              >
                Already have an account?
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((step) => (
              <div 
                key={step.step}
                className={`flex flex-col items-center transition-all duration-500 ${
                  step.step <= currentStep ? 'opacity-100 scale-100' : 'opacity-60 scale-95'
                }`}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 backdrop-blur-md border ${
                    step.step < currentStep 
                      ? 'bg-gradient-to-br from-green-500/80 to-emerald-600/80 text-white border-green-400/50 shadow-lg shadow-green-500/25' 
                      : step.step === currentStep 
                        ? 'bg-gradient-to-br from-purple-500/80 to-blue-600/80 text-white border-purple-400/50 shadow-lg shadow-purple-500/25 animate-pulse' 
                        : 'bg-white/10 text-white/70 border-white/30'
                  }`}
                >
                  {step.step < currentStep ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    step.step
                  )}
                </div>
                <span className="text-xs text-white/80 mt-2 text-center max-w-20 font-medium">
                  {step.title.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-md">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-700 ease-out shadow-lg shadow-purple-500/50"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current step content */}
        <Card className="mb-8 glass-card backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-md border border-white/30">
                {React.createElement(steps[currentStep - 1]?.icon, {
                  className: "w-12 h-12 text-white drop-shadow-lg"
                })}
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              {steps[currentStep - 1]?.title}
            </CardTitle>
            <p className="text-white/80 mt-3 text-lg">{steps[currentStep - 1]?.description}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="text-center space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="group text-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Calculator className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    <h3 className="font-bold mb-2 text-white">Smart Calculators</h3>
                    <p className="text-sm text-white/70">AI-powered pricing tools for any service</p>
                  </div>
                  <div className="group text-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                    <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Palette className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    <h3 className="font-bold mb-2 text-white">Custom Branding</h3>
                    <p className="text-sm text-white/70">Match your brand with custom styling</p>
                  </div>
                  <div className="group text-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                    <div className="p-3 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    <h3 className="font-bold mb-2 text-white">Lead Generation</h3>
                    <p className="text-sm text-white/70">Capture and manage customer inquiries</p>
                  </div>
                </div>
                
                {/* Social proof */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-xl border border-white/20 text-white p-8 rounded-2xl">
                    <div className="flex justify-center items-center space-x-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                      ))}
                    </div>
                    <h3 className="text-xl font-bold mb-3">Join 1000+ contractors</h3>
                    <p className="text-lg opacity-95 mb-2">"Increased qualified leads by 300% in the first month!"</p>
                    <p className="text-sm opacity-80">- Sarah K., Cleaning Business Owner</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-white/90 font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="mt-2 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-white/90 font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      value={userInfo.firstName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      className="mt-2 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className="text-white/90 font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={userInfo.lastName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="mt-2 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-white/90 font-medium">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userInfo.password}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a secure password"
                    className="mt-2 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25"
                    minLength={8}
                  />
                  <p className="text-sm text-white/60 mt-2">Password must be at least 8 characters</p>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur"></div>
                  <div className="relative bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white">Free Account Benefits</span>
                    </div>
                    <ul className="text-sm text-white/80 space-y-2">
                      <li className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-2 text-green-400" />Unlimited pricing calculators</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-2 text-green-400" />Custom branding and styling</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-2 text-green-400" />Lead capture and management</li>
                      <li className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-2 text-green-400" />Calendar booking integration</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName" className="text-white/90 font-medium">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessInfo.businessName}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Your Business Name"
                      className="mt-2 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry" className="text-white/90 font-medium">Industry *</Label>
                    <Select
                      value={businessInfo.industry}
                      onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger className="mt-2 glass-input bg-white/10 border-white/30 text-white backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25">
                        <SelectValue placeholder="Select your industry" className="text-white/50" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/95 backdrop-blur-xl border-white/20">
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry} className="text-white hover:bg-white/10 focus:bg-white/10">{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessType" className="text-white/90 font-medium">Business Type</Label>
                    <Select
                      value={businessInfo.businessType}
                      onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, businessType: value }))}
                    >
                      <SelectTrigger className="mt-2 glass-input bg-white/10 border-white/30 text-white backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25">
                        <SelectValue placeholder="Select business type" className="text-white/50" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800/95 backdrop-blur-xl border-white/20">
                        {businessTypes.map(type => (
                          <SelectItem key={type} value={type} className="text-white hover:bg-white/10 focus:bg-white/10">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-white/90 font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      value={businessInfo.phone || ""}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="mt-2 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website" className="text-white/90 font-medium">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={businessInfo.website || ""}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    className="mt-2 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white/90 font-medium">Business Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={businessInfo.description || ""}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell us about your business and the services you offer..."
                    className="mt-2 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-3xl blur-lg"></div>
                  <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl">
                    <div className="p-4 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 w-fit mx-auto mb-6">
                      <CheckCircle2 className="w-16 h-16 text-white drop-shadow-lg" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                      Welcome to PriceBuilder Pro!
                    </h3>
                    <p className="text-white/80 mb-6 text-lg">
                      Your 14-day free trial has started! You now have full access to all features.
                    </p>
                    <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-6">
                      <div className="flex items-center justify-center gap-3 text-white mb-3">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="font-semibold text-lg">Trial ends in 14 days</span>
                      </div>
                      <p className="text-white/70">
                        No payment required during trial. Cancel anytime.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-2xl blur"></div>
                  <div className="relative bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-white/20 text-white p-8 rounded-2xl">
                    <h3 className="text-xl font-bold mb-6 text-white">What you get during your trial:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
                        <span className="text-white/90">Unlimited pricing calculators</span>
                      </div>
                      <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
                        <span className="text-white/90">Custom branding & styling</span>
                      </div>
                      <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
                        <span className="text-white/90">Lead capture & management</span>
                      </div>
                      <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
                        <span className="text-white/90">Calendar integration</span>
                      </div>
                      <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
                        <span className="text-white/90">Analytics dashboard</span>
                      </div>
                      <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
                        <span className="text-white/90">Priority support</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-white/80 mb-2 text-lg">Ready to build your first calculator?</p>
                  <p className="text-sm text-white/60">
                    We'll upgrade you to our Professional plan when your trial ends.
                  </p>
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
            className="glass-button bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={createAccountMutation.isPending}
            className="relative group overflow-hidden px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              {currentStep === 3 
                ? (createAccountMutation.isPending ? "Creating Account..." : "Create Account")
                : currentStep === 4 
                  ? "Get Started" 
                  : "Continue"
              }
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}