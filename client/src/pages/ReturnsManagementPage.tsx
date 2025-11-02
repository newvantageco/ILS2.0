import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, PackageX, Plus, FileText, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Return {
  id: string;
  orderId: string;
  returnReason: string;
  returnType: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  processingNotes?: string;
  metadata?: Record<string, any>;
}

interface ReturnStats {
  totalReturns: number;
  pendingReturns: number;
  approvedReturns: number;
  rejectedReturns: number;
  averageProcessingTime: number;
}

const RETURN_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500" },
  { value: "approved", label: "Approved", color: "bg-green-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
  { value: "processing", label: "Processing", color: "bg-blue-500" },
  { value: "completed", label: "Completed", color: "bg-gray-500" },
];

const RETURN_TYPES = [
  { value: "defective", label: "Defective Product" },
  { value: "wrong_prescription", label: "Wrong Prescription" },
  { value: "damaged", label: "Damaged in Transit" },
  { value: "customer_request", label: "Customer Request" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

export default function ReturnsManagementPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  
  // Form state for creating return
  const [newReturn, setNewReturn] = useState({
    orderId: "",
    returnReason: "",
    returnType: "",
    description: "",
    processingNotes: "",
  });

  // Form state for updating status
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    processingNotes: "",
  });

  // Fetch returns
  const { data: returns, isLoading: loadingReturns } = useQuery<Return[]>({
    queryKey: ["/api/returns"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/returns");
      return await response.json();
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery<ReturnStats>({
    queryKey: ["/api/stats/returns"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stats/returns");
      return await response.json();
    },
  });

  // Create return mutation
  const createReturn = useMutation({
    mutationFn: async (data: typeof newReturn) => {
      const response = await apiRequest("POST", "/api/returns", {
        ...data,
        createdBy: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/returns"] });
      toast({
        title: "Return Created",
        description: "The return has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewReturn({
        orderId: "",
        returnReason: "",
        returnType: "",
        description: "",
        processingNotes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create return",
        variant: "destructive",
      });
    },
  });

  // Update return status mutation
  const updateReturnStatus = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof statusUpdate }) => {
      const response = await apiRequest("PATCH", `/api/returns/${id}/status`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/returns"] });
      toast({
        title: "Status Updated",
        description: "The return status has been updated successfully.",
      });
      setIsUpdateDialogOpen(false);
      setSelectedReturn(null);
      setStatusUpdate({ status: "", processingNotes: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update return status",
        variant: "destructive",
      });
    },
  });

  const handleCreateReturn = () => {
    createReturn.mutate(newReturn);
  };

  const handleUpdateStatus = () => {
    if (selectedReturn) {
      updateReturnStatus.mutate({ id: selectedReturn.id, data: statusUpdate });
    }
  };

  const openUpdateDialog = (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setStatusUpdate({
      status: returnItem.status,
      processingNotes: returnItem.processingNotes || "",
    });
    setIsUpdateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = RETURN_STATUSES.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-500"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const filteredReturns = returns?.filter((returnItem) => {
    const matchesSearch =
      returnItem.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.returnReason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || returnItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loadingReturns) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Returns Management</h1>
          <p className="text-muted-foreground">
            Track and manage product returns and replacements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Return
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Return</DialogTitle>
              <DialogDescription>
                Register a new product return request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Order ID *</Label>
                <Input
                  placeholder="Enter order ID"
                  value={newReturn.orderId}
                  onChange={(e) => setNewReturn({ ...newReturn, orderId: e.target.value })}
                />
              </div>
              <div>
                <Label>Return Type *</Label>
                <Select
                  value={newReturn.returnType}
                  onValueChange={(value) => setNewReturn({ ...newReturn, returnType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select return type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Return Reason *</Label>
                <Input
                  placeholder="Brief reason for return"
                  value={newReturn.returnReason}
                  onChange={(e) => setNewReturn({ ...newReturn, returnReason: e.target.value })}
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  placeholder="Detailed description of the issue"
                  value={newReturn.description}
                  onChange={(e) => setNewReturn({ ...newReturn, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label>Processing Notes (Optional)</Label>
                <Textarea
                  placeholder="Any additional notes for processing"
                  value={newReturn.processingNotes}
                  onChange={(e) => setNewReturn({ ...newReturn, processingNotes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateReturn}
                disabled={!newReturn.orderId || !newReturn.returnType || !newReturn.returnReason || !newReturn.description}
              >
                <PackageX className="h-4 w-4 mr-2" />
                Create Return
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PackageX className="h-4 w-4" />
                Total Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalReturns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pendingReturns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.approvedReturns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.rejectedReturns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg. Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.averageProcessingTime}h</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Returns List
          </CardTitle>
          <CardDescription>All product returns and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {RETURN_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No returns found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns?.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell className="font-medium">{returnItem.orderId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {RETURN_TYPES.find(t => t.value === returnItem.returnType)?.label || returnItem.returnType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{returnItem.returnReason}</TableCell>
                    <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                    <TableCell>{new Date(returnItem.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUpdateDialog(returnItem)}
                      >
                        Update Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Return Status</DialogTitle>
            <DialogDescription>
              Update the status and add processing notes for this return
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Order ID</Label>
                <p className="font-medium">{selectedReturn.orderId}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Current Reason</Label>
                <p className="text-sm">{selectedReturn.returnReason}</p>
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={statusUpdate.status}
                  onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Processing Notes</Label>
                <Textarea
                  placeholder="Add notes about the status update"
                  value={statusUpdate.processingNotes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, processingNotes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!statusUpdate.status}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
