import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
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
  Wrench,
  AlertTriangle,
  CheckCircle,
  Pause,
  Plus,
  Calendar,
  Clock,
  Settings,
  FileText,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

interface Equipment {
  id: string;
  companyId: string;
  testRoomId: string | null;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string;
  status: "operational" | "maintenance" | "repair" | "offline";
  purchaseDate: Date | null;
  lastCalibrationDate: Date | null;
  nextCalibrationDate: Date | null;
  calibrationFrequencyDays: number | null;
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
  specifications: any;
  notes: string | null;
  location: string | null;
  warrantyExpiration: Date | null;
  maintenanceHistory: any[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface EquipmentStats {
  total: number;
  operational: number;
  maintenance: number;
  repair: number;
  offline: number;
  needsCalibration: number;
  needsMaintenance: number;
}

const statusColors = {
  operational: "bg-green-500",
  maintenance: "bg-yellow-500",
  repair: "bg-orange-500",
  offline: "bg-red-500",
};

const statusIcons = {
  operational: CheckCircle,
  maintenance: Settings,
  repair: Wrench,
  offline: Pause,
};

export default function EquipmentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [calibrationDialogOpen, setCalibrationDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<EquipmentStats>({
    queryKey: ["/api/equipment/stats"],
  });

  const queryParams = statusFilter !== "all" ? `?status=${statusFilter}` : "";
  const { data: equipment, isLoading: equipmentLoading, error } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment", queryParams],
  });

