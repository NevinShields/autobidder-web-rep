import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
      toast({
        title: "Reset link sent",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isSubmitted) {
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-base mt-2">
                We've sent a password reset link to your email address
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>If you don't see the email in your inbox, check your spam folder.</p>
            </div>
            
            {resetLink && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Development Mode:</p>
                <a 
                  href={resetLink} 
                  className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resetLink}
                </a>
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
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
            <Mail className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Forgot Password
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit"
                className="w-full h-12 relative group overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
                disabled={forgotPasswordMutation.isPending}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center">
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Send Reset Link
                    </>
                  )}
                </div>
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Remember your password? Sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}