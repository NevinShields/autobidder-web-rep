import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogIn, Shield, Users, Calculator, Mail, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Welcome Back!",
        description: data.trialStatus?.isOnTrial 
          ? `${data.trialStatus.daysLeft} days left in your trial.`
          : "Successfully logged in.",
        variant: "default",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-br from-pink-500/30 to-yellow-500/30 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <img 
                src={autobidderLogo} 
                alt="PriceBuilder Pro" 
                className="h-16 w-16 drop-shadow-lg"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h1>
          <p className="text-white/80 text-lg">Sign in to access your pricing calculators</p>
        </div>

        {/* Login Card */}
        <Card className="glass-card backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-2xl font-bold text-white">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/90 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                          <Input 
                            type="email" 
                            placeholder="john@example.com" 
                            className="pl-10 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/90 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password" 
                            className="pr-10 glass-input bg-white/10 border-white/30 text-white placeholder:text-white/50 backdrop-blur-md focus:border-purple-400/50 focus:ring-purple-400/25"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-white/70 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit"
                  className="w-full h-12 relative group overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
                  disabled={loginMutation.isPending}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center">
                    {loginMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In
                      </>
                    )}
                  </div>
                </Button>
              </form>
            </Form>

            {/* Features */}
            <div className="pt-6 border-t border-white/20">
              <p className="text-sm text-white/80 text-center mb-4 font-medium">What you'll get access to:</p>
              <div className="space-y-3">
                <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                  <div className="p-1.5 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 mr-3">
                    <Calculator className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white/90">Create unlimited pricing calculators</span>
                </div>
                <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                  <div className="p-1.5 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 mr-3">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white/90">Manage leads and customer inquiries</span>
                </div>
                <div className="flex items-center p-3 rounded-xl bg-white/10 backdrop-blur-md">
                  <div className="p-1.5 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 mr-3">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white/90">Secure team collaboration tools</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <div className="text-sm">
            <Link href="/forgot-password" className="text-purple-300 hover:text-purple-200 font-medium transition-colors duration-200">
              Forgot your password?
            </Link>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <p className="text-sm text-white/80">
              New to PriceBuilder Pro?{" "}
              <Link href="/onboarding" className="text-purple-300 hover:text-purple-200 font-semibold transition-colors duration-200">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}