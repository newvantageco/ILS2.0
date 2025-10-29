import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, differenceInDays, parseISO } from "date-fns";

interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  purchaseDate: Date;
  lastCalibrationDate: Date | null;
  nextCalibrationDate: Date | null;
  calibrationFrequencyDays: number;
  status: "operational" | "maintenance" | "calibration-due" | "out-of-service";
  testRoomId: string;
  testRoom: {
    roomName: string;
  };
  notes: string | null;
}

interface CalibrationRecord {
  id: string;
  equipmentId: string;
  calibrationDate: Date;
  performedBy: string;
  certificateNumber: string | null;
  nextDueDate: Date;
  results: string | null;
  passed: boolean;
}

export function EquipmentCalibrationTracker() {
  const [selectedTestRoom, setSelectedTestRoom] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/ecp/equipment", selectedTestRoom],
  });

  const { data: testRooms } = useQuery<any[]>({
    queryKey: ["/api/ecp/test-rooms"],
  });

  const recordCalibrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ecp/equipment/calibration", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/equipment"] });
      toast({
        title: "Calibration Recorded",
        description: "Equipment calibration has been recorded successfully.",
      });
      setSelectedEquipment(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record calibration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCalibrationStatus = (item: Equipment) => {
    if (!item.nextCalibrationDate) {
      return {
        label: "Not Scheduled",
        color: "secondary" as const,
        icon: Clock,
        severity: 0,
      };
    }

    const today = new Date();
    const nextDate = parseISO(item.nextCalibrationDate.toString());
    const daysUntil = differenceInDays(nextDate, today);

    if (daysUntil < 0) {
      return {
        label: `Overdue by ${Math.abs(daysUntil)}d`,
        color: "destructive" as const,
        icon: AlertTriangle,
        severity: 3,
      };
    } else if (daysUntil <= 7) {
      return {
        label: `Due in ${daysUntil}d`,
        color: "default" as const,
        icon: AlertTriangle,
        severity: 2,
      };
    } else if (daysUntil <= 30) {
      return {
        label: `Due in ${daysUntil}d`,
        color: "default" as const,
        icon: Clock,
        severity: 1,
      };
    } else {
      return {
        label: `Due in ${daysUntil}d`,
        color: "outline" as const,
        icon: CheckCircle2,
        severity: 0,
      };
    }
  };

  const handleCalibrationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    const formData = new FormData(e.currentTarget);
    
    const data = {
      equipmentId: selectedEquipment.id,
      calibrationDate: formData.get("calibrationDate") as string,
      performedBy: formData.get("performedBy") as string,
      certificateNumber: formData.get("certificateNumber") as string || null,
      nextDueDate: formData.get("nextDueDate") as string,
      results: formData.get("results") as string || null,
      passed: formData.get("passed") === "true",
    };

    recordCalibrationMutation.mutate(data);
  };

  // Sort equipment by calibration urgency
  const sortedEquipment = equipment?.slice().sort((a, b) => {
    const statusA = getCalibrationStatus(a);
    const statusB = getCalibrationStatus(b);
    return statusB.severity - statusA.severity;
  });

  const stats = {
    total: equipment?.length || 0,
    operational: equipment?.filter(e => e.status === "operational").length || 0,
    dueSoon: equipment?.filter(e => {
      const status = getCalibrationStatus(e);
      return status.severity >= 2;
    }).length || 0,
    overdue: equipment?.filter(e => {
      const status = getCalibrationStatus(e);
      return status.severity === 3;
    }).length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wrench className="h-8 w-8" />
            Equipment Calibration
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage equipment calibration schedules
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
              <DialogDescription>
                Register new equipment for calibration tracking
              </DialogDescription>
            </DialogHeader>
            {/* Add equipment form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.operational}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueSoon}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Equipment Inventory</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="room-filter">Filter by Room:</Label>
              <select
                id="room-filter"
                className="border rounded-md px-3 py-2"
                value={selectedTestRoom}
                onChange={(e) => setSelectedTestRoom(e.target.value)}
              >
                <option value="all">All Rooms</option>
                {testRooms?.map((room: any) => (
                  <option key={room.id} value={room.id}>
                    {room.roomName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!sortedEquipment || sortedEquipment.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No equipment registered</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking equipment calibration by adding your first device
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Test Room</TableHead>
                    <TableHead>Last Calibration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEquipment.map((item) => {
                    const status = getCalibrationStatus(item);
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.manufacturer} {item.model}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {item.serialNumber}
                          </span>
                        </TableCell>
                        <TableCell>{item.testRoom.roomName}</TableCell>
                        <TableCell>
                          {item.lastCalibrationDate
                            ? format(parseISO(item.lastCalibrationDate.toString()), "dd/MM/yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.color} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEquipment(item)}
                          >
                            Record Calibration
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Calibration Dialog */}
      <Dialog
        open={!!selectedEquipment}
        onOpenChange={(open) => !open && setSelectedEquipment(null)}
      >
        <DialogContent>
          <form onSubmit={handleCalibrationSubmit}>
            <DialogHeader>
              <DialogTitle>Record Calibration</DialogTitle>
              <DialogDescription>
                {selectedEquipment && (
                  <>
                    {selectedEquipment.name} - {selectedEquipment.serialNumber}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calibrationDate">Calibration Date *</Label>
                  <Input
                    id="calibrationDate"
                    name="calibrationDate"
                    type="date"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Next Due Date *</Label>
                  <Input
                    id="nextDueDate"
                    name="nextDueDate"
                    type="date"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="performedBy">Performed By *</Label>
                <Input
                  id="performedBy"
                  name="performedBy"
                  placeholder="Technician name or company"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateNumber">Certificate Number</Label>
                <Input
                  id="certificateNumber"
                  name="certificateNumber"
                  placeholder="Calibration certificate reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passed">Calibration Result *</Label>
                <select
                  id="passed"
                  name="passed"
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="true">Passed</option>
                  <option value="false">Failed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="results">Notes</Label>
                <Input
                  id="results"
                  name="results"
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedEquipment(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recordCalibrationMutation.isPending}>
                {recordCalibrationMutation.isPending ? "Saving..." : "Save Calibration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
