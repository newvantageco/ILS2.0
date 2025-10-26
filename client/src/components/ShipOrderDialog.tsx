import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShipOrderDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShipOrderDialog({ orderId, open, onOpenChange }: ShipOrderDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const { toast } = useToast();

  // Reset tracking number when dialog opens
  useEffect(() => {
    if (open) {
      setTrackingNumber("");
    }
  }, [open]);

  const shipMutation = useMutation({
    mutationFn: async (data: { trackingNumber: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/ship`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Order shipped",
        description: "Order has been marked as shipped and customer notified.",
      });
      setTrackingNumber("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error shipping order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast({
        title: "Tracking number required",
        description: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }
    shipMutation.mutate({ trackingNumber: trackingNumber.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mark Order as Shipped</DialogTitle>
            <DialogDescription>
              Enter the tracking number to mark this order as shipped. The customer will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                data-testid="input-tracking-number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-ship"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={shipMutation.isPending} data-testid="button-ship-order">
              {shipMutation.isPending ? "Shipping..." : "Ship Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
