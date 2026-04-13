import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard-layout";
import { PlanSelection } from "@/components/plan-selection";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Crown, 
  ArrowLeft,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  plan?: "trial" | "starter" | "professional" | "enterprise";
  subscriptionStatus?: "trialing" | "active" | "inactive" | "canceled" | "canceling" | "past_due";
  trialStartDate?: string;
  trialEndDate?: string;
  trialUsed?: boolean;
}

interface TrialStatus {
  isOnTrial: boolean;
  daysLeft: number;
  expired: boolean;
  trialEndDate: string;
}

export default function UpgradePage() {
  const { toast } = useToast();
  const surfaceClassName =
    "rounded-[24px] border border-slate-200/70 bg-white/85 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.24)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/75";

  // Get user profile and trial status
  const { data: profileData, isLoading: isLoadingProfile } = useQuery<{
    user: UserProfile;
    trialStatus: TrialStatus;
  }>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profile");
      return res.json();
    },
  });

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const user = profileData?.user;
  const trialStatus = profileData?.trialStatus;

  // If user already has active subscription, redirect to billing
  if (user?.subscriptionStatus === 'active') {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className={`${surfaceClassName} p-8`}>
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                  <Crown className="w-8 h-8 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h1
                  className="text-3xl tracking-tight text-slate-950 dark:text-white"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  You're Already Subscribed
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  You currently have an active {user.plan} subscription. 
                  To change your plan or manage billing, use the subscription management section.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild variant="unstyled" className="rounded-xl border border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
                    <Link href="/dashboard">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Link>
                  </Button>
                  <Button asChild className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_18px_32px_-18px_rgba(234,88,12,0.95)]">
                    <Link href="/profile">
                      Manage Subscription
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className={`relative mb-8 overflow-hidden rounded-[28px] border border-amber-100/80 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-6 py-8 shadow-[0_24px_70px_-36px_rgba(234,88,12,0.45)] dark:border-amber-500/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900`}>
            <div className="absolute inset-0">
              <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-500/10" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-500/10" />
            </div>
            <div className="relative flex items-center justify-between">
            <div>
              <Button asChild variant="unstyled" className="mb-4 rounded-xl border border-white/80 bg-white/80 px-4 text-slate-700 shadow-sm hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:hover:bg-slate-900">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1
                className="text-4xl tracking-tight text-slate-950 dark:text-white sm:text-5xl"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                Choose Your Plan
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Unlock the full power of Autobidder with a premium plan
              </p>
            </div>
            </div>
          </div>

          {/* Trial Warning (if trial is expiring soon) */}
          {trialStatus?.isOnTrial && trialStatus.daysLeft <= 3 && (
            <Card className={`mb-8 ${surfaceClassName} border-orange-200/70 bg-orange-50/80 dark:border-orange-500/20 dark:bg-orange-500/10`}>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {trialStatus.daysLeft === 0 ? (
                      <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-300" />
                    ) : (
                      <Clock className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                      {trialStatus.daysLeft === 0 
                        ? "Trial Expired"
                        : `Trial Ending Soon - ${trialStatus.daysLeft} day${trialStatus.daysLeft === 1 ? '' : 's'} left`
                      }
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-200/90">
                      {trialStatus.daysLeft === 0
                        ? "Your trial has expired. Upgrade now to continue using all features."
                        : "Upgrade now to avoid any interruption to your service."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Current Plan Status */}
          {trialStatus?.isOnTrial && (
            <Card className={`mb-8 ${surfaceClassName} border-amber-200/70 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10`}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Clock className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 dark:text-amber-100">Free Trial Active</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-200/90">
                        {trialStatus.daysLeft > 0 
                          ? `${trialStatus.daysLeft} days remaining`
                          : "Trial has ended"
                        }
                      </p>
                    </div>
                  </div>
                  <Badge className="border-amber-200 bg-white/90 text-amber-700 dark:border-amber-500/20 dark:bg-slate-950/40 dark:text-amber-300">
                    Trial Plan
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Plan Selection Component */}
          <PlanSelection />

          {/* Additional Benefits */}
          <Card className={`mt-8 ${surfaceClassName}`}>
            <div className="p-6">
              <h3
                className="mb-4 text-center text-3xl tracking-tight text-slate-950 dark:text-white"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                Why upgrade from your trial?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                    <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <h4 className="mb-2 font-medium text-slate-900 dark:text-white">No Limits</h4>
                  <p className="text-slate-600 dark:text-slate-300">Create unlimited calculators and capture unlimited leads</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-500/10">
                    <Clock className="w-6 h-6 text-sky-600 dark:text-sky-300" />
                  </div>
                  <h4 className="mb-2 font-medium text-slate-900 dark:text-white">24/7 Support</h4>
                  <p className="text-slate-600 dark:text-slate-300">Get priority support whenever you need help</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10">
                    <ArrowLeft className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                  </div>
                  <h4 className="mb-2 font-medium text-slate-900 dark:text-white">Advanced Features</h4>
                  <p className="text-slate-600 dark:text-slate-300">Access to calendar booking, analytics, and more</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/10">
                    <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                  </div>
                  <h4 className="mb-2 font-medium text-slate-900 dark:text-white">Cancel Anytime</h4>
                  <p className="text-slate-600 dark:text-slate-300">No long-term contracts. Cancel whenever you want</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
