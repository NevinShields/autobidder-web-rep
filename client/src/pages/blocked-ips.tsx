import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, Trash2, Ban, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface BlockedIp {
  id: number;
  userId: string;
  ipAddress: string;
  reason: string | null;
  notes: string | null;
  blockedBy: string | null;
  createdAt: string;
}

export default function BlockedIpsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newIpAddress, setNewIpAddress] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blockedIps, isLoading } = useQuery<BlockedIp[]>({
    queryKey: ["/api/blocked-ips"],
  });

  const blockIpMutation = useMutation({
    mutationFn: async (data: { ipAddress: string; reason?: string; notes?: string }) => {
      return apiRequest("POST", "/api/blocked-ips", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-ips"] });
      setIsAddDialogOpen(false);
      setNewIpAddress("");
      setNewReason("");
      setNewNotes("");
      toast({
        title: "IP address blocked",
        description: "The IP address has been added to your blocklist.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to block IP",
        description: error.message || "An error occurred while blocking the IP address.",
        variant: "destructive",
      });
    },
  });

  const unblockIpMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/blocked-ips/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-ips"] });
      setDeleteId(null);
      toast({
        title: "IP address unblocked",
        description: "The IP address has been removed from your blocklist.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to unblock IP",
        description: "An error occurred while removing the IP address.",
        variant: "destructive",
      });
    },
  });

  const handleAddIp = () => {
    if (!newIpAddress.trim()) {
      toast({
        title: "IP address required",
        description: "Please enter an IP address to block.",
        variant: "destructive",
      });
      return;
    }
    blockIpMutation.mutate({
      ipAddress: newIpAddress.trim(),
      reason: newReason.trim() || undefined,
      notes: newNotes.trim() || undefined,
    });
  };

  const getReasonBadge = (reason: string | null) => {
    if (!reason) return null;
    const colors: Record<string, string> = {
      spam: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      abuse: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      bot: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      fraud: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    };
    return (
      <Badge className={colors[reason.toLowerCase()] || "bg-gray-100 text-gray-700"}>
        {reason}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Blocked IP Addresses
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage IP addresses that are blocked from submitting leads through your forms
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Block IP Address
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Blocklist
            </CardTitle>
            <CardDescription>
              Leads from blocked IP addresses will be rejected automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !blockedIps || blockedIps.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No blocked IP addresses</p>
                <p className="text-sm mt-1">
                  You haven't blocked any IP addresses yet. Block spammy IPs to prevent unwanted form submissions.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Blocked On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedIps.map((blocked) => (
                    <TableRow key={blocked.id}>
                      <TableCell className="font-mono">{blocked.ipAddress}</TableCell>
                      <TableCell>{getReasonBadge(blocked.reason)}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {blocked.notes || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(blocked.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(blocked.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">How IP Blocking Works</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  When a visitor with a blocked IP address attempts to submit a lead through your calculator or form,
                  they will receive an error message and their submission will be rejected. This helps prevent spam
                  and abuse from repeat offenders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add IP Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block IP Address</DialogTitle>
            <DialogDescription>
              Add an IP address to your blocklist. Leads from this IP will be rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address *</Label>
              <Input
                id="ipAddress"
                placeholder="e.g., 192.168.1.1"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., spam, abuse, bot"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this block..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddIp}
              disabled={blockIpMutation.isPending}
            >
              {blockIpMutation.isPending ? "Blocking..." : "Block IP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the IP address from your blocklist. Leads from this IP will be accepted again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && unblockIpMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {unblockIpMutation.isPending ? "Unblocking..." : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
