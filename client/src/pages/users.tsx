import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Settings, Trash2, Crown, User, Users, Mail, Clock, CheckCircle, Search } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useLocation } from "wouter";

const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  permissions: z.object({
    canEditFormulas: z.boolean().default(true),
    canViewLeads: z.boolean().default(true),
    canManageLeads: z.boolean().default(false),
    canManageCalendar: z.boolean().default(false),
    canAccessDesign: z.boolean().default(false),
    canViewStats: z.boolean().default(false),
    canManageSettings: z.boolean().default(false),
    canCreateWebsites: z.boolean().default(false),
    canManageWebsites: z.boolean().default(false),
    canAccessAI: z.boolean().default(false),
    canUseMeasureMap: z.boolean().default(false),
    canCreateUpsells: z.boolean().default(false),
    canAccessZapier: z.boolean().default(false),
    canManageEmailTemplates: z.boolean().default(false),
    canViewReports: z.boolean().default(false),
    canExportData: z.boolean().default(false),
    canManageTeam: z.boolean().default(false),
    canManageBilling: z.boolean().default(false),
    canAccessAPI: z.boolean().default(false),
    canManageIntegrations: z.boolean().default(false),
    canCustomizeBranding: z.boolean().default(false),
  }),
});

const editPermissionsSchema = z.object({
  permissions: z.object({
    canEditFormulas: z.boolean().default(true),
    canViewLeads: z.boolean().default(true),
    canManageLeads: z.boolean().default(false),
    canManageCalendar: z.boolean().default(false),
    canAccessDesign: z.boolean().default(false),
    canViewStats: z.boolean().default(false),
    canManageSettings: z.boolean().default(false),
    canCreateWebsites: z.boolean().default(false),
    canManageWebsites: z.boolean().default(false),
    canAccessAI: z.boolean().default(false),
    canUseMeasureMap: z.boolean().default(false),
    canCreateUpsells: z.boolean().default(false),
    canAccessZapier: z.boolean().default(false),
    canManageEmailTemplates: z.boolean().default(false),
    canViewReports: z.boolean().default(false),
    canExportData: z.boolean().default(false),
    canManageTeam: z.boolean().default(false),
    canManageBilling: z.boolean().default(false),
    canAccessAPI: z.boolean().default(false),
    canManageIntegrations: z.boolean().default(false),
    canCustomizeBranding: z.boolean().default(false),
  }),
  isActive: z.boolean().default(true),
});

type InviteUserForm = z.infer<typeof inviteUserSchema>;
type EditPermissionsForm = z.infer<typeof editPermissionsSchema>;

interface TeamUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'owner' | 'employee';
  ownerId?: string;
  organizationName?: string;
  isActive: boolean;
  permissions: {
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
  createdAt: string;
}

const permissionOptions = [
  { name: "permissions.canEditFormulas", label: "Edit Calculators", testId: "switch-edit-formulas" },
  { name: "permissions.canViewLeads", label: "View Leads", testId: "switch-view-leads" },
  { name: "permissions.canManageLeads", label: "Manage Leads", testId: "switch-manage-leads" },
  { name: "permissions.canManageCalendar", label: "Manage Calendar", testId: "switch-manage-calendar" },
  { name: "permissions.canAccessDesign", label: "Access Design", testId: "switch-access-design" },
  { name: "permissions.canViewStats", label: "View Statistics", testId: "switch-view-stats" },
  { name: "permissions.canManageSettings", label: "Manage Settings", testId: "switch-manage-settings" },
  { name: "permissions.canCreateWebsites", label: "Create Websites", testId: "switch-create-websites" },
  { name: "permissions.canManageWebsites", label: "Manage Websites", testId: "switch-manage-websites" },
  { name: "permissions.canAccessAI", label: "Access AI", testId: "switch-access-ai" },
  { name: "permissions.canUseMeasureMap", label: "Use Measure Map", testId: "switch-measure-map" },
  { name: "permissions.canCreateUpsells", label: "Create Upsells", testId: "switch-create-upsells" },
  { name: "permissions.canAccessZapier", label: "Access Zapier", testId: "switch-access-zapier" },
  { name: "permissions.canManageEmailTemplates", label: "Manage Email Templates", testId: "switch-manage-email-templates" },
  { name: "permissions.canViewReports", label: "View Reports", testId: "switch-view-reports" },
  { name: "permissions.canExportData", label: "Export Data", testId: "switch-export-data" },
  { name: "permissions.canManageTeam", label: "Manage Team", testId: "switch-manage-team" },
  { name: "permissions.canManageBilling", label: "Manage Billing", testId: "switch-manage-billing" },
  { name: "permissions.canAccessAPI", label: "Access API", testId: "switch-access-api" },
  { name: "permissions.canManageIntegrations", label: "Manage Integrations", testId: "switch-manage-integrations" },
  { name: "permissions.canCustomizeBranding", label: "Customize Branding", testId: "switch-customize-branding" },
];

