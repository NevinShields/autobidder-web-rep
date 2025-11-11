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
import { Zap, Plus, Trash2, Mail, Clock, Save, X, ChevronLeft, Tag, FileText, MessageSquare, Settings, AlertCircle, Sparkles, Calendar, CheckCircle, DollarSign, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  { value: 'lead_created', label: 'New Lead', icon: UserPlus },
  { value: 'pre_booking_scheduled', label: 'Pre-Booking (Lead Books After Getting Price)', icon: Calendar },
  { value: 'estimate_approved', label: 'Bid Confirmed by Business Owner', icon: CheckCircle },
  { value: 'estimate_customer_accepted', label: 'Confirmed Bid Accepted by Customer', icon: Sparkles },
  { value: 'work_order_created', label: 'Job Converted to Work Order', icon: FileText },
  { value: 'work_order_scheduled', label: 'Work Order Scheduled', icon: Calendar },
  { value: 'work_order_completed', label: 'Work Order Completed', icon: CheckCircle },
  { value: 'invoice_created', label: 'Invoice Created', icon: FileText },
  { value: 'invoice_paid', label: 'Invoice Paid', icon: DollarSign },
  { value: 'lead_tag_assigned', label: 'New Tag Assigned to Lead', icon: Tag },
  { value: 'lead_stage_changed', label: 'Stage Change', icon: Tag },
];

const STEP_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: Mail, description: 'Send an automated email' },
  { value: 'send_sms', label: 'Send SMS', icon: MessageSquare, description: 'Send a text message via Twilio' },
  { value: 'wait', label: 'Wait/Delay', icon: Clock, description: 'Pause before the next action' },
  { value: 'update_stage', label: 'Update Lead Stage', icon: Tag, description: 'Move lead to a different stage' },
  { value: 'create_task', label: 'Create Task', icon: FileText, description: 'Create a task for follow-up' },
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

