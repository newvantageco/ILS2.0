import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface QCStats {
  totalInspections: number;
  passed: number;
  failed: number;
  needsReview: number;
  passRate: number;
  commonDefects: { type: string; count: number }[];
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
}

interface QualityDefect {
  type: string;
  severity: "minor" | "major" | "critical";
  description: string;
  location: string;
}

interface QualityMeasurement {
  parameter: string;
  expected: number;
  actual: number;
  tolerance: number;
  passed: boolean;
}

interface QCMetrics {
  defectRate: number;
  avgInspectionTime: number;
  topDefectTypes: { type: string; count: number; percentage: number }[];
}

export default function QualityControlPage() {
  const { toast } = useToast();
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [defects, setDefects] = useState<QualityDefect[]>([]);
  const [measurements, setMeasurements] = useState<QualityMeasurement[]>([]);

  // Queries
  const { data: stats } = useQuery<QCStats>({
    queryKey: ["/api/quality-control/stats"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/quality-control/orders"],
  });

  const { data: metrics } = useQuery<QCMetrics>({
    queryKey: ["/api/quality-control/metrics"],
  });

  const { data: standardMeasurements } = useQuery<{ parameter: string; tolerance: number }[]>({
    queryKey: ["/api/quality-control/standard-measurements"],
  });

  const { data: defectTypes } = useQuery<string[]>({
    queryKey: ["/api/quality-control/defect-types"],
  });

  // Mutation
  const inspectMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      defects,
      measurements,
      notes,
    }: {
      orderId: string;
      status: string;
      defects: QualityDefect[];
      measurements: QualityMeasurement[];
      notes?: string;
    }) => {
      const response = await apiRequest("POST", `/api/quality-control/inspect/${orderId}`, {
        status,
        defects,
        measurements,
        notes,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-control"] });
      toast({ title: "Inspection completed successfully" });
      setInspectDialogOpen(false);
      setSelectedOrder(null);
      setDefects([]);
      setMeasurements([]);
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
          description: "Failed to complete inspection",
          variant: "destructive",
        });
      }
    },
  });

  const handleInspect = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as string;
    const notes = formData.get("notes") as string;

    inspectMutation.mutate({
      orderId: selectedOrder.id,
      status,
      defects,
      measurements,
      notes,
    });
  };

  const addDefect = () => {
    setDefects([
      ...defects,
      { type: "", severity: "minor", description: "", location: "" },
    ]);
  };

  const removeDefect = (index: number) => {
    setDefects(defects.filter((_, i) => i !== index));
  };

  const updateDefect = (index: number, field: keyof QualityDefect, value: string) => {
    const updated = [...defects];
    updated[index] = { ...updated[index], [field]: value };
    setDefects(updated);
  };

  const addMeasurement = () => {
    if (standardMeasurements && standardMeasurements.length > 0) {
      const defaultMeasurement = standardMeasurements[0];
      setMeasurements([
        ...measurements,
        {
          parameter: defaultMeasurement.parameter,
          expected: 0,
          actual: 0,
          tolerance: defaultMeasurement.tolerance,
          passed: true,
        },
      ]);
    }
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const updateMeasurement = (index: number, field: string, value: any) => {
    const updated = [...measurements];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate passed status
    if (field === "expected" || field === "actual" || field === "tolerance") {
      const m = updated[index];
      m.passed = Math.abs(m.actual - m.expected) <= m.tolerance;
    }
    
    setMeasurements(updated);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quality Control</h1>
          <p className="text-muted-foreground">Inspection workflows and defect tracking</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard
            title="Total Inspections"
            value={stats.totalInspections}
            icon={BarChart3}
          />
          <StatCard
            title="Passed"
            value={stats.passed}
            icon={CheckCircle}
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={XCircle}
          />
          <StatCard
            title="Needs Review"
            value={stats.needsReview}
            icon={AlertCircle}
          />
          <StatCard
            title="Pass Rate"
            value={`${stats.passRate.toFixed(1)}%`}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Inspection Queue</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="defects">Common Defects</TabsTrigger>
        </TabsList>

        {/* Queue Tab */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Orders Awaiting Quality Check</CardTitle>
              <CardDescription>Perform inspections and approve/reject orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Lens Type</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Coating</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.lensType}</TableCell>
                      <TableCell>{order.lensMaterial}</TableCell>
                      <TableCell>{order.coating}</TableCell>
                      <TableCell>{format(new Date(order.orderDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setInspectDialogOpen(true);
                          }}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!orders || orders.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No orders awaiting quality check
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Defect Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics?.defectRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${metrics?.defectRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Avg Inspection Time</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics?.avgInspectionTime} minutes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Defect Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.topDefectTypes.map((defect, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{defect.type}</span>
                        <span className="text-muted-foreground">
                          {defect.count} ({defect.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${defect.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Defects Tab */}
        <TabsContent value="defects">
          <Card>
            <CardHeader>
              <CardTitle>Common Defects</CardTitle>
              <CardDescription>Most frequently occurring defects</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Defect Type</TableHead>
                    <TableHead>Occurrences</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.commonDefects.map((defect, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{defect.type}</TableCell>
                      <TableCell>{defect.count}</TableCell>
                      <TableCell>
                        {index === 0 ? (
                          <Badge variant="destructive">Increasing</Badge>
                        ) : (
                          <Badge variant="secondary">Stable</Badge>
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

      {/* Inspection Dialog */}
      <Dialog open={inspectDialogOpen} onOpenChange={setInspectDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quality Inspection - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Perform quality checks and record defects/measurements
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInspect}>
            <div className="grid gap-6 py-4">
              {/* Inspection Result */}
              <div>
                <Label htmlFor="status">Inspection Result *</Label>
                <Select name="status" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="needs_review">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Defects Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Defects Found</Label>
                  <Button type="button" size="sm" onClick={addDefect}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Defect
                  </Button>
                </div>
                {defects.map((defect, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Defect Type</Label>
                        <Select
                          value={defect.type}
                          onValueChange={(value) => updateDefect(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {defectTypes?.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Severity</Label>
                        <Select
                          value={defect.severity}
                          onValueChange={(value) => updateDefect(index, "severity", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input
                          value={defect.location}
                          onChange={(e) => updateDefect(index, "location", e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDefect(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={defect.description}
                          onChange={(e) => updateDefect(index, "description", e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Measurements Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Measurements</Label>
                  <Button type="button" size="sm" onClick={addMeasurement}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Measurement
                  </Button>
                </div>
                {measurements.map((measurement, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-6 gap-4 items-end">
                      <div className="col-span-2">
                        <Label>Parameter</Label>
                        <Input value={measurement.parameter} disabled />
                      </div>
                      <div>
                        <Label>Expected</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={measurement.expected}
                          onChange={(e) =>
                            updateMeasurement(index, "expected", parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label>Actual</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={measurement.actual}
                          onChange={(e) =>
                            updateMeasurement(index, "actual", parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label>Tolerance</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={measurement.tolerance}
                          disabled
                        />
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={measurement.passed ? "default" : "destructive"}>
                          {measurement.passed ? "Pass" : "Fail"}
                        </Badge>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeMeasurement(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Inspection Notes</Label>
                <Textarea id="notes" name="notes" rows={4} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInspectDialogOpen(false);
                  setDefects([]);
                  setMeasurements([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Complete Inspection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
