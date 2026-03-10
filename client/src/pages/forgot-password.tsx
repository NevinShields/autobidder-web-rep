import { useState, useEffect, type ReactNode } from "react";
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
import autobidderLogo from "@assets/Autobidder Logo (1)_1753224528350.png";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter a 6-digit code"),
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;

type Step = "email" | "code" | "success";

function ForgotPasswordShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-slate-50"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        .forgot-password-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.028'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="forgot-password-grain absolute inset-0" />
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-200/50 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-orange-200/40 to-transparent rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80">
              <img
                src={autobidderLogo}
                alt="Autobidder"
                className="h-16 w-16 drop-shadow-lg"
              />
            </div>
          </div>
          <h1
            className="text-4xl text-slate-900 mb-3"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            {title}
          </h1>
          <p className="text-slate-600 text-lg">{subtitle}</p>
        </div>

        <Card className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
          <CardHeader className="pb-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center shadow-sm">
              {icon}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
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
      const response = await apiRequest("POST", "/api/auth/password-reset/verify", {
        email: email,
        code: data.code,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification successful",
        description: "Taking you to your dashboard...",
      });
      // Navigate directly to dashboard instead of password reset
      setTimeout(() => {
        window.location.href = "/dashboard"; // Force full page reload to refresh auth state
      }, 1000);
    },
    onError: (error: any) => {
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

  // Removed handleCompleteReset since we go directly to dashboard

  // Shared animated background component
  // Step 1: Email input
  if (step === "email") {
    return (
      <ForgotPasswordShell
        title="Forgot Your Password?"
        subtitle="Recover access with a secure email verification code."
        icon={<Mail className="h-8 w-8 text-white" />}
      >
        <div className="text-center -mt-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Reset Password</CardTitle>
          <CardDescription className="text-base mt-2 text-slate-600">
            Enter your email address and we'll send you a verification code.
          </CardDescription>
        </div>

        <div>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-6">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-800 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          className="h-11 bg-white border-slate-300/90 text-slate-900 placeholder:text-slate-400 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
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
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
                  disabled={requestResetMutation.isPending}
                  data-testid="button-send-code"
                >
                  <div className="flex items-center justify-center">
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

            <div className="mt-6 text-center pt-2 border-t border-slate-200">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Remember your password? Sign in
                </Button>
              </Link>
            </div>
          </div>
      </ForgotPasswordShell>
    );
  }

  // Step 2: Code verification
  if (step === "code") {
    return (
      <ForgotPasswordShell
        title="Check Your Email"
        subtitle="Enter the 6-digit code we sent to confirm it's you."
        icon={<Shield className="h-8 w-8 text-white" />}
      >
        <div className="text-center -mt-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Enter Verification Code</CardTitle>
          <CardDescription className="text-base mt-2 text-slate-600">
            We sent a 6-digit code to <span className="font-medium text-slate-800">{email}</span>
          </CardDescription>
        </div>

        <div>
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(onSubmitCode)} autoComplete="off" className="space-y-6">
                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-center block text-slate-800 font-medium">Verification Code</FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
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
                            className="w-40 h-12 text-center text-2xl font-mono tracking-widest border-slate-300 bg-white text-slate-900 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
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
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-all duration-200"
                  disabled={verifyCodeMutation.isPending || codeValue.length !== 6}
                  onClick={() => {
                    if (codeValue.length === 6) {
                      verifyCodeMutation.mutate({ code: codeValue });
                    }
                  }}
                  data-testid="button-verify-code"
                >
                  <div className="flex items-center justify-center">
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
              <div className="text-center text-sm text-slate-500">
                <p>Didn't receive a code? Check your spam folder.</p>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100" 
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
                  className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100" 
                  onClick={() => setStep("email")}
                  data-testid="button-back-to-email"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use different email
                </Button>
              </div>
            </div>
          </div>
      </ForgotPasswordShell>
    );
  }

  // Step 3: Success
  return (
    <ForgotPasswordShell
      title="Verification Complete"
      subtitle="Your identity has been confirmed."
      icon={<CheckCircle className="h-8 w-8 text-white" />}
    >
      <div className="text-center -mt-2">
        <CardTitle className="text-2xl font-bold text-slate-900">Code Verified</CardTitle>
        <CardDescription className="text-base mt-2 text-slate-600">
          Your identity has been confirmed. You can now create a new password.
        </CardDescription>
      </div>

      <div className="space-y-4">
          <div className="text-center text-sm text-slate-500">
            <p>Click below to proceed to password reset.</p>
          </div>
          
          <Button
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm"
            onClick={() => navigate("/dashboard")}
            data-testid="button-reset-password"
          >
            <Shield className="mr-2 h-5 w-5" />
            Reset My Password
          </Button>
          
          <div className="text-center">
            <Link href="/login">
              <Button
                variant="outline"
                className="text-sm border-slate-300 text-slate-700 hover:bg-slate-50"
                data-testid="link-back-to-login-final"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </div>
      </div>
    </ForgotPasswordShell>
  );
}
