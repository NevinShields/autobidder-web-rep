import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, Filter, Users, DollarSign, Mail, Phone, MapPin, FileText, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import LeadDetailsModal from "@/components/lead-details-modal";

interface Lead {
  id: number;
  formulaId: number;
  name: string;
  email: string;
  phone?: string;
  calculatedPrice: number;
  variables: Record<string, any>;
  createdAt: string;
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
  createdAt: string;
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      (filterBy === "high-value" && lead.calculatedPrice > 1000);

    return matchesSearch && matchesFilter;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
            Leads Management
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Track and manage all your pricing calculator leads in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-blue-700">Total Leads</span>
                  <div className="text-3xl font-bold text-blue-900 mt-1">{totalLeads}</div>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-green-700">Total Value</span>
                  <div className="text-3xl font-bold text-green-900 mt-1">
                    ${totalValue.toLocaleString()}
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-purple-700">Average Value</span>
                  <div className="text-3xl font-bold text-purple-900 mt-1">
                    ${Math.round(averageValue).toLocaleString()}
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-xs">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate">{lead.name}</h3>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{format(new Date(lead.createdAt), "MMM dd")}</span>
                              <Badge variant={lead.type === 'multi' ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                                {lead.type === 'multi' ? 'Multi' : 'Single'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-green-600">
                            ${lead.calculatedPrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {lead.totalServices} svc{lead.totalServices > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <div className="flex items-center truncate flex-1 mr-2">
                          <Mail className="h-3 w-3 mr-1 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center flex-shrink-0">
                            <Phone className="h-3 w-3 mr-1 text-green-500" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate">
                        {lead.serviceNames}
                      </div>
                    </div>

                    {/* Desktop Layout (unchanged) */}
                    <div className="hidden sm:block">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {format(new Date(lead.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                              </span>
                              <Badge variant={lead.type === 'multi' ? 'default' : 'secondary'}>
                                {lead.type === 'multi' ? 'Multi Service' : 'Single Service'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeadClick(lead);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              ${lead.calculatedPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {lead.totalServices} service{lead.totalServices > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="break-all">{lead.email}</span>
                        </div>
                        
                        {lead.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-green-500" />
                            <span>{lead.phone}</span>
                          </div>
                        )}

                        {lead.type === 'multi' && lead.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-red-500" />
                            <span className="truncate">{lead.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services Requested:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {lead.serviceNames}
                        </p>
                      </div>

                      {lead.type === 'multi' && lead.services && lead.services.length > 1 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Service Breakdown:</h4>
                          <div className="space-y-2">
                            {lead.services.map((service, index) => (
                              <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                <span className="text-gray-700">{service.formulaName}</span>
                                <span className="font-medium text-green-600">
                                  ${service.calculatedPrice.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {lead.type === 'multi' && lead.notes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            Additional Notes:
                          </h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {lead.notes}
                          </p>
                        </div>
                      )}

                      {lead.type === 'multi' && lead.howDidYouHear && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">How they heard about us:</span> {lead.howDidYouHear}
                        </div>
                      )}
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
  );
}