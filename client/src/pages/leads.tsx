import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, Filter, Users, DollarSign, Mail, Phone, MapPin, FileText, Clock, Eye, CheckCircle, Circle, XCircle, AlertCircle, Trash2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import LeadDetailsModal from "@/components/lead-details-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Lead {
  id: number;
  formulaId: number;
  name: string;
  email: string;
  phone?: string;
  calculatedPrice: number;
  variables: Record<string, any>;
  stage: string;
  createdAt: string;
  ipAddress?: string;
  formula?: {
    name: string;
    title: string;
  };
}

interface MultiServiceLead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
  services: Array<{
    formulaId: number;
    formulaName: string;
    variables: Record<string, any>;
    calculatedPrice: number;
  }>;
  totalPrice: number;
  appliedDiscounts?: Array<{
    id: string;
    name: string;
    percentage: number;
    amount: number;
  }>;
  bundleDiscountAmount?: number;
  selectedUpsells?: Array<{
    id: string;
    name: string;
    description?: string;
    percentageOfMain: number;
    amount: number;
    category?: string;
  }>;
  stage: string;
  createdAt: string;
  ipAddress?: string;
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: singleLeads, isLoading: singleLeadsLoading } = useQuery({
    queryKey: ["/api/leads"],
  });

  const { data: multiServiceLeads, isLoading: multiServiceLeadsLoading } = useQuery({
    queryKey: ["/api/multi-service-leads"],
  });

  const { data: formulas } = useQuery({
    queryKey: ["/api/formulas"],
  });

  const isLoading = singleLeadsLoading || multiServiceLeadsLoading;

  // Stage update mutations
  const updateLeadStageMutation = useMutation({
    mutationFn: async ({ leadId, stage, isMultiService }: { leadId: number; stage: string; isMultiService: boolean }) => {
      const endpoint = isMultiService ? `/api/multi-service-leads/${leadId}` : `/api/leads/${leadId}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stage }),
      });
      if (!response.ok) throw new Error('Failed to update lead stage');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Stage Updated",
        description: "Lead stage has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update lead stage. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create estimate mutations
  const createEstimateMutation = useMutation({
    mutationFn: async ({ leadId, isMultiService, businessMessage, validUntil }: { 
      leadId: number; 
      isMultiService: boolean; 
      businessMessage?: string; 
      validUntil?: string; 
    }) => {
      const endpoint = isMultiService ? `/api/multi-service-leads/${leadId}/estimate` : `/api/leads/${leadId}/estimate`;
      return await apiRequest("POST", endpoint, { businessMessage, validUntil });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({
        title: "Estimate Created",
        description: "Estimate has been created successfully.",
      });
      // Open the estimate in a new tab if estimateNumber is available
      if (response && typeof response === 'object' && 'estimateNumber' in response) {
        window.open(`/estimate/${(response as any).estimateNumber}`, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create estimate. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete lead mutations
  const deleteLeadMutation = useMutation({
    mutationFn: async ({ leadId, isMultiService }: { leadId: number; isMultiService: boolean }) => {
      const endpoint = isMultiService ? `/api/multi-service-leads/${leadId}` : `/api/leads/${leadId}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete lead');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Lead Deleted",
        description: "Lead has been permanently deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions for stage management
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "open": return <Circle className="w-4 h-4" />;
      case "booked": return <Clock className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "lost": return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-200";
      case "booked": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "lost": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleStageUpdate = (leadId: number, newStage: string, isMultiService: boolean) => {
    updateLeadStageMutation.mutate({ leadId, stage: newStage, isMultiService });
  };

  const handleDeleteLead = (leadId: number, isMultiService: boolean, leadName: string) => {
    if (confirm(`Are you sure you want to delete the lead from ${leadName}? This action cannot be undone.`)) {
      deleteLeadMutation.mutate({ leadId, isMultiService });
    }
  };

  // Combine and process leads data
  const processedSingleLeads = (singleLeads as Lead[] || []).map(lead => {
    const formula = (formulas as any[] || []).find(f => f.id === lead.formulaId);
    return {
      ...lead,
      type: 'single' as const,
      formula,
      totalServices: 1,
      serviceNames: formula?.name || 'Unknown Service'
    };
  });

  const processedMultiServiceLeads = (multiServiceLeads as MultiServiceLead[] || []).map(lead => ({
    ...lead,
    type: 'multi' as const,
    calculatedPrice: lead.totalPrice,
    totalServices: lead.services.length,
    serviceNames: lead.services.map(s => s.formulaName).join(', ')
  }));

  const allLeads = [...processedSingleLeads, ...processedMultiServiceLeads];

  // Filter leads
  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.serviceNames.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterBy === "all" ||
      (filterBy === "single" && lead.type === "single") ||
      (filterBy === "multi" && lead.type === "multi") ||
      (filterBy === "high-value" && lead.calculatedPrice > 100000);

    const matchesStage = 
      stageFilter === "all" || lead.stage === stageFilter;

    return matchesSearch && matchesFilter && matchesStage;
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "highest-value":
        return b.calculatedPrice - a.calculatedPrice;
      case "lowest-value":
        return a.calculatedPrice - b.calculatedPrice;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const totalLeads = allLeads.length;
  const totalValue = allLeads.reduce((sum, lead) => sum + lead.calculatedPrice, 0);
  const averageValue = totalLeads > 0 ? totalValue / totalLeads : 0;

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Mobile-First Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
            Customer Leads
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-600">
            Track and manage all your pricing calculator leads in one place
          </p>
        </div>

        {/* Mobile-Optimized Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200 active:scale-95">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-blue-700">Total Leads</span>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mt-1">{totalLeads}</div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-blue-500 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-green-700">Total Value</span>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mt-1">
                    ${(totalValue / 100).toLocaleString()}
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-green-500 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-purple-700">Average Value</span>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900 mt-1">
                    ${Math.round(averageValue / 100).toLocaleString()}
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-purple-500 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Filter className="w-5 h-5" />
              Filter & Search Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest-value">Highest Value</SelectItem>
                  <SelectItem value="lowest-value">Lowest Value</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leads</SelectItem>
                  <SelectItem value="single">Single Service</SelectItem>
                  <SelectItem value="multi">Multi Service</SelectItem>
                  <SelectItem value="high-value">High Value ($1000+)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
            <CardTitle className="text-gray-800">
              All Leads ({sortedLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sortedLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterBy !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Leads will appear here once customers submit quotes"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedLeads.map((lead) => (
                  <div 
                    key={`${lead.type}-${lead.id}`} 
                    className="p-3 sm:p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => handleLeadClick(lead)}
                  >
                    {/* Mobile Compact Layout */}
                    <div className="block sm:hidden">
                      {/* Top row with avatar, name, and price */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate">{lead.name}</h3>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-green-600">
                            ${(lead.calculatedPrice / 100).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {lead.totalServices} service{lead.totalServices > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      {/* Badge row */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant={lead.type === 'multi' ? 'default' : 'secondary'} className="text-xs">
                          {lead.type === 'multi' ? 'Multi Service' : 'Single Service'}
                        </Badge>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStageColor(lead.stage)}`}>
                          {getStageIcon(lead.stage)}
                          <span>{lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}</span>
                        </div>
                      </div>
                      
                      {/* Contact info row */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Services row */}
                      <div className="bg-gray-50 px-3 py-2 rounded-lg mb-3">
                        <div className="text-xs font-medium text-gray-700 mb-1">Services:</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{lead.serviceNames}</div>
                      </div>

                      {/* Discounts and Upsells for mobile - multi-service only */}
                      {lead.type === 'multi' && ((lead.appliedDiscounts && lead.appliedDiscounts.length > 0) || (lead.selectedUpsells && lead.selectedUpsells.length > 0)) && (
                        <div className="bg-orange-50 px-3 py-2 rounded-lg mb-3">
                          <div className="text-xs font-medium text-gray-700 mb-2">Pricing Adjustments:</div>
                          
                          {/* Discounts */}
                          {lead.appliedDiscounts && lead.appliedDiscounts.length > 0 && (
                            <div className="mb-2">
                              {lead.appliedDiscounts.map((discount, index) => (
                                <div key={index} className="flex justify-between items-center text-xs text-green-700 mb-1">
                                  <span>{discount.name} ({discount.percentage}% off)</span>
                                  <span className="font-bold">-${(discount.amount / 100).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Bundle Discount */}
                          {lead.bundleDiscountAmount && lead.bundleDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-blue-700 mb-2">
                              <span>Bundle Discount</span>
                              <span className="font-bold">-${(lead.bundleDiscountAmount / 100).toFixed(2)}</span>
                            </div>
                          )}
                          
                          {/* Upsells */}
                          {lead.selectedUpsells && lead.selectedUpsells.length > 0 && (
                            <div>
                              {lead.selectedUpsells.map((upsell, index) => (
                                <div key={index} className="flex justify-between items-center text-xs text-orange-700 mb-1">
                                  <span>{upsell.name}</span>
                                  <span className="font-bold">+${(upsell.amount / 100).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            createEstimateMutation.mutate({
                              leadId: lead.id,
                              isMultiService: lead.type === 'multi',
                              businessMessage: "Thank you for your interest in our services. Please find your detailed estimate below."
                            });
                          }}
                          disabled={createEstimateMutation.isPending}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Estimate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLead(lead.id, lead.type === 'multi', lead.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout - Clean & Spacious */}
                    <div className="hidden sm:block">
                      <div className="grid grid-cols-12 gap-4 p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors items-center">
                        {/* Left Section - Customer Info (4 columns) */}
                        <div className="col-span-4 flex items-center space-x-4 min-w-0">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-lg">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{lead.name}</h3>
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-gray-500 flex items-center truncate">
                                <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{lead.email}</span>
                              </span>
                              {lead.phone && (
                                <span className="text-sm text-gray-500 flex items-center">
                                  <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Center Section - Service & Status (6 columns) */}
                        <div className="col-span-6 min-w-0">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <p className="text-sm font-medium text-gray-900 truncate" title={lead.serviceNames}>
                                {lead.serviceNames}
                              </p>
                              <span className="text-lg font-bold text-green-600 flex-shrink-0">
                                ${(lead.calculatedPrice / 100).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant={lead.type === 'multi' ? 'default' : 'secondary'} className="text-xs">
                                  {lead.type === 'multi' ? 'Multi' : 'Single'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                                </span>
                              </div>
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${getStageColor(lead.stage)}`}>
                                {getStageIcon(lead.stage)}
                                {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Actions Only (2 columns) */}
                        <div className="col-span-2 flex items-center justify-end">
                          {/* Quick Actions */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeadClick(lead);
                              }}
                              className="px-2"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                createEstimateMutation.mutate({
                                  leadId: lead.id,
                                  isMultiService: lead.type === 'multi',
                                  businessMessage: "Thank you for your interest in our services. Please find your detailed estimate below."
                                });
                              }}
                              disabled={createEstimateMutation.isPending}
                              className="px-2"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>

                            <Select value={lead.stage} onValueChange={(newStage) => handleStageUpdate(lead.id, newStage, lead.type === 'multi')}>
                              <SelectTrigger className="w-8 h-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="booked">Booked</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Details Modal */}
        <LeadDetailsModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
        </div>
      </div>
    </DashboardLayout>
  );
}