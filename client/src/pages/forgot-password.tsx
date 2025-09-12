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
import { Mail, ArrowLeft, CheckCircle, Shield, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter a 6-digit code"),
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;

type Step = "email" | "code" | "success";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeValue, setCodeValue] = useState("");

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: "",
    },
  });

  // Clear code when stepping to code step
  useEffect(() => {
    if (step === "code") {
      setCodeValue("");
    }
  }, [step]);

  // Request password reset code
  const requestResetMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      const response = await apiRequest("POST", "/api/auth/password-reset/request", data);
      return response.json();
    },
    onSuccess: (data) => {
      setEmail(emailForm.getValues("email"));
      setStep("code");
      setResendCooldown(60); // 60 second cooldown
      toast({
        title: "Code sent",
        description: data.message || "Check your email for the verification code",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    },
  });

  // Verify reset code
  const verifyCodeMutation = useMutation({
    mutationFn: async (data: CodeForm) => {
      console.log("🌐 MAKING API REQUEST with:", data, "email:", email);
      const response = await apiRequest("POST", "/api/auth/password-reset/verify", {
        email: email,
        code: data.code,
      });
      console.log("🌐 API RESPONSE:", response.status);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ VERIFICATION SUCCESS:", data);
      setResetToken(data.token);
      setStep("success");
      toast({
        title: "Code verified",
        description: "You can now reset your password",
      });
    },
    onError: (error: any) => {
      console.log("❌ VERIFICATION ERROR:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
      setCodeValue(""); // Clear the direct state instead of form
    },
  });

  // Resend code
  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/password-reset/request", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setResendCooldown(60);
      toast({
        title: "Code resent",
        description: data.message || "New verification code sent to your email",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    },
  });

  const onSubmitEmail = (data: EmailForm) => {
    requestResetMutation.mutate(data);
  };

  const onSubmitCode = (data: CodeForm) => {
    console.log("🚀 onSubmitCode called! Data:", data, "codeValue:", codeValue);
    // Use the direct state value instead of form data since we bypassed react-hook-form
    verifyCodeMutation.mutate({ code: codeValue });
  };

  const handleResend = () => {
    if (resendCooldown === 0 && !resendMutation.isPending) {
      resendMutation.mutate();
    }
  };

  const handleCompleteReset = () => {
    if (resetToken) {
      navigate(`/reset-password?token=${resetToken}`);
    }
  };

  // Shared animated background component
  const AnimatedBackground = () => (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute -top-10 -left-10 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-10 left-20 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  );

  // Step 1: Email input
  if (step === "email") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />

        <Card className="w-full max-w-md relative glass-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Reset Password
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Enter your email address and we'll send you a verification code
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-6">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          className="h-11"
                          data-testid="input-email"
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
                  disabled={requestResetMutation.isPending}
                  data-testid="button-send-code"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center">
                    {requestResetMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Send Verification Code
                      </>
                    )}
                  </div>
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/login">
                <Button variant="ghost" className="text-sm" data-testid="link-back-to-login">
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

  // Step 2: Code verification
  if (step === "code") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatedBackground />

        <Card className="w-full max-w-md relative glass-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                Enter Verification Code
              </CardTitle>
              <CardDescription className="text-base mt-2">
                We sent a 6-digit code to <span className="font-medium">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(onSubmitCode)} autoComplete="off" className="space-y-6">
                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-center block">Verification Code</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center space-y-2">
                          {/* Debug info */}
                          <div className="text-xs text-red-500 p-2 bg-red-50 rounded border">
                            DEBUG: codeValue = "{codeValue || 'EMPTY'}" | length = {codeValue.length} | pending = {verifyCodeMutation.isPending ? 'YES' : 'NO'}
                          </div>
                          
                          <Input
                            key="verification-input"
                            value={codeValue}
                            name="verification_code"
                            id="verification-code"
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            autoFocus
                            inputMode="numeric"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            className="w-40 text-center text-2xl font-mono tracking-widest border-2 border-green-500"
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              console.log("🎯 Direct state update:", value);
                              setCodeValue(value);
                            }}
                            data-testid="input-verification-code"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="button"
                  className="w-full h-12 relative group overflow-hidden bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02]"
                  disabled={verifyCodeMutation.isPending || codeValue.length !== 6}
                  onClick={() => {
                    console.log("🔴 DIRECT Button clicked! codeValue:", codeValue, "email:", email);
                    if (codeValue.length === 6) {
                      console.log("🚀 DIRECT submission with code:", codeValue);
                      verifyCodeMutation.mutate({ code: codeValue });
                    } else {
                      console.log("❌ Code length not 6:", codeValue.length);
                    }
                  }}
                  data-testid="button-verify-code"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center">
                    {verifyCodeMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Verifying Code...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-5 w-5" />
                        Verify Code
                      </>
                    )}
                  </div>
                </Button>
              </form>
            </Form>

            <div className="mt-6 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>Didn't receive a code? Check your spam folder.</p>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  className="text-sm" 
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendMutation.isPending}
                  data-testid="button-resend-code"
                >
                  {resendMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                      Resending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend code in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend code
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button 
                  variant="ghost" 
                  className="text-sm" 
                  onClick={() => setStep("email")}
                  data-testid="button-back-to-email"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use different email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Success
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />

      <Card className="w-full max-w-md relative glass-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Code Verified
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Your identity has been confirmed. You can now create a new password.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Click below to proceed to password reset.</p>
          </div>
          
          <Button
            className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold"
            onClick={handleCompleteReset}
            data-testid="button-reset-password"
          >
            <Shield className="mr-2 h-5 w-5" />
            Reset My Password
          </Button>
          
          <div className="text-center">
            <Link href="/login">
              <Button variant="outline" className="text-sm" data-testid="link-back-to-login-final">
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