import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { createOptimisticHandlers, optimisticAdd } from "@/lib/optimisticUpdates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  Wrench,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  FileText,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { TimestampDisplay } from "@/components/ui/TimestampDisplay";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Equipment = {
  id: string;
  name: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  status: "active" | "maintenance" | "inactive";
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  lastCalibration: string | null;
  nextCalibration: string | null;
  notes: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
};

type CalibrationRecord = {
  id: string;
  equipmentId: string;
  calibrationDate: string;
  performedBy: string | null;
  result: string;
  notes: string | null;
  nextDueDate: string | null;
  createdAt: string;
};

type MaintenanceLog = {
  id: string;
  equipmentId: string;
  date: string;
  type: "repair" | "maintenance" | "inspection";
  description: string;
  performedBy: string | null;
  cost: number | null;
  createdAt: string;
};

export default function EquipmentDetailPage() {
  const [, params] = useRoute<{ id: string }>("/*/equipment/:id");
  const equipmentId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [calibrationData, setCalibrationData] = useState({
    result: "",
    notes: "",
    nextDueDate: "",
  });

  const { data: equipment, isLoading } = useQuery<Equipment>({
    queryKey: ["/api/equipment", equipmentId],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${equipmentId}`);
      if (!response.ok) throw new Error("Failed to fetch equipment");
      return response.json();
    },
    enabled: !!equipmentId,
  });

  const { data: calibrationRecords = [] } = useQuery<CalibrationRecord[]>({
    queryKey: ["/api/equipment", equipmentId, "calibration"],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${equipmentId}/calibration`);
      if (!response.ok) throw new Error("Failed to fetch calibration records");
      return response.json();
    },
    enabled: !!equipmentId,
  });

  const { data: maintenanceLogs = [] } = useQuery<MaintenanceLog[]>({
    queryKey: ["/api/equipment", equipmentId, "maintenance"],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${equipmentId}/maintenance`);
      if (!response.ok) throw new Error("Failed to fetch maintenance logs");
      return response.json();
    },
    enabled: !!equipmentId,
  });

  const addCalibrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/equipment/${equipmentId}/calibration`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add calibration record");
      }
      return await res.json();
    },
    ...createOptimisticHandlers<any[], any>({
      queryKey: ["/api/equipment", equipmentId, "calibration"],
      updater: (oldData, variables) => {
        const newRecord = {
          id: `temp-${Date.now()}`,
          ...variables,
          equipmentId,
          createdAt: new Date().toISOString(),
        };
        return optimisticAdd(oldData, newRecord) || [];
      },
      successMessage: "Calibration record added successfully",
      errorMessage: "Failed to add calibration record",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId] });
      setShowCalibrationDialog(false);
      setCalibrationData({ result: "", notes: "", nextDueDate: "" });
    },
  });

  if (!equipmentId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Equipment ID not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Equipment not found</p>
      </div>
    );
  }

  const statusColors = {
    active: "bg-green-500/20 text-green-700 dark:text-green-400",
    maintenance: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    inactive: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
  };

  const getBackPath = () => {
    if (!user?.role) return "/";
    switch (user.role) {
      case "ecp":
        return "/ecp/equipment";
      case "lab_tech":
      case "engineer":
        return "/lab/equipment";
      default:
        return "/";
    }
  };

  const isCalibrationDue = equipment.nextCalibration
    ? new Date(equipment.nextCalibration) < new Date()
    : false;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href={getBackPath()}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              <Wrench className="h-6 w-6" />
              {equipment.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {equipment.type} · {equipment.manufacturer} {equipment.model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[equipment.status]}>
            {equipment.status.toUpperCase()}
          </Badge>
          {isCalibrationDue && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Calibration Due
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Equipment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {equipment.serialNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-medium font-mono">{equipment.serialNumber}</p>
              </div>
            )}
            {equipment.location && (
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{equipment.location}</p>
              </div>
            )}
            {equipment.purchaseDate && (
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">
                  {new Date(equipment.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {equipment.warrantyExpiry && (
              <div>
                <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                <p className="font-medium">
                  {new Date(equipment.warrantyExpiry).toLocaleDateString()}
                </p>
              </div>
            )}
            {equipment.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{equipment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calibration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {equipment.lastCalibration && (
              <div>
                <p className="text-sm text-muted-foreground">Last Calibration</p>
                <p className="font-medium">
                  {new Date(equipment.lastCalibration).toLocaleDateString()}
                </p>
              </div>
            )}
            {equipment.nextCalibration && (
              <div>
                <p className="text-sm text-muted-foreground">Next Calibration Due</p>
                <p className={`font-medium ${isCalibrationDue ? "text-red-600" : ""}`}>
                  {new Date(equipment.nextCalibration).toLocaleDateString()}
                </p>
              </div>
            )}
            <Dialog open={showCalibrationDialog} onOpenChange={setShowCalibrationDialog}>
              <DialogTrigger asChild>
                <Button className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Calibration Record
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Calibration Record</DialogTitle>
                  <DialogDescription>
                    Record a new calibration for {equipment.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="result">Result</Label>
                    <Input
                      id="result"
                      placeholder="Pass/Fail/Within Tolerance"
                      value={calibrationData.result}
                      onChange={(e) =>
                        setCalibrationData({ ...calibrationData, result: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Calibration details..."
                      value={calibrationData.notes}
                      onChange={(e) =>
                        setCalibrationData({ ...calibrationData, notes: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextDueDate">Next Due Date</Label>
                    <Input
                      id="nextDueDate"
                      type="date"
                      value={calibrationData.nextDueDate}
                      onChange={(e) =>
                        setCalibrationData({ ...calibrationData, nextDueDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCalibrationDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addCalibrationMutation.mutate(calibrationData)}
                    disabled={!calibrationData.result || addCalibrationMutation.isPending}
                  >
                    Add Record
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Calibration History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {calibrationRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No calibration records yet
            </p>
          ) : (
            <div className="space-y-4">
              {calibrationRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {new Date(record.calibrationDate).toLocaleDateString()}
                      </p>
                      <Badge variant="outline">{record.result}</Badge>
                    </div>
                    {record.performedBy && (
                      <p className="text-sm text-muted-foreground mt-1">
                        By: {record.performedBy}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-sm mt-2">{record.notes}</p>
                    )}
                    {record.nextDueDate && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Next due: {new Date(record.nextDueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No maintenance records yet
            </p>
          ) : (
            <div className="space-y-4">
              {maintenanceLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    <Wrench className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {log.type}
                      </Badge>
                    </div>
                    {log.performedBy && (
                      <p className="text-sm text-muted-foreground mt-1">
                        By: {log.performedBy}
                      </p>
                    )}
                    <p className="text-sm mt-2">{log.description}</p>
                    {log.cost && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Cost: ${log.cost.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
