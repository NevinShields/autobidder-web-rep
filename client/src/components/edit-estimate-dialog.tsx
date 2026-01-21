import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, X, Truck, Percent, Receipt } from "lucide-react";
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
  const [travelFee, setTravelFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [autoCalculateTax, setAutoCalculateTax] = useState(false);
  const [taxAmount, setTaxAmount] = useState(0);
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
      setTravelFee((estimate.distanceFee || 0) / 100);
      setDiscountAmount((estimate.discountAmount || 0) / 100);
      setTaxAmount((estimate.taxAmount || 0) / 100);
      setTaxRate(0);
      setAutoCalculateTax(false);
    }
  }, [estimate, open]);

  // Calculate tax when auto-calculate is enabled
  useEffect(() => {
    if (autoCalculateTax && taxRate > 0) {
      const subtotal = lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
      const adjustedSubtotal = subtotal + travelFee - discountAmount;
      const calculatedTax = adjustedSubtotal * (taxRate / 100);
      setTaxAmount(Math.round(calculatedTax * 100) / 100);
    }
  }, [autoCalculateTax, taxRate, lineItems, travelFee, discountAmount]);

  const updateEstimateMutation = useMutation({
    mutationFn: async ({ estimateId, lineItems, businessMessage, travelFee, discountAmount, taxAmount }: {
      estimateId: number;
      lineItems: LineItem[];
      businessMessage: string;
      travelFee: number;
      discountAmount: number;
      taxAmount: number;
    }) => {
      if (!estimate) throw new Error("No estimate being edited");

      const services = lineItems.map(item => ({
        name: item.name,
        description: item.description,
        price: Math.round(item.price * 100), // Convert to cents
        category: item.category || "Service"
      }));

      const subtotalCents = services.reduce((sum, s) => sum + s.price, 0);
      const travelFeeCents = Math.round(travelFee * 100);
      const discountCents = Math.round(discountAmount * 100);
      const taxCents = Math.round(taxAmount * 100);

      // Total = subtotal + travel fee - discount + tax
      const totalAmountCents = subtotalCents + travelFeeCents - discountCents + taxCents;

      const updateData = {
        businessMessage,
        services,
        subtotal: subtotalCents,
        distanceFee: travelFeeCents,
        discountAmount: discountCents,
        taxAmount: taxCents,
        totalAmount: totalAmountCents,
      };

      return await apiRequest("PATCH", `/api/estimates/${estimateId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multi-service-leads"] });
      setLineItems([{ name: '', description: '', price: 0 }]);
      setBusinessMessage("");
      setTravelFee(0);
      setDiscountAmount(0);
      setTaxAmount(0);
      setTaxRate(0);
      setAutoCalculateTax(false);
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
        businessMessage,
        travelFee,
        discountAmount,
        taxAmount
      });
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setLineItems([{ name: '', description: '', price: 0 }]);
      setBusinessMessage("");
      setTravelFee(0);
      setDiscountAmount(0);
      setTaxAmount(0);
      setTaxRate(0);
      setAutoCalculateTax(false);
    }
    onOpenChange(open);
  };

  // Calculate displayed total
  const subtotal = lineItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const calculatedTotal = subtotal + travelFee - discountAmount + taxAmount;

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

          {/* Additional Fees Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Additional Fees & Adjustments</h4>

            {/* Travel Fee */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-32">
                <Truck className="h-4 w-4 text-orange-500" />
                <Label className="text-sm">Travel Fee</Label>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={travelFee === 0 ? '' : travelFee}
                    onChange={(e) => setTravelFee(parseFloat(e.target.value) || 0)}
                    className="pl-7"
                    placeholder="0.00"
                    data-testid="input-edit-travel-fee"
                  />
                </div>
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-32">
                <Percent className="h-4 w-4 text-green-500" />
                <Label className="text-sm">Discount</Label>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountAmount === 0 ? '' : discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="pl-7"
                    placeholder="0.00"
                    data-testid="input-edit-discount"
                  />
                </div>
              </div>
            </div>

            {/* Tax */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <Receipt className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm">Tax</Label>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxAmount === 0 ? '' : taxAmount}
                      onChange={(e) => {
                        setTaxAmount(parseFloat(e.target.value) || 0);
                        setAutoCalculateTax(false);
                      }}
                      className="pl-7"
                      placeholder="0.00"
                      disabled={autoCalculateTax}
                      data-testid="input-edit-tax"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-calculate tax checkbox */}
              <div className="flex items-center gap-3 ml-32 pl-3">
                <Checkbox
                  id="auto-calc-tax"
                  checked={autoCalculateTax}
                  onCheckedChange={(checked) => setAutoCalculateTax(checked as boolean)}
                  data-testid="checkbox-auto-calculate-tax"
                />
                <Label htmlFor="auto-calc-tax" className="text-sm cursor-pointer">
                  Auto-calculate tax at
                </Label>
                <div className="w-20">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={taxRate === 0 ? '' : taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="pr-6 text-sm"
                      placeholder="0"
                      disabled={!autoCalculateTax}
                      data-testid="input-tax-rate"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {travelFee > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Travel Fee:</span>
                <span>+${travelFee.toFixed(2)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Tax{autoCalculateTax && taxRate > 0 ? ` (${taxRate}%)` : ''}:</span>
                <span>+${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>${calculatedTotal.toFixed(2)}</span>
            </div>
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