  const { data: dueCalibrations } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment/due-calibration"],
  });

  const { data: dueMaintenance } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment/due-maintenance"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/equipment", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/stats"] });
      toast({ title: "Equipment created successfully" });
      setCreateDialogOpen(false);
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
          description: "Failed to create equipment",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/equipment/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/stats"] });
      toast({ title: "Equipment updated successfully" });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/equipment/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/stats"] });
      toast({ title: "Equipment deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete equipment",
        variant: "destructive",
      });
    },
  });

  const addMaintenanceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("POST", `/api/equipment/${id}/maintenance`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/due-maintenance"] });
      toast({ title: "Maintenance record added successfully" });
      setMaintenanceDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add maintenance record",
        variant: "destructive",
      });
    },
  });

  const recordCalibrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("POST", `/api/equipment/${id}/calibration`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/due-calibration"] });
      toast({ title: "Calibration recorded successfully" });
      setCalibrationDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record calibration",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      manufacturer: formData.get("manufacturer") as string || null,
      model: formData.get("model") as string || null,
      serialNumber: formData.get("serialNumber") as string,
      status: formData.get("status") as string || "operational",
      location: formData.get("location") as string || null,
      calibrationFrequencyDays: parseInt(formData.get("calibrationFrequencyDays") as string) || 365,
      notes: formData.get("notes") as string || null,
    };
    createMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      manufacturer: formData.get("manufacturer") as string || null,
      model: formData.get("model") as string || null,
      serialNumber: formData.get("serialNumber") as string,
      status: formData.get("status") as string,
      location: formData.get("location") as string || null,
      calibrationFrequencyDays: parseInt(formData.get("calibrationFrequencyDays") as string),
      notes: formData.get("notes") as string || null,
    };
    updateMutation.mutate({ id: selectedEquipment.id, data });
  };

  const handleMaintenanceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      type: formData.get("type") as string,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      cost: parseFloat(formData.get("cost") as string) || undefined,
      nextScheduledDate: formData.get("nextScheduledDate") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    };
    addMaintenanceMutation.mutate({ id: selectedEquipment.id, data });
  };

  const handleCalibrationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      calibrationDate: formData.get("calibrationDate") as string,
      nextCalibrationDate: formData.get("nextCalibrationDate") as string,
      notes: formData.get("notes") as string || undefined,
    };
    recordCalibrationMutation.mutate({ id: selectedEquipment.id, data });
  };

  const getStatusBadge = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons];
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground">Track and maintain lab equipment</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
              <DialogDescription>Enter equipment details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Equipment Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Serial Number *</Label>
                    <Input id="serialNumber" name="serialNumber" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input id="manufacturer" name="manufacturer" />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" name="model" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="operational">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="calibrationFrequencyDays">Calibration Frequency (days)</Label>
                  <Input
                    id="calibrationFrequencyDays"
                    name="calibrationFrequencyDays"
                    type="number"
                    defaultValue="365"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Equipment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Equipment"
            value={stats.total}
            icon={Settings}
          />
          <StatCard
            title="Operational"
            value={stats.operational}
            icon={CheckCircle}
          />
          <StatCard
            title="Needs Calibration"
            value={stats.needsCalibration}
            icon={Calendar}
          />
          <StatCard
            title="Needs Maintenance"
            value={stats.needsMaintenance}
            icon={Wrench}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Equipment</TabsTrigger>
          <TabsTrigger value="calibration">Due Calibration</TabsTrigger>
          <TabsTrigger value="maintenance">Due Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Calibration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.serialNumber}</TableCell>
                      <TableCell>{item.manufacturer || "-"}</TableCell>
                      <TableCell>{item.location || "-"}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {item.nextCalibrationDate
                          ? format(new Date(item.nextCalibrationDate), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/lab/equipment/${item.id}`}>
                            <Button size="sm" variant="default">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEquipment(item);
                              setCalibrationDialogOpen(true);
                            }}
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEquipment(item);
                              setMaintenanceDialogOpen(true);
                            }}
                          >
                            <Wrench className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEquipment(item);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
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

        <TabsContent value="calibration">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Due for Calibration</CardTitle>
              <CardDescription>Within the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueCalibrations?.map((item) => {
                    const dueDate = item.nextCalibrationDate
                      ? new Date(item.nextCalibrationDate)
                      : null;
                    const daysOverdue = dueDate
                      ? Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                      : 0;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.serialNumber}</TableCell>
                        <TableCell>
                          {dueDate ? format(dueDate, "MMM dd, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {daysOverdue > 0 ? (
                            <Badge variant="destructive">{daysOverdue} days</Badge>
                          ) : (
                            <Badge variant="secondary">{Math.abs(daysOverdue)} days</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedEquipment(item);
                              setCalibrationDialogOpen(true);
                            }}
                          >
                            Calibrate
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Due for Maintenance</CardTitle>
              <CardDescription>Within the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Last Maintenance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueMaintenance?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.serialNumber}</TableCell>
                      <TableCell>
                        {item.nextMaintenance
                          ? format(new Date(item.nextMaintenance), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.lastMaintenance
                          ? format(new Date(item.lastMaintenance), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedEquipment(item);
                            setMaintenanceDialogOpen(true);
                          }}
                        >
                          Add Maintenance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Equipment Name *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedEquipment.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-serialNumber">Serial Number *</Label>
                    <Input
                      id="edit-serialNumber"
                      name="serialNumber"
                      defaultValue={selectedEquipment.serialNumber}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                    <Input
                      id="edit-manufacturer"
                      name="manufacturer"
                      defaultValue={selectedEquipment.manufacturer || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-model">Model</Label>
                    <Input
                      id="edit-model"
                      name="model"
                      defaultValue={selectedEquipment.model || ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select name="status" defaultValue={selectedEquipment.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      name="location"
                      defaultValue={selectedEquipment.location || ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    rows={3}
                    defaultValue={selectedEquipment.notes || ""}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Maintenance Record</DialogTitle>
            <DialogDescription>
              Record maintenance for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMaintenanceSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="type">Maintenance Type *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" required />
              </div>
              <div>
                <Label htmlFor="cost">Cost (optional)</Label>
                <Input id="cost" name="cost" type="number" step="0.01" />
              </div>
              <div>
                <Label htmlFor="nextScheduledDate">Next Scheduled Date</Label>
                <Input id="nextScheduledDate" name="nextScheduledDate" type="date" />
              </div>
              <div>
                <Label htmlFor="maint-notes">Notes</Label>
                <Textarea id="maint-notes" name="notes" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMaintenanceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Calibration Dialog */}
      <Dialog open={calibrationDialogOpen} onOpenChange={setCalibrationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Calibration</DialogTitle>
            <DialogDescription>
              Record calibration for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCalibrationSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="calibrationDate">Calibration Date *</Label>
                <Input
                  id="calibrationDate"
                  name="calibrationDate"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nextCalibrationDate">Next Calibration Date *</Label>
                <Input
                  id="nextCalibrationDate"
                  name="nextCalibrationDate"
                  type="date"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cal-notes">Notes</Label>
                <Textarea id="cal-notes" name="notes" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCalibrationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Record Calibration</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