export default function UsersPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();
  const { canAccess } = useUserPermissions();
  const [, navigate] = useLocation();

  const { data: users = [], isLoading, error } = useQuery<TeamUser[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserForm) => {
      return apiRequest("POST", "/api/users/invite", data);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/users"] });
      setIsInviteDialogOpen(false);
      form.reset();
      toast({
        title: "Invitation Sent",
        description: "An email has been sent with instructions to join your team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<EditPermissionsForm> }) => {
      return apiRequest("PATCH", `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Updated",
        description: "Team member settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Removed",
        description: "Team member has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/resend-invite`, {});
    },
    onSuccess: () => {
      toast({
        title: "Invitation Resent",
        description: "A new invitation email has been sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      permissions: {
        canEditFormulas: true,
        canViewLeads: true,
        canManageLeads: false,
        canManageCalendar: false,
        canAccessDesign: false,
        canViewStats: false,
        canManageSettings: false,
        canCreateWebsites: false,
        canManageWebsites: false,
        canAccessAI: false,
        canUseMeasureMap: false,
        canCreateUpsells: false,
        canAccessZapier: false,
        canManageEmailTemplates: false,
        canViewReports: false,
        canExportData: false,
        canManageTeam: false,
        canManageBilling: false,
        canAccessAPI: false,
        canManageIntegrations: false,
        canCustomizeBranding: false,
      },
    },
  });

  const editForm = useForm<EditPermissionsForm>({
    resolver: zodResolver(editPermissionsSchema),
    defaultValues: {
      permissions: {
        canEditFormulas: true,
        canViewLeads: true,
        canManageLeads: false,
        canManageCalendar: false,
        canAccessDesign: false,
        canViewStats: false,
        canManageSettings: false,
        canCreateWebsites: false,
        canManageWebsites: false,
        canAccessAI: false,
        canUseMeasureMap: false,
        canCreateUpsells: false,
        canAccessZapier: false,
        canManageEmailTemplates: false,
        canViewReports: false,
        canExportData: false,
        canManageTeam: false,
        canManageBilling: false,
        canAccessAPI: false,
        canManageIntegrations: false,
        canCustomizeBranding: false,
      },
      isActive: true,
    },
  });

  const onSubmit = (data: InviteUserForm) => {
    inviteUserMutation.mutate(data);
  };

  const handleEditUser = (user: TeamUser) => {
    setSelectedUser(user);
    editForm.reset({
      permissions: {
        canEditFormulas: user.permissions?.canEditFormulas ?? true,
        canViewLeads: user.permissions?.canViewLeads ?? true,
        canManageLeads: user.permissions?.canManageLeads ?? false,
        canManageCalendar: user.permissions?.canManageCalendar ?? false,
        canAccessDesign: user.permissions?.canAccessDesign ?? false,
        canViewStats: user.permissions?.canViewStats ?? false,
        canManageSettings: user.permissions?.canManageSettings ?? false,
        canCreateWebsites: user.permissions?.canCreateWebsites ?? false,
        canManageWebsites: user.permissions?.canManageWebsites ?? false,
        canAccessAI: user.permissions?.canAccessAI ?? false,
        canUseMeasureMap: user.permissions?.canUseMeasureMap ?? false,
        canCreateUpsells: user.permissions?.canCreateUpsells ?? false,
        canAccessZapier: user.permissions?.canAccessZapier ?? false,
        canManageEmailTemplates: user.permissions?.canManageEmailTemplates ?? false,
        canViewReports: user.permissions?.canViewReports ?? false,
        canExportData: user.permissions?.canExportData ?? false,
        canManageTeam: user.permissions?.canManageTeam ?? false,
        canManageBilling: user.permissions?.canManageBilling ?? false,
        canAccessAPI: user.permissions?.canAccessAPI ?? false,
        canManageIntegrations: user.permissions?.canManageIntegrations ?? false,
        canCustomizeBranding: user.permissions?.canCustomizeBranding ?? false,
      },
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (data: EditPermissionsForm) => {
    if (selectedUser) {
      updateUserMutation.mutate({ userId: selectedUser.id, data });
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleResendInvite = (userId: string) => {
    resendInviteMutation.mutate(userId);
  };

  const getPermissionBadges = (permissions: TeamUser['permissions']) => {
    const badges = [];
    if (permissions?.canEditFormulas) badges.push("Formulas");
    if (permissions?.canViewLeads) badges.push("Leads");
    if (permissions?.canManageLeads) badges.push("Lead Mgmt");
    if (permissions?.canManageCalendar) badges.push("Calendar");
    if (permissions?.canAccessDesign) badges.push("Design");
    if (permissions?.canViewStats) badges.push("Stats");
    if (permissions?.canManageSettings) badges.push("Settings");
    if (permissions?.canManageWebsites) badges.push("Websites");
    if (permissions?.canAccessAI) badges.push("AI");
    if (permissions?.canAccessZapier) badges.push("Zapier");
    if (permissions?.canManageEmailTemplates) badges.push("Email");
    if (permissions?.canManageTeam) badges.push("Team");
    if (permissions?.canManageBilling) badges.push("Billing");
    if (permissions?.canAccessAPI) badges.push("API");
    if (permissions?.canManageUsers) badges.push("Admin");
    return badges;
  };

  const totalMembers = users.length;
  const activeMembers = users.filter((user) => user.userType === "owner" || user.isActive).length;
  const pendingInvites = users.filter((user) => user.userType !== "owner" && !user.isActive).length;
  const teamMembers = users.filter((user) => user.userType !== "owner").length;

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "active") {
      return user.userType === "owner" || user.isActive;
    }
    if (statusFilter === "pending") {
      return user.userType !== "owner" && !user.isActive;
    }
    return true;
  });

  if (!canAccess("canManageTeam")) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600 mb-4">You don't have permission to manage team members.</p>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center py-12">
            <div className="animate-pulse">Loading team members...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load team members</h3>
              <p className="text-gray-600 mb-4">Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="border-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-gray-950 dark:to-purple-950">
          <CardContent className="py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
                      Team Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Invite teammates and control access across your workspace.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{teamMembers} team members</span>
                  <span className="h-1 w-1 rounded-full bg-gray-400" />
                  <span>{activeMembers} active</span>
                  {pendingInvites > 0 && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-gray-400" />
                      <span>{pendingInvites} pending</span>
                    </>
                  )}
                </div>
              </div>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="button-invite-user">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Team Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Add a new team member to your organization. They'll receive an email with instructions to set up their account.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Permissions</Label>
                    {permissionOptions.map((option) => (
                      <FormField
                        key={option.name}
                        control={form.control}
                        name={option.name as any}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel className="text-sm font-normal">{option.label}</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid={option.testId}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={inviteUserMutation.isPending}
                      className="flex-1"
                      data-testid="button-submit-invite"
                    >
                      {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </form>
              </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update permissions for {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <FormLabel className="text-sm font-medium">Account Active</FormLabel>
                        <p className="text-xs text-gray-500">Disable to temporarily suspend access</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Permissions</Label>
                  {permissionOptions.map((option) => (
                    <FormField
                      key={option.name}
                      control={editForm.control}
                      name={option.name as any}
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="text-sm font-normal">{option.label}</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-permissions"
                  >
                    {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-blue-100 dark:border-blue-900">
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{totalMembers}</p>
            </CardContent>
          </Card>
          <Card className="border border-green-100 dark:border-green-900">
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-wide text-green-600 dark:text-green-300">Active</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{activeMembers}</p>
            </CardContent>
          </Card>
          <Card className="border border-amber-100 dark:border-amber-900">
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-300">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{pendingInvites}</p>
            </CardContent>
          </Card>
          <Card className="border border-purple-100 dark:border-purple-900">
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-300">Team Only</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{teamMembers}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Search, filter, and manage access for your team.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by name or email"
                    className="pl-9"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant={statusFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("active")}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredUsers.map((user) => {
              const permissions = getPermissionBadges(user.permissions || {});
              const previewPermissions = permissions.slice(0, 4);
              const remainingPermissions = permissions.length - previewPermissions.length;

              return (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  data-testid={`card-user-${user.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.userType === 'owner'
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-blue-500 to-purple-500'
                      }`}>
                        {user.userType === 'owner' ? (
                          <Crown className="w-5 h-5 text-white" />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {user.firstName} {user.lastName}
                          </h3>
                          <Badge variant={user.userType === 'owner' ? 'default' : 'secondary'}>
                            {user.userType === 'owner' ? 'Owner' : 'Team Member'}
                          </Badge>
                          {user.userType !== 'owner' && !user.isActive && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Invite
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {user.userType === 'owner' ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Full Access</span>
                          </>
                        ) : (
                          <>
                            <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-amber-400'}`} />
                            <span>{user.isActive ? 'Active' : 'Pending'}</span>
                          </>
                        )}
                      </div>
                      {user.userType !== 'owner' && (
                        <div className="flex gap-1">
                          {!user.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvite(user.id)}
                              disabled={resendInviteMutation.isPending}
                              title="Resend invitation email"
                              data-testid={`button-resend-invite-${user.id}`}
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit permissions"
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                            disabled={deleteUserMutation.isPending}
                            title="Remove team member"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 block">Permissions</Label>
                    <div className="flex flex-wrap gap-2">
                      {previewPermissions.length > 0 ? (
                        previewPermissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No specific permissions set</span>
                      )}
                      {remainingPermissions > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{remainingPermissions} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {filteredUsers.length === 0 && users.length > 0 && (
          <Card className="text-center py-10">
            <CardContent>
              <User className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No matches found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or filter.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {users.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No team members yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your team by inviting your first member.</p>
              <Button onClick={() => setIsInviteDialogOpen(true)} data-testid="button-first-invite">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>
            </CardContent>
          </Card>
        )}

        {users.length === 1 && users[0].userType === 'owner' && (
          <Card className="border-dashed border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
            <CardContent className="py-8 text-center">
              <UserPlus className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Grow your team</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                Invite salespeople or employees to help manage leads, update calculators, and grow your business.
              </p>
              <Button 
                onClick={() => setIsInviteDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-grow-team"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Your First Team Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
