import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, Check, Calculator, Users, BarChart3, Palette, Globe, Shield, Clock, Mail, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { z } from "zod";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().optional(),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      businessName: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Account Created Successfully!",
        description: `Welcome! Your 14-day free trial has started. ${data.trialStatus?.daysLeft || 14} days remaining.`,
        variant: "default",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(data);
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
                alt="Autobidder" 
                className="h-12 w-12"
              />
              <span className="text-2xl font-bold text-gray-900">Autobidder</span>
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
                  <div className="flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      14-Day Free Trial
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Get Started Free
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    No credit card required • Cancel anytime
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Name Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Email Field */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="email" 
                                  placeholder="john@example.com" 
                                  className="pl-10" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Password Field */}
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Minimum 8 characters" 
                                  className="pr-10"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Business Name Field (Optional) */}
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your business name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Submit Button */}
                      <Button 
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={signupMutation.isPending}
                      >
                        {signupMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-5 w-5" />
                            Start My Free Trial
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>

                  {/* What's included */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-900 text-center mb-4">
                      ✨ What's included in your trial:
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

                  {/* Terms and Login Link */}
                  <div className="pt-4 border-t border-gray-100 text-center space-y-3">
                    <p className="text-xs text-gray-500">
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
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