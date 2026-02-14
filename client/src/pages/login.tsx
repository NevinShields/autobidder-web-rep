import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogIn, Shield, Users, Calculator, Mail, Eye, EyeOff, Chrome } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";
import { usePendingCalculator } from "@/hooks/use-pending-calculator";
import ImportCalculatorModal from "@/components/import-calculator-modal";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { calculator, hasStoredCalculator } = usePendingCalculator();

  // Redirect if already authenticated (only once, not in useEffect)
  if (!isLoading && isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

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
    onSuccess: async (data: any) => {
      // Invalidate auth query to force refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Welcome Back!",
        description: data.trialStatus?.isOnTrial
          ? `${data.trialStatus.daysLeft} days left in your trial.`
          : "Successfully logged in.",
        variant: "default",
      });

      // Check if there's a pending calculator to import
      if (hasStoredCalculator && calculator) {
        setShowImportModal(true);
      } else {
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          setLocation("/dashboard");
        }, 100);
      }
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



  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 login-grain bg-slate-50 dark:bg-slate-950" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .login-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.028'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-200/50 to-transparent dark:from-amber-500/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-orange-200/40 to-transparent dark:from-orange-500/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200/80 dark:border-white/10">
              <img 
                src={autobidderLogo} 
                alt="Autobidder" 
                className="h-16 w-16 drop-shadow-lg"
              />
            </div>
          </div>
          <h1 className="text-4xl text-slate-900 dark:text-white mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Welcome Back
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Sign in to access your pricing calculators</p>
        </div>

        {/* Login Card */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/75 shadow-sm backdrop-blur-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">Sign In</CardTitle>
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
                      <FormLabel className="text-slate-800 dark:text-slate-200 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input 
                            type="email" 
                            placeholder="john@example.com" 
                            className="pl-10 bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
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
                      <FormLabel className="text-slate-800 dark:text-slate-200 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password" 
                            className="pr-10 bg-white dark:bg-slate-950/50 border-slate-300/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-transparent"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit"
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
                  disabled={loginMutation.isPending}
                >
                  <div className="flex items-center justify-center">
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

            <div className="relative">
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
              data-testid="button-google-login"
            >
              <SiGoogle className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button>

            {/* Features */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300 text-center mb-4 font-medium">What you'll get access to:</p>
              <div className="space-y-3">
                <div className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                  <div className="p-1.5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 mr-3">
                    <Calculator className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                  </div>
                  <span className="text-sm text-slate-800 dark:text-slate-200">Create unlimited pricing calculators</span>
                </div>
                <div className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                  <div className="p-1.5 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 mr-3">
                    <Users className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                  </div>
                  <span className="text-sm text-slate-800 dark:text-slate-200">Manage leads and customer inquiries</span>
                </div>
                <div className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                  <div className="p-1.5 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20 mr-3">
                    <Shield className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <span className="text-sm text-slate-800 dark:text-slate-200">Secure team collaboration tools</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <div className="text-sm">
            <Link href="/forgot-password" className="text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 font-medium transition-colors duration-200">
              Forgot your password?
            </Link>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              New to Autobidder?{" "}
              <Link href="/onboarding" className="text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 font-semibold transition-colors duration-200">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Import Calculator Modal */}
      {calculator && (
        <ImportCalculatorModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setLocation("/dashboard");
          }}
          calculator={calculator}
        />
      )}
    </div>
  );
}
