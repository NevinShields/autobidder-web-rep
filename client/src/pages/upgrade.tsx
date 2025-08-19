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
  subscriptionStatus?: "trialing" | "active" | "inactive" | "canceled" | "past_due";
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
            <Card className="p-8">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Crown className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold">You're Already Subscribed!</h1>
                <p className="text-gray-600">
                  You currently have an active {user.plan} subscription. 
                  To change your plan or manage billing, use the subscription management section.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/dashboard">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Link>
                  </Button>
                  <Button asChild>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button asChild variant="ghost" className="mb-4">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Choose Your Plan</h1>
              <p className="text-gray-600 mt-2">
                Unlock the full power of Autobidder with a premium plan
              </p>
            </div>
          </div>

          {/* Trial Warning (if trial is expiring soon) */}
          {trialStatus?.isOnTrial && trialStatus.daysLeft <= 3 && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {trialStatus.daysLeft === 0 ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900">
                      {trialStatus.daysLeft === 0 
                        ? "Trial Expired"
                        : `Trial Ending Soon - ${trialStatus.daysLeft} day${trialStatus.daysLeft === 1 ? '' : 's'} left`
                      }
                    </h3>
                    <p className="text-orange-700 text-sm">
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
            <Card className="mb-8 border-blue-200 bg-blue-50">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Free Trial Active</h3>
                      <p className="text-blue-700 text-sm">
                        {trialStatus.daysLeft > 0 
                          ? `${trialStatus.daysLeft} days remaining`
                          : "Trial has ended"
                        }
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Trial Plan
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Plan Selection Component */}
          <PlanSelection />

          {/* Additional Benefits */}
          <Card className="mt-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Why upgrade from your trial?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-2">No Limits</h4>
                  <p className="text-gray-600">Create unlimited calculators and capture unlimited leads</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-2">24/7 Support</h4>
                  <p className="text-gray-600">Get priority support whenever you need help</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ArrowLeft className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-2">Advanced Features</h4>
                  <p className="text-gray-600">Access to calendar booking, analytics, and more</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-medium mb-2">Cancel Anytime</h4>
                  <p className="text-gray-600">No long-term contracts. Cancel whenever you want</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}