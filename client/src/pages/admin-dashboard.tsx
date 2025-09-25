import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Redirect, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
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
  Plus,
  Tags,
  FileText,
  MessageCircle,
  Clock,
  User,
  Send,
  RefreshCw,
  Filter,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layout
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SupportTicket, TicketMessage, FormulaTemplate, InsertFormulaTemplate, IconTag, InsertIconTag } from "@shared/schema";
import IconSelector from "@/components/icon-selector";

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
  isBetaTester: boolean;
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

interface CustomWebsiteTemplate {
  id: number;
  name: string;
  description?: string;
  industry: string;
  thumbnailUrl: string;
  previewUrl: string;
  templateId: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState("formulas");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [newIconName, setNewIconName] = useState("");
  const [newIconCategory, setNewIconCategory] = useState("general");
  const [newIconDescription, setNewIconDescription] = useState("");
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null);
  const [iconUploadDialogOpen, setIconUploadDialogOpen] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState("");
  const [iconCategoryFilter, setIconCategoryFilter] = useState("all");
  const [iconStatusFilter, setIconStatusFilter] = useState("all");
  
  // Website template management state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomWebsiteTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateIndustry, setNewTemplateIndustry] = useState("");
  const [newTemplateThumbnail, setNewTemplateThumbnail] = useState("");
  const [newTemplatePreview, setNewTemplatePreview] = useState("");
  const [newTemplateId, setNewTemplateId] = useState("");
  const [newTemplateOrder, setNewTemplateOrder] = useState(0);
  
  // Formula template management state
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
  const [editingFormulaTemplate, setEditingFormulaTemplate] = useState<FormulaTemplate | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateTitle, setEditTemplateTitle] = useState("");
  const [editTemplateCategory, setEditTemplateCategory] = useState("");
  const [editTemplateDescription, setEditTemplateDescription] = useState("");
  const [editTemplateIconId, setEditTemplateIconId] = useState<number | null>(null);
  const [editTemplateIconUrl, setEditTemplateIconUrl] = useState<string | null>(null);
  
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
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

  // Fetch all formula templates
  const { data: formulaTemplates, isLoading: formulaTemplatesLoading } = useQuery<FormulaTemplate[]>({
    queryKey: ['/api/admin/formula-templates'],
  });

  // Fetch custom website templates
  const { data: customTemplates, isLoading: customTemplatesLoading } = useQuery<CustomWebsiteTemplate[]>({
    queryKey: ['/api/admin/custom-website-templates'],
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

  const filteredIcons = icons?.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
                         icon.description?.toLowerCase().includes(iconSearchQuery.toLowerCase());
    const matchesCategory = iconCategoryFilter === 'all' || icon.category === iconCategoryFilter;
    const matchesStatus = iconStatusFilter === 'all' || 
                         (iconStatusFilter === 'active' && icon.isActive) ||
                         (iconStatusFilter === 'inactive' && !icon.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
      enterprise: "text-gold-800 bg-yellow-100",
      trial: "text-gray-800 bg-gray-100",
      standard: "text-blue-800 bg-blue-100",
      plus: "text-purple-800 bg-purple-100",
      plus_seo: "text-yellow-800 bg-yellow-100"
    };
    
    const color = planColors[plan as keyof typeof planColors] || planColors.starter;
    return <Badge className={`${color} text-xs capitalize`}>{plan}</Badge>;
  };

  const getBetaTesterBadge = (isBetaTester: boolean) => {
    if (!isBetaTester) return null;
    return <Badge className="text-green-800 bg-green-100 text-xs">Beta Tester</Badge>;
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

  const handleManagePermissions = (user: AdminUser) => {
    setSelectedUser(user);
    setPermissionsDialogOpen(true);
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
          isBetaTester: selectedUser.isBetaTester,
          permissions: selectedUser.permissions,
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

  // Formula template mutations
  const updateFormulaTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormulaTemplate> }) => {
      return apiRequest('PUT', `/api/admin/formula-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/formula-templates'] });
      setEditTemplateDialogOpen(false);
      setEditingFormulaTemplate(null);
      toast({
        title: "Success",
        description: "Formula template updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update formula template",
        variant: "destructive",
      });
    },
  });

  const deleteFormulaTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/formula-templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/formula-templates'] });
      toast({
        title: "Success",
        description: "Formula template deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete formula template",
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

  // Formula template helper functions
  const handleEditFormulaTemplate = (template: FormulaTemplate) => {
    setEditingFormulaTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateTitle(template.title);
    setEditTemplateCategory(template.category);
    setEditTemplateDescription(template.description || "");
    setEditTemplateIconId(template.iconId);
    setEditTemplateIconUrl(template.iconUrl);
    setEditTemplateDialogOpen(true);
  };

  const handleSaveFormulaTemplate = () => {
    if (!editingFormulaTemplate || !editTemplateName || !editTemplateTitle || !editTemplateCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateFormulaTemplateMutation.mutate({
      id: editingFormulaTemplate.id,
      data: {
        name: editTemplateName,
        title: editTemplateTitle,
        category: editTemplateCategory,
        description: editTemplateDescription,
        iconId: editTemplateIconId,
        iconUrl: editTemplateIconUrl,
      },
    });
  };

  const resetFormulaTemplateForm = () => {
    setEditingFormulaTemplate(null);
    setEditTemplateName("");
    setEditTemplateTitle("");
    setEditTemplateCategory("");
    setEditTemplateDescription("");
    setEditTemplateIconId(null);
    setEditTemplateIconUrl(null);
  };

  // Template management mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: {
      name: string;
      description?: string;
      industry: string;
      thumbnailUrl: string;
      previewUrl: string;
      templateId: string;
      displayOrder: number;
      status: 'active' | 'inactive';
    }) => {
      return apiRequest('POST', '/api/admin/custom-website-templates', templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-website-templates'] });
      setTemplateDialogOpen(false);
      resetTemplateForm();
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: {
      id: number;
      name: string;
      description?: string;
      industry: string;
      thumbnailUrl: string;
      previewUrl: string;
      templateId: string;
      displayOrder: number;
      status: 'active' | 'inactive';
    }) => {
      return apiRequest('PUT', `/api/admin/custom-website-templates/${id}`, templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-website-templates'] });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/custom-website-templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/custom-website-templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const resetTemplateForm = () => {
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateIndustry("");
    setNewTemplateThumbnail("");
    setNewTemplatePreview("");
    setNewTemplateId("");
    setNewTemplateOrder(0);
  };

  const handleEditTemplate = (template: CustomWebsiteTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateDescription(template.description || "");
    setNewTemplateIndustry(template.industry);
    setNewTemplateThumbnail(template.thumbnailUrl);
    setNewTemplatePreview(template.previewUrl);
    setNewTemplateId(template.templateId);
    setNewTemplateOrder(template.displayOrder);
    setTemplateDialogOpen(true);
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName || !newTemplateIndustry || !newTemplateId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const templateData = {
      name: newTemplateName,
      description: newTemplateDescription,
      industry: newTemplateIndustry,
      thumbnailUrl: newTemplateThumbnail,
      previewUrl: newTemplatePreview,
      templateId: newTemplateId,
      displayOrder: newTemplateOrder,
      status: 'active' as const,
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...templateData });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  if (statsLoading) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 lg:gap-3">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-600" />
                  Admin Dashboard
                </h1>
                <p className="text-sm lg:text-base text-gray-600 mt-1 lg:mt-2">
                  Manage users, monitor application performance, and view analytics
                </p>
              </div>
              
              {/* Mobile-optimized action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button 
                  onClick={() => window.location.href = '/admin/duda-templates'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-3"
                  size="sm"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Duda </span>Templates
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin/template-tags'}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-3"
                  size="sm"
                >
                  <Tags className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Template </span>Tags
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-3" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Admin </span>Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Users</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{stats?.activeUsers || 0} active users</span>
                  <span className="sm:hidden">{stats?.activeUsers || 0} active</span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Websites</CardTitle>
                <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.totalWebsites || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">Across all users</span>
                  <span className="sm:hidden">Total sites</span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Leads</CardTitle>
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.totalLeads || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">Generated leads</span>
                  <span className="sm:hidden">Generated</span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Revenue</CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{stats?.activeSubscriptions || 0} subscriptions</span>
                  <span className="sm:hidden">{stats?.activeSubscriptions || 0} subs</span>
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

          {/* Tabs - Mobile-optimized navigation */}
          <Tabs defaultValue="users" className="space-y-4 lg:space-y-6">
            {/* Mobile horizontal scroll tabs */}
            <div className="overflow-x-auto">
              <TabsList className="grid w-max min-w-full grid-cols-6 gap-1 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 min-w-0 whitespace-nowrap text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Users</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="leads" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 min-w-0 whitespace-nowrap text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all"
                >
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Leads</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="content" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 min-w-0 whitespace-nowrap text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Content</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="websites" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 min-w-0 whitespace-nowrap text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all"
                >
                  <Globe className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Sites</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="icons" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 min-w-0 whitespace-nowrap text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all"
                >
                  <Image className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Icons</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="system" 
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 min-w-0 whitespace-nowrap text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 transition-all"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>System</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile-optimized Search Bar */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search users, leads, or websites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6 py-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b">
                          <TableHead className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap">User</TableHead>
                          <TableHead className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap min-w-[120px]">Organization</TableHead>
                          <TableHead className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap">Plan</TableHead>
                          <TableHead className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap">Status</TableHead>
                          <TableHead className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap">Tags</TableHead>
                          <TableHead className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap">Permissions</TableHead>
                          <TableHead className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap min-w-[100px]">Joined</TableHead>
                          <TableHead className="px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap text-right min-w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersLoading ? (
                          [...Array(5)].map((_, i) => (
                            <TableRow key={i} className="border-b">
                              <TableCell className="px-4 py-3"><div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell className="px-4 py-3"><div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell className="px-4 py-3"><div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell className="px-4 py-3"><div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell className="px-4 py-3"><div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell className="px-4 py-3"><div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell className="px-4 py-3"><div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                              <TableCell className="px-4 py-3"><div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          filteredUsers?.map((user) => (
                            <TableRow key={user.id} className="border-b hover:bg-gray-50">
                              <TableCell className="px-4 py-3">
                                <div className="min-w-[140px]">
                                  <div className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="text-xs sm:text-sm text-gray-600 truncate">
                                  {user.organizationName || 'Not set'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {getPlanBadge(user.plan)}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {user.isActive ? (
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                                  )}
                                  <div className="hidden sm:block">
                                    {getStatusBadge(user.subscriptionStatus)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {getBetaTesterBadge(user.isBetaTester)}
                                  {user.userType === 'super_admin' && (
                                    <Badge className="text-red-800 bg-red-100 text-xs px-1 py-0">Admin</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleManagePermissions(user)}
                                  className="text-xs px-2 py-1 h-7"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  Manage
                                </Button>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                  {formatDate(user.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleImpersonateUser(user)}
                                    className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                                  >
                                    <LogIn className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditUser(user)}
                                    className="h-8 w-8 p-0"
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

            {/* Content Tab */}
            <TabsContent value="content">
              <div className="space-y-6">
                {/* Sub-navigation for Content */}
                <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setActiveSubTab('formulas')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSubTab === 'formulas'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Shield className="h-4 w-4 inline mr-2" />
                    Formulas
                  </button>
                  <button
                    onClick={() => setActiveSubTab('icons')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSubTab === 'icons'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Image className="h-4 w-4 inline mr-2" />
                    Icons
                  </button>
                  <button
                    onClick={() => setActiveSubTab('duda-templates')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSubTab === 'duda-templates'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Tags className="h-4 w-4 inline mr-2" />
                    Duda Templates
                  </button>
                </div>

                {/* Formula Templates */}
                {activeSubTab === 'formulas' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Formula Templates ({formulaTemplates?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {formulaTemplatesLoading ? (
                        <div className="text-center py-8">Loading formula templates...</div>
                      ) : formulaTemplates && formulaTemplates.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Template</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Icon</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Times Used</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formulaTemplates.map((template) => (
                                <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium text-gray-900" data-testid={`text-template-name-${template.id}`}>
                                        {template.name}
                                      </div>
                                      <div className="text-sm text-gray-600" data-testid={`text-template-title-${template.id}`}>
                                        {template.title}
                                      </div>
                                      {template.description && (
                                        <div className="text-xs text-gray-400 line-clamp-2" data-testid={`text-template-description-${template.id}`}>
                                          {template.description}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize" data-testid={`badge-category-${template.id}`}>
                                      {template.category.replace('-', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {template.iconUrl ? (
                                      <div className="flex items-center gap-2" data-testid={`icon-display-${template.id}`}>
                                        <img 
                                          src={template.iconUrl} 
                                          alt={template.name} 
                                          className="w-6 h-6 object-contain" 
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center" data-testid={`icon-placeholder-${template.id}`}>
                                        <FileText className="w-4 h-4 text-gray-400" />
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={template.isActive ? "default" : "secondary"} 
                                      data-testid={`status-${template.id}`}
                                    >
                                      {template.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell data-testid={`text-usage-${template.id}`}>
                                    {template.timesUsed || 0}
                                  </TableCell>
                                  <TableCell data-testid={`text-created-${template.id}`}>
                                    <div className="text-sm text-gray-600">
                                      {formatDate(template.createdAt)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditFormulaTemplate(template)}
                                        data-testid={`button-edit-${template.id}`}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => deleteFormulaTemplateMutation.mutate(template.id)}
                                        disabled={deleteFormulaTemplateMutation.isPending}
                                        className="text-red-600 hover:text-red-700"
                                        data-testid={`button-delete-${template.id}`}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Formula Templates</h3>
                          <p className="text-gray-600">
                            No formula templates have been created yet. Users can create templates from their formulas.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Icons Management */}
                {activeSubTab === 'icons' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Icon Library Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Header with Upload Button */}
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-medium">Icon Library</h3>
                            <p className="text-sm text-gray-600">Manage icons used throughout the application</p>
                          </div>
                          <Dialog open={iconUploadDialogOpen} onOpenChange={setIconUploadDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Upload Icon
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload New Icon</DialogTitle>
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
                                      <SelectValue />
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
                                  <Input
                                    id="iconDescription"
                                    value={newIconDescription}
                                    onChange={(e) => setNewIconDescription(e.target.value)}
                                    placeholder="Brief description of the icon"
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
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setIconUploadDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (selectedIconFile && newIconName) {
                                        uploadIconMutation.mutate({
                                          name: newIconName,
                                          category: newIconCategory,
                                          description: newIconDescription,
                                          file: selectedIconFile
                                        });
                                      }
                                    }}
                                    disabled={!selectedIconFile || !newIconName || uploadIconMutation.isPending}
                                  >
                                    {uploadIconMutation.isPending ? 'Uploading...' : 'Upload Icon'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Search and Filter */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search icons by name or description..."
                                className="pl-10"
                                value={iconSearchQuery}
                                onChange={(e) => setIconSearchQuery(e.target.value)}
                              />
                            </div>
                          </div>
                          <Select value={iconCategoryFilter} onValueChange={setIconCategoryFilter}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="construction">Construction</SelectItem>
                              <SelectItem value="cleaning">Cleaning</SelectItem>
                              <SelectItem value="automotive">Automotive</SelectItem>
                              <SelectItem value="landscaping">Landscaping</SelectItem>
                              <SelectItem value="home">Home Services</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={iconStatusFilter} onValueChange={setIconStatusFilter}>
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Icons Grid */}
                        {iconsLoading ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[...Array(12)].map((_, i) => (
                              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredIcons?.map((icon) => (
                              <div key={icon.id} className="group relative border rounded-lg p-3 hover:shadow-md transition-shadow">
                                <div className="aspect-square mb-2 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                                  <img
                                    src={icon.url || `/api/icons/file/${icon.filename}`}
                                    alt={icon.name}
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <Image className="h-8 w-8" />
                                  </div>
                                </div>
                                <div className="text-xs text-center">
                                  <p className="font-medium truncate" title={icon.name}>{icon.name}</p>
                                  <p className="text-gray-500 capitalize">{icon.category}</p>
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Badge variant={icon.isActive ? "default" : "secondary"} className="text-xs">
                                    {icon.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => toggleIconStatusMutation.mutate({ id: icon.id, isActive: !icon.isActive })}
                                      disabled={toggleIconStatusMutation.isPending}
                                      className="h-8 w-8 p-0"
                                    >
                                      {icon.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to delete "${icon.name}"?`)) {
                                          deleteIconMutation.mutate(icon.id);
                                        }
                                      }}
                                      disabled={deleteIconMutation.isPending}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Empty State */}
                        {!iconsLoading && filteredIcons?.length === 0 && (
                          <div className="text-center py-12">
                            <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Icons Found</h3>
                            <p className="text-gray-600 mb-4">
                              {iconSearchQuery || iconCategoryFilter !== 'all' || iconStatusFilter !== 'all'
                                ? "No icons match your current filters. Try adjusting your search criteria."
                                : "No icons have been uploaded yet. Upload your first icon to get started."
                              }
                            </p>
                            {(!iconSearchQuery && iconCategoryFilter === 'all' && iconStatusFilter === 'all') && (
                              <Button onClick={() => setIconUploadDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Upload First Icon
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Summary Stats */}
                        {!iconsLoading && icons && icons.length > 0 && (
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>
                                Showing {filteredIcons?.length || 0} of {icons.length} icons
                              </span>
                              <div className="flex space-x-4">
                                <span>{icons.filter(i => i.isActive).length} Active</span>
                                <span>{icons.filter(i => !i.isActive).length} Inactive</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Duda Templates */}
                {activeSubTab === 'duda-templates' && (
                  <DudaTemplatesSection />
                )}
              </div>
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

            {/* System Tab */}
            <TabsContent value="system">
              <div className="space-y-6">
                {/* Sub-navigation for System */}
                <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setActiveSubTab('support')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSubTab === 'support'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Ticket className="h-4 w-4 inline mr-2" />
                    Support Tickets
                  </button>
                  <button
                    onClick={() => setActiveSubTab('emails')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSubTab === 'emails'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Send className="h-4 w-4 inline mr-2" />
                    Email Management
                  </button>
                  <button
                    onClick={() => setActiveSubTab('analytics')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSubTab === 'analytics'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Page Analytics
                  </button>
                </div>

                {/* Support Tickets */}
                {activeSubTab === 'support' && (
                  <SupportTicketsSection />
                )}

                {/* Email Management */}
                {activeSubTab === 'emails' && (
                  <EmailManagementSection />
                )}

                {/* Page Analytics */}
                {activeSubTab === 'analytics' && (
                  <PageAnalyticsSection />
                )}
              </div>
            </TabsContent>

            {/* Icons Management Tab */}
            <TabsContent value="icons">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Icon Management with Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Icon tag management system will be implemented here.
                    Backend API is ready - frontend interface coming soon.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* App Pages Tab */}
            <TabsContent value="app-pages">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    App Pages Navigation
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Quick access to all application pages for testing and navigation
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Dashboard & Core Pages */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b pb-1">Dashboard & Core</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/', '_blank')} data-testid="link-dashboard">
                          <Users className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/formulas', '_blank')} data-testid="link-formulas">
                          <Settings className="h-4 w-4 mr-2" />
                          Formulas
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/leads', '_blank')} data-testid="link-leads">
                          <Mail className="h-4 w-4 mr-2" />
                          Leads
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/calendar', '_blank')} data-testid="link-calendar">
                          <Calendar className="h-4 w-4 mr-2" />
                          Calendar
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/stats', '_blank')} data-testid="link-stats">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Statistics
                        </Button>
                      </div>
                    </div>

                    {/* Website & Design */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b pb-1">Website & Design</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/website', '_blank')} data-testid="link-website">
                          <Globe className="h-4 w-4 mr-2" />
                          Website Builder
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/design', '_blank')} data-testid="link-design">
                          <Edit className="h-4 w-4 mr-2" />
                          Design Dashboard
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/custom-forms', '_blank')} data-testid="link-custom-forms">
                          <Settings className="h-4 w-4 mr-2" />
                          Custom Forms
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/embed-code', '_blank')} data-testid="link-embed-code">
                          <Settings className="h-4 w-4 mr-2" />
                          Embed Code
                        </Button>
                      </div>
                    </div>

                    {/* Business Management */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b pb-1">Business Management</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/estimates', '_blank')} data-testid="link-estimates">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Estimates
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/proposals', '_blank')} data-testid="link-proposals">
                          <Settings className="h-4 w-4 mr-2" />
                          Proposals
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/bid-requests', '_blank')} data-testid="link-bid-requests">
                          <Settings className="h-4 w-4 mr-2" />
                          Bid Requests
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/dfy-services', '_blank')} data-testid="link-dfy-services">
                          <Settings className="h-4 w-4 mr-2" />
                          DFY Services
                        </Button>
                      </div>
                    </div>

                    {/* Settings & Configuration */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b pb-1">Settings & Configuration</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/users', '_blank')} data-testid="link-users">
                          <Users className="h-4 w-4 mr-2" />
                          User Management
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/email-settings', '_blank')} data-testid="link-email-settings">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Settings
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/email-templates', '_blank')} data-testid="link-email-templates">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Templates
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/form-settings', '_blank')} data-testid="link-form-settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Form Settings
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/integrations', '_blank')} data-testid="link-integrations">
                          <Settings className="h-4 w-4 mr-2" />
                          Integrations
                        </Button>
                      </div>
                    </div>

                    {/* Admin Pages */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b pb-1">Admin Pages</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/admin/website-templates', '_blank')} data-testid="link-admin-website-templates">
                          <Globe className="h-4 w-4 mr-2" />
                          Website Templates
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/admin/template-tags', '_blank')} data-testid="link-admin-template-tags">
                          <Tags className="h-4 w-4 mr-2" />
                          Template Tags
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/admin/dfy-services', '_blank')} data-testid="link-admin-dfy-services">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin DFY Services
                        </Button>
                      </div>
                    </div>

                    {/* Account & Support */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b pb-1">Account & Support</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/profile', '_blank')} data-testid="link-profile">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/support', '_blank')} data-testid="link-support">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Support
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/upgrade', '_blank')} data-testid="link-upgrade">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Upgrade
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open('/pricing', '_blank')} data-testid="link-pricing">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Pricing
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">🚀 Quick Actions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Button size="sm" variant="outline" onClick={() => window.open('/onboarding', '_blank')} data-testid="link-onboarding">
                        Onboarding
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open('/terms', '_blank')} data-testid="link-terms">
                        Terms
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open('/privacy', '_blank')} data-testid="link-privacy">
                        Privacy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open('/payment-confirmation', '_blank')} data-testid="link-payment-confirmation">
                        Payment Confirmation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                  Edit User Account
                </DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="firstName"
                        value={selectedUser.firstName || ""}
                        onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                        className="mt-1 h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        value={selectedUser.lastName || ""}
                        onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                        className="mt-1 h-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="organizationName" className="text-sm font-medium">Organization Name</Label>
                    <Input
                      id="organizationName"
                      value={selectedUser.organizationName || ""}
                      onChange={(e) => setSelectedUser({ ...selectedUser, organizationName: e.target.value })}
                      className="mt-1 h-10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="plan" className="text-sm font-medium">Subscription Plan</Label>
                    <Select 
                      value={selectedUser.plan} 
                      onValueChange={(value) => setSelectedUser({ ...selectedUser, plan: value })}
                    >
                      <SelectTrigger className="mt-1 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="plus">Plus</SelectItem>
                        <SelectItem value="plus_seo">Plus SEO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
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
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isBetaTester"
                        checked={selectedUser.isBetaTester || false}
                        onChange={(e) => setSelectedUser({ ...selectedUser, isBetaTester: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isBetaTester">Beta Tester (Free Access)</Label>
                    </div>
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

          {/* Permissions Management Dialog */}
          <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
            <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  Manage User Permissions
                </DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedUser.firstName} {selectedUser.lastName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {selectedUser.email}
                      </div>
                      <div>
                        <span className="font-medium">Plan:</span> <span className="capitalize">{selectedUser.plan}</span>
                      </div>
                      <div>
                        <span className="font-medium">Organization:</span> {selectedUser.organizationName || 'Not set'}
                      </div>
                    </div>
                  </div>

                  {/* Permission Categories */}
                  <div className="grid gap-6">
                    {/* Core Features */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Core Features
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Edit Formulas</Label>
                            <p className="text-sm text-gray-600">Create and modify pricing calculators</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canEditFormulas || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canEditFormulas: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">View Leads</Label>
                            <p className="text-sm text-gray-600">Access lead information</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canViewLeads || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canViewLeads: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Manage Leads</Label>
                            <p className="text-sm text-gray-600">Edit and organize leads</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canManageLeads || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canManageLeads: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Access Design</Label>
                            <p className="text-sm text-gray-600">Customize form appearance</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canAccessDesign || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canAccessDesign: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">View Stats</Label>
                            <p className="text-sm text-gray-600">Access dashboard analytics</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canViewStats || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canViewStats: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Manage Calendar</Label>
                            <p className="text-sm text-gray-600">Schedule and manage appointments</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canManageCalendar || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canManageCalendar: checked }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced Features */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Advanced Features
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Create Websites</Label>
                            <p className="text-sm text-gray-600">Build new websites from templates</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canCreateWebsites || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canCreateWebsites: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Manage Websites</Label>
                            <p className="text-sm text-gray-600">Edit and publish websites</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canManageWebsites || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canManageWebsites: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Access AI Tools</Label>
                            <p className="text-sm text-gray-600">Use AI formula generation</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canAccessAI || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canAccessAI: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Use Measure Map</Label>
                            <p className="text-sm text-gray-600">Measure areas and distances</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canUseMeasureMap || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canUseMeasureMap: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Create Upsells</Label>
                            <p className="text-sm text-gray-600">Add optional products/services</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canCreateUpsells || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canCreateUpsells: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Access Zapier</Label>
                            <p className="text-sm text-gray-600">Connect with external tools</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canAccessZapier || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canAccessZapier: checked }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Features */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Business Features
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Manage Team</Label>
                            <p className="text-sm text-gray-600">Add/remove team members</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canManageTeam || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canManageTeam: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Manage Billing</Label>
                            <p className="text-sm text-gray-600">Access billing and payments</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canManageBilling || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canManageBilling: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Access API</Label>
                            <p className="text-sm text-gray-600">Use API endpoints</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canAccessAPI || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canAccessAPI: checked }
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-medium">Custom Branding</Label>
                            <p className="text-sm text-gray-600">Customize brand appearance</p>
                          </div>
                          <Switch
                            checked={selectedUser.permissions?.canCustomizeBranding || false}
                            onCheckedChange={(checked) => setSelectedUser({
                              ...selectedUser,
                              permissions: { ...selectedUser.permissions, canCustomizeBranding: checked }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Feature Limits */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Feature Limits
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="font-medium">Max Formulas</Label>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            value={selectedUser.permissions?.maxFormulas || ''}
                            onChange={(e) => setSelectedUser({
                              ...selectedUser,
                              permissions: { 
                                ...selectedUser.permissions, 
                                maxFormulas: e.target.value ? parseInt(e.target.value) : undefined 
                              }
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="font-medium">Max Leads Per Month</Label>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            value={selectedUser.permissions?.maxLeadsPerMonth || ''}
                            onChange={(e) => setSelectedUser({
                              ...selectedUser,
                              permissions: { 
                                ...selectedUser.permissions, 
                                maxLeadsPerMonth: e.target.value ? parseInt(e.target.value) : undefined 
                              }
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="font-medium">Max Websites</Label>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            value={selectedUser.permissions?.maxWebsites || ''}
                            onChange={(e) => setSelectedUser({
                              ...selectedUser,
                              permissions: { 
                                ...selectedUser.permissions, 
                                maxWebsites: e.target.value ? parseInt(e.target.value) : undefined 
                              }
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="font-medium">Max Team Members</Label>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            value={selectedUser.permissions?.maxTeamMembers || ''}
                            onChange={(e) => setSelectedUser({
                              ...selectedUser,
                              permissions: { 
                                ...selectedUser.permissions, 
                                maxTeamMembers: e.target.value ? parseInt(e.target.value) : undefined 
                              }
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setPermissionsDialogOpen(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        handleSaveUser();
                        setPermissionsDialogOpen(false);
                      }}
                      disabled={editUserMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editUserMutation.isPending ? "Saving..." : "Save Permissions"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Formula Template Edit Dialog */}
          <Dialog open={editTemplateDialogOpen} onOpenChange={(open) => {
            setEditTemplateDialogOpen(open);
            if (!open) resetFormulaTemplateForm();
          }}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Edit Formula Template
                </DialogTitle>
              </DialogHeader>
              {editingFormulaTemplate && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={editTemplateName}
                        onChange={(e) => setEditTemplateName(e.target.value)}
                        placeholder="e.g., Kitchen Remodel Calculator"
                        className="mt-1"
                        data-testid="input-template-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-title">Display Title</Label>
                      <Input
                        id="template-title"
                        value={editTemplateTitle}
                        onChange={(e) => setEditTemplateTitle(e.target.value)}
                        placeholder="e.g., Kitchen Remodeling Cost Calculator"
                        className="mt-1"
                        data-testid="input-template-title"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select value={editTemplateCategory} onValueChange={setEditTemplateCategory}>
                      <SelectTrigger className="mt-1" data-testid="select-template-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="home-improvement">Home Improvement</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="professional-services">Professional Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="template-description">Description (Optional)</Label>
                    <Textarea
                      id="template-description"
                      value={editTemplateDescription}
                      onChange={(e) => setEditTemplateDescription(e.target.value)}
                      placeholder="Describe what this template is used for"
                      className="mt-1"
                      rows={3}
                      data-testid="textarea-template-description"
                    />
                  </div>
                  
                  <div>
                    <Label>Template Icon</Label>
                    <div className="mt-1">
                      <IconSelector
                        selectedIconId={editTemplateIconId}
                        onIconSelect={(iconId, iconUrl) => {
                          setEditTemplateIconId(iconId);
                          setEditTemplateIconUrl(iconUrl);
                        }}
                        triggerText={editTemplateIconId ? "Change Icon" : "Select Icon"}
                        size="md"
                      />
                      {editTemplateIconUrl && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <img src={editTemplateIconUrl} alt="Selected icon" className="w-6 h-6 object-contain" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Template icon selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setEditTemplateDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveFormulaTemplate}
                  disabled={updateFormulaTemplateMutation.isPending}
                  data-testid="button-save-template"
                >
                  {updateFormulaTemplateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Template
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Support Tickets Section Component
function SupportTicketsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support-tickets"],
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SupportTicket> }) => {
      return await apiRequest("PATCH", `/api/support-tickets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      return await apiRequest("POST", `/api/support-tickets/${ticketId}/messages`, {
        message,
        senderName: "Support Agent",
        senderEmail: "support@autobidder.org",
      });
    },
    onSuccess: () => {
      setNewMessage("");
      loadTicketMessages(selectedTicket!.id);
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const loadTicketMessages = async (ticketId: number) => {
    try {
      const response = await apiRequest("GET", `/api/support-tickets/${ticketId}/messages`);
      const messagesData = await response.json();
      setTicketMessages(messagesData as TicketMessage[]);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const filteredTickets = tickets.filter((ticket: SupportTicket) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    closed: tickets.filter(t => t.status === "closed").length,
    avgResponseTime: "2.5 hours"
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "destructive";
      case "in_progress": return "secondary";
      case "closed": return "default";
      default: return "outline";
    }
  };

  React.useEffect(() => {
    if (selectedTicket) {
      loadTicketMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{ticketStats.total}</p>
                <p className="text-xs text-gray-500">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{ticketStats.open}</p>
                <p className="text-xs text-gray-500">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{ticketStats.inProgress}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{ticketStats.closed}</p>
                <p className="text-xs text-gray-500">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-bold">{ticketStats.avgResponseTime}</p>
                <p className="text-xs text-gray-500">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Support Tickets</CardTitle>
              <div className="space-y-2">
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="p-4 text-center">Loading tickets...</div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No tickets found
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedTicket?.id === ticket.id ? "bg-gray-50" : ""
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm line-clamp-2">{ticket.subject}</h4>
                            <Badge variant={getPriorityColor(ticket.priority) as any} className="text-xs">
                              {ticket.priority}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <User className="w-3 h-3" />
                              <span>{ticket.customerName}</span>
                            </div>
                            <Badge variant={getStatusColor(ticket.status) as any} className="text-xs">
                              {ticket.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{selectedTicket.customerName}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{selectedTicket.customerEmail}</span>
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) =>
                      updateTicketMutation.mutate({
                        id: selectedTicket.id,
                        data: { status: value as any },
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedTicket.priority}
                    onValueChange={(value) =>
                      updateTicketMutation.mutate({
                        id: selectedTicket.id,
                        data: { priority: value as any },
                      })
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original Message */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{selectedTicket.customerName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{selectedTicket.description}</p>
                  <div className="flex space-x-2 mt-2">
                    <Badge variant={getPriorityColor(selectedTicket.priority) as any} className="text-xs">
                      {selectedTicket.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedTicket.category.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="h-[300px] space-y-2">
                  {ticketMessages.map((message, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{message.senderName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-white border rounded-lg">
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                <Separator />

                {/* Reply Form */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-between">
                    <div className="text-xs text-gray-500">
                      Response will be sent to {selectedTicket.customerEmail}
                    </div>
                    <Button
                      onClick={() =>
                        sendMessageMutation.mutate({
                          ticketId: selectedTicket.id,
                          message: newMessage,
                        })
                      }
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendMessageMutation.isPending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Support Ticket</h3>
                <p className="text-gray-600">
                  Choose a ticket from the list to view details and respond to the customer
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Duda Templates Section Component
function DudaTemplatesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('templates');
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [newTagData, setNewTagData] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#3B82F6',
    displayOrder: 0
  });

  // Fetch templates with tags
  const { data: templatesWithTags = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/duda-templates-with-tags']
  });

  // Fetch all tags
  const { data: allTags = [], isLoading: tagsLoading, refetch: refetchTags } = useQuery({
    queryKey: ['/api/admin/duda-template-tags']
  });

  // Sync templates mutation
  const syncTemplatesMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/duda-templates/sync'),
    onSuccess: (data: any) => {
      toast({
        title: "Templates Synced",
        description: `Successfully synced ${data.templates?.length || 0} templates from Duda API`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/duda-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/duda-templates-with-tags'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync templates",
        variant: "destructive"
      });
    }
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: (tagData: any) => apiRequest('POST', '/api/admin/duda-template-tags', tagData),
    onSuccess: () => {
      toast({
        title: "Tag Created",
        description: "Template tag created successfully"
      });
      setIsTagDialogOpen(false);
      setNewTagData({
        name: '',
        displayName: '',
        description: '',
        color: '#3B82F6',
        displayOrder: 0
      });
      refetchTags();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tag",
        variant: "destructive"
      });
    }
  });

  // Toggle template visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ templateId, isVisible }: { templateId: string; isVisible: boolean }) => 
      apiRequest('PATCH', `/api/admin/duda-templates/${templateId}`, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/duda-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/duda-templates-with-tags'] });
    }
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => apiRequest('DELETE', `/api/admin/duda-template-tags/${tagId}`),
    onSuccess: () => {
      toast({
        title: "Tag Deleted",
        description: "Template tag deleted successfully"
      });
      refetchTags();
      queryClient.invalidateQueries({ queryKey: ['/api/duda-templates-with-tags'] });
    }
  });

  // Toggle tag active mutation
  const toggleTagActiveMutation = useMutation({
    mutationFn: ({ tagId, isActive }: { tagId: number; isActive: boolean }) => 
      apiRequest('PATCH', `/api/admin/duda-template-tags/${tagId}`, { isActive }),
    onSuccess: () => {
      refetchTags();
      queryClient.invalidateQueries({ queryKey: ['/api/duda-templates-with-tags'] });
    }
  });

  const handleCreateTag = () => {
    if (!newTagData.name || !newTagData.displayName) {
      toast({
        title: "Error",
        description: "Name and display name are required",
        variant: "destructive"
      });
      return;
    }
    createTagMutation.mutate(newTagData);
  };

  const handleToggleVisibility = (templateId: string, currentVisibility: boolean) => {
    toggleVisibilityMutation.mutate({ templateId, isVisible: !currentVisibility });
  };

  const handleToggleTagActive = (tag: any) => {
    toggleTagActiveMutation.mutate({ tagId: tag.id, isActive: !tag.isActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duda Template Management</h2>
          <p className="text-gray-600">Manage Duda website templates and their tags</p>
        </div>
        <Button 
          onClick={() => syncTemplatesMutation.mutate()}
          disabled={syncTemplatesMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncTemplatesMutation.isPending ? 'animate-spin' : ''}`} />
          {syncTemplatesMutation.isPending ? 'Syncing...' : 'Sync Templates'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Duda Templates ({(templatesWithTags as any[]).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8">Loading templates...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(templatesWithTags as any[]).map((template: any) => (
                    <Card key={template.templateId} className="border">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{template.templateName}</h4>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleVisibility(template.templateId, template.isVisible)}
                              >
                                {template.isVisible ? (
                                  <Eye className="w-4 h-4 text-green-600" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {template.thumbnailUrl && (
                            <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={template.thumbnailUrl} 
                                alt={template.templateName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">ID: {template.templateId}</p>
                            {template.vertical && (
                              <p className="text-xs text-gray-500">Vertical: {template.vertical}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-1">
                              {template.tags?.map((tag: any) => (
                                <Badge 
                                  key={tag.id} 
                                  variant="secondary" 
                                  className="text-xs"
                                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                >
                                  {tag.displayName}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <Badge variant={template.isVisible ? "default" : "secondary"} className="text-xs">
                                {template.isVisible ? "Visible" : "Hidden"}
                              </Badge>
                              {template.previewUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(template.previewUrl, '_blank')}
                                  className="text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Preview
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tags className="w-5 h-5" />
                  Template Tags ({(allTags as any[]).length})
                </CardTitle>
                <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Template Tag</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tagName">Tag Name (ID)</Label>
                        <Input
                          id="tagName"
                          value={newTagData.name}
                          onChange={(e) => setNewTagData({ ...newTagData, name: e.target.value })}
                          placeholder="e.g., auto-detailing"
                        />
                      </div>
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={newTagData.displayName}
                          onChange={(e) => setNewTagData({ ...newTagData, displayName: e.target.value })}
                          placeholder="e.g., Auto Detailing"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTagData.description}
                          onChange={(e) => setNewTagData({ ...newTagData, description: e.target.value })}
                          placeholder="Optional description for this tag"
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          type="color"
                          value={newTagData.color}
                          onChange={(e) => setNewTagData({ ...newTagData, color: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="displayOrder">Display Order</Label>
                        <Input
                          id="displayOrder"
                          type="number"
                          value={newTagData.displayOrder}
                          onChange={(e) => setNewTagData({ ...newTagData, displayOrder: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <Button 
                        onClick={handleCreateTag} 
                        disabled={createTagMutation.isPending}
                        className="w-full"
                      >
                        Create Tag
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="text-center py-8">Loading tags...</div>
              ) : (
                <div className="space-y-3">
                  {(allTags as any[]).map((tag: any) => (
                    <Card key={tag.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <div>
                              <h4 className="font-medium">{tag.displayName}</h4>
                              <p className="text-sm text-gray-500">
                                {tag.name} • Order: {tag.displayOrder}
                              </p>
                              {tag.description && (
                                <p className="text-xs text-gray-400 mt-1">{tag.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={tag.isActive}
                              onCheckedChange={() => handleToggleTagActive(tag)}
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this tag? This will remove it from all templates.')) {
                                  deleteTagMutation.mutate(tag.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Email Management Section Component
function EmailManagementSection() {
  const [selectedEmailType, setSelectedEmailType] = useState<string>('all');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  
  // Fetch email send statistics
  const { data: emailStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/email-stats'],
    queryFn: async () => {
      const response = await fetch('/api/email-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch email statistics');
      }
      return response.json() as Array<{ emailType: string; count: number }>;
    }
  });

  // Helper function to get send count for an email type
  const getEmailSendCount = (emailType: string): number => {
    if (!emailStats) return 0;
    const stat = emailStats.find(s => s.emailType === emailType);
    return stat ? stat.count : 0;
  };
  
  // Comprehensive list of all automated emails in the system
  const automatedEmails = [
    {
      id: 'sendWelcomeEmail',
      name: 'Welcome Email',
      description: 'Sent to new users when they sign up',
      trigger: 'User Registration',
      category: 'User Management',
      status: 'Active',
      emailType: 'welcome', // Add mapping to database email type
      subject: 'Welcome to Autobidder - Let\'s Build Your First Calculator!',
      preview: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 2rem;">Welcome to Autobidder!</h1>
          </div>
          <div style="padding: 2rem; background: white;">
            <p>Hi [firstName],</p>
            <p>Welcome to Autobidder! We're excited to help you create professional pricing calculators that convert visitors into leads.</p>
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
              <h3 style="margin-top: 0; color: #1e293b;">Quick Start Guide:</h3>
              <ul style="margin: 0;">
                <li>Create your first formula in the Formula Builder</li>
                <li>Design your calculator with our styling tools</li>
                <li>Embed it on your website</li>
                <li>Start capturing qualified leads</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 2rem 0;">
              <a href="[dashboardUrl]" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Go to Dashboard</a>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'sendOnboardingCompleteEmail',
      name: 'Onboarding Complete Email',
      description: 'Sent when user completes setup process',
      trigger: 'Setup Completion',
      category: 'User Management',
      status: 'Active',
      emailType: 'onboarding_complete',
      subject: 'Your Autobidder Account is Ready!',
      preview: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #10b981; padding: 2rem; text-align: center;">
            <h1 style="color: white; margin: 0;">You're All Set!</h1>
          </div>
          <div style="padding: 2rem; background: white;">
            <p>Congratulations, [firstName]!</p>
            <p>You've successfully completed your Autobidder setup. Your account is now ready to start generating qualified leads with professional pricing calculators.</p>
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 1rem; margin: 1.5rem 0;">
              <h3 style="margin-top: 0; color: #065f46;">What's Next?</h3>
              <p style="margin-bottom: 0;">Start creating your first formula and watch how easy it is to capture and convert leads with Autobidder.</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'sendSubscriptionConfirmationEmail',
      name: 'Subscription Confirmation',
      description: 'Sent when user subscribes to a plan',
      trigger: 'Plan Subscription',
      category: 'Billing',
      status: 'Active',
      emailType: 'subscription_confirmation'
    },
    {
      id: 'sendWebsiteActivationEmail',
      name: 'Website Activation Email',
      description: 'Sent when user\'s website is ready',
      trigger: 'Website Creation',
      emailType: 'website_activation',
      category: 'Website Builder',
      status: 'Active'
    },
    {
      id: 'sendNewLeadNotification',
      name: 'New Lead Notification',
      description: 'Sent to business owner when new lead is captured',
      trigger: 'Lead Submission',
      category: 'Lead Management',
      status: 'Active',
      subject: 'New Lead: [leadName] - $[estimatedPrice] Project',
      preview: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #f59e0b; padding: 2rem; text-align: center;">
            <h1 style="color: white; margin: 0;">New Lead Received!</h1>
          </div>
          <div style="padding: 2rem; background: white;">
            <h2 style="color: #1f2937; margin-top: 0;">Lead Details</h2>
            <div style="background: #fef3c7; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td>[leadName]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>[leadEmail]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>[leadPhone]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Service:</td><td>[serviceName]</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Estimated Price:</td><td style="color: #059669; font-weight: bold;">$[estimatedPrice]</td></tr>
              </table>
            </div>
            <div style="text-align: center; margin: 2rem 0;">
              <a href="[leadUrl]" style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">View Lead Details</a>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'sendNewMultiServiceLeadNotification',
      name: 'Multi-Service Lead Notification',
      description: 'Sent for leads with multiple services',
      trigger: 'Multi-Service Lead',
      category: 'Lead Management',
      status: 'Active',
      subject: 'Multi-Service Lead: [leadName] - $[totalPrice] Total',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Multi-service lead email with service breakdown table...</div>'
    },
    {
      id: 'sendNewBookingNotification',
      name: 'New Booking Notification',
      description: 'Sent to business owner when appointment is booked',
      trigger: 'Appointment Booking',
      category: 'Scheduling',
      status: 'Active',
      subject: 'New Appointment Booked: [customerName] on [appointmentDate]',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Booking notification with calendar details...</div>'
    },
    {
      id: 'sendBidRequestNotification',
      name: 'Bid Request Notification',
      description: 'Sent when customer requests a bid',
      trigger: 'Bid Request',
      category: 'Bidding',
      status: 'Active',
      subject: 'Bid Request from [customerName]',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Bid request notification with project details...</div>'
    },
    {
      id: 'sendBidResponseNotification',
      name: 'Bid Response Email',
      description: 'Sent to customer with bid details',
      trigger: 'Bid Response',
      category: 'Bidding',
      status: 'Active',
      subject: 'Your [serviceName] Estimate - $[bidAmount]',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Customer bid response with pricing breakdown...</div>'
    },
    {
      id: 'sendRevisedBidEmail',
      name: 'Revised Bid Email',
      description: 'Sent when bid is revised',
      trigger: 'Bid Revision',
      category: 'Bidding',
      status: 'Active',
      subject: 'Revised Estimate: [serviceName] - $[revisedAmount]',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Revised bid email with updated pricing...</div>'
    },
    {
      id: 'sendLeadSubmittedEmail',
      name: 'Lead Submitted Email (Customer)',
      description: 'Sent to customer after form submission',
      trigger: 'Form Submission',
      category: 'Customer Communication',
      status: 'Active',
      subject: 'Thank you for your interest in [serviceName]',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Customer thank you email with next steps...</div>'
    },
    {
      id: 'sendLeadBookedEmail',
      name: 'Lead Booked Email (Customer)',
      description: 'Sent to customer when appointment is booked',
      trigger: 'Appointment Booking',
      category: 'Customer Communication',
      status: 'Active',
      subject: 'Appointment Confirmed for [appointmentDate]',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Customer appointment confirmation...</div>'
    },
    {
      id: 'sendCustomerEstimateEmail',
      name: 'Customer Estimate Email',
      description: 'Sends estimate details to customer',
      trigger: 'Estimate Creation',
      category: 'Customer Communication',
      status: 'Active',
      subject: 'Your [serviceName] Estimate is Ready',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Customer estimate with detailed breakdown...</div>'
    },
    {
      id: 'sendCustomerBookingConfirmationEmail',
      name: 'Customer Booking Confirmation',
      description: 'Confirms appointment details to customer',
      trigger: 'Booking Confirmation',
      category: 'Customer Communication',
      status: 'Active',
      subject: 'Booking Confirmed: [serviceName] on [date]',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Customer booking confirmation with details...</div>'
    },
    {
      id: 'sendCustomerRevisedEstimateEmail',
      name: 'Customer Revised Estimate',
      description: 'Sends revised estimate to customer',
      trigger: 'Estimate Revision',
      category: 'Customer Communication',
      status: 'Active',
      subject: 'Updated Estimate: [serviceName]',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Customer revised estimate notification...</div>'
    },
    {
      id: 'sendPasswordResetEmail',
      name: 'Password Reset Email',
      description: 'Sent when user requests password reset',
      trigger: 'Password Reset Request',
      category: 'Authentication',
      status: 'Active',
      subject: 'Reset Your Autobidder Password',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Password reset email with secure link...</div>'
    },
    {
      id: 'sendWebsiteSetupEmail',
      name: 'Website Setup Email',
      description: 'Sent during website setup process',
      trigger: 'Website Setup',
      category: 'Website Builder',
      status: 'Active',
      subject: 'Your Website is Being Created',
      preview: '<div style="padding: 20px; background: #f3f4f6;">Website setup progress notification...</div>'
    }
  ];

  const categories = Array.from(new Set(automatedEmails.map(email => email.category)));
  const filteredEmails = selectedEmailType === 'all' 
    ? automatedEmails
    : automatedEmails.filter(email => email.category === selectedEmailType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Email Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Manage all automated email templates in the system. Each email is automatically triggered by specific user actions.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Email Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{automatedEmails.length}</div>
                  <div className="text-sm text-blue-600">Total Email Templates</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {automatedEmails.filter(e => e.status === 'Active').length}
                  </div>
                  <div className="text-sm text-green-600">Active Templates</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
                  <div className="text-sm text-purple-600">Categories</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {automatedEmails.filter(e => e.category === 'Customer Communication').length}
                  </div>
                  <div className="text-sm text-orange-600">Customer Facing</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Templates Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Email Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject Line</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Count</TableHead>
                  <TableHead className="text-right">Function Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmails.map((email) => (
                  <>
                    <TableRow 
                      key={email.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {expandedEmail === email.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{email.name}</div>
                          <div className="text-sm text-gray-500">{email.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            email.category === 'Customer Communication' ? 'default' :
                            email.category === 'Lead Management' ? 'secondary' :
                            email.category === 'Billing' ? 'outline' :
                            'secondary'
                          }
                        >
                          {email.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700 max-w-xs truncate">
                          {email.subject || 'No subject defined'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={email.status === 'Active' ? 'default' : 'secondary'}>
                          {email.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {statsLoading ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : (
                            <span className="text-lg font-semibold text-blue-600">
                              {getEmailSendCount((email as any).emailType || 'unknown')}
                            </span>
                          )}
                          <span className="text-sm text-gray-500 ml-1">sent</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {email.id}
                        </code>
                      </TableCell>
                    </TableRow>
                    {expandedEmail === email.id && (
                      <TableRow key={`${email.id}-expanded`}>
                        <TableCell colSpan={7} className="bg-gray-50 border-t-0">
                          <div className="py-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <h4 className="font-medium text-gray-900">Email Preview</h4>
                              <Badge variant="outline" className="text-xs">
                                Trigger: {email.trigger}
                              </Badge>
                            </div>
                            
                            {email.subject && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm font-medium text-blue-800 mb-1">Subject Line:</div>
                                <div className="text-blue-700">{email.subject}</div>
                              </div>
                            )}
                            
                            <div className="border rounded-lg bg-white overflow-hidden">
                              <div className="bg-gray-100 px-4 py-2 border-b">
                                <div className="text-xs text-gray-600">Email Content Preview:</div>
                              </div>
                              <div className="p-4 max-h-96 overflow-y-auto">
                                {email.preview ? (
                                  <div 
                                    dangerouslySetInnerHTML={{ __html: email.preview }}
                                    className="prose prose-sm max-w-none"
                                  />
                                ) : (
                                  <div className="text-gray-500 italic">No preview available for this email template</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-4 flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit Template
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                Send Test Email
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Email Template Categories */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Email Categories Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category} className="border">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{category}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {automatedEmails.filter(e => e.category === category).length} templates
                    </p>
                    <div className="space-y-1">
                      {automatedEmails
                        .filter(e => e.category === category)
                        .slice(0, 3)
                        .map((email) => (
                          <div key={email.id} className="text-xs text-gray-500">
                            • {email.name}
                          </div>
                        ))}
                      {automatedEmails.filter(e => e.category === category).length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{automatedEmails.filter(e => e.category === category).length - 3} more
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">📧 Email System Information</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p>• All email templates are located in <code>server/email-templates.ts</code></p>
              <p>• Templates use a unified design system with consistent branding</p>
              <p>• Business domains fallback to verified Autobidder domain for delivery reliability</p>
              <p>• Email sending uses Resend as primary provider with Gmail fallback</p>
              <p>• Customer-facing emails use professional tone without emojis</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Page Analytics Section Component
function PageAnalyticsSection() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [selectedPage, setSelectedPage] = useState("all");

  // Complete list of all application pages for analytics tracking
  const allAppPages = [
    // Public pages (unauthenticated)
    { path: "/", description: "Landing Page" },
    { path: "/landing", description: "Alternative Landing" },
    { path: "/login", description: "User Login" },
    { path: "/signup", description: "User Registration" },
    { path: "/forgot-password", description: "Password Reset Request" },
    { path: "/reset-password", description: "Password Reset Form" },
    { path: "/pricing", description: "Pricing Plans" },
    { path: "/onboarding", description: "User Onboarding" },
    { path: "/signup-success", description: "Registration Success" },
    { path: "/terms", description: "Terms & Conditions" },
    { path: "/privacy", description: "Privacy Policy" },
    
    // Embed & Public Calculator pages
    { path: "/embed/:embedId", description: "Embed Calculator" },
    { path: "/custom-form/:embedId", description: "Styled Calculator Embed" },
    { path: "/f/:accountId/:slug", description: "Custom Form Display" },
    { path: "/service-selector", description: "Service Selector" },
    { path: "/services", description: "Services Page" },
    { path: "/styled-calculator", description: "Styled Calculator" },
    { path: "/estimate/:estimateNumber", description: "Estimate View" },
    { path: "/verify-bid/:token", description: "Bid Verification" },
    { path: "/bid-response/:token", description: "Bid Response" },
    { path: "/proposal/:leadId", description: "Proposal View" },
    
    // Demo & Testing pages
    { path: "/map-migration-demo", description: "Map Migration Demo" },
    { path: "/terra-draw-refinement", description: "Terra Draw Testing" },
    
    // Authenticated Dashboard pages
    { path: "/dashboard", description: "Main Dashboard" },
    { path: "/formulas", description: "Formula List" },
    { path: "/formula/:id", description: "Formula Editor" },
    { path: "/formula-builder/:id", description: "Formula Builder (Edit)" },
    { path: "/formula-builder", description: "Formula Builder (New)" },
    { path: "/embed-code", description: "Embed Code Generator" },
    { path: "/form-settings", description: "Form Settings" },
    { path: "/design", description: "Design Dashboard" },
    { path: "/leads", description: "Leads Management" },
    { path: "/proposals", description: "Proposals" },
    { path: "/calendar", description: "Calendar & Booking" },
    { path: "/stats", description: "Statistics" },
    { path: "/users", description: "User Management" },
    { path: "/website", description: "Website Builder" },
    { path: "/custom-forms", description: "Custom Forms" },
    { path: "/estimates", description: "Estimates" },
    { path: "/email-settings", description: "Email Settings" },
    { path: "/email-templates", description: "Email Templates" },
    { path: "/bid-email-templates", description: "Bid Email Templates" },
    { path: "/bid-requests", description: "Bid Requests" },
    { path: "/support", description: "Support" },
    { path: "/integrations", description: "Integrations" },
    { path: "/profile", description: "User Profile" },
    { path: "/upgrade", description: "Subscription Upgrade" },
    { path: "/payment-confirmation", description: "Payment Confirmation" },
    { path: "/subscription-test", description: "Subscription Testing" },
    { path: "/dfy-services", description: "Done-For-You Services" },
    
    // Admin pages
    { path: "/admin", description: "Admin Dashboard" },
    { path: "/admin-dashboard", description: "Admin Dashboard Alt" },
    { path: "/admin/website-templates", description: "Admin Website Templates" },
    { path: "/admin/template-tags", description: "Admin Template Tags" },
    { path: "/admin/dfy-services", description: "Admin DFY Services" },
  ];

  // Mock analytics data with comprehensive page coverage
  const pageViews = {
    "7d": {
      totalViews: 12847,
      uniqueVisitors: 8234,
      bounceRate: 34.2,
      avgSessionDuration: "3m 42s",
      topPages: [
        { path: "/", views: 3245, uniqueVisitors: 2156, avgTime: "2m 15s" },
        { path: "/dashboard", views: 2834, uniqueVisitors: 1923, avgTime: "4m 32s" },
        { path: "/styled-calculator", views: 2156, uniqueVisitors: 1845, avgTime: "5m 18s" },
        { path: "/formula-builder", views: 1578, uniqueVisitors: 1234, avgTime: "6m 45s" },
        { path: "/leads", views: 1289, uniqueVisitors: 987, avgTime: "3m 28s" },
        { path: "/design", views: 987, uniqueVisitors: 756, avgTime: "4m 12s" },
        { path: "/embed-code", views: 758, uniqueVisitors: 623, avgTime: "2m 44s" },
        { path: "/service-selector", views: 654, uniqueVisitors: 523, avgTime: "3m 15s" },
        { path: "/custom-forms", views: 543, uniqueVisitors: 432, avgTime: "4m 22s" },
        { path: "/proposals", views: 432, uniqueVisitors: 345, avgTime: "3m 45s" },
        { path: "/calendar", views: 387, uniqueVisitors: 298, avgTime: "2m 58s" },
        { path: "/stats", views: 298, uniqueVisitors: 245, avgTime: "4m 05s" },
        { path: "/website", views: 245, uniqueVisitors: 198, avgTime: "5m 32s" },
        { path: "/integrations", views: 198, uniqueVisitors: 156, avgTime: "3m 22s" },
        { path: "/profile", views: 156, uniqueVisitors: 134, avgTime: "2m 18s" },
        { path: "/email-settings", views: 134, uniqueVisitors: 112, avgTime: "3m 45s" },
        { path: "/bid-requests", views: 112, uniqueVisitors: 89, avgTime: "4m 12s" },
        { path: "/estimates", views: 89, uniqueVisitors: 76, avgTime: "3m 55s" },
        { path: "/support", views: 76, uniqueVisitors: 65, avgTime: "5m 15s" },
        { path: "/admin", views: 65, uniqueVisitors: 54, avgTime: "6m 32s" }
      ]
    },
    "30d": {
      totalViews: 45623,
      uniqueVisitors: 28934,
      bounceRate: 31.8,
      avgSessionDuration: "4m 12s",
      topPages: [
        { path: "/", views: 11245, uniqueVisitors: 8156, avgTime: "2m 25s" },
        { path: "/dashboard", views: 9834, uniqueVisitors: 7123, avgTime: "4m 45s" },
        { path: "/styled-calculator", views: 8156, uniqueVisitors: 6845, avgTime: "5m 32s" },
        { path: "/formula-builder", views: 5578, uniqueVisitors: 4234, avgTime: "7m 15s" },
        { path: "/leads", views: 4289, uniqueVisitors: 3187, avgTime: "3m 38s" },
        { path: "/design", views: 3187, uniqueVisitors: 2456, avgTime: "4m 22s" },
        { path: "/embed-code", views: 2758, uniqueVisitors: 2123, avgTime: "2m 54s" },
        { path: "/service-selector", views: 2456, uniqueVisitors: 1876, avgTime: "3m 25s" },
        { path: "/custom-forms", views: 1987, uniqueVisitors: 1543, avgTime: "4m 35s" },
        { path: "/proposals", views: 1654, uniqueVisitors: 1298, avgTime: "3m 52s" },
        { path: "/calendar", views: 1432, uniqueVisitors: 1123, avgTime: "3m 08s" },
        { path: "/stats", views: 1234, uniqueVisitors: 987, avgTime: "4m 18s" },
        { path: "/website", views: 1098, uniqueVisitors: 876, avgTime: "5m 45s" },
        { path: "/integrations", views: 876, uniqueVisitors: 698, avgTime: "3m 42s" },
        { path: "/profile", views: 723, uniqueVisitors: 589, avgTime: "2m 28s" },
        { path: "/email-settings", views: 589, uniqueVisitors: 456, avgTime: "3m 55s" },
        { path: "/bid-requests", views: 456, uniqueVisitors: 367, avgTime: "4m 25s" },
        { path: "/estimates", views: 367, uniqueVisitors: 298, avgTime: "4m 08s" },
        { path: "/support", views: 298, uniqueVisitors: 234, avgTime: "5m 28s" },
        { path: "/admin", views: 234, uniqueVisitors: 187, avgTime: "6m 45s" }
      ]
    }
  };

  const currentData = pageViews[selectedTimeRange as keyof typeof pageViews];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Page Analytics & Tracking
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Page Views</p>
                  <p className="text-2xl font-bold text-gray-900">{currentData.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unique Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">{currentData.uniqueVisitors.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bounce Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{currentData.bounceRate}%</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Session</p>
                  <p className="text-2xl font-bold text-gray-900">{currentData.avgSessionDuration}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Pages Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Top Pages Performance
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Path</TableHead>
                  <TableHead className="text-right">Page Views</TableHead>
                  <TableHead className="text-right">Unique Visitors</TableHead>
                  <TableHead className="text-right">Avg. Time on Page</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.topPages.map((page, index) => {
                  const engagementScore = ((page.uniqueVisitors / page.views) * 100).toFixed(1);
                  const isHighTraffic = page.views > 2000;
                  
                  return (
                    <TableRow key={page.path} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                            {index + 1}
                          </div>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {page.path}
                          </code>
                          {isHighTraffic && (
                            <Badge className="text-xs bg-green-100 text-green-700">Popular</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {page.views.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {page.uniqueVisitors.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {page.avgTime}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className={`h-2 w-16 rounded-full ${
                            parseFloat(engagementScore) > 80 ? 'bg-green-200' : 
                            parseFloat(engagementScore) > 60 ? 'bg-yellow-200' : 'bg-red-200'
                          }`}>
                            <div className={`h-full rounded-full ${
                              parseFloat(engagementScore) > 80 ? 'bg-green-500' : 
                              parseFloat(engagementScore) > 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} style={{ width: `${Math.min(parseFloat(engagementScore), 100)}%` }}></div>
                          </div>
                          <span className="text-sm text-gray-600">{engagementScore}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Complete Application Pages List */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layout className="h-5 w-5" />
            All Application Pages ({allAppPages.length})
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Complete directory of all pages in the application for management and monitoring purposes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAppPages.map((page, index) => {
              const isTopPage = currentData.topPages.some(tp => tp.path === page.path);
              const pageStats = currentData.topPages.find(tp => tp.path === page.path);
              
              return (
                <Card key={index} className={`border ${isTopPage ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {page.path}
                      </code>
                      {isTopPage && (
                        <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{page.description}</p>
                    {pageStats && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {pageStats.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {pageStats.uniqueVisitors}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pageStats.avgTime}
                        </span>
                      </div>
                    )}
                    <Link href={page.path}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs gap-1"
                        data-testid={`visit-page-${page.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit Page
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">📊 Analytics System Information</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p>• Page tracking automatically captures all application routes and user interactions</p>
            <p>• Analytics data includes page views, unique visitors, bounce rates, and session duration</p>
            <p>• Real-time monitoring helps identify popular features and optimization opportunities</p>
            <p>• Data privacy compliant - no personal information is tracked without consent</p>
            <p>• Performance metrics help improve user experience and identify bottlenecks</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}