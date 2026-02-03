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
import { useLocation } from "wouter";
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
  LogOut
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
    queryFn: () => fetch('/api/profile').then(res => res.json()),
  });

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
  }, [toast, refetch, queryClient]);

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
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 hidden sm:block" />
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
                      <p className="text-gray-600 dark:text-gray-400 break-all sm:break-normal">{profile?.email}</p>
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
                      className="mt-1 bg-gray-50 dark:bg-gray-800"
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
                    <Bell className="w-5 h-5 hidden sm:block" />
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
                      <p className="text-xs text-gray-600 dark:text-gray-400">Receive updates via email</p>
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
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get notified when new leads are received</p>
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
                      <p className="text-xs text-gray-600 dark:text-gray-400">Receive notifications about system changes</p>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) => 
                        setNotifications({...notifications, systemUpdates: checked})
                      }
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Push Notifications</Label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get instant alerts on your device when new leads come in</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-enable-lead-alerts"
                      onClick={async () => {
                        try {
                          if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                            toast({
                              title: "Not Supported",
                              description: "Push notifications are not supported in this browser.",
                              variant: "destructive",
                            });
                            return;
                          }

                          const registration = await navigator.serviceWorker.register('/service-worker.js');
                          await navigator.serviceWorker.ready;

                          const permission = await Notification.requestPermission();
                          if (permission !== 'granted') {
                            toast({
                              title: "Permission Denied",
                              description: "Please allow notifications to receive lead alerts.",
                              variant: "destructive",
                            });
                            return;
                          }

                          const vapidResponse = await fetch('/api/vapid-public-key');
                          const { publicKey } = await vapidResponse.json();

                          const urlBase64ToUint8Array = (base64String: string) => {
                            const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
                            const base64 = (base64String + padding)
                              .replace(/-/g, '+')
                              .replace(/_/g, '/');
                            const rawData = window.atob(base64);
                            const outputArray = new Uint8Array(rawData.length);
                            for (let i = 0; i < rawData.length; ++i) {
                              outputArray[i] = rawData.charCodeAt(i);
                            }
                            return outputArray;
                          };

                          const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(publicKey)
                          });

                          const saveResponse = await fetch('/api/save-subscription', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(subscription)
                          });

                          if (saveResponse.ok) {
                            toast({
                              title: "Lead Alerts Enabled",
                              description: "You will now receive push notifications for new leads.",
                            });
                          } else {
                            throw new Error('Failed to save subscription');
                          }
                        } catch (error) {
                          console.error('Push subscription error:', error);
                          toast({
                            title: "Setup Failed",
                            description: "Failed to enable push notifications. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Enable Lead Alerts
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Management */}
              <SubscriptionManagement />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 hidden sm:block" />
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">
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
                    <Lock className="w-5 h-5 hidden sm:block" />
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
                  {profile?.userType === 'owner' && (
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/users")}>
                      <Users className="w-4 h-4 mr-2" />
                      Manage Team
                    </Button>
                  )}
                  <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new password.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              placeholder="Enter current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            >
                              {showPasswords.current ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Enter new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            >
                              {showPasswords.new ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Confirm new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            >
                              {showPasswords.confirm ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsChangePasswordOpen(false);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleChangePassword}
                          disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
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
    </DashboardLayout>
  );
}
