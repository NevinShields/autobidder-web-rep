import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Zap, Plus, Trash2, ArrowUp, ArrowDown, Mail, Clock, Save, X, ChevronLeft, Tag, FileText, MessageSquare, Settings, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AutomationStep {
  id?: number;
  stepType: 'send_email' | 'send_sms' | 'wait' | 'update_stage' | 'create_task';
  stepOrder: number;
  config: {
    subject?: string;
    body?: string;
    duration?: number;
    durationUnit?: 'minutes' | 'hours' | 'days';
    newStage?: string;
    taskTitle?: string;
    taskDescription?: string;
  };
}

const TRIGGER_TYPES = [
  { value: 'new_lead', label: 'New Lead Created' },
  { value: 'estimate_sent', label: 'Estimate Sent' },
  { value: 'estimate_viewed', label: 'Estimate Viewed by Customer' },
  { value: 'estimate_approved', label: 'Estimate Approved' },
  { value: 'job_booked', label: 'Job Booked' },
  { value: 'job_completed', label: 'Job Completed' },
  { value: 'payment_confirmed', label: 'Payment Confirmed' },
];

const STEP_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'send_sms', label: 'Send SMS', icon: MessageSquare },
  { value: 'wait', label: 'Wait/Delay', icon: Clock },
  { value: 'update_stage', label: 'Update Lead Stage', icon: Tag },
  { value: 'create_task', label: 'Create Task', icon: FileText },
];

const LEAD_STAGES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

