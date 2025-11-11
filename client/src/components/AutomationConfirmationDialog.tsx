import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, CheckCircle, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PendingStep {
  stepId: number;
  stepType: string;
  stepOrder: number;
  renderedConfig: {
    subject?: string;
    body?: string;
    fromName?: string;
    replyToEmail?: string;
  };
}

interface PendingAutomationRun {
  id: number;
  automationId: number;
  status: string;
  pendingStepsData: PendingStep[];
}

interface AutomationConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pendingRunIds: number[];
  onConfirmed?: () => void;
}

export function AutomationConfirmationDialog({
  isOpen,
  onClose,
  pendingRunIds,
  onConfirmed,
}: AutomationConfirmationDialogProps) {
  const { toast } = useToast();
  const [currentRunIndex, setCurrentRunIndex] = useState(0);
  const [editedSteps, setEditedSteps] = useState<Map<number, PendingStep>>(new Map());
  const [confirmedRunIds, setConfirmedRunIds] = useState<Set<number>>(new Set());

  const { data: pendingRuns, isLoading } = useQuery({
    queryKey: ["/api/crm/automation-runs/pending"],
    enabled: isOpen && pendingRunIds.length > 0,
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentRunIndex(0);
      setEditedSteps(new Map());
      setConfirmedRunIds(new Set());
    }
  }, [isOpen]);

  const handleNextRun = (wasConfirmed: boolean, runId: number) => {
    const filteredRuns = (pendingRuns || []).filter((run: PendingAutomationRun) =>
      pendingRunIds.includes(run.id)
    );

    const newConfirmedSet = wasConfirmed 
      ? new Set([...confirmedRunIds, runId])
      : confirmedRunIds;

    if (currentRunIndex + 1 < filteredRuns.length) {
      setCurrentRunIndex(currentRunIndex + 1);
      setEditedSteps(new Map());
      setConfirmedRunIds(newConfirmedSet);
    } else {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/automation-runs/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      if (newConfirmedSet.size > 0 && onConfirmed) onConfirmed();
      onClose();
    }
  };

  const confirmMutation = useMutation({
    mutationFn: async (runId: number) => {
      const editedStepsData = Array.from(editedSteps.values()).filter(
        step => pendingRuns?.some((run: PendingAutomationRun) => 
          run.id === runId && run.pendingStepsData.some(s => s.stepId === step.stepId)
        )
      );

      return apiRequest("PATCH", `/api/crm/automation-runs/${runId}/confirm`, {
        editedStepsData: editedStepsData.length > 0 ? editedStepsData : undefined,
      });
    },
    onSuccess: (_data, runId) => {
      toast({
        title: "Automation Confirmed",
        description: "The automation is now running.",
      });
      handleNextRun(true, runId);
    },
    onError: () => {
      toast({
        title: "Confirmation Failed",
        description: "Failed to confirm the automation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (runId: number) => {
      return apiRequest("DELETE", `/api/crm/automation-runs/${runId}/cancel`, {});
    },
    onSuccess: (_data, runId) => {
      toast({
        title: "Automation Cancelled",
        description: "The automation has been cancelled.",
      });
      handleNextRun(false, runId);
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel the automation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStepContent = (stepId: number, field: string, value: string) => {
    const currentRun = pendingRuns?.find((run: PendingAutomationRun) =>
      run.pendingStepsData.some(s => s.stepId === stepId)
    );
    const currentStep = currentRun?.pendingStepsData.find((s: PendingStep) => s.stepId === stepId);

    if (currentStep) {
      const edited = editedSteps.get(stepId) || { ...currentStep };
      setEditedSteps(new Map(editedSteps.set(stepId, {
        ...edited,
        renderedConfig: {
          ...edited.renderedConfig,
          [field]: value,
        },
      })));
    }
  };

  const getStepContent = (step: PendingStep, field: string): string => {
    const edited = editedSteps.get(step.stepId);
    if (edited && edited.renderedConfig[field as keyof typeof edited.renderedConfig]) {
      return edited.renderedConfig[field as keyof typeof edited.renderedConfig] as string;
    }
    return (step.renderedConfig[field as keyof typeof step.renderedConfig] || '') as string;
  };

  if (!isOpen || pendingRunIds.length === 0) {
    return null;
  }

  const filteredRuns = (pendingRuns || []).filter((run: PendingAutomationRun) =>
    pendingRunIds.includes(run.id)
  );

  const run = filteredRuns[currentRunIndex];

  const isLoadingRuns = isLoading || !pendingRuns;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-automation-confirmation">
        <DialogHeader>
          <DialogTitle>
            {isLoadingRuns ? "Loading Automation..." : `Review Automation ${filteredRuns.length > 1 ? `(${currentRunIndex + 1} of ${filteredRuns.length})` : ''}`}
          </DialogTitle>
          {!isLoadingRuns && (
            <DialogDescription>
              Review and edit the messages before sending. You can customize the content for this specific customer.
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoadingRuns ? (
          <div className="py-8 text-center text-gray-500">Loading pending automations...</div>
        ) : !run ? (
          <div className="py-8 text-center text-gray-500">No pending automations found.</div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {run.pendingStepsData.map((step: PendingStep, index: number) => (
            <div key={step.stepId} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">Step {index + 1}</Badge>
                {step.stepType === 'send_email' && <Mail className="h-4 w-4 text-blue-600" />}
                {step.stepType === 'send_sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
                <span className="font-semibold text-sm">
                  {step.stepType === 'send_email' ? 'Email' : step.stepType === 'send_sms' ? 'SMS' : step.stepType}
                </span>
              </div>

              {step.stepType === 'send_email' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`subject-${step.stepId}`} className="text-xs">Subject</Label>
                    <Input
                      id={`subject-${step.stepId}`}
                      value={getStepContent(step, 'subject')}
                      onChange={(e) => updateStepContent(step.stepId, 'subject', e.target.value)}
                      className="mt-1"
                      data-testid={`input-subject-${step.stepId}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`body-${step.stepId}`} className="text-xs">Message</Label>
                    <Textarea
                      id={`body-${step.stepId}`}
                      value={getStepContent(step, 'body')}
                      onChange={(e) => updateStepContent(step.stepId, 'body', e.target.value)}
                      rows={6}
                      className="mt-1"
                      data-testid={`textarea-body-${step.stepId}`}
                    />
                  </div>
                </div>
              )}

              {step.stepType === 'send_sms' && (
                <div>
                  <Label htmlFor={`sms-${step.stepId}`} className="text-xs">SMS Message</Label>
                  <Textarea
                    id={`sms-${step.stepId}`}
                    value={getStepContent(step, 'body')}
                    onChange={(e) => updateStepContent(step.stepId, 'body', e.target.value)}
                    rows={3}
                    maxLength={160}
                    className="mt-1"
                    data-testid={`textarea-sms-${step.stepId}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {getStepContent(step, 'body').length}/160 characters
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => cancelMutation.mutate(run.id)}
            disabled={cancelMutation.isPending || confirmMutation.isPending}
            data-testid="button-cancel-automation"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={() => confirmMutation.mutate(run.id)}
            disabled={confirmMutation.isPending || cancelMutation.isPending}
            data-testid="button-confirm-automation"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {confirmMutation.isPending ? "Sending..." : "Confirm & Send"}
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
