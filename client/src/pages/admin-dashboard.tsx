import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AppHeader from "@/components/app-header";
import SupportTickets from "@/pages/support-tickets";
import { 
  Users, 
  Activity, 
  DollarSign, 
  Globe,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  Search,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  UserCheck,
  LogIn,
  Save,
  X,
  Ticket,
  Image,
  Upload,
  Plus
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalWebsites: number;
  totalFormulas: number;
  totalLeads: number;
  totalRevenue: number;
  activeSubscriptions: number;
  monthlyGrowth: number;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  organizationName: string;
  plan: string;
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  lastActivity?: string;
}

interface AdminLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  calculatedPrice: number;
  stage: string;
  createdAt: string;
  formulaName?: string;
}

interface AdminIcon {
  id: number;
  name: string;
  filename: string;
  category: string;
  description?: string;
  isActive: boolean;
  url: string;
  createdAt: string;
}

interface AdminWebsite {
  id: number;
  siteName: string;
  userId: string;
  userEmail: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [newIconName, setNewIconName] = useState("");
  const [newIconCategory, setNewIconCategory] = useState("general");
  const [newIconDescription, setNewIconDescription] = useState("");
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null);
  const [iconUploadDialogOpen, setIconUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSuperAdmin, isLoading } = useAuth();

  // Redirect non-super admin users
  if (!isLoading && !isSuperAdmin) {
    return <Redirect to="/" />;
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch all leads
  const { data: leads, isLoading: leadsLoading } = useQuery<AdminLead[]>({
    queryKey: ['/api/admin/leads'],
  });

  // Fetch all websites
  const { data: websites, isLoading: websitesLoading } = useQuery<AdminWebsite[]>({
    queryKey: ['/api/admin/websites'],
  });

  // Fetch all icons
  const { data: icons, isLoading: iconsLoading } = useQuery<AdminIcon[]>({
    queryKey: ['/api/icons'],
  });

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeads = leads?.filter(lead =>
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: "default", color: "text-green-800 bg-green-100" },
      inactive: { variant: "secondary", color: "text-gray-800 bg-gray-100" },
      canceled: { variant: "destructive", color: "text-red-800 bg-red-100" },
      past_due: { variant: "destructive", color: "text-orange-800 bg-orange-100" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.inactive;
    return <Badge variant={config.variant as any} className={`${config.color} text-xs`}>{status}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const planColors = {
      starter: "text-blue-800 bg-blue-100",
      professional: "text-purple-800 bg-purple-100", 
      enterprise: "text-gold-800 bg-yellow-100"
    };
    
    const color = planColors[plan as keyof typeof planColors] || planColors.starter;
    return <Badge className={`${color} text-xs capitalize`}>{plan}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // User editing mutation
  const editUserMutation = useMutation({
    mutationFn: async (userData: { id: string; updates: Partial<AdminUser> }) => {
      return apiRequest('PATCH', `/api/admin/users/${userData.id}`, userData.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // User impersonation mutation
  const impersonateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/admin/impersonate/${userId}`, {});
    },
    onSuccess: (data: any) => {
      // Redirect to user's dashboard
      window.location.href = `/?impersonate=${data.token}`;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to impersonate user",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleImpersonateUser = (user: AdminUser) => {
    setSelectedUser(user);
    setImpersonateDialogOpen(true);
  };

  const confirmImpersonate = () => {
    if (selectedUser) {
      impersonateUserMutation.mutate(selectedUser.id);
    }
    setImpersonateDialogOpen(false);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      editUserMutation.mutate({
        id: selectedUser.id,
        updates: {
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName,
          organizationName: selectedUser.organizationName,
          plan: selectedUser.plan,
          isActive: selectedUser.isActive,
        },
      });
    }
  };

  // Icon management mutations
  const uploadIconMutation = useMutation({
    mutationFn: async (iconData: { name: string; category: string; description: string; file: File }) => {
      const formData = new FormData();
      formData.append('icon', iconData.file);
      formData.append('name', iconData.name);
      formData.append('category', iconData.category);
      formData.append('description', iconData.description);
      
      const response = await fetch('/api/icons', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload icon');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/icons'] });
      setIconUploadDialogOpen(false);
      setNewIconName("");
      setNewIconCategory("general");
      setNewIconDescription("");
      setSelectedIconFile(null);
      toast({
        title: "Success",
        description: "Icon uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload icon",
        variant: "destructive",
      });
    },
  });

  const toggleIconStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest('PUT', `/api/icons/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/icons'] });
      toast({
        title: "Success",
        description: "Icon status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update icon status",
        variant: "destructive",
      });
    },
  });

  const deleteIconMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/icons/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/icons'] });
      toast({
        title: "Success",
        description: "Icon deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete icon",
        variant: "destructive",
      });
    },
  });

  const handleUploadIcon = () => {
    if (!selectedIconFile || !newIconName) {
      toast({
        title: "Error",
        description: "Please provide icon name and select a file",
        variant: "destructive",
      });
      return;
    }

    uploadIconMutation.mutate({
      name: newIconName,
      category: newIconCategory,
      description: newIconDescription,
      file: selectedIconFile,
    });
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppHeader />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AppHeader />
      <div className="p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  Admin Dashboard
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  Manage users, monitor application performance, and view analytics
                </p>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Settings className="h-4 w-4 mr-2" />
                Admin Settings
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats?.activeUsers || 0} active users
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Websites</CardTitle>
                <Globe className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalWebsites || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Across all users
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
                <Mail className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalLeads || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Generated leads
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats?.activeSubscriptions || 0} subscriptions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-600" />
                  Formulas Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-900">{stats?.totalFormulas || 0}</div>
                <p className="text-xs text-gray-500">Active pricing calculators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  Monthly Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">+{stats?.monthlyGrowth || 0}%</div>
                <p className="text-xs text-gray-500">User growth this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-gray-600" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">
                  {stats?.totalLeads && stats?.totalUsers 
                    ? Math.round((stats.totalLeads / stats.totalUsers) * 100) / 100
                    : 0}
                </div>
                <p className="text-xs text-gray-500">Leads per user</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Leads</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">Support</span>
              </TabsTrigger>
              <TabsTrigger value="websites" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Websites</span>
              </TabsTrigger>
              <TabsTrigger value="icons" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Icons</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users, leads, or websites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Organization</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersLoading ? (
                          [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          filteredUsers?.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {user.organizationName || 'Not set'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getPlanBadge(user.plan)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {user.isActive ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  {getStatusBadge(user.subscriptionStatus)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">
                                  {formatDate(user.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleImpersonateUser(user)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <LogIn className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Lead Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contact</TableHead>
                          <TableHead>Formula</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leadsLoading ? (
                          [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          filteredLeads?.map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-gray-900">{lead.name}</div>
                                  <div className="text-sm text-gray-500">{lead.email}</div>
                                  {lead.phone && (
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {lead.phone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{lead.formulaName || 'Unknown'}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {formatCurrency(lead.calculatedPrice)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={lead.stage === 'completed' ? 'default' : 'secondary'}>
                                  {lead.stage}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">
                                  {formatDate(lead.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Websites Tab */}
            <TabsContent value="websites">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Website</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {websitesLoading ? (
                          [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          websites?.map((website) => (
                            <TableRow key={website.id}>
                              <TableCell>
                                <div className="font-medium text-gray-900">{website.siteName}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">{website.userEmail}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={website.status === 'active' ? 'default' : 'secondary'}>
                                  {website.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">
                                  {formatDate(website.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Icons Management Tab */}
            <TabsContent value="icons">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5" />
                      Icon Library Management
                    </CardTitle>
                    <Dialog open={iconUploadDialogOpen} onOpenChange={setIconUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Upload Icon
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload New Icon
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="iconName">Icon Name</Label>
                            <Input
                              id="iconName"
                              value={newIconName}
                              onChange={(e) => setNewIconName(e.target.value)}
                              placeholder="Enter icon name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="iconCategory">Category</Label>
                            <Select value={newIconCategory} onValueChange={setNewIconCategory}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="construction">Construction</SelectItem>
                                <SelectItem value="cleaning">Cleaning</SelectItem>
                                <SelectItem value="automotive">Automotive</SelectItem>
                                <SelectItem value="landscaping">Landscaping</SelectItem>
                                <SelectItem value="home">Home Services</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="iconDescription">Description (Optional)</Label>
                            <Textarea
                              id="iconDescription"
                              value={newIconDescription}
                              onChange={(e) => setNewIconDescription(e.target.value)}
                              placeholder="Describe the icon usage"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="iconFile">Icon File</Label>
                            <Input
                              id="iconFile"
                              type="file"
                              accept="image/*"
                              onChange={(e) => setSelectedIconFile(e.target.files?.[0] || null)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Supported formats: PNG, JPG, SVG. Max size: 2MB
                            </p>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={handleUploadIcon}
                              disabled={uploadIconMutation.isPending}
                              className="flex-1"
                            >
                              {uploadIconMutation.isPending ? "Uploading..." : "Upload Icon"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIconUploadDialogOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {iconsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : icons && icons.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {icons.map((icon) => (
                        <div key={icon.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                            <img
                              src={icon.url}
                              alt={icon.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{icon.name}</h4>
                            <p className="text-xs text-gray-500">{icon.category}</p>
                            {icon.description && (
                              <p className="text-xs text-gray-400 line-clamp-2">{icon.description}</p>
                            )}
                            <div className="flex items-center justify-between pt-2">
                              <Badge variant={icon.isActive ? "default" : "secondary"} className="text-xs">
                                {icon.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleIconStatusMutation.mutate({
                                    id: icon.id,
                                    isActive: !icon.isActive
                                  })}
                                  disabled={toggleIconStatusMutation.isPending}
                                >
                                  {icon.isActive ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteIconMutation.mutate(icon.id)}
                                  disabled={deleteIconMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Icons Available</h3>
                      <p className="text-gray-600 mb-4">
                        Upload icons to build your formula library
                      </p>
                      <Button
                        onClick={() => setIconUploadDialogOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload First Icon
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tickets Tab */}
            <TabsContent value="support">
              <SupportTickets />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Analytics Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                      <p className="text-gray-600 mb-4">
                        Detailed charts and analytics will be available here
                      </p>
                      <Button variant="outline">
                        Configure Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit User Account
                </DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={selectedUser.firstName || ""}
                        onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={selectedUser.lastName || ""}
                        onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      value={selectedUser.organizationName || ""}
                      onChange={(e) => setSelectedUser({ ...selectedUser, organizationName: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="plan">Subscription Plan</Label>
                    <Select 
                      value={selectedUser.plan} 
                      onValueChange={(value) => setSelectedUser({ ...selectedUser, plan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={selectedUser.isActive}
                      onChange={(e) => setSelectedUser({ ...selectedUser, isActive: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isActive">Account Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditDialogOpen(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveUser}
                      disabled={editUserMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editUserMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Impersonate User Dialog */}
          <Dialog open={impersonateDialogOpen} onOpenChange={setImpersonateDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-orange-600" />
                  Access User Account
                </DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-900">Admin Access Warning</h4>
                        <p className="text-sm text-orange-800 mt-1">
                          You are about to access this user's account as an administrator. 
                          All actions will be logged for security purposes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">User:</span>
                      <span>{selectedUser.firstName} {selectedUser.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Email:</span>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Organization:</span>
                      <span>{selectedUser.organizationName || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Plan:</span>
                      <span className="capitalize">{selectedUser.plan}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setImpersonateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={confirmImpersonate}
                      disabled={impersonateUserMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      {impersonateUserMutation.isPending ? "Accessing..." : "Access Account"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}