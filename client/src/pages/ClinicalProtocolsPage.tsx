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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, Plus, Copy, Edit2, BookOpen, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ClinicalProtocol {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  category: string;
  content: string;
  version: string;
  status: string;
  effectiveDate?: string;
  reviewDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const PROTOCOL_CATEGORIES = [
  { value: "examination", label: "Eye Examination" },
  { value: "contact_lens", label: "Contact Lens Fitting" },
  { value: "pediatric", label: "Pediatric Care" },
  { value: "geriatric", label: "Geriatric Care" },
  { value: "emergency", label: "Emergency Procedures" },
  { value: "referral", label: "Referral Guidelines" },
  { value: "infection_control", label: "Infection Control" },
  { value: "equipment", label: "Equipment Procedures" },
  { value: "safety", label: "Safety Protocols" },
  { value: "other", label: "Other" },
];

const PROTOCOL_STATUS = [
  { value: "draft", label: "Draft", color: "bg-gray-500" },
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "under_review", label: "Under Review", color: "bg-yellow-500" },
  { value: "archived", label: "Archived", color: "bg-red-500" },
];

export default function ClinicalProtocolsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<ClinicalProtocol | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [protocolToDelete, setProtocolToDelete] = useState<ClinicalProtocol | null>(null);
  
  // Form state
  const [protocolForm, setProtocolForm] = useState({
    title: "",
    description: "",
    category: "examination",
    content: "",
    version: "1.0",
    status: "draft",
    effectiveDate: "",
    reviewDate: "",
  });

  // Fetch protocols
  const { data: protocols, isLoading } = useQuery<ClinicalProtocol[]>({
    queryKey: ["/api/clinical-protocols"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/clinical-protocols");
      return await response.json();
    },
  });

  // Create protocol mutation
  const createProtocol = useMutation({
    mutationFn: async (data: typeof protocolForm) => {
      const response = await apiRequest("POST", "/api/clinical-protocols", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinical-protocols"] });
      toast({
        title: "Protocol Created",
        description: "The clinical protocol has been created successfully.",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create protocol",
        variant: "destructive",
      });
    },
  });

  // Update protocol mutation
  const updateProtocol = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof protocolForm }) => {
      const response = await apiRequest("PUT", `/api/clinical-protocols/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinical-protocols"] });
      toast({
        title: "Protocol Updated",
        description: "The clinical protocol has been updated successfully.",
      });
      resetForm();
      setEditingProtocol(null);
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update protocol",
        variant: "destructive",
      });
    },
  });

  // Delete protocol mutation
  const deleteProtocol = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/clinical-protocols/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinical-protocols"] });
      toast({
        title: "Protocol Deleted",
        description: "The clinical protocol has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setProtocolToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete protocol",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setProtocolForm({
      title: "",
      description: "",
      category: "examination",
      content: "",
      version: "1.0",
      status: "draft",
      effectiveDate: "",
      reviewDate: "",
    });
  };

  const handleSave = () => {
    if (editingProtocol) {
      updateProtocol.mutate({ id: editingProtocol.id, data: protocolForm });
    } else {
      createProtocol.mutate(protocolForm);
    }
  };

  const openEditDialog = (protocol: ClinicalProtocol) => {
    setEditingProtocol(protocol);
    setProtocolForm({
      title: protocol.title,
      description: protocol.description || "",
      category: protocol.category,
      content: protocol.content,
      version: protocol.version,
      status: protocol.status,
      effectiveDate: protocol.effectiveDate || "",
      reviewDate: protocol.reviewDate || "",
    });
    setIsCreateDialogOpen(true);
  };

  const openDuplicateDialog = (protocol: ClinicalProtocol) => {
    setEditingProtocol(null);
    const currentVersion = parseFloat(protocol.version);
    const newVersion = (currentVersion + 0.1).toFixed(1);
    
    setProtocolForm({
      title: `${protocol.title} (Copy)`,
      description: protocol.description || "",
      category: protocol.category,
      content: protocol.content,
      version: newVersion,
      status: "draft",
      effectiveDate: "",
      reviewDate: "",
    });
    setIsCreateDialogOpen(true);
  };

  const filteredProtocols = protocols?.filter((protocol) => {
    const matchesSearch = protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || protocol.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || protocol.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = PROTOCOL_STATUS.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-500"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading protocols...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clinical Protocols</h1>
          <p className="text-muted-foreground">
            Manage standardized clinical procedures and best practices
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingProtocol(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Protocol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProtocol ? "Edit Protocol" : "Create Clinical Protocol"}
              </DialogTitle>
              <DialogDescription>
                Document standardized procedures and clinical guidelines
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Protocol Title *</Label>
                  <Input
                    placeholder="e.g., Comprehensive Eye Examination Protocol"
                    value={protocolForm.title}
                    onChange={(e) => setProtocolForm({ ...protocolForm, title: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief summary of the protocol purpose and scope"
                    value={protocolForm.description}
                    onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={protocolForm.category} onValueChange={(value) => setProtocolForm({ ...protocolForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROTOCOL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select value={protocolForm.status} onValueChange={(value) => setProtocolForm({ ...protocolForm, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROTOCOL_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Version *</Label>
                  <Input
                    placeholder="e.g., 1.0, 2.5"
                    value={protocolForm.version}
                    onChange={(e) => setProtocolForm({ ...protocolForm, version: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Review Date</Label>
                  <Input
                    type="date"
                    value={protocolForm.reviewDate}
                    onChange={(e) => setProtocolForm({ ...protocolForm, reviewDate: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Effective Date</Label>
                  <Input
                    type="date"
                    value={protocolForm.effectiveDate}
                    onChange={(e) => setProtocolForm({ ...protocolForm, effectiveDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Protocol Content *</Label>
                <Textarea
                  placeholder="Enter the detailed protocol steps, guidelines, and procedures..."
                  value={protocolForm.content}
                  onChange={(e) => setProtocolForm({ ...protocolForm, content: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use clear step-by-step instructions. Include safety considerations, required equipment, and expected outcomes.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
                setEditingProtocol(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!protocolForm.title || !protocolForm.content}>
                <FileText className="h-4 w-4 mr-2" />
                {editingProtocol ? "Update Protocol" : "Create Protocol"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Protocols
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{protocols?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {protocols?.filter(p => p.status === "active").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-yellow-500" />
              Under Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {protocols?.filter(p => p.status === "under_review").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Needs Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {protocols?.filter(p => {
                if (!p.reviewDate) return false;
                return new Date(p.reviewDate) < new Date();
              }).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Protocols Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Protocol Library</CardTitle>
              <CardDescription>Browse and manage clinical protocols</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {PROTOCOL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {PROTOCOL_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search protocols..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProtocols?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No protocols found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProtocols?.map((protocol) => (
                  <TableRow key={protocol.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{protocol.title}</p>
                        {protocol.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{protocol.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PROTOCOL_CATEGORIES.find(c => c.value === protocol.category)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">v{protocol.version}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(protocol.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(protocol.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(protocol)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDuplicateDialog(protocol)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setProtocolToDelete(protocol);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Protocol</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{protocolToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setProtocolToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (protocolToDelete) {
                  deleteProtocol.mutate(protocolToDelete.id);
                }
              }}
              disabled={deleteProtocol.isPending}
            >
              {deleteProtocol.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
