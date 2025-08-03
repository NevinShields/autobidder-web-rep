import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const tokenParam = urlParams.get('token');
    console.log('Reset password token extraction:', { location, tokenParam });
    setToken(tokenParam || ''); // Convert null to empty string for clarity
  }, [location]);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      if (!token) {
        throw new Error("No reset token found");
      }
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  // Show loading while token is being extracted
  if (token === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error only if token is explicitly empty string (not found)
  if (token === '') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -top-10 -right-10 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-10 left-20 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <Card className="w-full max-w-md relative glass-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-base mt-2">
                This password reset link is invalid or has expired
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Please request a new password reset link to continue.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Link href="/forgot-password">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -top-10 -right-10 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-10 left-20 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <Card className="w-full max-w-md relative glass-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Password Reset Complete
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Your password has been successfully updated
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>You can now sign in with your new password.</p>
            </div>
            
            <Link href="/login">
              <Button className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold">
                Continue to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-10 left-20 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md relative glass-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your new password below
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="h-11 pr-10"
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="h-11 pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
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

              <Button 
                type="submit"
                className="w-full h-12 relative group overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
                disabled={resetPasswordMutation.isPending}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  {resetPasswordMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      Reset Password
                    </>
                  )}
                </div>
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}