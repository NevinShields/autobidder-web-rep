import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AutomationConfirmationDialog } from "@/components/AutomationConfirmationDialog";

interface UseAutomationApprovalOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successTitle?: string;
  successDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  invalidateQueries?: string[][];
}

export function useAutomationApproval(options: UseAutomationApprovalOptions = {}) {
  const {
    onSuccess,
    onError,
    successTitle = "Estimate Approved",
    successDescription = "Estimate has been approved and is ready to send to customer.",
    errorTitle = "Approval Failed",
    errorDescription = "Failed to approve estimate. Please try again.",
    invalidateQueries = [],
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingRunIds, setPendingRunIds] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const approveMutation = useMutation({
    mutationFn: async ({ estimateId, notes }: { estimateId: number; notes?: string }) => {
      return await apiRequest("POST", `/api/estimates/${estimateId}/approve`, { notes });
    },
    onSuccess: (data: any) => {
      // Handle pending automation runs if present
      if (data.pendingAutomationRunIds && data.pendingAutomationRunIds.length > 0) {
        setPendingRunIds(data.pendingAutomationRunIds);
        setShowConfirmDialog(true);
      } else {
        // No pending automations, show success immediately
        toast({
          title: successTitle,
          description: successDescription,
        });
      }

      // Invalidate queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Call custom onSuccess if provided
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });

      // Call custom onError if provided
      if (onError) {
        onError(error);
      }
    },
  });

  const handleConfirmDialogClose = () => {
    setShowConfirmDialog(false);
    setPendingRunIds([]);
  };

  const handleConfirmed = () => {
    toast({
      title: successTitle,
      description: successDescription,
    });
  };

  const DialogComponent = () => (
    <AutomationConfirmationDialog
      isOpen={showConfirmDialog}
      onClose={handleConfirmDialogClose}
      pendingRunIds={pendingRunIds}
      onConfirmed={handleConfirmed}
    />
  );

  return {
    approveMutation,
    DialogComponent,
    isDialogOpen: showConfirmDialog,
  };
}
