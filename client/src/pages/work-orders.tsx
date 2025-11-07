import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Briefcase,
  Search,
  MoreVertical,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  FileText,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkOrder } from "@shared/schema";

export default function WorkOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [schedulingWorkOrder, setSchedulingWorkOrder] = useState<WorkOrder | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const { toast } = useToast();

  const { data: workOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ workOrderId, scheduledDate, scheduledTime }: { workOrderId: number; scheduledDate: string; scheduledTime: string }) => {
      return await apiRequest("PATCH", `/api/work-orders/${workOrderId}`, { scheduledDate, scheduledTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setSchedulingWorkOrder(null);
      setScheduledDate("");
      setScheduledTime("");
      toast({
        title: "Schedule Updated",
        description: "Work order has been scheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update work order schedule",
        variant: "destructive",
      });
    },
  });

  const handleSchedule = () => {
    if (schedulingWorkOrder && scheduledDate && scheduledTime) {
      updateScheduleMutation.mutate({
        workOrderId: schedulingWorkOrder.id,
        scheduledDate,
        scheduledTime,
      });
    }
  };

  const filteredWorkOrders = workOrders.filter(workOrder =>
    workOrder.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workOrder.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workOrder.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <TrendingUp className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Calculate statistics
  const totalWorkOrders = workOrders.length;
  const scheduledCount = workOrders.filter(wo => wo.status === 'scheduled').length;
  const inProgressCount = workOrders.filter(wo => wo.status === 'in_progress').length;
  const completedCount = workOrders.filter(wo => wo.status === 'completed').length;
  const totalValue = workOrders.reduce((sum, wo) => sum + wo.totalAmount, 0);

  return (
    <DashboardLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-gray-600 mt-1">
              Manage and schedule your work orders
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalWorkOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-900">{scheduledCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-900">{inProgressCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{completedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Work Orders</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search work orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-work-orders"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading work orders...</p>
              </div>
            ) : filteredWorkOrders.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No work orders found</h3>
                <p className="text-gray-600">
                  {searchTerm ? "Try adjusting your search criteria" : "Convert accepted estimates to create work orders"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkOrders.map((workOrder) => (
                      <TableRow key={workOrder.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <Button variant="link" className="p-0 h-auto font-mono text-blue-600">
                            {workOrder.workOrderNumber}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{workOrder.customerName}</p>
                            <p className="text-sm text-gray-600">{workOrder.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {workOrder.scheduledDate && workOrder.scheduledTime ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{workOrder.scheduledDate}</p>
                                <p className="text-xs text-gray-600">{workOrder.scheduledTime}</p>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSchedulingWorkOrder(workOrder);
                                setScheduledDate(workOrder.scheduledDate || "");
                                setScheduledTime(workOrder.scheduledTime || "");
                              }}
                              data-testid={`button-schedule-${workOrder.id}`}
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(workOrder.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(workOrder.status)}
                              {workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1).replace('_', ' ')}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(workOrder.totalAmount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {format(new Date(workOrder.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSchedulingWorkOrder(workOrder);
                                  setScheduledDate(workOrder.scheduledDate || "");
                                  setScheduledTime(workOrder.scheduledTime || "");
                                }}
                                data-testid={`menu-reschedule-${workOrder.id}`}
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                {workOrder.scheduledDate ? 'Reschedule' : 'Schedule'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Dialog */}
        <Dialog open={!!schedulingWorkOrder} onOpenChange={(open) => !open && setSchedulingWorkOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Work Order</DialogTitle>
              <DialogDescription>
                Set the scheduled date and time for {schedulingWorkOrder?.customerName}'s work order.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-date">Scheduled Date *</Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  data-testid="input-schedule-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled-time">Scheduled Time *</Label>
                <Input
                  id="scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  data-testid="input-schedule-time"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setSchedulingWorkOrder(null)}
                data-testid="button-cancel-schedule"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={!scheduledDate || !scheduledTime || updateScheduleMutation.isPending}
                data-testid="button-confirm-schedule"
              >
                {updateScheduleMutation.isPending ? "Scheduling..." : "Confirm Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardLayout>
  );
}
