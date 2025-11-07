import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Play, Pause, Trash2, Zap, Mail, MessageSquare, Clock } from "lucide-react";
import { CrmAutomation } from "@shared/schema";

type AutomationWithSteps = CrmAutomation & {
  steps?: Array<{
    id: number;
    stepOrder: number;
    actionType: string;
    actionConfig: any;
    delayMinutes: number;
  }>;
};

export default function CrmAutomations() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationWithSteps | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "stage_change",
    triggerConditions: {},
    isActive: true
  });
  
  const { data: automations = [], isLoading } = useQuery<CrmAutomation[]>({
    queryKey: ["/api/crm/automations"]
  });
  
  const createAutomationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/crm/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations"] });
      setDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        triggerType: "stage_change",
        triggerConditions: {},
        isActive: true
      });
      toast({
        title: "Automation created",
        description: "Your automation has been created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create automation",
        variant: "destructive"
      });
    }
  });
  
  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest(`/api/crm/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations"] });
      toast({
        title: "Automation updated",
        description: "Automation status has been updated"
      });
    }
  });
  
  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/crm/automations/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations"] });
      toast({
        title: "Automation deleted",
        description: "The automation has been deleted"
      });
    }
  });
  
  const handleCreateAutomation = () => {
    createAutomationMutation.mutate(formData);
  };
  
  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case "stage_change":
        return <Zap className="h-4 w-4" />;
      case "lead_created":
        return <Plus className="h-4 w-4" />;
      case "time_based":
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-500">Loading automations...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 bg-white dark:bg-gray-900">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Zap className="h-8 w-8" />
            CRM Automations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automate your sales workflows with triggers and actions
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-automation">
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Create New Automation</DialogTitle>
              <DialogDescription>
                Set up automated workflows to save time and improve lead engagement
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Automation Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Send welcome email to new leads"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-automation-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe what this automation does"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="input-automation-description"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger</Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                >
                  <SelectTrigger data-testid="select-trigger-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage_change">When lead stage changes</SelectItem>
                    <SelectItem value="lead_created">When new lead is created</SelectItem>
                    <SelectItem value="time_based">Time-based (e.g., after X days)</SelectItem>
                    <SelectItem value="manual">Manual trigger only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-is-active"
                />
              </div>
              
              <Button
                onClick={handleCreateAutomation}
                disabled={!formData.name || createAutomationMutation.isPending}
                className="w-full"
                data-testid="button-save-automation"
              >
                {createAutomationMutation.isPending ? "Creating..." : "Create Automation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {automations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No automations yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Create your first automation to streamline your sales process
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-create-first-automation">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((automation) => (
            <Card key={automation.id} data-testid={`automation-card-${automation.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                      {automation.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {automation.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge variant={automation.isActive ? "default" : "secondary"}>
                    {automation.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {getTriggerIcon(automation.triggerType)}
                    <span className="capitalize">{automation.triggerType.replace(/_/g, " ")}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAutomationMutation.mutate({
                        id: automation.id,
                        isActive: !automation.isActive
                      })}
                      data-testid={`button-toggle-${automation.id}`}
                    >
                      {automation.isActive ? (
                        <><Pause className="h-3 w-3 mr-1" /> Pause</>
                      ) : (
                        <><Play className="h-3 w-3 mr-1" /> Activate</>
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this automation?")) {
                          deleteAutomationMutation.mutate(automation.id);
                        }
                      }}
                      data-testid={`button-delete-${automation.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Setup Templates</CardTitle>
            <CardDescription>
              Common automation workflows you can set up with one click
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">New Lead Welcome</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Send a welcome email when a new lead is created
                  </p>
                  <Badge variant="outline" className="mt-2">Coming Soon</Badge>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Estimate Follow-up</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Send SMS reminder 3 days after estimate is sent
                  </p>
                  <Badge variant="outline" className="mt-2">Coming Soon</Badge>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Payment Reminder</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Trigger Zapier webhook when work is completed
                  </p>
                  <Badge variant="outline" className="mt-2">Coming Soon</Badge>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Inactive Lead Nurture</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Re-engage leads that have been inactive for 30 days
                  </p>
                  <Badge variant="outline" className="mt-2">Coming Soon</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