export default function AutomationBuilder() {
  const [, params] = useRoute("/automations/:id");
  const automationId = params?.id === 'create' ? null : params?.id ? parseInt(params.id) : null;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [removedStepIds, setRemovedStepIds] = useState<number[]>([]);
  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [showTwilioSetupDialog, setShowTwilioSetupDialog] = useState(false);

  const { data: automation, isLoading } = useQuery({
    queryKey: ['/api/crm/automations', automationId],
    enabled: !!automationId,
  });

  const { data: automationSteps = [] } = useQuery({
    queryKey: ['/api/crm/automations', automationId, 'steps'],
    enabled: !!automationId,
  });

  const { data: businessSettings } = useQuery({
    queryKey: ['/api/business-settings'],
  });

  useEffect(() => {
    if (automation) {
      setName(automation.name || "");
      setDescription(automation.description || "");
      setTriggerType(automation.triggerType || "");
    }
  }, [automation]);

  useEffect(() => {
    if (automationSteps.length > 0) {
      setSteps(automationSteps.map((step: any) => ({
        id: step.id,
        stepType: step.stepType,
        stepOrder: step.stepOrder,
        config: step.config || {},
      })));
    } else {
      setSteps([]);
    }
    setRemovedStepIds([]);
  }, [automationSteps, automationId]);

  const saveAutomationMutation = useMutation({
    mutationFn: async () => {
      const automationData = {
        name,
        description,
        triggerType,
        isActive: true,
      };

      let savedAutomation;
      if (automationId) {
        savedAutomation = await apiRequest("PATCH", `/api/crm/automations/${automationId}`, automationData);
      } else {
        savedAutomation = await apiRequest("POST", "/api/crm/automations", automationData);
      }

      const savedAutomationId = automationId || savedAutomation.id;

      // Delete removed steps first (with error handling for 404s)
      for (const stepId of removedStepIds) {
        try {
          await apiRequest("DELETE", `/api/crm/automations/${savedAutomationId}/steps/${stepId}`, {});
        } catch (error: any) {
          // Gracefully handle 404s (step already deleted) but re-throw other errors
          if (error.status !== 404) {
            throw error;
          }
        }
      }

      // Create or update existing steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepData = {
          stepType: step.stepType,
          stepOrder: i + 1,
          config: step.config,
        };

        if (step.id) {
          await apiRequest("PATCH", `/api/crm/automations/${savedAutomationId}/steps/${step.id}`, stepData);
        } else {
          await apiRequest("POST", `/api/crm/automations/${savedAutomationId}/steps`, stepData);
        }
      }

      return savedAutomation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations"] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/automations', automationId, 'steps'] });
      setRemovedStepIds([]);
      toast({
        title: "Automation Saved",
        description: "Your automation has been saved successfully.",
      });
      navigate("/leads?tab=automations");
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save automation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkTwilioConfigured = () => {
    return businessSettings?.twilioAccountSid && 
           businessSettings?.twilioAuthToken && 
           businessSettings?.twilioPhoneNumber;
  };

  const addStep = (stepType: string) => {
    // Check if trying to add SMS step without Twilio configured
    if (stepType === 'send_sms' && !checkTwilioConfigured()) {
      setIsAddStepDialogOpen(false);
      setShowTwilioSetupDialog(true);
      return;
    }

    const newStep: AutomationStep = {
      stepType: stepType as AutomationStep['stepType'],
      stepOrder: steps.length + 1,
      config: {},
    };
    setSteps([...steps, newStep]);
    setIsAddStepDialogOpen(false);
  };

  const removeStep = (index: number) => {
    const stepToRemove = steps[index];
    if (stepToRemove.id) {
      setRemovedStepIds([...removedStepIds, stepToRemove.id]);
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setSteps(newSteps);
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
  };

  const updateStepConfig = (index: number, config: any) => {
    const newSteps = [...steps];
    newSteps[index].config = { ...newSteps[index].config, ...config };
    setSteps(newSteps);
  };

  const renderStepCard = (step: AutomationStep, index: number) => {
    const StepIcon = STEP_TYPES.find(t => t.value === step.stepType)?.icon || Zap;

    return (
      <Card key={index} className="border-l-4 border-l-blue-500" data-testid={`step-card-${index}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full px-2 py-1">
                {index + 1}
              </Badge>
              <StepIcon className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">
                {STEP_TYPES.find(t => t.value === step.stepType)?.label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveStepUp(index)}
                disabled={index === 0}
                data-testid={`button-move-up-${index}`}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => moveStepDown(index)}
                disabled={index === steps.length - 1}
                data-testid={`button-move-down-${index}`}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStep(index)}
                data-testid={`button-remove-step-${index}`}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step.stepType === 'send_email' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`email-subject-${index}`}>Subject</Label>
                <Input
                  id={`email-subject-${index}`}
                  value={step.config.subject || ""}
                  onChange={(e) => updateStepConfig(index, { subject: e.target.value })}
                  placeholder="Email subject line"
                  data-testid={`input-email-subject-${index}`}
                />
              </div>
              <div>
                <Label htmlFor={`email-body-${index}`}>Body</Label>
                <Textarea
                  id={`email-body-${index}`}
                  value={step.config.body || ""}
                  onChange={(e) => updateStepConfig(index, { body: e.target.value })}
                  placeholder="Email message body..."
                  rows={6}
                  data-testid={`textarea-email-body-${index}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{name}'}, {'{email}'}, {'{calculatedPrice}'}
                </p>
              </div>
            </div>
          )}

          {step.stepType === 'send_sms' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`sms-message-${index}`}>SMS Message</Label>
                <Textarea
                  id={`sms-message-${index}`}
                  value={step.config.body || ""}
                  onChange={(e) => updateStepConfig(index, { body: e.target.value })}
                  placeholder="Your SMS message..."
                  rows={4}
                  maxLength={160}
                  data-testid={`textarea-sms-message-${index}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(step.config.body || "").length}/160 characters | Available variables: {'{name}'}, {'{calculatedPrice}'}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Configure your Twilio credentials in Business Settings to enable SMS sending.
                </p>
              </div>
            </div>
          )}

          {step.stepType === 'wait' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`wait-duration-${index}`}>Duration</Label>
                  <Input
                    id={`wait-duration-${index}`}
                    type="number"
                    min="1"
                    value={step.config.duration || 1}
                    onChange={(e) => updateStepConfig(index, { duration: parseInt(e.target.value) })}
                    data-testid={`input-wait-duration-${index}`}
                  />
                </div>
                <div>
                  <Label htmlFor={`wait-unit-${index}`}>Unit</Label>
                  <Select
                    value={step.config.durationUnit || 'hours'}
                    onValueChange={(value) => updateStepConfig(index, { durationUnit: value })}
                  >
                    <SelectTrigger id={`wait-unit-${index}`} data-testid={`select-wait-unit-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step.stepType === 'update_stage' && (
            <div>
              <Label htmlFor={`stage-select-${index}`}>New Stage</Label>
              <Select
                value={step.config.newStage || ''}
                onValueChange={(value) => updateStepConfig(index, { newStage: value })}
              >
                <SelectTrigger id={`stage-select-${index}`} data-testid={`select-stage-${index}`}>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step.stepType === 'create_task' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`task-title-${index}`}>Task Title</Label>
                <Input
                  id={`task-title-${index}`}
                  value={step.config.taskTitle || ""}
                  onChange={(e) => updateStepConfig(index, { taskTitle: e.target.value })}
                  placeholder="Follow up with customer"
                  data-testid={`input-task-title-${index}`}
                />
              </div>
              <div>
                <Label htmlFor={`task-description-${index}`}>Task Description (optional)</Label>
                <Textarea
                  id={`task-description-${index}`}
                  value={step.config.taskDescription || ""}
                  onChange={(e) => updateStepConfig(index, { taskDescription: e.target.value })}
                  placeholder="Additional task details..."
                  rows={3}
                  data-testid={`textarea-task-description-${index}`}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header with breadcrumb */}
        <div className="mb-6">
          <Link href="/leads?tab=automations">
            <Button variant="ghost" size="sm" className="mb-2" data-testid="button-back">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Automations
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {automationId ? 'Edit Automation' : 'Create Automation'}
          </h1>
          <p className="text-gray-600 mt-1">
            Set up automated workflows to streamline your lead management
          </p>
        </div>

        {/* Main Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Details</CardTitle>
              <CardDescription>Give your automation a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="automation-name">Name *</Label>
                <Input
                  id="automation-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Welcome new leads"
                  data-testid="input-automation-name"
                />
              </div>
              <div>
                <Label htmlFor="automation-description">Description (optional)</Label>
                <Textarea
                  id="automation-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this automation do?"
                  rows={3}
                  data-testid="textarea-automation-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Trigger Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Trigger</CardTitle>
              <CardDescription>When should this automation run?</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="trigger-type">Trigger Event *</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger id="trigger-type" data-testid="select-trigger-type">
                    <SelectValue placeholder="Select a trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Automation Steps</CardTitle>
                  <CardDescription>Define what happens when the trigger fires</CardDescription>
                </div>
                <Button onClick={() => setIsAddStepDialogOpen(true)} data-testid="button-add-step">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No steps added yet</h3>
                  <p className="text-gray-500 mb-4">Add steps to define your automation workflow</p>
                  <Button onClick={() => setIsAddStepDialogOpen(true)} data-testid="button-add-first-step">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Step
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {steps.map((step, index) => renderStepCard(step, index))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link href="/leads?tab=automations">
              <Button variant="outline" data-testid="button-cancel">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
            <Button
              onClick={() => saveAutomationMutation.mutate()}
              disabled={!name || !triggerType || saveAutomationMutation.isPending}
              data-testid="button-save-automation"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveAutomationMutation.isPending ? "Saving..." : "Save Automation"}
            </Button>
          </div>
        </div>

        {/* Add Step Dialog */}
        <Dialog open={isAddStepDialogOpen} onOpenChange={setIsAddStepDialogOpen}>
          <DialogContent data-testid="dialog-add-step">
            <DialogHeader>
              <DialogTitle>Add Automation Step</DialogTitle>
              <DialogDescription>Choose the type of action you want to perform</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 py-4">
              {STEP_TYPES.map((stepType) => {
                const Icon = stepType.icon;
                return (
                  <Button
                    key={stepType.value}
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start"
                    onClick={() => addStep(stepType.value)}
                    data-testid={`button-add-step-type-${stepType.value}`}
                  >
                    <Icon className="h-5 w-5 mr-3 text-blue-500" />
                    <div className="text-left">
                      <div className="font-semibold">{stepType.label}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Twilio Setup Required Dialog */}
        <Dialog open={showTwilioSetupDialog} onOpenChange={setShowTwilioSetupDialog}>
          <DialogContent data-testid="dialog-twilio-setup-required">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Twilio Integration Required
              </DialogTitle>
              <DialogDescription>
                To send SMS messages through automations, you need to configure your Twilio credentials first.
              </DialogDescription>
            </DialogHeader>
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertTitle>Setup Instructions</AlertTitle>
              <AlertDescription>
                Go to the CRM Settings page and configure your Twilio Account SID, Auth Token, and Phone Number.
                Each business uses their own Twilio account for SMS automation.
              </AlertDescription>
            </Alert>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTwilioSetupDialog(false)}
                data-testid="button-cancel-twilio-setup"
              >
                Cancel
              </Button>
              <Link href="/settings?tab=crm">
                <Button data-testid="button-go-to-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to CRM Settings
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
