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
import { UserPlus, Settings, Trash2, Crown, User, Mail, RefreshCw, Clock, CheckCircle } from "lucide-react";
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
    canManageCalendar: z.boolean().default(false),
    canAccessDesign: z.boolean().default(false),
    canViewStats: z.boolean().default(false),
  }),
});

const editPermissionsSchema = z.object({
  permissions: z.object({
    canEditFormulas: z.boolean().default(true),
    canViewLeads: z.boolean().default(true),
    canManageCalendar: z.boolean().default(false),
    canAccessDesign: z.boolean().default(false),
    canViewStats: z.boolean().default(false),
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
    canManageCalendar?: boolean;
    canAccessDesign?: boolean;
    canViewStats?: boolean;
  };
  createdAt: string;
}

export default function UsersPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();
  const { isOwner, canAccess } = useUserPermissions();
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
        canManageCalendar: false,
        canAccessDesign: false,
        canViewStats: false,
      },
    },
  });

  const editForm = useForm<EditPermissionsForm>({
    resolver: zodResolver(editPermissionsSchema),
    defaultValues: {
      permissions: {
        canEditFormulas: true,
        canViewLeads: true,
        canManageCalendar: false,
        canAccessDesign: false,
        canViewStats: false,
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
        canManageCalendar: user.permissions?.canManageCalendar ?? false,
        canAccessDesign: user.permissions?.canAccessDesign ?? false,
        canViewStats: user.permissions?.canViewStats ?? false,
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
    if (permissions?.canManageCalendar) badges.push("Calendar");
    if (permissions?.canAccessDesign) badges.push("Design");
    if (permissions?.canViewStats) badges.push("Stats");
    if (permissions?.canManageUsers) badges.push("Users");
    return badges;
  };

  if (!isOwner) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600 mb-4">Only account owners can manage team members.</p>
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">Team Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your team members and their permissions</p>
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
                    
                    <FormField
                      control={form.control}
                      name="permissions.canEditFormulas"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="text-sm font-normal">Edit Calculators</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-edit-formulas" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permissions.canViewLeads"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="text-sm font-normal">View Leads</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-view-leads" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permissions.canManageCalendar"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="text-sm font-normal">Manage Calendar</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-manage-calendar" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permissions.canAccessDesign"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="text-sm font-normal">Access Design</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-access-design" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permissions.canViewStats"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel className="text-sm font-normal">View Statistics</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-view-stats" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
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
                  
                  <FormField
                    control={editForm.control}
                    name="permissions.canEditFormulas"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-sm font-normal">Edit Calculators</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="permissions.canViewLeads"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-sm font-normal">View Leads</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="permissions.canManageCalendar"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-sm font-normal">Manage Calendar</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="permissions.canAccessDesign"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-sm font-normal">Access Design</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="permissions.canViewStats"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-sm font-normal">View Statistics</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-colors" data-testid={`card-user-${user.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
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
                      <CardTitle className="text-lg">
                        {user.firstName} {user.lastName}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
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
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Permissions</Label>
                  <div className="flex flex-wrap gap-1">
                    {getPermissionBadges(user.permissions || {}).length > 0 ? (
                      getPermissionBadges(user.permissions || {}).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No specific permissions set</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    {user.userType === 'owner' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Full Access</span>
                      </>
                    ) : (
                      <>
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-amber-400'}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.isActive ? 'Active' : 'Pending'}
                        </span>
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
              </CardContent>
            </Card>
          ))}
        </div>

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
