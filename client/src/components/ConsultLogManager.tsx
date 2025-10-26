import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { MessageSquare, Plus, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ConsultLog {
  id: string;
  orderId: string;
  ecpId: string;
  priority: string;
  subject: string;
  description: string;
  labResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  patient: { name: string };
}

function CreateConsultDialog({ orders }: { orders: Order[] }) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/consult-logs", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Consult request submitted",
        description: "The lab has been notified and will respond soon.",
      });
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/consult-logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting consult",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setOrderId("");
    setPriority("normal");
    setSubject("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId || !subject || !description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      orderId,
      priority,
      subject,
      description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-consult">
          <Plus className="h-4 w-4 mr-2" />
          Request Lab Consult
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request Lab Consultation</DialogTitle>
            <DialogDescription>
              Submit a question about a difficult dispense or complex prescription case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="order">Order *</Label>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger id="order" data-testid="select-consult-order">
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority" data-testid="select-consult-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of the issue"
                data-testid="input-consult-subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed explanation of the issue, including patient concerns, fitting challenges, or technical questions"
                rows={6}
                data-testid="input-consult-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-consult"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-consult">
              {createMutation.isPending ? "Submitting..." : "Submit Consult"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    normal: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  return (
    <Badge className={`${colors[priority] || colors.normal} text-white`}>
      {priority.toUpperCase()}
    </Badge>
  );
}

export function ConsultLogManager() {
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: consultLogs, isLoading } = useQuery<ConsultLog[]>({
    queryKey: ["/api/consult-logs"],
  });

  const getOrderInfo = (orderId: string) => {
    const order = orders?.find((o) => o.id === orderId);
    return order ? `${order.orderNumber} - ${order.patient.name}` : "Unknown Order";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>Lab Consultations</CardTitle>
        <CreateConsultDialog orders={orders || []} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : consultLogs && consultLogs.length > 0 ? (
          <div className="space-y-4">
            {consultLogs.map((log) => (
              <div
                key={log.id}
                className="border border-border rounded-md p-4 space-y-3"
                data-testid={`consult-log-${log.id}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold" data-testid={`consult-subject-${log.id}`}>
                        {log.subject}
                      </h4>
                      <PriorityBadge priority={log.priority} />
                      {log.labResponse ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Answered
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`consult-order-${log.id}`}>
                      Order: {getOrderInfo(log.orderId)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`consult-date-${log.id}`}>
                    {format(new Date(log.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Your Question:</p>
                    <p className="text-sm" data-testid={`consult-description-${log.id}`}>
                      {log.description}
                    </p>
                  </div>

                  {log.labResponse && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">Lab Response:</p>
                      <p className="text-sm" data-testid={`consult-response-${log.id}`}>
                        {log.labResponse}
                      </p>
                      {log.respondedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Responded on {format(new Date(log.respondedAt), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-consults">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No consultations yet.</p>
            <p className="text-sm mt-1">
              Request a lab consultation when you need help with complex prescriptions or difficult dispenses.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
