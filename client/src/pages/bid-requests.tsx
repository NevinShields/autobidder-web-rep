import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ExternalLink,
  Search,
  Filter
} from "lucide-react";
import type { BidRequest } from "@shared/schema";
import { Link } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";

export default function BidRequestsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch bid requests for the current user
  const { data: bidRequests = [], isLoading } = useQuery<BidRequest[]>({
    queryKey: ["/api/bids"],
    enabled: !!user,
  });

  // Format price from cents to dollars
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "revised":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><DollarSign className="h-3 w-3 mr-1" />Revised</Badge>;
      case "need_more_info":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertCircle className="h-3 w-3 mr-1" />More Info Needed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBidRequests = bidRequests.filter(bidRequest => {
    const matchesSearch = bidRequest.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bidRequest.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || bidRequest.bidStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = bidRequests.filter(bid => bid.bidStatus === "pending").length;
  const approvedCount = bidRequests.filter(bid => bid.bidStatus === "approved").length;
  const revisedCount = bidRequests.filter(bid => bid.bidStatus === "revised").length;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bid Requests</h1>
            <p className="text-muted-foreground mt-1">Review and approve customer pricing requests</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{bidRequests.length}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revised</p>
                  <p className="text-2xl font-bold text-blue-600">{revisedCount}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by customer name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="revised">Revised</option>
                  <option value="need_more_info">Need More Info</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bid Requests List */}
        <div className="space-y-4">
          {filteredBidRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bid requests found</h3>
                <p className="text-muted-foreground">
                  {bidRequests.length === 0 
                    ? "When customers submit pricing forms, their requests will appear here for your review."
                    : "No bid requests match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : filteredBidRequests.map((bidRequest) => (
            <Card key={bidRequest.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{bidRequest.customerName}</h3>
                      {getStatusBadge(bidRequest.bidStatus)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{bidRequest.customerEmail}</span>
                      </div>
                      {bidRequest.customerPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{bidRequest.customerPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(bidRequest.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(bidRequest.finalPrice || bidRequest.autoPrice)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bidRequest.finalPrice && bidRequest.finalPrice !== bidRequest.autoPrice 
                        ? `Original: ${formatPrice(bidRequest.autoPrice)}`
                        : 'Auto-calculated'
                      }
                    </div>
                  </div>
                </div>

                {bidRequest.address && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{bidRequest.address}</span>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Services */}
                {bidRequest.services && bidRequest.services.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Services Requested:</h4>
                    <div className="space-y-2">
                      {bidRequest.services.map((service, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="font-medium">{service.formulaName}</span>
                          <span className="text-green-600 font-medium">{formatPrice(service.calculatedPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Link href={`/verify-bid/${bidRequest.magicToken}`}>
                    <Button variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Review & Verify
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}