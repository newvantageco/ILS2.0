import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Package,
  Clock,
  CheckCircle,
  PlayCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductionStats {
  pending: number;
  inProduction: number;
  qualityCheck: number;
  completed: number;
  totalToday: number;
  averageCompletionTime: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  patientId: string;
  lensType: string;
  lensMaterial: string;
  coating: string;
  orderDate: Date;
  dueDate: Date | null;
  completedAt: Date | null;
}

interface TimelineEvent {
  id: string;
  orderId: string;
  status: string;
  details: string | null;
  timestamp: Date;
  userId: string;
}

interface ProductionStage {
  stageName: string;
  ordersCount: number;
  averageTimeInStage: number;
}

interface Bottleneck {
  stage: string;
  ordersCount: number;
  averageWaitTime: number;
}

const statusColors = {
  pending: "bg-gray-500",
  in_production: "bg-blue-500",
  quality_check: "bg-yellow-500",
  completed: "bg-green-500",
  on_hold: "bg-orange-500",
  cancelled: "bg-red-500",
};

const statusLabels = {
  pending: "Pending",
  in_production: "In Production",
  quality_check: "Quality Check",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

export default function ProductionTrackingPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<ProductionStats>({
    queryKey: ["/api/production/stats"],
  });

  const queryParams = statusFilter !== "all" ? `?status=${statusFilter}` : "";
  const { data: orders, isLoading: ordersLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/production/orders", queryParams],
  });

  const { data: stages } = useQuery<ProductionStage[]>({
    queryKey: ["/api/production/stages"],
  });

  const { data: bottlenecks } = useQuery<Bottleneck[]>({
    queryKey: ["/api/production/bottlenecks"],
  });

  const { data: timeline } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/production/orders", selectedOrder?.id, "timeline"],
    enabled: !!selectedOrder,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/production/orders/${id}/status`, {
        status,
        notes,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/bottlenecks"] });
      toast({ title: "Status updated successfully" });
      setUpdateStatusDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/api/login";
      } else {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    },
  });

  const handleUpdateStatus = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const formData = new FormData(e.currentTarget);
    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status: formData.get("status") as string,
      notes: formData.get("notes") as string,
    });
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors] || "bg-gray-500"} text-white`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hrs`;
    } else {
      return `${(hours / 24).toFixed(1)} days`;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production Tracking</h1>
          <p className="text-muted-foreground">Real-time order monitoring and stage tracking</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-6">
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
          />
          <StatCard
            title="In Production"
            value={stats.inProduction}
            icon={PlayCircle}
          />
          <StatCard
            title="Quality Check"
            value={stats.qualityCheck}
            icon={CheckCircle}
          />
          <StatCard
            title="Completed Today"
            value={stats.totalToday}
            icon={Package}
          />
          <div className="md:col-span-2">
            <StatCard
              title="Avg Completion Time"
              value={formatDuration(stats.averageCompletionTime)}
              icon={TrendingUp}
            />
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="stages">Production Stages</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="quality_check">Quality Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lens Type</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Coating</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{order.lensType}</TableCell>
                      <TableCell>{order.lensMaterial}</TableCell>
                      <TableCell>{order.coating}</TableCell>
                      <TableCell>{format(new Date(order.orderDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        {order.dueDate ? format(new Date(order.dueDate), "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setTimelineDialogOpen(true);
                            }}
                          >
                            Timeline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setUpdateStatusDialogOpen(true);
                            }}
                          >
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Stages Tab */}
        <TabsContent value="stages">
          <Card>
            <CardHeader>
              <CardTitle>Production Stage Analysis</CardTitle>
              <CardDescription>Average time spent in each stage</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead>Orders Count</TableHead>
                    <TableHead>Average Time in Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stages?.map((stage) => (
                    <TableRow key={stage.stageName}>
                      <TableCell className="font-medium">
                        {statusLabels[stage.stageName as keyof typeof statusLabels] || stage.stageName}
                      </TableCell>
                      <TableCell>{stage.ordersCount}</TableCell>
                      <TableCell>{formatDuration(stage.averageTimeInStage)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks">
          <Card>
            <CardHeader>
              <CardTitle>Production Bottlenecks</CardTitle>
              <CardDescription>Stages with longest wait times</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead>Orders Waiting</TableHead>
                    <TableHead>Average Wait Time</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bottlenecks?.map((bottleneck, index) => (
                    <TableRow key={bottleneck.stage}>
                      <TableCell className="font-medium">
                        {statusLabels[bottleneck.stage as keyof typeof statusLabels] || bottleneck.stage}
                      </TableCell>
                      <TableCell>{bottleneck.ordersCount}</TableCell>
                      <TableCell>{formatDuration(bottleneck.averageWaitTime)}</TableCell>
                      <TableCell>
                        {index === 0 ? (
                          <Badge variant="destructive">High Priority</Badge>
                        ) : index === 1 ? (
                          <Badge className="bg-orange-500 text-white">Medium</Badge>
                        ) : (
                          <Badge variant="secondary">Low</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Timeline Dialog */}
      <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Timeline - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>Complete history of status changes and events</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {timeline?.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${statusColors[event.status as keyof typeof statusColors] || "bg-gray-500"}`} />
                  {index < (timeline.length - 1) && (
                    <div className="w-0.5 h-full bg-gray-300 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {statusLabels[event.status as keyof typeof statusLabels] || event.status}
                      </p>
                      {event.details && (
                        <p className="text-sm text-muted-foreground mt-1">{event.details}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.timestamp), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialogOpen} onOpenChange={setUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change status for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStatus}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="status">New Status *</Label>
                <Select name="status" required defaultValue={selectedOrder?.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_production">In Production</SelectItem>
                    <SelectItem value="quality_check">Quality Check</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} placeholder="Add notes about this status change..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpdateStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Status</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
