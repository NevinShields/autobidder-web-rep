import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LineItem {
  name: string;
  description: string;
  price: number;
  category?: string;
}

interface EditEstimateDialogProps {
  estimate: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditEstimateDialog({
  estimate,
  open,
  onOpenChange,
  onSuccess,
}: EditEstimateDialogProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: '', description: '', price: 0 }
  ]);
  const [businessMessage, setBusinessMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (estimate && open) {
      const items = estimate.services?.map((s: any) => ({
        name: s.name || '',
        description: s.description || '',
        price: (s.price || 0) / 100,
        category: s.category
      })) || [];
      setLineItems(items.length > 0 ? items : [{ name: '', description: '', price: 0 }]);
      setBusinessMessage(estimate.businessMessage || '');
    }
  }, [estimate, open]);

  const updateEstimateMutation = useMutation({
    mutationFn: async ({ estimateId, lineItems, businessMessage }: { 
      estimateId: number;
      lineItems: LineItem[];
      businessMessage: string;
    }) => {
      if (!estimate) throw new Error("No estimate being edited");
      
      const services = lineItems.map(item => ({
        name: item.name,
        description: item.description,
        price: Math.round(item.price * 100), // Convert to cents
        category: item.category || "Service"
      }));
      
      const subtotal = services.reduce((sum, s) => sum + s.price, 0);
      
      // Preserve existing tax and discount amounts
      const taxAmount = estimate.taxAmount || 0;
      const discountAmount = estimate.discountAmount || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;
      
      const updateData = {
        businessMessage,
        services,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
      };
      
      return await apiRequest("PATCH", `/api/estimates/${estimateId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      setLineItems([{ name: '', description: '', price: 0 }]);
      setBusinessMessage("");
      onOpenChange(false);
      toast({
        title: "Estimate Updated",
        description: "The estimate has been updated successfully.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update estimate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Validate line items
    if (lineItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one line item",
        variant: "destructive",
      });
      return;
    }
    
    const invalidItems = lineItems.filter(item => 
      !item.name?.trim() || item.price <= 0
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "All line items must have a name and a price greater than zero",
        variant: "destructive",
      });
      return;
    }
    
    if (estimate) {
      updateEstimateMutation.mutate({ 
        estimateId: estimate.id,
        lineItems,
        businessMessage
      });
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setLineItems([{ name: '', description: '', price: 0 }]);
      setBusinessMessage("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Estimate</DialogTitle>
          <DialogDescription>
            Modify the line items and pricing for this estimate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Line Items */}
          <div className="space-y-3">
            <Label>Line Items</Label>
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start border p-3 rounded">
                <div className="col-span-4">
                  <Input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...lineItems];
                      newItems[index].name = e.target.value;
                      setLineItems(newItems);
                    }}
                    data-testid={`input-edit-line-item-name-${index}`}
                  />
                </div>
                <div className="col-span-5">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...lineItems];
                      newItems[index].description = e.target.value;
                      setLineItems(newItems);
                    }}
                    data-testid={`input-edit-line-item-description-${index}`}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.price === 0 ? '' : item.price}
                    onChange={(e) => {
                      const newItems = [...lineItems];
                      newItems[index].price = parseFloat(e.target.value) || 0;
                      setLineItems(newItems);
                    }}
                    data-testid={`input-edit-line-item-price-${index}`}
                  />
                </div>
                <div className="col-span-1">
                  {lineItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newItems = lineItems.filter((_, i) => i !== index);
                        setLineItems(newItems);
                      }}
                      data-testid={`button-remove-edit-line-item-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLineItems([...lineItems, { name: '', description: '', price: 0 }])}
              data-testid="button-add-edit-line-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </div>

          <div className="p-3 bg-gray-50 rounded">
            <p className="font-semibold">
              Total: ${lineItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-business-message">Business Message</Label>
            <Textarea
              id="edit-business-message"
              placeholder="Thank you for your interest..."
              value={businessMessage}
              onChange={(e) => setBusinessMessage(e.target.value)}
              rows={3}
              data-testid="input-edit-business-message"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={updateEstimateMutation.isPending}
            data-testid="button-cancel-edit-estimate"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateEstimateMutation.isPending}
            data-testid="button-submit-edit-estimate"
          >
            {updateEstimateMutation.isPending ? "Updating..." : "Update Estimate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