const getAvailableVariables = (triggerType: string) => {
  const baseVariables = [
    { name: '{lead.name}', description: 'Customer name' },
    { name: '{lead.email}', description: 'Customer email' },
    { name: '{lead.phone}', description: 'Customer phone number' },
    { name: '{lead.price}', description: 'Calculated price' },
    { name: '{lead.totalPrice}', description: 'Total price' },
    { name: '{lead.servicesTable}', description: 'Table of services with prices' },
    { name: '{lead.stage}', description: 'Current lead stage' },
    { name: '{lead.source}', description: 'Lead source' },
  ];

  const estimateVariables = [
    { name: '{estimate.id}', description: 'Estimate number' },
    { name: '{estimate.total}', description: 'Total amount' },
    { name: '{estimate.status}', description: 'Estimate status' },
    { name: '{estimate.customerName}', description: 'Customer name' },
    { name: '{estimate.customerEmail}', description: 'Customer email' },
    { name: '{estimate.validUntil}', description: 'Expiration date' },
  ];

  const workOrderVariables = [
    { name: '{workOrder.id}', description: 'Work order ID' },
    { name: '{workOrder.title}', description: 'Work order title' },
    { name: '{workOrder.description}', description: 'Work details' },
    { name: '{workOrder.scheduledDate}', description: 'Scheduled date' },
    { name: '{workOrder.status}', description: 'Current status' },
  ];

  const invoiceVariables = [
    { name: '{invoice.id}', description: 'Invoice number' },
    { name: '{invoice.amount}', description: 'Invoice amount' },
    { name: '{invoice.dueDate}', description: 'Payment due date' },
    { name: '{invoice.status}', description: 'Payment status' },
  ];

  if (triggerType?.includes('estimate')) {
    return [...baseVariables, ...estimateVariables];
  } else if (triggerType?.includes('work_order')) {
    return [...baseVariables, ...workOrderVariables];
  } else if (triggerType?.includes('invoice')) {
    return [...baseVariables, ...invoiceVariables];
  }
  
  return baseVariables;
};

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
  const [showAddStepMenu, setShowAddStepMenu] = useState<number | null>(null);
  const [showTwilioSetupDialog, setShowTwilioSetupDialog] = useState(false);
  const [stepConfigDialog, setStepConfigDialog] = useState<{
    isOpen: boolean;
    stepType: AutomationStep['stepType'] | null;
    insertAt: number;
    config: any;
  }>({
    isOpen: false,
    stepType: null,
    insertAt: 0,
    config: {},
  });
  const [expandedVariables, setExpandedVariables] = useState<Set<number>>(new Set());

  const { data: automation, isLoading } = useQuery({
    queryKey: ['/api/crm/automations', automationId],
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
      
      // Steps are included in the automation response
      if (automation.steps && automation.steps.length > 0) {
        setSteps(automation.steps.map((step: any) => ({
          id: step.id,
          stepType: step.stepType,
          stepOrder: step.stepOrder,
          config: step.stepConfig || step.config || {},
        })));
      }
      setRemovedStepIds([]);
    }
  }, [automation]);

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
        const response = await apiRequest("PATCH", `/api/crm/automations/${automationId}`, automationData);
        savedAutomation = await response.json();
      } else {
        const response = await apiRequest("POST", "/api/crm/automations", automationData);
        savedAutomation = await response.json();
      }

      console.log('Saved automation response:', savedAutomation);
      const savedAutomationId = automationId || savedAutomation?.id;
      console.log('Saved automation ID:', savedAutomationId);
      
      if (!savedAutomationId) {
        throw new Error('Failed to get automation ID from server response');
      }

      // Delete removed steps first (with error handling for 404s)
      for (const stepId of removedStepIds) {
        try {
          await apiRequest("DELETE", `/api/crm/automations/${savedAutomationId}/steps/${stepId}`, {});
        } catch (error: any) {
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
          stepConfig: step.config,
        };

        if (step.id) {
          await apiRequest("PATCH", `/api/crm/automations/${savedAutomationId}/steps/${step.id}`, stepData);
        } else {
          await apiRequest("POST", `/api/crm/automations/${savedAutomationId}/steps`, stepData);
        }
      }

      return { savedAutomation, savedAutomationId, isNewAutomation: !automationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automations"] });
      setRemovedStepIds([]);
      toast({
        title: "Automation Saved",
        description: "Your automation has been saved successfully.",
      });
      
      // If creating a new automation, navigate to edit it
      if (data.isNewAutomation) {
        navigate(`/automations/${data.savedAutomationId}`);
      }
      // Otherwise stay on the current page (editing existing automation)
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

  const openStepConfig = (stepType: string, insertAt: number) => {
    if (stepType === 'send_sms' && !checkTwilioConfigured()) {
      setShowAddStepMenu(null);
      setShowTwilioSetupDialog(true);
      return;
    }

    // Open configuration dialog for the step
    setStepConfigDialog({
      isOpen: true,
      stepType: stepType as AutomationStep['stepType'],
      insertAt,
      config: stepType === 'wait' ? { duration: 1, durationUnit: 'hours' } : {},
    });
    setShowAddStepMenu(null);
  };

  const addStepWithConfig = () => {
    if (!stepConfigDialog.stepType) return;

    const newStep: AutomationStep = {
      stepType: stepConfigDialog.stepType,
      stepOrder: stepConfigDialog.insertAt + 1,
      config: stepConfigDialog.config,
    };
    
    const newSteps = [...steps];
    newSteps.splice(stepConfigDialog.insertAt, 0, newStep);
    setSteps(newSteps);
    
    // Close dialog and reset
    setStepConfigDialog({
      isOpen: false,
      stepType: null,
      insertAt: 0,
      config: {},
    });
  };

  const removeStep = (index: number) => {
    const stepToRemove = steps[index];
    if (stepToRemove.id) {
      setRemovedStepIds([...removedStepIds, stepToRemove.id]);
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStepConfig = (index: number, config: any) => {
    const newSteps = [...steps];
    newSteps[index].config = { ...newSteps[index].config, ...config };
    setSteps(newSteps);
  };

  const renderTriggerCard = () => {
    const triggerInfo = TRIGGER_TYPES.find(t => t.value === triggerType);
    const TriggerIcon = triggerInfo?.icon || Zap;

    return (
      <div className="relative">
        <Card className="border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <TriggerIcon className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-100">
                    Trigger
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {triggerInfo?.label || 'Select a trigger'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This automation will run when this event occurs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Connecting line */}
        <div className="absolute left-[42px] top-full w-0.5 h-16 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>
      </div>
    );
  };

  const renderStepCard = (step: AutomationStep, index: number) => {
    const stepInfo = STEP_TYPES.find(t => t.value === step.stepType);
    const StepIcon = stepInfo?.icon || Zap;

    return (
      <div key={index} className="relative">
        {/* Connecting line from previous step */}
        {index > 0 && (
          <div className="absolute left-[42px] bottom-full w-0.5 h-16 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>
        )}
        
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all group" data-testid={`step-card-${index}`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Step Icon */}
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <StepIcon className="h-7 w-7 text-white" />
              </div>
              
              {/* Step Content */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">
                      Step {index + 1}
                    </Badge>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {stepInfo?.label}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-remove-step-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Step Configuration */}
                <div className="mt-4 space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  {step.stepType === 'send_email' && (
                    <>
                      <div>
                        <Label htmlFor={`email-subject-${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">Subject</Label>
                        <Input
                          id={`email-subject-${index}`}
                          value={step.config.subject || ""}
                          onChange={(e) => updateStepConfig(index, { subject: e.target.value })}
                          placeholder="Email subject line"
                          className="mt-1"
                          data-testid={`input-email-subject-${index}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`email-body-${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">Body</Label>
                        <Textarea
                          id={`email-body-${index}`}
                          value={step.config.body || ""}
                          onChange={(e) => updateStepConfig(index, { body: e.target.value })}
                          placeholder="Email message body..."
                          rows={5}
                          className="mt-1 font-mono text-sm"
                          data-testid={`textarea-email-body-${index}`}
                        />
                        <Collapsible 
                          open={expandedVariables.has(index)} 
                          onOpenChange={(open) => {
                            const newExpanded = new Set(expandedVariables);
                            if (open) {
                              newExpanded.add(index);
                            } else {
                              newExpanded.delete(index);
                            }
                            setExpandedVariables(newExpanded);
                          }}
                          className="mt-2"
                        >
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center justify-between w-full text-xs font-semibold text-blue-900 dark:text-blue-100 hover:opacity-80 transition-opacity">
                                <span>Available Variables</span>
                                {expandedVariables.has(index) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {getAvailableVariables(triggerType).map((variable) => (
                                  <button
                                    key={variable.name}
                                    type="button"
                                    onClick={() => {
                                      const textarea = document.getElementById(`email-body-${index}`) as HTMLTextAreaElement;
                                      if (textarea) {
                                        const cursorPos = textarea.selectionStart;
                                        const currentValue = step.config.body || "";
                                        const newValue = currentValue.slice(0, cursorPos) + variable.name + currentValue.slice(cursorPos);
                                        updateStepConfig(index, { body: newValue });
                                        setTimeout(() => {
                                          textarea.focus();
                                          textarea.setSelectionRange(cursorPos + variable.name.length, cursorPos + variable.name.length);
                                        }, 0);
                                      }
                                    }}
                                    className="text-left p-2 rounded bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors min-w-0"
                                  >
                                    <code className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">{variable.name}</code>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{variable.description}</p>
                                  </button>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      </div>
                    </>
                  )}

                  {step.stepType === 'send_sms' && (
                    <div>
                      <Label htmlFor={`sms-message-${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">SMS Message</Label>
                      <Textarea
                        id={`sms-message-${index}`}
                        value={step.config.body || ""}
                        onChange={(e) => updateStepConfig(index, { body: e.target.value })}
                        placeholder="Your SMS message..."
                        rows={3}
                        maxLength={160}
                        className="mt-1 font-mono text-sm"
                        data-testid={`textarea-sms-message-${index}`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {(step.config.body || "").length}/160 characters
                      </p>
                      <Collapsible 
                        open={expandedVariables.has(index)} 
                        onOpenChange={(open) => {
                          const newExpanded = new Set(expandedVariables);
                          if (open) {
                            newExpanded.add(index);
                          } else {
                            newExpanded.delete(index);
                          }
                          setExpandedVariables(newExpanded);
                        }}
                        className="mt-2"
                      >
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full text-xs font-semibold text-blue-900 dark:text-blue-100 hover:opacity-80 transition-opacity">
                              <span>Available Variables</span>
                              {expandedVariables.has(index) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {getAvailableVariables(triggerType).map((variable) => (
                                <button
                                  key={variable.name}
                                  type="button"
                                  onClick={() => {
                                    const textarea = document.getElementById(`sms-message-${index}`) as HTMLTextAreaElement;
                                    if (textarea) {
                                      const cursorPos = textarea.selectionStart;
                                      const currentValue = step.config.body || "";
                                      const newValue = currentValue.slice(0, cursorPos) + variable.name + currentValue.slice(cursorPos);
                                      updateStepConfig(index, { body: newValue });
                                      setTimeout(() => {
                                        textarea.focus();
                                        textarea.setSelectionRange(cursorPos + variable.name.length, cursorPos + variable.name.length);
                                      }, 0);
                                    }
                                  }}
                                  className="text-left p-2 rounded bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors min-w-0"
                                >
                                  <code className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">{variable.name}</code>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{variable.description}</p>
                                </button>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    </div>
                  )}

                  {step.stepType === 'wait' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`wait-duration-${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                        <Input
                          id={`wait-duration-${index}`}
                          type="number"
                          min="1"
                          value={step.config.duration || 1}
                          onChange={(e) => updateStepConfig(index, { duration: parseInt(e.target.value) })}
                          className="mt-1"
                          data-testid={`input-wait-duration-${index}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`wait-unit-${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">Unit</Label>
                        <Select
                          value={step.config.durationUnit || 'hours'}
                          onValueChange={(value) => updateStepConfig(index, { durationUnit: value })}
                        >
                          <SelectTrigger id={`wait-unit-${index}`} className="mt-1" data-testid={`select-wait-unit-${index}`}>
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
                  )}

                  {step.stepType === 'update_stage' && (
                    <div>
                      <Label htmlFor={`stage-select-${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">New Stage</Label>
                      <Select
                        value={step.config.newStage || ''}
                        onValueChange={(value) => updateStepConfig(index, { newStage: value })}
                      >
                        <SelectTrigger id={`stage-select-${index}`} className="mt-1" data-testid={`select-stage-${index}`}>
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
                    <>
                      <div>
                        <Label htmlFor={`task-title-${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">Task Title</Label>
                        <Input
                          id={`task-title-${index}`}
                          value={step.config.taskTitle || ""}
                          onChange={(e) => updateStepConfig(index, { taskTitle: e.target.value })}
                          placeholder="Follow up with customer"
                          className="mt-1"
                          data-testid={`input-task-title-${index}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`task-description-${index}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">Task Description (optional)</Label>
                        <Textarea
                          id={`task-description-${index}`}
                          value={step.config.taskDescription || ""}
                          onChange={(e) => updateStepConfig(index, { taskDescription: e.target.value })}
                          placeholder="Additional task details..."
                          rows={2}
                          className="mt-1"
                          data-testid={`textarea-task-description-${index}`}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add step button after this step */}
        <div className="relative">
          <div className="absolute left-[42px] top-0 w-0.5 h-16 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500"></div>
          <div className="flex justify-center py-8">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddStepMenu(showAddStepMenu === index + 1 ? null : index + 1)}
                className="rounded-full w-10 h-10 p-0 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 shadow-md"
                data-testid={`button-add-step-after-${index}`}
              >
                <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
              
              {/* Inline add menu */}
              {showAddStepMenu === index + 1 && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-80 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2">
                  <div className="space-y-1">
                    {STEP_TYPES.map((stepType) => {
                      const Icon = stepType.icon;
                      return (
                        <button
                          key={stepType.value}
                          onClick={() => openStepConfig(stepType.value, index + 1)}
                          className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                          data-testid={`button-add-step-type-${stepType.value}`}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{stepType.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{stepType.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <Link href="/leads?tab=automations">
                  <Button variant="ghost" size="sm" data-testid="button-back" className="flex-shrink-0">
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                </Link>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {automationId ? 'Edit Automation' : 'Create Automation'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href="/leads?tab=automations">
                  <Button variant="outline" size="sm" data-testid="button-cancel" className="hidden sm:inline-flex">
                    Cancel
                  </Button>
                </Link>
                <Button
                  onClick={() => saveAutomationMutation.mutate()}
                  disabled={!name || !triggerType || saveAutomationMutation.isPending}
                  data-testid="button-save-automation"
                  size="sm"
                >
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{saveAutomationMutation.isPending ? "Saving..." : "Save"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {/* Automation Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Automation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="automation-name">Name *</Label>
                <Input
                  id="automation-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Welcome new leads"
                  className="mt-1"
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
                  rows={2}
                  className="mt-1"
                  data-testid="textarea-automation-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Trigger Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Trigger</CardTitle>
              <CardDescription>Choose the event that starts this automation</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger data-testid="select-trigger-type">
                  <SelectValue placeholder="Select a trigger event" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Workflow Builder */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workflow</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Build your automation step by step</p>
            </div>

            <div className="space-y-0">
              {/* Trigger Card */}
              {triggerType && renderTriggerCard()}

              {/* Steps */}
              {steps.length === 0 && triggerType && (
                <div className="relative">
                  <div className="flex justify-center py-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowAddStepMenu(0)}
                      className="rounded-full gap-2 border-2 border-dashed border-gray-400 hover:border-blue-500 bg-white dark:bg-gray-800"
                      data-testid="button-add-first-step"
                    >
                      <Plus className="h-5 w-5" />
                      Add Your First Step
                    </Button>
                    
                    {showAddStepMenu === 0 && (
                      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-80 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2">
                        <div className="space-y-1">
                          {STEP_TYPES.map((stepType) => {
                            const Icon = stepType.icon;
                            return (
                              <button
                                key={stepType.value}
                                onClick={() => openStepConfig(stepType.value, 0)}
                                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                data-testid={`button-add-step-type-${stepType.value}`}
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{stepType.label}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{stepType.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {steps.map((step, index) => renderStepCard(step, index))}
            </div>
          </div>
        </div>

        {/* Step Configuration Dialog */}
        <Dialog open={stepConfigDialog.isOpen} onOpenChange={(open) => {
          if (!open) {
            setStepConfigDialog({ isOpen: false, stepType: null, insertAt: 0, config: {} });
          }
        }}>
          <DialogContent className="max-w-2xl" data-testid="dialog-step-config">
            <DialogHeader>
              <DialogTitle>
                Configure {STEP_TYPES.find(t => t.value === stepConfigDialog.stepType)?.label}
              </DialogTitle>
              <DialogDescription>
                {STEP_TYPES.find(t => t.value === stepConfigDialog.stepType)?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {stepConfigDialog.stepType === 'send_email' && (
                <>
                  <div>
                    <Label htmlFor="dialog-email-subject">Email Subject *</Label>
                    <Input
                      id="dialog-email-subject"
                      value={stepConfigDialog.config.subject || ""}
                      onChange={(e) => setStepConfigDialog(prev => ({
                        ...prev,
                        config: { ...prev.config, subject: e.target.value }
                      }))}
                      placeholder="e.g., Welcome to our service!"
                      className="mt-1"
                      data-testid="input-dialog-email-subject"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dialog-email-body">Email Body *</Label>
                    <Textarea
                      id="dialog-email-body"
                      value={stepConfigDialog.config.body || ""}
                      onChange={(e) => setStepConfigDialog(prev => ({
                        ...prev,
                        config: { ...prev.config, body: e.target.value }
                      }))}
                      placeholder="Hi {name},&#10;&#10;Thank you for your interest! Your quote is {calculatedPrice}.&#10;&#10;Best regards"
                      rows={8}
                      className="mt-1 font-mono text-sm"
                      data-testid="textarea-dialog-email-body"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{name}'}</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{email}'}</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{calculatedPrice}'}</code>
                    </p>
                  </div>
                </>
              )}

              {stepConfigDialog.stepType === 'send_sms' && (
                <div>
                  <Label htmlFor="dialog-sms-message">SMS Message *</Label>
                  <Textarea
                    id="dialog-sms-message"
                    value={stepConfigDialog.config.body || ""}
                    onChange={(e) => setStepConfigDialog(prev => ({
                      ...prev,
                      config: { ...prev.config, body: e.target.value }
                    }))}
                    placeholder="Hi {name}! Your quote is ready: {calculatedPrice}"
                    rows={4}
                    maxLength={160}
                    className="mt-1 font-mono text-sm"
                    data-testid="textarea-dialog-sms-message"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(stepConfigDialog.config.body || "").length}/160 characters
                    <br />
                    Available variables: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{name}'}</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{calculatedPrice}'}</code>
                  </p>
                </div>
              )}

              {stepConfigDialog.stepType === 'wait' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dialog-wait-duration">Wait Duration *</Label>
                    <Input
                      id="dialog-wait-duration"
                      type="number"
                      min="1"
                      value={stepConfigDialog.config.duration || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setStepConfigDialog(prev => ({
                          ...prev,
                          config: { ...prev.config, duration: isNaN(value) || value < 1 ? 1 : value }
                        }));
                      }}
                      className="mt-1"
                      data-testid="input-dialog-wait-duration"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dialog-wait-unit">Time Unit *</Label>
                    <Select
                      value={stepConfigDialog.config.durationUnit || 'hours'}
                      onValueChange={(value) => setStepConfigDialog(prev => ({
                        ...prev,
                        config: { ...prev.config, durationUnit: value }
                      }))}
                    >
                      <SelectTrigger id="dialog-wait-unit" className="mt-1" data-testid="select-dialog-wait-unit">
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
              )}

              {stepConfigDialog.stepType === 'update_stage' && (
                <div>
                  <Label htmlFor="dialog-stage-select">Move Lead To Stage *</Label>
                  <Select
                    value={stepConfigDialog.config.newStage || ''}
                    onValueChange={(value) => setStepConfigDialog(prev => ({
                      ...prev,
                      config: { ...prev.config, newStage: value }
                    }))}
                  >
                    <SelectTrigger id="dialog-stage-select" className="mt-1" data-testid="select-dialog-stage">
                      <SelectValue placeholder="Select a stage" />
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

              {stepConfigDialog.stepType === 'create_task' && (
                <>
                  <div>
                    <Label htmlFor="dialog-task-title">Task Title *</Label>
                    <Input
                      id="dialog-task-title"
                      value={stepConfigDialog.config.taskTitle || ""}
                      onChange={(e) => setStepConfigDialog(prev => ({
                        ...prev,
                        config: { ...prev.config, taskTitle: e.target.value }
                      }))}
                      placeholder="e.g., Follow up with customer"
                      className="mt-1"
                      data-testid="input-dialog-task-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dialog-task-description">Task Description (optional)</Label>
                    <Textarea
                      id="dialog-task-description"
                      value={stepConfigDialog.config.taskDescription || ""}
                      onChange={(e) => setStepConfigDialog(prev => ({
                        ...prev,
                        config: { ...prev.config, taskDescription: e.target.value }
                      }))}
                      placeholder="Additional details about this task..."
                      rows={3}
                      className="mt-1"
                      data-testid="textarea-dialog-task-description"
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStepConfigDialog({ isOpen: false, stepType: null, insertAt: 0, config: {} })}
                data-testid="button-cancel-step-config"
              >
                Cancel
              </Button>
              <Button
                onClick={addStepWithConfig}
                disabled={
                  !stepConfigDialog.stepType ||
                  (stepConfigDialog.stepType === 'send_email' && (!stepConfigDialog.config.subject?.trim() || !stepConfigDialog.config.body?.trim())) ||
                  (stepConfigDialog.stepType === 'send_sms' && !stepConfigDialog.config.body?.trim()) ||
                  (stepConfigDialog.stepType === 'wait' && (!stepConfigDialog.config.duration || stepConfigDialog.config.duration < 1 || !stepConfigDialog.config.durationUnit)) ||
                  (stepConfigDialog.stepType === 'update_stage' && !stepConfigDialog.config.newStage) ||
                  (stepConfigDialog.stepType === 'create_task' && !stepConfigDialog.config.taskTitle?.trim())
                }
                data-testid="button-add-step-with-config"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </DialogFooter>
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
              <Link href="/crm/settings">
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
