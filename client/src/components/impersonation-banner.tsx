import { AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ImpersonationBanner() {
  const { toast } = useToast();

  const endImpersonationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/end-impersonation', {});
    },
    onSuccess: () => {
      window.location.href = '/admin';
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end impersonation session",
        variant: "destructive",
      });
    },
  });

  const handleEndImpersonation = () => {
    endImpersonationMutation.mutate();
  };

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 flex items-center justify-between shadow-lg sticky top-0 z-50" data-testid="impersonation-banner">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="font-semibold">
          Admin Mode: You are currently viewing this account as an administrator
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-white hover:bg-gray-100"
        onClick={handleEndImpersonation}
        disabled={endImpersonationMutation.isPending}
        data-testid="button-end-impersonation"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {endImpersonationMutation.isPending ? 'Exiting...' : 'Exit Admin View'}
      </Button>
    </div>
  );
}
