import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Search, Filter, Users, DollarSign, Mail, Phone, MapPin, FileText, Clock, Eye, CheckCircle, Circle, XCircle, AlertCircle, Trash2, MoreHorizontal, Download, Columns, LayoutGrid, Tag, Plus, X, Edit2, Zap, Play, Pause, Settings, ExternalLink, Check, ChevronDown, ChevronUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import LeadDetailsModal from "@/components/lead-details-modal";
import EditEstimateDialog from "@/components/edit-estimate-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAutomationApproval } from "@/hooks/useAutomationApproval";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Lead {
  id: number;
  userId?: string;
  formulaId?: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  calculatedPrice: number;
  variables: Record<string, any>;
  stage: string;
  source?: string;
  dudaSiteId?: string;
  dudaSubmissionId?: string;
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
  stageHistory?: Array<{
    stage: string;
    changedAt: string;
    notes?: string;
  }>;
  lastStageChange?: string;
}

const PIPELINE_STAGES = [
  { value: "new", label: "New Lead", color: "bg-blue-500" },
  { value: "pre_estimate", label: "Pre-Estimate", color: "bg-purple-500" },
  { value: "estimate_approved", label: "Estimate Confirmed", color: "bg-green-500" },
  { value: "booked", label: "Scheduled", color: "bg-orange-500" },
  { value: "completed", label: "Completed", color: "bg-emerald-500" }
];

const LEGACY_STAGES = [
  { value: "open", label: "Open", color: "bg-blue-500" },
  { value: "booked", label: "Booked", color: "bg-cyan-500" },
  { value: "completed", label: "Completed", color: "bg-emerald-500" },
  { value: "lost", label: "Lost", color: "bg-red-500" }
];

type KanbanLead = (Lead | MultiServiceLead) & { type: "single" | "multi"; serviceNames: string; totalServices: number };

