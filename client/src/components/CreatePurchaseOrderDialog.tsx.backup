import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LineItem {
  id: string;
  materialSKU: string;
  description: string;
  quantity: number;
  unitPrice: string;
}

interface Supplier {
  id: string;
  organizationName: string;
  firstName: string;
  lastName: string;
}

export function CreatePurchaseOrderDialog() {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      materialSKU: "",
      description: "",
      quantity: 1,
      unitPrice: "",
    },
  ]);
  const { toast } = useToast();

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/purchase-orders", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase order created",
        description: "The purchase order has been sent to the supplier.",
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating purchase order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSupplierId("");
    setNotes("");
    setLineItems([
      {
        id: "1",
        materialSKU: "",
        description: "",
        quantity: 1,
        unitPrice: "",
      },
    ]);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        materialSKU: "",
        description: "",
        quantity: 1,
        unitPrice: "",
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast({
        title: "Supplier required",
        description: "Please select a supplier.",
        variant: "destructive",
      });
      return;
    }

    const hasEmptyFields = lineItems.some(
      (item) => !item.materialSKU || !item.description || !item.unitPrice
    );

    if (hasEmptyFields) {
      toast({
        title: "Incomplete line items",
        description: "Please fill in all fields for each line item.",
        variant: "destructive",
      });
      return;
    }

    const total = calculateTotal();

    createMutation.mutate({
      supplierId,
      notes: notes || null,
      totalAmount: total.toFixed(2),
      lineItems: lineItems.map((item) => ({
        itemName: item.materialSKU,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: (item.quantity * parseFloat(item.unitPrice || "0")).toFixed(2),
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-po">
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order to request materials from a supplier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="supplier" data-testid="select-supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.organizationName || `${supplier.firstName} ${supplier.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Line Items</Label>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-border rounded-md p-4 space-y-3"
                    data-testid={`line-item-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Material SKU</Label>
                        <Input
                          value={item.materialSKU}
                          onChange={(e) => updateLineItem(item.id, "materialSKU", e.target.value)}
                          placeholder="e.g., PC-159-CR"
                          data-testid={`input-sku-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          placeholder="e.g., Polycarbonate 1.59 w/ CR coating"
                          data-testid={`input-description-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)
                          }
                          data-testid={`input-quantity-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, "unitPrice", e.target.value)}
                          placeholder="0.00"
                          data-testid={`input-price-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={addLineItem} data-testid="button-add-item">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or special instructions"
                data-testid="input-notes"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-semibold" data-testid="text-total-amount">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-po"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-po">
              {createMutation.isPending ? "Creating..." : "Create Purchase Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
