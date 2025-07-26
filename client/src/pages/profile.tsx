import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/app-header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  Mail, 
  Building2, 
  Settings, 
  Shield, 
  Camera,
  Save,
  Bell,
  Lock,
  Palette,
  Calendar,
  BarChart3,
  Users,
  FileText,
  Eye,
  CreditCard,
  Crown,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  userType: "owner" | "employee";
  ownerId?: string;
  organizationName?: string;
  isActive: boolean;
  plan?: "trial" | "starter" | "professional" | "enterprise";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "trialing" | "active" | "inactive" | "canceled" | "past_due";
  billingPeriod?: "monthly" | "yearly";
  trialStartDate?: string;
  trialEndDate?: string;
  trialUsed?: boolean;
  permissions?: {
    canManageUsers?: boolean;
    canEditFormulas?: boolean;
    canViewLeads?: boolean;
    canManageCalendar?: boolean;
    canAccessDesign?: boolean;
    canViewStats?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    leadAlerts: true,
    systemUpdates: false,
  });

  // Fetch current user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    queryFn: () => fetch('/api/profile').then(res => res.json()),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => 
      apiRequest('PATCH', '/api/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditToggle = () => {
    if (isEditing) {
      setProfileData({});
    } else {
      setProfileData({
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        organizationName: profile?.organizationName || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'canManageUsers': return <Users className="w-4 h-4" />;
      case 'canEditFormulas': return <FileText className="w-4 h-4" />;
      case 'canViewLeads': return <Eye className="w-4 h-4" />;
      case 'canManageCalendar': return <Calendar className="w-4 h-4" />;
      case 'canAccessDesign': return <Palette className="w-4 h-4" />;
      case 'canViewStats': return <BarChart3 className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'canManageUsers': return 'Manage Users';
      case 'canEditFormulas': return 'Edit Formulas';
      case 'canViewLeads': return 'View Leads';
      case 'canManageCalendar': return 'Manage Calendar';
      case 'canAccessDesign': return 'Access Design';
      case 'canViewStats': return 'View Statistics';
      default: return permission;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and account details
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    size="sm"
                    onClick={handleEditToggle}
                    disabled={updateProfileMutation.isPending}
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile?.profileImageUrl} />
                      <AvatarFallback className="text-lg">
                        {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {profile?.firstName} {profile?.lastName}
                      </h3>
                      <p className="text-gray-600">{profile?.email}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={isEditing ? (profileData.firstName || '') : (profile?.firstName || '')}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={isEditing ? (profileData.lastName || '') : (profile?.lastName || '')}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="organization" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Organization Name
                    </Label>
                    <Input
                      id="organization"
                      value={isEditing ? (profileData.organizationName || '') : (profile?.organizationName || '')}
                      onChange={(e) => setProfileData({...profileData, organizationName: e.target.value})}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="outline" onClick={handleEditToggle}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="text-sm font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-gray-600">Receive updates via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({...notifications, emailNotifications: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="leadAlerts" className="text-sm font-medium">
                        New Lead Alerts
                      </Label>
                      <p className="text-xs text-gray-600">Get notified when new leads are received</p>
                    </div>
                    <Switch
                      id="leadAlerts"
                      checked={notifications.leadAlerts}
                      onCheckedChange={(checked) => 
                        setNotifications({...notifications, leadAlerts: checked})
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="systemUpdates" className="text-sm font-medium">
                        System Updates
                      </Label>
                      <p className="text-xs text-gray-600">Receive notifications about system changes</p>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) => 
                        setNotifications({...notifications, systemUpdates: checked})
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Management */}
              <SubscriptionManagement profile={profile} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account Type</span>
                    <Badge variant={profile?.userType === 'owner' ? 'default' : 'secondary'}>
                      {profile?.userType === 'owner' ? 'Owner' : 'Employee'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant={profile?.isActive ? 'default' : 'destructive'}>
                      {profile?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {profile?.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Member Since</span>
                      <span className="text-sm text-gray-600">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Permissions
                  </CardTitle>
                  <CardDescription>
                    Your current access permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile?.permissions && Object.entries(profile.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        {getPermissionIcon(key)}
                        <span className={`text-sm flex-1 ${value ? 'text-green-700' : 'text-gray-500'}`}>
                          {getPermissionLabel(key)}
                        </span>
                        <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                          {value ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                    {(!profile?.permissions || Object.keys(profile.permissions).length === 0) && (
                      <p className="text-sm text-gray-500">No specific permissions set</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                    <User className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subscription Management Component
function SubscriptionManagement({ profile }: { profile: UserProfile | undefined }) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">("monthly");
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Subscription plan configurations
  const SUBSCRIPTION_PLANS = {
    starter: {
      name: 'Starter',
      monthlyPrice: 49,
      yearlyPrice: 41, // ~17% discount
      features: [
        '5 pricing calculators',
        '500 leads per month',
        'Basic customization',
        'Email support'
      ]
    },
    professional: {
      name: 'Professional', 
      monthlyPrice: 97,
      yearlyPrice: 80, // ~17% discount
      features: [
        '25 pricing calculators',
        '2,500 leads per month',
        'Advanced customization',
        'Website publishing',
        'Calendar integration',
        'Analytics dashboard',
        'Priority support'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      monthlyPrice: 297,
      yearlyPrice: 247, // ~17% discount
      features: [
        'Unlimited calculators',
        'Unlimited leads',
        'White-label branding',
        'Team collaboration',
        'API access',
        'Custom integrations',
        'Dedicated support'
      ]
    }
  };

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: { planId: string; billingPeriod: "monthly" | "yearly" }) => {
      const response = await apiRequest('POST', '/api/update-subscription', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      if (data.url) {
        // Redirect to Stripe Checkout for payment
        window.location.href = data.url;
      } else {
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been successfully updated.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    },
  });

  const handleUpgrade = () => {
    if (!selectedPlan) {
      toast({
        title: "Please select a plan",
        description: "Choose a plan to upgrade to.",
        variant: "destructive",
      });
      return;
    }

    setIsUpgrading(true);
    updateSubscriptionMutation.mutate({
      planId: selectedPlan,
      billingPeriod: selectedBilling
    });
  };

  const getTrialDaysRemaining = () => {
    if (!profile?.trialEndDate) return null;
    const endDate = new Date(profile.trialEndDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getCurrentPlanPrice = () => {
    if (!profile?.plan || profile.plan === 'trial') return 0;
    const plan = SUBSCRIPTION_PLANS[profile.plan as keyof typeof SUBSCRIPTION_PLANS];
    return profile.billingPeriod === 'yearly' ? plan?.yearlyPrice : plan?.monthlyPrice;
  };

  const getUpgradeProratedPrice = () => {
    if (!selectedPlan || !profile?.plan) return 0;
    const currentPrice = getCurrentPlanPrice() || 0;
    const newPlan = SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS];
    const newPrice = selectedBilling === 'yearly' ? newPlan?.yearlyPrice : newPlan?.monthlyPrice;
    
    // Simple proration calculation (you might want to make this more sophisticated)
    const difference = (newPrice || 0) - currentPrice;
    return Math.max(0, difference);
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const proratedPrice = getUpgradeProratedPrice();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription Management
        </CardTitle>
        <CardDescription>
          Manage your subscription plan and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Current Plan</span>
            </div>
            <Badge variant={profile?.plan === 'trial' ? 'secondary' : 'default'} className="capitalize">
              {profile?.plan || 'trial'}
            </Badge>
          </div>
          
          {profile?.plan === 'trial' && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span>
                {trialDaysRemaining !== null ? (
                  trialDaysRemaining > 0 ? 
                    `${trialDaysRemaining} days remaining in trial` : 
                    "Trial expired"
                ) : "Trial active"}
              </span>
            </div>
          )}

          {profile?.plan && profile.plan !== 'trial' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Billing period:</span>
                <span className="capitalize">{profile.billingPeriod}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Current price:</span>
                <span className="font-semibold">${getCurrentPlanPrice()}/{profile.billingPeriod === 'yearly' ? 'year' : 'month'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600 capitalize">
                  {profile.subscriptionStatus}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Plan Upgrade Section */}
        {(profile?.plan === 'trial' || profile?.plan === 'starter') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Upgrade Your Plan</h3>
            </div>

            {/* Billing Period Toggle */}
            <div className="flex items-center justify-center space-x-4 bg-gray-100 rounded-lg p-1">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedBilling === 'monthly' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setSelectedBilling('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedBilling === 'yearly' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setSelectedBilling('yearly')}
              >
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
              </button>
            </div>

            {/* Plan Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(SUBSCRIPTION_PLANS)
                .filter(([key]) => key !== profile?.plan) // Don't show current plan
                .map(([key, plan]) => (
                <div
                  key={key}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPlan === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{plan.name}</h4>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        ${selectedBilling === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                      </div>
                      <div className="text-xs text-gray-500">
                        per {selectedBilling === 'yearly' ? 'year' : 'month'}
                      </div>
                    </div>
                  </div>
                  
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs text-gray-500">
                        +{plan.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>

            {/* Prorated Pricing Info */}
            {selectedPlan && proratedPrice > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Prorated Upgrade</span>
                </div>
                <p className="text-sm text-blue-700">
                  You'll be charged ${proratedPrice} today for the upgrade, 
                  then ${selectedBilling === 'yearly' ? 
                    SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS]?.yearlyPrice : 
                    SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS]?.monthlyPrice
                  } {selectedBilling === 'yearly' ? 'annually' : 'monthly'} going forward.
                </p>
              </div>
            )}

            {/* Upgrade Button */}
            <Button 
              onClick={handleUpgrade}
              disabled={!selectedPlan || isUpgrading || updateSubscriptionMutation.isPending}
              className="w-full"
            >
              {isUpgrading || updateSubscriptionMutation.isPending ? (
                "Processing..."
              ) : (
                `Upgrade to ${selectedPlan ? SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS]?.name : 'Selected Plan'}`
              )}
            </Button>
          </div>
        )}

        {/* Billing Portal for Existing Subscribers */}
        {profile?.plan && profile.plan !== 'trial' && profile.stripeCustomerId && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold">Billing Management</h3>
            </div>
            <p className="text-sm text-gray-600">
              Manage your payment methods, view invoices, and update billing information through our secure billing portal.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                // Open Stripe billing portal
                apiRequest('POST', '/api/create-portal-session', { 
                  customerId: profile.stripeCustomerId 
                })
                .then(response => response.json())
                .then(data => {
                  if (data.url) {
                    window.open(data.url, '_blank');
                  }
                })
                .catch(() => {
                  toast({
                    title: "Error",
                    description: "Failed to open billing portal. Please try again.",
                    variant: "destructive",
                  });
                });
              }}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Open Billing Portal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}