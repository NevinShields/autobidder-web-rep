import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, DollarSign, Calendar, Mail, Phone, MapPin, FileText } from "lucide-react";
import { Lead, MultiServiceLead } from "@shared/schema";

const PIPELINE_STAGES = [
  { value: "new", label: "New Leads", color: "bg-blue-500" },
  { value: "estimate_sent", label: "Estimate Sent", color: "bg-purple-500" },
  { value: "estimate_viewed", label: "Estimate Viewed", color: "bg-indigo-500" },
  { value: "estimate_approved", label: "Estimate Approved", color: "bg-green-500" },
  { value: "booked", label: "Booked", color: "bg-cyan-500" },
  { value: "completed", label: "Completed", color: "bg-emerald-500" },
  { value: "paid", label: "Paid", color: "bg-teal-500" },
  { value: "lost", label: "Lost", color: "bg-red-500" }
];

const LEGACY_STAGES = [
  { value: "open", label: "Open", color: "bg-blue-500" },
  { value: "booked", label: "Booked", color: "bg-cyan-500" },
  { value: "completed", label: "Completed", color: "bg-emerald-500" },
  { value: "lost", label: "Lost", color: "bg-red-500" }
];

type LeadType = (Lead | MultiServiceLead) & { type: "lead" | "multiServiceLead" };

function LeadCard({ lead, onClick }: { lead: LeadType; onClick: () => void }) {
  const price = "calculatedPrice" in lead ? lead.calculatedPrice : lead.totalPrice;
  
  return (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
      onClick={onClick}
      data-testid={`lead-card-${lead.id}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100" data-testid={`lead-name-${lead.id}`}>
            {lead.name}
          </h4>
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
      </CardContent>
    </Card>
  );
}

function LeadDetailDialog({ lead, open, onOpenChange }: { lead: LeadType | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!lead) return null;
  
  const price = "calculatedPrice" in lead ? lead.calculatedPrice : lead.totalPrice;
  const stageHistory = lead.stageHistory || [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900" data-testid="lead-detail-dialog">
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
  leads: LeadType[];
  onLeadClick: (lead: LeadType) => void;
}) {
  const count = leads.length;
  const totalValue = leads.reduce((sum, lead) => {
    const price = "calculatedPrice" in lead ? lead.calculatedPrice : lead.totalPrice;
    return sum + price;
  }, 0);
  
  return (
    <div className="flex-shrink-0 w-80" data-testid={`stage-column-${stage.value}`}>
      <Card className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
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
          <div className="space-y-2" id={`droppable-${stage.value}`}>
            {leads.map((lead) => (
              <div key={`${lead.type}-${lead.id}`} id={`draggable-${lead.type}-${lead.id}`}>
                <LeadCard lead={lead} onClick={() => onLeadClick(lead)} />
              </div>
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

export default function CrmPipeline() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [useLegacyStages, setUseLegacyStages] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const { data: regularLeads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"]
  });
  
  const { data: multiServiceLeads = [], isLoading: multiLeadsLoading } = useQuery<MultiServiceLead[]>({
    queryKey: ["/api/multi-service-leads"]
  });
  
  const updateLeadStageMutation = useMutation({
    mutationFn: async ({ id, stage, type }: { id: number; stage: string; type: "lead" | "multiServiceLead" }) => {
      const endpoint = type === "lead" ? `/api/leads/${id}/stage` : `/api/multi-service-leads/${id}/stage`;
      return await apiRequest(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      toast({
        title: "Stage updated",
        description: "Lead stage has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lead stage",
        variant: "destructive"
      });
    }
  });
  
  const allLeads: LeadType[] = [
    ...regularLeads.map(lead => ({ ...lead, type: "lead" as const })),
    ...multiServiceLeads.map(lead => ({ ...lead, type: "multiServiceLead" as const }))
  ];
  
  const filteredLeads = allLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.phone && lead.phone.includes(searchTerm))
  );
  
  const stages = useLegacyStages ? LEGACY_STAGES : PIPELINE_STAGES;
  
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.value] = filteredLeads.filter(lead => lead.stage === stage.value);
    return acc;
  }, {} as Record<string, LeadType[]>);
  
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
      updateLeadStageMutation.mutate({
        id,
        stage: newStage,
        type: type as "lead" | "multiServiceLead"
      });
    }
    
    setActiveId(null);
  };
  
  const handleLeadClick = (lead: LeadType) => {
    setSelectedLead(lead);
    setDetailDialogOpen(true);
  };
  
  const activeLead = activeId ? allLeads.find(l => `draggable-${l.type}-${l.id}` === activeId) : null;
  
  if (leadsLoading || multiLeadsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-500">Loading pipeline...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CRM Pipeline</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your leads through the sales pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={useLegacyStages ? "outline" : "default"}
              onClick={() => setUseLegacyStages(false)}
              data-testid="button-toggle-new-stages"
            >
              New Pipeline
            </Button>
            <Button
              variant={useLegacyStages ? "default" : "outline"}
              onClick={() => setUseLegacyStages(true)}
              data-testid="button-toggle-legacy-stages"
            >
              Legacy Pipeline
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            data-testid="input-search-leads"
          />
        </div>
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
                onLeadClick={handleLeadClick}
              />
            </div>
          ))}
        </div>
        
        <DragOverlay>
          {activeLead ? (
            <div className="rotate-3 opacity-90">
              <LeadCard lead={activeLead} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      <LeadDetailDialog
        lead={selectedLead}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
      </div>
    </div>
  );
}