function DraggableKanbanCard({ lead, onClick }: { lead: KanbanLead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-${lead.type}-${lead.id}`,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const price = lead.calculatedPrice || ("totalPrice" in lead ? lead.totalPrice : 0);
  const leadSource = (lead as any).source || 'calculator';
  
  const getSourceBadge = (source: string) => {
    const badges = {
      'duda': { label: 'Website', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
      'calculator': { label: 'Calculator', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      'custom_form': { label: 'Custom Form', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      'manual': { label: 'Manual', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' }
    };
    return badges[source as keyof typeof badges] || badges['calculator'];
  };
  
  const sourceBadge = getSourceBadge(leadSource);
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card 
        className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
        onClick={onClick}
        data-testid={`kanban-lead-card-${lead.id}`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {lead.name}
              </h4>
              <Badge variant="secondary" className={`text-xs ${sourceBadge.color}`}>
                {sourceBadge.label}
              </Badge>
            </div>
            <Badge variant="secondary" className="text-xs">
              ${(price / 100).toFixed(2)}
            </Badge>
          </div>
          
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {lead.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{lead.address}</span>
              </div>
            )}
          </div>
          
          {lead.lastStageChange && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              <Calendar className="h-3 w-3 inline mr-1" />
              {new Date(lead.lastStageChange).toLocaleDateString()}
            </div>
          )}
          
          {/* Lead Tags */}
          {(lead as any).tags && (lead as any).tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(lead as any).tags.map((tag: any) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                <div className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: tag.color }} />
                {tag.displayName}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}

function KanbanLeadDetailDialog({ lead, open, onOpenChange }: { lead: KanbanLead | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!lead) return null;
  
  const price = lead.calculatedPrice || ("totalPrice" in lead ? lead.totalPrice : 0);
  const stageHistory = lead.stageHistory || [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900" data-testid="kanban-lead-detail-dialog">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">{lead.name}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">Stage History</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Phone</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.phone || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Address</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.address || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Price</label>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">${(price / 100).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Current Stage</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{lead.stage.replace(/_/g, " ")}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Services</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.serviceNames}</p>
              </div>
            </div>
            
            {lead.notes && (
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Notes</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{lead.notes}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <ScrollArea className="h-[400px]">
              {stageHistory.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">No stage history available</p>
              ) : (
                <div className="space-y-3">
                  {stageHistory.map((entry, index) => (
                    <div key={index} className="flex gap-3 border-l-2 border-gray-300 dark:border-gray-700 pl-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {entry.stage.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(entry.changedAt).toLocaleString()}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="communications">
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">
              Communications feature coming soon
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function DroppableColumn({ stage, leads, onLeadClick }: { 
  stage: typeof PIPELINE_STAGES[0]; 
  leads: KanbanLead[];
  onLeadClick: (lead: KanbanLead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${stage.value}`,
  });

  const count = leads.length;
  const totalValue = leads.reduce((sum, lead) => {
    const price = lead.calculatedPrice || ("totalPrice" in lead ? lead.totalPrice : 0);
    return sum + price;
  }, 0);
  
  return (
    <div className="flex-shrink-0 w-80" data-testid={`stage-column-${stage.value}`}>
      <Card className={`h-full flex flex-col ${isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' : 'bg-gray-50 dark:bg-gray-800'} transition-colors`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {stage.label}
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {count} lead{count !== 1 ? "s" : ""} • ${(totalValue / 100).toFixed(2)}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${stage.color}`} />
          </div>
        </CardHeader>
        <Separator />
        <ScrollArea className="flex-1 p-4">
          <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
            {leads.map((lead) => (
              <DraggableKanbanCard key={`${lead.type}-${lead.id}`} lead={lead} onClick={() => onLeadClick(lead)} />
            ))}
            {leads.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">
                No leads in this stage
              </p>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<"leads" | "estimates" | "work-orders" | "invoices" | "automations">("leads");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [kanbanSelectedLead, setKanbanSelectedLead] = useState<KanbanLead | null>(null);
  const [kanbanDetailDialogOpen, setKanbanDetailDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [useLegacyStages, setUseLegacyStages] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<any | null>(null);
  const [schedulingWorkOrder, setSchedulingWorkOrder] = useState<any | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState("60");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: singleLeads, isLoading: singleLeadsLoading } = useQuery({
    queryKey: ["/api/leads?includeTags=true"],
  });

  const { data: multiServiceLeads, isLoading: multiServiceLeadsLoading } = useQuery({
    queryKey: ["/api/multi-service-leads?includeTags=true"],
  });

  const { data: formulas } = useQuery({
    queryKey: ["/api/formulas"],
  });
  
  const { data: leadTags } = useQuery<any[]>({
    queryKey: ["/api/lead-tags"],
  });

  const { data: allEstimates = [], isLoading: estimatesLoading } = useQuery<any[]>({
    queryKey: ["/api/estimates"],
    enabled: activeTab === "estimates",
  });

  const { data: allWorkOrders = [], isLoading: workOrdersLoading } = useQuery<any[]>({
    queryKey: ["/api/work-orders"],
    enabled: activeTab === "work-orders",
  });

  const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    enabled: activeTab === "invoices",
  });

  const isLoading = singleLeadsLoading || multiServiceLeadsLoading;
  
  // Tag management state
  const [tagFilter, setTagFilter] = useState("all");
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [tagDialogMode, setTagDialogMode] = useState<"create" | "edit">("create");
  const [editingTag, setEditingTag] = useState<any>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  
  // Tag mutations
  const createTagMutation = useMutation({
    mutationFn: async (tagData: { displayName: string; color: string }) => {
      return await apiRequest("/api/lead-tags", {
        method: "POST",
        body: JSON.stringify({
          displayName: tagData.displayName,
          color: tagData.color,
          isActive: true,
          displayOrder: (leadTags?.length || 0) + 1,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-tags"] });
      setIsTagDialogOpen(false);
      setNewTagName("");
      setNewTagColor("#3b82f6");
      toast({
        title: "Tag Created",
        description: "Lead tag has been created successfully.",
      });
    },
  });
  
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/lead-tags/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-tags"] });
      setIsTagDialogOpen(false);
      setEditingTag(null);
      toast({
        title: "Tag Updated",
        description: "Lead tag has been updated successfully.",
      });
    },
  });
  
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      return await apiRequest(`/api/lead-tags/${tagId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-tags"] });
      toast({
        title: "Tag Deleted",
        description: "Lead tag has been deleted successfully.",
      });
    },
  });
  
  const assignTagMutation = useMutation({
    mutationFn: async ({ leadId, tagId, isMultiService }: { leadId: number; tagId: number; isMultiService: boolean }) => {
      return await apiRequest(`/api/leads/${leadId}/tags`, {
        method: "POST",
        body: JSON.stringify({ tagId, isMultiService }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-tags"] });
    },
  });
  
  const removeTagMutation = useMutation({
    mutationFn: async ({ leadId, tagId, isMultiService }: { leadId: number; tagId: number; isMultiService: boolean }) => {
      return await apiRequest(`/api/leads/${leadId}/tags/${tagId}?isMultiService=${isMultiService}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-tags"] });
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: { name: string; email: string; phone?: string; address?: string; notes?: string }) => {
      return await apiRequest("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          ...customerData,
          calculatedPrice: 0,
          variables: {},
          stage: "new",
          source: "manual",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads?includeTags=true"] });
      setIsAddCustomerDialogOpen(false);
      setNewCustomerData({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      toast({
        title: "Customer Added",
        description: "Customer has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stage update mutations
  const updateLeadStageMutation = useMutation({
    mutationFn: async ({ leadId, stage, isMultiService, notes }: { leadId: number; stage: string; isMultiService: boolean; notes?: string }) => {
      const endpoint = isMultiService ? `/api/multi-service-leads/${leadId}/stage` : `/api/leads/${leadId}/stage`;
      return await apiRequest("PATCH", endpoint, { stage, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads?includeTags=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads?includeTags=true"] });
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

  // Workflow mutations for estimate → work order → invoice
  const { approveMutation: approveEstimateMutation, DialogComponent: AutomationDialog } = useAutomationApproval({
    invalidateQueries: [
      ["/api/estimates"],
      ["/api/leads"],
      ["/api/multi-service-leads"]
    ],
  });

  const requestRevisionMutation = useMutation({
    mutationFn: async ({ estimateId, revisionNotes }: { estimateId: number; revisionNotes: string }) => {
      return await apiRequest("POST", `/api/estimates/${estimateId}/request-revision`, { revisionNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({
        title: "Revision Requested",
        description: "Revision has been requested for this estimate.",
      });
    },
    onError: () => {
      toast({
        title: "Request Failed",
        description: "Failed to request revision. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markCustomerApprovedMutation = useMutation({
    mutationFn: async ({ estimateId }: { estimateId: number }) => {
      return await apiRequest("POST", `/api/estimates/${estimateId}/mark-customer-approved`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Customer Approved",
        description: "Estimate has been marked as customer approved and is ready to convert to work order.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Mark as Approved",
        description: error.message || "Failed to mark estimate as customer approved",
        variant: "destructive",
      });
    },
  });

  const convertToWorkOrderMutation = useMutation({
    mutationFn: async ({ estimateId, scheduledDate }: { estimateId: number; scheduledDate?: string }) => {
      return await apiRequest("POST", `/api/estimates/${estimateId}/convert-to-work-order`, { scheduledDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Work Order Created",
        description: "Estimate has been converted to a work order.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error.message || "Failed to convert estimate to work order",
        variant: "destructive",
      });
    },
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async ({ workOrderId }: { workOrderId: number }) => {
      return await apiRequest("POST", `/api/work-orders/${workOrderId}/convert-to-invoice`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Invoice Created",
        description: "Work order has been converted to an invoice.",
      });
    },
    onError: () => {
      toast({
        title: "Conversion Failed",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const convertInvoiceToWorkOrderMutation = useMutation({
    mutationFn: async ({ invoiceId, scheduledDate }: { invoiceId: number; scheduledDate?: string }) => {
      return await apiRequest("POST", `/api/invoices/${invoiceId}/convert-to-work-order`, { scheduledDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Work Order Created",
        description: "Invoice has been converted to a work order.",
      });
    },
    onError: () => {
      toast({
        title: "Conversion Failed",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scheduleWorkOrderMutation = useMutation({
    mutationFn: async ({ workOrderId, scheduledDate, scheduledTime, duration }: { workOrderId: number; scheduledDate: string; scheduledTime?: string; duration?: number }) => {
      return await apiRequest("PATCH", `/api/work-orders/${workOrderId}`, { scheduledDate, scheduledTime, duration, status: 'scheduled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setSchedulingWorkOrder(null);
      setScheduleDate("");
      setScheduleTime("");
      setScheduleDuration("60");
      toast({
        title: "Work Order Scheduled",
        description: "The work order has been scheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule work order. Please try again.",
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

  // Helper function to clean service names
  const cleanServiceName = (serviceName: string) => {
    return serviceName
      .replace(/\s*Service Calculator$/i, '')
      .replace(/\s*Calculator$/i, '')
      .trim();
  };

  // Combine and process leads data
  const processedSingleLeads = (singleLeads as Lead[] || []).map(lead => {
    const formula = (formulas as any[] || []).find(f => f.id === lead.formulaId);
    return {
      ...lead,
      type: 'single' as const,
      formula,
      totalServices: 1,
      serviceNames: cleanServiceName(formula?.name || 'Unknown Service')
    };
  });

  const processedMultiServiceLeads = (multiServiceLeads as MultiServiceLead[] || []).map(lead => ({
    ...lead,
    type: 'multi' as const,
    calculatedPrice: lead.totalPrice,
    totalServices: lead.services.length,
    serviceNames: lead.services.map(s => cleanServiceName(s.formulaName)).join(', ')
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

  // Checkbox selection handlers
  const handleSelectLead = (leadKey: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(leadKey) 
        ? prev.filter(id => id !== leadKey)
        : [...prev, leadKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === sortedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(sortedLeads.map(lead => `${lead.type}-${lead.id}`));
    }
  };

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (leadKeys: string[]) => {
      const deletePromises = leadKeys.map(async (key) => {
        const [type, id] = key.split('-');
        const isMultiService = type === 'multi';
        const endpoint = isMultiService ? `/api/multi-service-leads/${id}` : `/api/leads/${id}`;
        const response = await fetch(endpoint, { method: "DELETE" });
        if (!response.ok) {
          throw new Error(`Failed to delete lead ${id}`);
        }
        return response;
      });
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Leads Deleted",
        description: `Successfully deleted ${selectedLeadIds.length} lead(s).`,
      });
      setSelectedLeadIds([]);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete some leads. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedLeadIds.length} lead(s)? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedLeadIds);
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (selectedLeadIds.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select at least one lead to export.",
        variant: "destructive",
      });
      return;
    }

    const selectedLeads = sortedLeads.filter(lead => 
      selectedLeadIds.includes(`${lead.type}-${lead.id}`)
    );

    // Helper function to escape CSV values per RFC 4180
    const escapeCSV = (value: string) => {
      if (!value) return '""';
      // If value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
      if (value.includes('"') || value.includes(',') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return `"${value}"`;
    };

    const headers = ['Name', 'Email', 'Phone', 'Services', 'Price', 'Stage', 'Date'];
    const csvContent = [
      headers.join(','),
      ...selectedLeads.map(lead => [
        escapeCSV(lead.name),
        escapeCSV(lead.email),
        escapeCSV(lead.phone || ''),
        escapeCSV(lead.serviceNames),
        escapeCSV(`$${(lead.calculatedPrice / 100).toFixed(2)}`),
        escapeCSV(lead.stage),
        escapeCSV(format(new Date(lead.createdAt), 'MMM dd, yyyy')),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Successfully exported ${selectedLeadIds.length} lead(s) to CSV.`,
    });
  };
  
  // Kanban DND handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const draggedId = active.id as string;
    const [type, idStr] = draggedId.split("-").slice(1);
    const id = parseInt(idStr);
    const newStage = (over.id as string).replace("droppable-", "");
    
    const lead = allLeads.find(l => l.id === id && l.type === type);
    
    if (lead && lead.stage !== newStage) {
      const isMultiService = type === "multi";
      updateLeadStageMutation.mutate({ leadId: id, stage: newStage, isMultiService });
    }
    
    setActiveId(null);
  };
  
  const handleKanbanLeadClick = (lead: KanbanLead) => {
    setKanbanSelectedLead(lead);
    setKanbanDetailDialogOpen(true);
  };
  
  const stages = useLegacyStages ? LEGACY_STAGES : PIPELINE_STAGES;
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.value] = allLeads.filter(lead => lead.stage === stage.value);
    return acc;
  }, {} as Record<string, typeof allLeads>);
  
  const activeLead = activeId ? allLeads.find(l => `draggable-${l.type}-${l.id}` === activeId) : null;

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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                Customer Leads
              </h1>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-gray-600">
                Track and manage all your pricing calculator leads in one place
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAddCustomerDialogOpen(true)}
                data-testid="button-add-customer"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Customer</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <Columns className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Table</span>
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                data-testid="button-view-kanban"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "leads" | "estimates" | "work-orders" | "invoices" | "automations")} className="mb-8">
          <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:max-w-3xl md:grid-cols-4 h-auto gap-1">
              <TabsTrigger value="leads" data-testid="tab-leads" className="flex-shrink-0 min-w-[100px] h-11 md:min-w-0">Customers</TabsTrigger>
              <TabsTrigger value="estimates" data-testid="tab-estimates" className="flex-shrink-0 min-w-[100px] h-11 md:min-w-0">Estimates</TabsTrigger>
              <TabsTrigger value="work-orders" data-testid="tab-work-orders" className="flex-shrink-0 min-w-[120px] h-11 md:min-w-0">Work Orders</TabsTrigger>
              <TabsTrigger value="invoices" data-testid="tab-invoices" className="flex-shrink-0 min-w-[100px] h-11 md:min-w-0">Invoices</TabsTrigger>
            </TabsList>
          </div>

          {/* Leads Tab */}
          <TabsContent value="leads">
        {/* Mobile-Optimized Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Leads</span>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">{totalLeads}</div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-primary/10 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Value</span>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">
                    ${(totalValue / 100).toLocaleString()}
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-primary/10 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Average Value</span>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">
                    ${Math.round(averageValue / 100).toLocaleString()}
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-primary/10 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Filter className="w-5 h-5" />
                  Filter & Search Leads
                </CardTitle>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    data-testid="button-toggle-filters"
                  >
                    {isFiltersOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide Filters
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show Filters
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
              
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger data-testid="select-tag-filter">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {leadTags?.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.displayName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {leadTags?.slice(0, 5).map((tag) => (
                  <Badge 
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ borderColor: tag.color, color: tag.color }}
                    onClick={() => setTagFilter(tag.id.toString())}
                  >
                    <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
                    {tag.displayName}
                  </Badge>
                ))}
              </div>
              
              <Button
                data-testid="button-manage-tags"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTagDialogMode("create");
                  setEditingTag(null);
                  setNewTagName("");
                  setNewTagColor("#3b82f6");
                  setIsTagDialogOpen(true);
                }}
                className="gap-2"
              >
                <Tag className="h-4 w-4" />
                Manage Tags
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>

        {viewMode === "table" ? (
          <>
            {/* Leads List */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {sortedLeads.length > 0 && (
                      <Checkbox
                        data-testid="checkbox-select-all"
                        checked={selectedLeadIds.length === sortedLeads.length && sortedLeads.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all leads"
                      />
                    )}
                    <CardTitle className="text-gray-800">
                      All Leads ({sortedLeads.length})
                      {selectedLeadIds.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-blue-600">
                          ({selectedLeadIds.length} selected)
                        </span>
                      )}
                    </CardTitle>
                  </div>
              
              {selectedLeadIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    data-testid="button-export-csv"
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </Button>
                  <Button
                    data-testid="button-bulk-delete"
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              )}
            </div>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">
                        <Checkbox
                          data-testid="checkbox-select-all-table"
                          checked={selectedLeadIds.length === sortedLeads.length && sortedLeads.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all leads"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tags</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedLeads.map((lead) => (
                      <tr 
                        key={`${lead.type}-${lead.id}`}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => handleLeadClick(lead)}
                        data-testid={`lead-row-${lead.type}-${lead.id}`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            data-testid={`checkbox-lead-${lead.type}-${lead.id}`}
                            checked={selectedLeadIds.includes(`${lead.type}-${lead.id}`)}
                            onCheckedChange={() => handleSelectLead(`${lead.type}-${lead.id}`)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-xs">
                                {lead.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{lead.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-[200px]">{lead.email}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {lead.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900 truncate max-w-[200px] block" title={lead.serviceNames}>
                            {lead.serviceNames}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-green-600">
                            ${(lead.calculatedPrice / 100).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge 
                            variant="secondary"
                            className={`${getStageColor(lead.stage)}`}
                          >
                            {getStageIcon(lead.stage)}
                            <span className="ml-1 capitalize">{lead.stage.replace(/_/g, ' ')}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(lead as any).tags?.map((tag: any) => (
                              <Badge
                                key={tag.id}
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: tag.color, color: tag.color }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: tag.color }} />
                                {tag.displayName}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600">
                            {format(new Date(lead.createdAt), "MMM dd, yyyy")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-actions-${lead.type}-${lead.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleLeadClick(lead)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStageUpdate(lead.id, 'open', lead.type === 'multi')}>
                                <Circle className="h-4 w-4 mr-2" />
                                Mark as Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStageUpdate(lead.id, 'booked', lead.type === 'multi')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Booked
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStageUpdate(lead.id, 'completed', lead.type === 'multi')}>
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStageUpdate(lead.id, 'lost', lead.type === 'multi')}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark as Lost
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        ) : (
          <>
            {/* Kanban View */}
            <div className="mb-4 flex justify-end gap-2">
              <Button
                variant={useLegacyStages ? "outline" : "default"}
                size="sm"
                onClick={() => setUseLegacyStages(false)}
                data-testid="button-toggle-new-stages"
              >
                New Pipeline
              </Button>
              <Button
                variant={useLegacyStages ? "default" : "outline"}
                size="sm"
                onClick={() => setUseLegacyStages(true)}
                data-testid="button-toggle-legacy-stages"
              >
                Legacy Pipeline
              </Button>
            </div>
            
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                {stages.map((stage) => (
                  <div key={stage.value} id={`droppable-${stage.value}`}>
                    <DroppableColumn
                      stage={stage}
                      leads={leadsByStage[stage.value] || []}
                      onLeadClick={handleKanbanLeadClick}
                    />
                  </div>
                ))}
              </div>
              
              <DragOverlay>
                {activeLead ? (
                  <div className="rotate-3 opacity-90">
                    <DraggableKanbanCard lead={activeLead} onClick={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
            
            <KanbanLeadDetailDialog
              lead={kanbanSelectedLead}
              open={kanbanDetailDialogOpen}
              onOpenChange={setKanbanDetailDialogOpen}
            />
          </>
        )}

        {/* Lead Details Modal */}
        <LeadDetailsModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
        
        {/* Tag Management Dialog */}
        <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Manage Lead Tags</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Create New Tag Form */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-sm font-semibold mb-3">
                  {tagDialogMode === "create" ? "Create New Tag" : "Edit Tag"}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Tag Name</label>
                    <Input
                      data-testid="input-tag-name"
                      placeholder="Enter tag name"
                      value={tagDialogMode === "create" ? newTagName : editingTag?.displayName || ""}
                      onChange={(e) => {
                        if (tagDialogMode === "create") {
                          setNewTagName(e.target.value);
                        } else if (editingTag) {
                          setEditingTag({ ...editingTag, displayName: e.target.value });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tag Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tagDialogMode === "create" ? newTagColor : editingTag?.color || "#3b82f6"}
                        onChange={(e) => {
                          if (tagDialogMode === "create") {
                            setNewTagColor(e.target.value);
                          } else if (editingTag) {
                            setEditingTag({ ...editingTag, color: e.target.value });
                          }
                        }}
                        className="h-10 w-20 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: tagDialogMode === "create" ? newTagColor : editingTag?.color,
                            color: tagDialogMode === "create" ? newTagColor : editingTag?.color
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: tagDialogMode === "create" ? newTagColor : editingTag?.color }}
                          />
                          {tagDialogMode === "create" ? (newTagName || "Preview") : (editingTag?.displayName || "Preview")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    data-testid="button-save-tag"
                    onClick={() => {
                      if (tagDialogMode === "create") {
                        if (newTagName.trim()) {
                          createTagMutation.mutate({
                            displayName: newTagName,
                            color: newTagColor,
                          });
                        }
                      } else if (editingTag) {
                        updateTagMutation.mutate({
                          id: editingTag.id,
                          data: {
                            displayName: editingTag.displayName,
                            color: editingTag.color,
                          },
                        });
                      }
                    }}
                    disabled={
                      createTagMutation.isPending ||
                      updateTagMutation.isPending ||
                      (tagDialogMode === "create" && !newTagName.trim()) ||
                      (tagDialogMode === "edit" && !editingTag?.displayName?.trim())
                    }
                    className="w-full"
                  >
                    {tagDialogMode === "create" ? "Create Tag" : "Update Tag"}
                  </Button>
                </div>
              </div>
              
              {/* Existing Tags List */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Existing Tags</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {leadTags && leadTags.length > 0 ? (
                    leadTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                      >
                        <Badge
                          variant="outline"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          <div
                            className="w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.displayName}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            data-testid={`button-edit-tag-${tag.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTagDialogMode("edit");
                              setEditingTag(tag);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            data-testid={`button-delete-tag-${tag.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete tag "${tag.displayName}"? This will remove it from all leads.`)) {
                                deleteTagMutation.mutate(tag.id);
                              }
                            }}
                            disabled={deleteTagMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No tags created yet. Create your first tag above.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Customer Dialog */}
        <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Name *</Label>
                <Input
                  id="customer-name"
                  data-testid="input-customer-name"
                  placeholder="Enter customer name"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email *</Label>
                <Input
                  id="customer-email"
                  data-testid="input-customer-email"
                  type="email"
                  placeholder="Enter customer email"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  data-testid="input-customer-phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer-address">Address</Label>
                <Input
                  id="customer-address"
                  data-testid="input-customer-address"
                  placeholder="Enter address"
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer-notes">Notes</Label>
                <Input
                  id="customer-notes"
                  data-testid="input-customer-notes"
                  placeholder="Add any notes"
                  value={newCustomerData.notes}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddCustomerDialogOpen(false);
                  setNewCustomerData({
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    notes: "",
                  });
                }}
                data-testid="button-cancel-add-customer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createCustomerMutation.mutate(newCustomerData)}
                disabled={createCustomerMutation.isPending || !newCustomerData.name || !newCustomerData.email}
                data-testid="button-save-customer"
              >
                {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </TabsContent>

          {/* Estimates Tab */}
          <TabsContent value="estimates">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                <CardTitle className="text-gray-800">
                  All Estimates ({allEstimates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {estimatesLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading estimates...</p>
                  </div>
                ) : allEstimates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h3>
                    <p className="text-gray-500">Estimates will appear here once you create them for your leads</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estimate</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                          <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allEstimates.map((estimate: any) => {
                          const currentStage = 
                            estimate.status === 'accepted' ? 3 :
                            estimate.ownerApprovalStatus === 'approved' ? 2 : 1;
                          
                          return (
                            <tr key={estimate.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`estimate-row-${estimate.id}`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <a 
                                    href={`/estimate/${estimate.estimateNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                  >
                                    {estimate.estimateNumber}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{estimate.customerName}</span>
                                  <span className="text-xs text-gray-500">{estimate.customerEmail}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-gray-900">${(estimate.totalAmount / 100).toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <Badge 
                                  variant="secondary"
                                  className={
                                    estimate.status === 'accepted' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : estimate.ownerApprovalStatus === 'approved'
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }
                                >
                                  {estimate.status === 'accepted' ? 'Customer Approved' : 
                                   estimate.ownerApprovalStatus === 'approved' ? 'Owner Confirmed' : 
                                   'Pre-estimate'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                {/* Compact horizontal stepper */}
                                <div className="flex items-center gap-2 min-w-[180px]">
                                  {/* Step 1 */}
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      currentStage >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                                    }`}>
                                      {currentStage > 1 ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">1</span>}
                                    </div>
                                  </div>
                                  <div className={`flex-1 h-0.5 ${currentStage >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
                                  {/* Step 2 */}
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      currentStage >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                                    }`}>
                                      {currentStage > 2 ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">2</span>}
                                    </div>
                                  </div>
                                  <div className={`flex-1 h-0.5 ${currentStage >= 3 ? 'bg-green-500' : 'bg-gray-200'}`} />
                                  {/* Step 3 */}
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      currentStage >= 3 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'
                                    }`}>
                                      {currentStage >= 3 ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">3</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600">{format(new Date(estimate.createdAt), 'MMM d, yyyy')}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-actions-${estimate.id}`}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    {estimate.ownerApprovalStatus !== 'approved' && (
                                      <DropdownMenuItem
                                        onClick={() => approveEstimateMutation.mutate({ estimateId: estimate.id })}
                                        disabled={approveEstimateMutation.isPending}
                                        data-testid={`button-confirm-bid-${estimate.id}`}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Confirm Bid
                                      </DropdownMenuItem>
                                    )}
                                    {estimate.ownerApprovalStatus === 'approved' && estimate.status !== 'accepted' && (
                                      <DropdownMenuItem
                                        onClick={() => markCustomerApprovedMutation.mutate({ estimateId: estimate.id })}
                                        disabled={markCustomerApprovedMutation.isPending}
                                        data-testid={`button-mark-customer-approved-${estimate.id}`}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark Customer Approved
                                      </DropdownMenuItem>
                                    )}
                                    {estimate.status === 'accepted' && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => convertToWorkOrderMutation.mutate({ estimateId: estimate.id })}
                                          disabled={convertToWorkOrderMutation.isPending}
                                          data-testid={`button-convert-to-work-order-${estimate.id}`}
                                        >
                                          <FileText className="h-4 w-4 mr-2" />
                                          Convert to Work Order
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => setEditingEstimate(estimate)}
                                      data-testid={`button-adjust-bid-${estimate.id}`}
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Adjust Bid
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Orders Tab */}
          <TabsContent value="work-orders">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                <CardTitle className="text-gray-800">
                  All Work Orders ({allWorkOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {workOrdersLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading work orders...</p>
                  </div>
                ) : allWorkOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No work orders found</h3>
                    <p className="text-gray-500">Work orders will appear here once you convert estimates to work orders</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Work Order #</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Amount</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Scheduled Date/Time</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Created</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allWorkOrders.map((workOrder: any) => (
                          <tr key={workOrder.id} className="border-b hover:bg-gray-50" data-testid={`work-order-row-${workOrder.id}`}>
                            <td className="p-3 text-sm font-semibold">{workOrder.workOrderNumber}</td>
                            <td className="p-3 text-sm">{workOrder.customerName}</td>
                            <td className="p-3 text-sm">{workOrder.customerEmail}</td>
                            <td className="p-3 text-sm font-semibold">${(workOrder.totalAmount / 100).toFixed(2)}</td>
                            <td className="p-3 text-sm">
                              <Badge 
                                variant="secondary"
                                className={
                                  workOrder.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : workOrder.status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : workOrder.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : workOrder.status === 'scheduled'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {workOrder.status === 'in_progress' ? 'In Progress' : 
                                 workOrder.status === 'completed' ? 'Completed' :
                                 workOrder.status === 'cancelled' ? 'Cancelled' :
                                 workOrder.status === 'scheduled' ? 'Scheduled' : 'Pending'}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {workOrder.scheduledDate ? (
                                <div>
                                  <div className="font-medium">{format(new Date(workOrder.scheduledDate), 'MMM d, yyyy')}</div>
                                  {workOrder.scheduledTime && (
                                    <div className="text-xs text-gray-500">{workOrder.scheduledTime}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {format(new Date(workOrder.createdAt), 'MMM d, yyyy')}
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex gap-2">
                                {!workOrder.scheduledDate && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSchedulingWorkOrder(workOrder)}
                                    data-testid={`button-schedule-${workOrder.id}`}
                                  >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Schedule
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => convertToInvoiceMutation.mutate({ workOrderId: workOrder.id })}
                                  disabled={convertToInvoiceMutation.isPending}
                                  data-testid={`button-convert-to-invoice-${workOrder.id}`}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Convert to Invoice
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
                <CardTitle className="text-gray-800">
                  All Invoices ({allInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {invoicesLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading invoices...</p>
                  </div>
                ) : allInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                    <p className="text-gray-500">Invoices will appear here once you convert work orders to invoices</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Invoice #</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Customer</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Email</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Amount</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Due Date</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Created</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allInvoices.map((invoice: any) => (
                          <tr key={invoice.id} className="border-b hover:bg-gray-50" data-testid={`invoice-row-${invoice.id}`}>
                            <td className="p-3 text-sm font-semibold">{invoice.invoiceNumber}</td>
                            <td className="p-3 text-sm">{invoice.customerName}</td>
                            <td className="p-3 text-sm">{invoice.customerEmail}</td>
                            <td className="p-3 text-sm font-semibold">${(invoice.totalAmount / 100).toFixed(2)}</td>
                            <td className="p-3 text-sm">
                              <Badge 
                                variant="secondary"
                                className={
                                  invoice.status === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : invoice.status === 'sent'
                                    ? 'bg-blue-100 text-blue-800'
                                    : invoice.status === 'overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {invoice.status || 'draft'}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {invoice.dueDate 
                                ? format(new Date(invoice.dueDate), 'MMM d, yyyy')
                                : 'Not set'}
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                            </td>
                            <td className="p-3 text-sm">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => convertInvoiceToWorkOrderMutation.mutate({ invoiceId: invoice.id })}
                                disabled={convertInvoiceToWorkOrderMutation.isPending}
                                data-testid={`button-convert-to-work-order-${invoice.id}`}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Convert to Work Order
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <LeadDetailsModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
        />

        <KanbanLeadDetailDialog
          lead={kanbanSelectedLead}
          open={kanbanDetailDialogOpen}
          onOpenChange={setKanbanDetailDialogOpen}
        />

        <EditEstimateDialog
          estimate={editingEstimate}
          open={!!editingEstimate}
          onOpenChange={(open) => {
            if (!open) {
              setEditingEstimate(null);
            }
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
          }}
        />

        {/* Schedule Work Order Dialog */}
        <Dialog open={!!schedulingWorkOrder} onOpenChange={(open) => {
          if (!open) {
            setSchedulingWorkOrder(null);
            setScheduleDate("");
            setScheduleTime("");
            setScheduleDuration("60");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Work Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date *</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  data-testid="input-schedule-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time (optional)</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  data-testid="input-schedule-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-duration">Duration (minutes)</Label>
                <Select value={scheduleDuration} onValueChange={setScheduleDuration}>
                  <SelectTrigger id="schedule-duration" data-testid="select-schedule-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">8 hours (full day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSchedulingWorkOrder(null);
                  setScheduleDate("");
                  setScheduleTime("");
                }}
                data-testid="button-cancel-schedule"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (scheduleDate && schedulingWorkOrder) {
                    scheduleWorkOrderMutation.mutate({
                      workOrderId: schedulingWorkOrder.id,
                      scheduledDate: scheduleDate,
                      scheduledTime: scheduleTime || undefined,
                      duration: parseInt(scheduleDuration),
                    });
                  }
                }}
                disabled={!scheduleDate || scheduleWorkOrderMutation.isPending}
                data-testid="button-confirm-schedule"
              >
                {scheduleWorkOrderMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AutomationDialog />
        </div>
      </div>
    </DashboardLayout>
  );
}