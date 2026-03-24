import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
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
  EyeOff,
  CreditCard,
  Crown,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  LogOut,
  ExternalLink,
  Globe,
  Zap
} from "lucide-react";
import SubscriptionManagement from "@/components/subscription-management";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  userType: "owner" | "employee";
  ownerId?: string;
  organizationName?: string;
  businessPhone?: string;
  showLandingPageNav?: boolean;
  isActive: boolean;
  plan?: "free" | "trial" | "starter" | "professional" | "enterprise" | "standard" | "plus" | "plus_seo";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "trialing" | "active" | "inactive" | "canceled" | "canceling" | "past_due";
  billingPeriod?: "monthly" | "yearly";
  trialStartDate?: string;
  trialEndDate?: string;
  trialUsed?: boolean;
  permissions?: {
    canManageUsers?: boolean;
    canEditFormulas?: boolean;
    canViewLeads?: boolean;
    canManageLeads?: boolean;
    canManageCalendar?: boolean;
    canAccessDesign?: boolean;
    canViewStats?: boolean;
    canManageSettings?: boolean;
    canCreateWebsites?: boolean;
    canManageWebsites?: boolean;
    canAccessAI?: boolean;
    canUseMeasureMap?: boolean;
    canCreateUpsells?: boolean;
    canAccessZapier?: boolean;
    canManageEmailTemplates?: boolean;
    canViewReports?: boolean;
    canExportData?: boolean;
    canManageTeam?: boolean;
    canManageBilling?: boolean;
    canAccessAPI?: boolean;
    canManageIntegrations?: boolean;
    canCustomizeBranding?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const [showLandingPageNav, setShowLandingPageNav] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    leadAlerts: true,
    systemUpdates: false,
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Fetch current user profile
  const { data: profile, isLoading, refetch } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/profile');
      return response.json();
    },
  });

  // Fetch business settings for the phone number
  const { data: businessSettings } = useQuery<any>({
    queryKey: ['/api/business-settings'],
  });

  // Sync business phone when settings load
  useEffect(() => {
    if (businessSettings?.businessPhone && !isEditing) {
      setProfileData(prev => ({
        ...prev,
        businessPhone: businessSettings.businessPhone
      }));
    }
  }, [businessSettings, isEditing]);

  useEffect(() => {
    setShowLandingPageNav(profile?.showLandingPageNav ?? false);

    if (!profile || isEditing) return;

    setProfileData(prev => ({
      ...prev,
      showLandingPageNav: profile.showLandingPageNav ?? false,
    }));
  }, [profile?.showLandingPageNav, profile, isEditing]);

  // Handle payment success callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const sessionId = urlParams.get('session_id');
    
    if (paymentSuccess === 'true' && sessionId) {
      // Verify checkout session and update subscription
      apiRequest('GET', `/api/verify-checkout/${sessionId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            toast({
              title: "Payment Successful!",
              description: `Your subscription to ${data.plan} plan has been activated.`,
              duration: 5000,
            });
            
            // Refresh profile data
            refetch();
            queryClient.invalidateQueries({ queryKey: ['/api/subscription-details'] });
            
            // Clean up URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          } else {
            toast({
              title: "Payment Verification Failed",
              description: data.message || "Unable to verify payment. Please contact support if you were charged.",
              variant: "destructive",
              duration: 8000,
            });
          }
        })
        .catch(error => {
          console.error('Payment verification error:', error);
          toast({
            title: "Payment Verification Error",
            description: "Unable to verify payment status. Please refresh the page or contact support.",
            variant: "destructive",
            duration: 8000,
          });
        });
    }
  }, [toast, refetch]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await apiRequest('PATCH', '/api/profile', data);
      return response.json();
    },
    onMutate: (data: Partial<UserProfile>) => {
      if (data.showLandingPageNav === undefined) {
        return;
      }

      const nextShowLandingPageNav = Boolean(data.showLandingPageNav);
      setShowLandingPageNav(nextShowLandingPageNav);
      setProfileData((prev) => ({ ...prev, showLandingPageNav: nextShowLandingPageNav }));

      queryClient.setQueryData(['/api/profile'], (current: UserProfile | undefined) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          showLandingPageNav: nextShowLandingPageNav,
          businessInfo: {
            ...(current as any).businessInfo,
            showLandingPageNav: nextShowLandingPageNav,
          },
        } as UserProfile;
      });

      queryClient.setQueryData(['/api/auth/user'], (current: any) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          showLandingPageNav: nextShowLandingPageNav,
          businessInfo: {
            ...(current.businessInfo || {}),
            showLandingPageNav: nextShowLandingPageNav,
          },
        };
      });
    },
    onSuccess: (updatedProfile: UserProfile) => {
      const nextShowLandingPageNav = updatedProfile.showLandingPageNav ?? false;
      setShowLandingPageNav(nextShowLandingPageNav);
      setProfileData((prev) => ({ ...prev, showLandingPageNav: nextShowLandingPageNav }));
      queryClient.setQueryData(['/api/profile'], updatedProfile);
      queryClient.setQueryData(['/api/auth/user'], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: () => {
      setShowLandingPageNav(profile?.showLandingPageNav ?? false);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      apiRequest('POST', '/api/auth/change-password', data),
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
      setIsChangePasswordOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Directory profile
  const { data: directoryProfile } = useQuery<{
    id: number;
    companySlug: string;
    companyName: string;
    showOnDirectory: boolean;
    totalServices: number;
  } | null>({
    queryKey: ["/api/directory/profile"],
  });

  const toggleDirectoryVisibility = useMutation({
    mutationFn: (showOnDirectory: boolean) =>
      apiRequest("PATCH", "/api/directory/profile", { showOnDirectory }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({
        title: "Directory Listing Updated",
        description: "Your directory visibility has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update directory visibility.",
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
        businessPhone: businessSettings?.businessPhone || '',
        showLandingPageNav: profile?.showLandingPageNav ?? false,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      
      // Clear authentication cache
      queryClient.clear();
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'canManageUsers': return <Users className="w-4 h-4" />;
      case 'canEditFormulas': return <FileText className="w-4 h-4" />;
      case 'canViewLeads': return <Eye className="w-4 h-4" />;
      case 'canManageLeads': return <TrendingUp className="w-4 h-4" />;
      case 'canManageCalendar': return <Calendar className="w-4 h-4" />;
      case 'canAccessDesign': return <Palette className="w-4 h-4" />;
      case 'canViewStats': return <BarChart3 className="w-4 h-4" />;
      case 'canManageSettings': return <Settings className="w-4 h-4" />;
      case 'canManageTeam': return <Users className="w-4 h-4" />;
      case 'canManageBilling': return <CreditCard className="w-4 h-4" />;
      case 'canAccessAPI': return <Shield className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'canManageUsers': return 'Manage Users';
      case 'canEditFormulas': return 'Edit Formulas';
      case 'canViewLeads': return 'View Leads';
      case 'canManageLeads': return 'Manage Leads';
      case 'canManageCalendar': return 'Manage Calendar';
      case 'canAccessDesign': return 'Access Design';
      case 'canViewStats': return 'View Statistics';
      case 'canManageSettings': return 'Manage Settings';
      case 'canCreateWebsites': return 'Create Websites';
      case 'canManageWebsites': return 'Manage Websites';
      case 'canAccessAI': return 'Access AI';
      case 'canUseMeasureMap': return 'Use Measure Map';
      case 'canCreateUpsells': return 'Create Upsells';
      case 'canAccessZapier': return 'Access Zapier';
      case 'canManageEmailTemplates': return 'Manage Email Templates';
      case 'canViewReports': return 'View Reports';
      case 'canExportData': return 'Export Data';
      case 'canManageTeam': return 'Manage Team';
      case 'canManageBilling': return 'Manage Billing';
      case 'canAccessAPI': return 'Access API';
      case 'canManageIntegrations': return 'Manage Integrations';
      case 'canCustomizeBranding': return 'Customize Branding';
      default: return permission;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="animate-pulse rounded-2xl h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="animate-pulse rounded-2xl h-96 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
                <div className="animate-pulse rounded-2xl h-64 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
              </div>
              <div className="space-y-6">
                <div className="animate-pulse rounded-2xl h-48 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
                <div className="animate-pulse rounded-2xl h-48 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes dash-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-stagger { animation: dash-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .dash-stagger-1 { animation-delay: 0ms; }
        .dash-stagger-2 { animation-delay: 60ms; }
        .dash-stagger-3 { animation-delay: 120ms; }
        .dash-stagger-4 { animation-delay: 180ms; }
        .dash-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 dash-grain min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Header */}
          <div className="dash-stagger dash-stagger-1 relative overflow-hidden rounded-2xl border border-blue-200/40 dark:border-blue-500/10 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/30 to-transparent dark:from-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600/70 dark:text-blue-400/60 font-semibold mb-2">Account</p>
                <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Profile Settings
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  Manage your personal information, notification preferences, and subscription details.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={profile?.isActive ? "default" : "destructive"} className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {profile?.isActive ? "Active Account" : "Inactive"}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl h-10 px-4 bg-white/50 backdrop-blur-sm border-white/20 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile & Notifications */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Info Card */}
              <Card className="dash-stagger dash-stagger-2 rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
                  <div>
                    <CardTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Your personal details and organizational identity.
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    size="sm"
                    className="rounded-xl h-9"
                    onClick={handleEditToggle}
                    disabled={updateProfileMutation.isPending}
                  >
                    {isEditing ? "Cancel" : <><Settings className="w-4 h-4 mr-2" /> Edit Profile</>}
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-xl">
                        <AvatarImage src={profile?.profileImageUrl} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                          {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <button className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Camera className="w-6 h-6" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                        {profile?.firstName} {profile?.lastName}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2 mt-1">
                        <Mail className="w-3.5 h-3.5" />
                        {profile?.email}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                          {profile?.userType}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400">
                          {profile?.plan?.replace('_', ' ')} Plan
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="dark:bg-gray-800" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">First Name</Label>
                      <Input
                        value={isEditing ? (profileData.firstName || '') : (profile?.firstName || '')}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        disabled={!isEditing}
                        className="rounded-xl h-11 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Last Name</Label>
                      <Input
                        value={isEditing ? (profileData.lastName || '') : (profile?.lastName || '')}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        disabled={!isEditing}
                        className="rounded-xl h-11 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Organization</Label>
                      <Input
                        value={isEditing ? (profileData.organizationName || '') : (profile?.organizationName || '')}
                        onChange={(e) => setProfileData({...profileData, organizationName: e.target.value})}
                        disabled={!isEditing}
                        className="rounded-xl h-11 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Business Phone</Label>
                      <Input
                        type="tel"
                        value={isEditing ? (profileData.businessPhone || '') : (businessSettings?.businessPhone || '')}
                        onChange={(e) => setProfileData({...profileData, businessPhone: e.target.value})}
                        disabled={!isEditing}
                        placeholder="(555) 123-4567"
                        className="rounded-xl h-11 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="md:col-span-2 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label className="text-sm font-bold text-gray-900 dark:text-white">Show Landing Page Editor In Nav</Label>
                          <p className="text-xs text-gray-500 mt-1">Adds the dashboard landing page editor to the left navigation menu. Off by default.</p>
                        </div>
                        <Switch
                          checked={showLandingPageNav}
                          onCheckedChange={(checked) => {
                            setShowLandingPageNav(checked);
                            setProfileData((prev) => ({ ...prev, showLandingPageNav: checked }));
                            updateProfileMutation.mutate({ showLandingPageNav: checked });
                          }}
                          disabled={updateProfileMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="rounded-xl px-6 bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Profile Changes"}
                      </Button>
                      <Button variant="outline" onClick={handleEditToggle} className="rounded-xl px-6">
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notifications Card */}
              <Card className="dash-stagger dash-stagger-3 rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Stay updated on your business activity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {[
                    { id: "email", label: "Email Notifications", desc: "Receive automated alerts and reports", icon: Mail, checked: notifications.emailNotifications, field: 'emailNotifications' },
                    { id: "leads", label: "Lead Alerts", desc: "Real-time notifications for new quote requests", icon: Users, checked: notifications.leadAlerts, field: 'leadAlerts' },
                    { id: "system", label: "System Updates", desc: "Maintenance alerts and new feature announcements", icon: Zap, checked: notifications.systemUpdates, field: 'systemUpdates' }
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800">
                          <pref.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <Label className="text-sm font-bold">{pref.label}</Label>
                          <p className="text-xs text-gray-500">{pref.desc}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={pref.checked}
                        onCheckedChange={(checked) => setNotifications({...notifications, [pref.field as any]: checked})}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <SubscriptionManagement />
            </div>

            {/* Right Column: Account Status & Security */}
            <div className="space-y-6">
              {/* Security Card */}
              <Card className="dash-stagger dash-stagger-2 rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Security & Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start rounded-xl h-11 border-gray-200 dark:border-gray-700">
                        <Lock className="w-4 h-4 mr-3 text-blue-500" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      <DialogHeader>
                        <DialogTitle style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Update Password</DialogTitle>
                        <DialogDescription>Enter your current password to authorize this change.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Password</Label>
                          <div className="relative">
                            <Input
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              placeholder="••••••••"
                              className="rounded-xl h-11 pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            >
                              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">New Password</Label>
                          <div className="relative">
                            <Input
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="••••••••"
                              className="rounded-xl h-11 pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            >
                              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Confirm Password</Label>
                          <div className="relative">
                            <Input
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="••••••••"
                              className="rounded-xl h-11 pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            >
                              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="pt-6">
                        <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button 
                          className="rounded-xl bg-blue-600" 
                          onClick={handleChangePassword}
                          disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword}
                        >
                          {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full justify-start rounded-xl h-11 border-gray-200 dark:border-gray-700">
                    <Shield className="w-4 h-4 mr-3 text-emerald-500" />
                    Authentication Logs
                  </Button>
                  
                  {profile?.userType === 'owner' && (
                    <Button variant="outline" className="w-full justify-start rounded-xl h-11 border-gray-200 dark:border-gray-700" onClick={() => navigate("/users")}>
                      <Users className="w-4 h-4 mr-3 text-indigo-500" />
                      Team Management
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Directory Listing Card */}
              <Card className="dash-stagger dash-stagger-3 rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Public Directory
                  </CardTitle>
                  <CardDescription>Get discovered by homeowners near you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {directoryProfile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40">
                        <span className="text-sm font-medium">Listing Status</span>
                        <Badge variant={directoryProfile.showOnDirectory ? "default" : "secondary"}>
                          {directoryProfile.showOnDirectory ? "Visible" : "Hidden"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Link href={`/directory/company/${directoryProfile.companySlug}`}>
                          <Button variant="outline" className="w-full justify-start rounded-xl border-gray-200 dark:border-gray-700 h-10">
                            <ExternalLink className="w-3.5 h-3.5 mr-2.5" />
                            View Profile
                          </Button>
                        </Link>
                        <Link href="/directory-dashboard">
                          <Button variant="outline" className="w-full justify-start rounded-xl border-gray-200 dark:border-gray-700 h-10">
                            <Settings className="w-3.5 h-3.5 mr-2.5" />
                            Manage Listing
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Globe className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-4 px-4">Set up your directory profile to appear in public search results.</p>
                      <Link href="/directory-setup">
                        <Button className="w-full rounded-xl">Set Up Listing</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Permissions Summary */}
              <Card className="dash-stagger dash-stagger-4 rounded-2xl border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Active Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile?.permissions && Object.entries(profile.permissions).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <div className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-1">{getPermissionLabel(key)}</span>
                        {value && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
