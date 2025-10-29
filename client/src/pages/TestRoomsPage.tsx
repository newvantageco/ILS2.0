import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  DoorOpen,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Wrench,
  Wifi,
  WifiOff,
  MapPin,
  Calendar,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface TestRoom {
  id: string;
  roomName: string;
  roomCode: string | null;
  locationDescription: string | null;
  equipmentList: string | null;
  capacity: number;
  floorLevel: string | null;
  accessibility: boolean;
  currentStatus: string;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  equipmentDetails: any;
  allowRemoteAccess: boolean;
  locationId: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Equipment {
  name: string;
  serialNumber: string;
  lastCalibration: string;
  nextCalibration: string;
  status: "calibrated" | "due" | "overdue";
}

const STATUS_COLORS = {
  available: "bg-green-500",
  occupied: "bg-yellow-500",
  maintenance: "bg-orange-500",
  offline: "bg-red-500",
};

const STATUS_LABELS = {
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
  offline: "Offline",
};

export default function TestRoomsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<TestRoom | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: testRooms, isLoading } = useQuery<TestRoom[]>({
    queryKey: ["/api/ecp/test-rooms"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ecp/test-rooms", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/test-rooms"] });
      toast({
        title: "Test Room Created",
        description: "The test room has been created successfully.",
      });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/ecp/test-rooms/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/test-rooms"] });
      toast({
        title: "Test Room Updated",
        description: "The test room has been updated successfully.",
      });
      setEditingRoom(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update test room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/ecp/test-rooms/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/test-rooms"] });
      toast({
        title: "Test Room Deleted",
        description: "The test room has been deactivated.",
      });
      setDeletingRoomId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete test room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/ecp/test-rooms/${id}`, { currentStatus: status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/test-rooms"] });
      toast({
        title: "Status Updated",
        description: "The room status has been updated.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, isEdit: boolean) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      roomName: formData.get("roomName") as string,
      roomCode: formData.get("roomCode") as string || null,
      locationDescription: formData.get("locationDescription") as string || null,
      equipmentList: formData.get("equipmentList") as string || null,
      capacity: parseInt(formData.get("capacity") as string) || 1,
      floorLevel: formData.get("floorLevel") as string || null,
      accessibility: formData.get("accessibility") === "true",
      allowRemoteAccess: formData.get("allowRemoteAccess") === "true",
      currentStatus: formData.get("currentStatus") as string || "available",
    };

    if (isEdit && editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getMaintenanceStatus = (room: TestRoom) => {
    if (!room.nextMaintenanceDate) return null;
    
    const today = new Date();
    const nextDate = new Date(room.nextMaintenanceDate);
    const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { label: "Overdue", color: "destructive" as const };
    } else if (daysUntil <= 7) {
      return { label: `Due in ${daysUntil}d`, color: "default" as const };
    } else {
      return { label: `Due in ${daysUntil}d`, color: "secondary" as const };
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Test Rooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage test rooms, equipment, and scheduling
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Test Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={(e) => handleSubmit(e, false)}>
              <DialogHeader>
                <DialogTitle>Create Test Room</DialogTitle>
                <DialogDescription>
                  Add a new test room to your practice
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name *</Label>
                    <Input
                      id="roomName"
                      name="roomName"
                      placeholder="Test Room 1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roomCode">Room Code</Label>
                    <Input
                      id="roomCode"
                      name="roomCode"
                      placeholder="TR1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      defaultValue="1"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floorLevel">Floor Level</Label>
                    <Input
                      id="floorLevel"
                      name="floorLevel"
                      placeholder="Ground Floor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationDescription">Location Description</Label>
                  <Textarea
                    id="locationDescription"
                    name="locationDescription"
                    placeholder="Enter location details..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipmentList">Equipment List</Label>
                  <Textarea
                    id="equipmentList"
                    name="equipmentList"
                    placeholder="List equipment (one per line)..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessibility">Accessibility</Label>
                    <Select name="accessibility" defaultValue="true">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Wheelchair Accessible</SelectItem>
                        <SelectItem value="false">Not Accessible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowRemoteAccess">Remote Access</Label>
                    <Select name="allowRemoteAccess" defaultValue="false">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentStatus">Initial Status</Label>
                  <Select name="currentStatus" defaultValue="available">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Room Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testRooms?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testRooms?.filter(r => r.currentStatus === "available").length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testRooms?.filter(r => r.currentStatus === "occupied").length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testRooms?.filter(r => r.currentStatus === "maintenance" || r.currentStatus === "offline").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Test Rooms</CardTitle>
          <CardDescription>
            Manage and monitor all test rooms across your practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!testRooms || testRooms.length === 0 ? (
            <div className="text-center py-12">
              <DoorOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No test rooms yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first test room to start managing examinations
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testRooms.map((room) => {
                    const maintenanceStatus = getMaintenanceStatus(room);
                    
                    return (
                      <TableRow key={room.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{room.roomName}</div>
                            {room.roomCode && (
                              <div className="text-sm text-muted-foreground">
                                Code: {room.roomCode}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={room.currentStatus}
                            onValueChange={(status) => 
                              updateStatusMutation.mutate({ id: room.id, status })
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[room.currentStatus as keyof typeof STATUS_COLORS]}`} />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {room.floorLevel || "—"}
                          </div>
                          {room.accessibility && (
                            <Badge variant="outline" className="text-xs mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              Accessible
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {room.equipmentList ? (
                              <span>{room.equipmentList.split('\n').length} items</span>
                            ) : (
                              "—"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {maintenanceStatus ? (
                            <Badge variant={maintenanceStatus.color}>
                              {maintenanceStatus.label}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {room.allowRemoteAccess ? (
                              <div className="flex items-center gap-1">
                                <Wifi className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-muted-foreground">Remote</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <WifiOff className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRoom(room)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingRoomId(room.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={(e) => handleSubmit(e, true)}>
            <DialogHeader>
              <DialogTitle>Edit Test Room</DialogTitle>
              <DialogDescription>
                Update test room details and settings
              </DialogDescription>
            </DialogHeader>
            {editingRoom && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-roomName">Room Name *</Label>
                    <Input
                      id="edit-roomName"
                      name="roomName"
                      defaultValue={editingRoom.roomName}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-roomCode">Room Code</Label>
                    <Input
                      id="edit-roomCode"
                      name="roomCode"
                      defaultValue={editingRoom.roomCode || ""}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-capacity">Capacity</Label>
                    <Input
                      id="edit-capacity"
                      name="capacity"
                      type="number"
                      defaultValue={editingRoom.capacity}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-floorLevel">Floor Level</Label>
                    <Input
                      id="edit-floorLevel"
                      name="floorLevel"
                      defaultValue={editingRoom.floorLevel || ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-locationDescription">Location Description</Label>
                  <Textarea
                    id="edit-locationDescription"
                    name="locationDescription"
                    defaultValue={editingRoom.locationDescription || ""}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-equipmentList">Equipment List</Label>
                  <Textarea
                    id="edit-equipmentList"
                    name="equipmentList"
                    defaultValue={editingRoom.equipmentList || ""}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-accessibility">Accessibility</Label>
                    <Select 
                      name="accessibility" 
                      defaultValue={editingRoom.accessibility ? "true" : "false"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Wheelchair Accessible</SelectItem>
                        <SelectItem value="false">Not Accessible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-allowRemoteAccess">Remote Access</Label>
                    <Select 
                      name="allowRemoteAccess" 
                      defaultValue={editingRoom.allowRemoteAccess ? "true" : "false"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-currentStatus">Current Status</Label>
                  <Select name="currentStatus" defaultValue={editingRoom.currentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRoom(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRoomId} onOpenChange={(open) => !open && setDeletingRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Test Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this test room? This will prevent it from being used for new examinations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRoomId && deleteMutation.mutate(deletingRoomId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
