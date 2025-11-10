import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Play, Pause, Trash2, Zap, Mail, MessageSquare, Clock, Settings, Edit } from "lucide-react";
import { CrmAutomation } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import { Link } from "wouter";
import { format } from "date-fns";

export default function CrmAutomations() {
  const { toast } = useToast();
  
  const { data: automations = [], isLoading } = useQuery<CrmAutomation[]>({
    queryKey: ["/api/crm/automations"]
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
      return await apiRequest("DELETE", `/api/crm/automations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations"] });
      toast({
        title: "Automation deleted",
        description: "The automation has been deleted"
      });
    }
  });
  
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
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-500">Loading automations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 bg-white dark:bg-gray-900">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Zap className="h-8 w-8" />
            Automations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Build visual workflows to automate your sales process
          </p>
        </div>
        
        <Link href="/automations/create">
          <Button data-testid="button-create-automation">
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </Link>
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
            <Link href="/automations/create">
              <Button data-testid="button-create-first-automation">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Automation
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => (
            <Card key={automation.id} data-testid={`automation-card-${automation.id}`} className="border-l-4" style={{ borderLeftColor: automation.isActive ? '#10b981' : '#6b7280' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className={`h-5 w-5 ${automation.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{automation.name}</h4>
                      <Badge variant={automation.isActive ? "default" : "secondary"}>
                        {automation.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {automation.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-8 mb-2">{automation.description}</p>
                    )}
                    <div className="flex items-center gap-4 ml-8">
                      <span className="text-xs text-gray-500">
                        Trigger: <strong className="capitalize">{automation.triggerType?.replace(/_/g, ' ')}</strong>
                      </span>
                      <span className="text-xs text-gray-500">
                        Created: {format(new Date(automation.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
                    
                    <Link href={`/automations/${automation.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-edit-automation-${automation.id}`}>
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    
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
    </DashboardLayout>
  );
}
