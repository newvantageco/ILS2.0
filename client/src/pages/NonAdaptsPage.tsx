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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, AlertTriangle, Plus, FileText, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface NonAdapt {
  id: string;
  orderId: string;
  reportedBy: string;
  patientFeedback: string;
  symptoms: string[];
  createdAt: string;
  resolution?: string;
  resolutionType?: string;
  resolvedAt?: string;
  qualityIssueId?: string;
  replacementOrderId?: string;
  metadata?: Record<string, any>;
}

interface NonAdaptStats {
  totalNonAdapts: number;
  pendingNonAdapts: number;
  resolvedNonAdapts: number;
  averageResolutionTime: number;
}

const SYMPTOM_OPTIONS = [
  "Blurred vision",
  "Eye strain",
  "Headaches",
  "Dizziness",
  "Double vision",
  "Discomfort",
  "Halos around lights",
  "Difficulty reading",
  "Eye fatigue",
  "Nausea",
];

const RESOLUTION_TYPES = [
  { value: "remake", label: "Remake Lenses" },
  { value: "adjustment", label: "Frame Adjustment" },
  { value: "prescription_change", label: "Prescription Change" },
  { value: "patient_adaptation", label: "Patient Adaptation Period" },
  { value: "refund", label: "Refund" },
  { value: "other", label: "Other" },
];

export default function NonAdaptsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedNonAdapt, setSelectedNonAdapt] = useState<NonAdapt | null>(null);
  
  // Form state for creating non-adapt
  const [newNonAdapt, setNewNonAdapt] = useState({
    orderId: "",
    patientFeedback: "",
    symptoms: [] as string[],
  });

  // Form state for resolving
  const [resolution, setResolution] = useState({
    resolutionType: "",
    resolution: "",
    replacementOrderId: "",
  });

  // Fetch non-adapts
  const { data: nonAdapts, isLoading: loadingNonAdapts } = useQuery<NonAdapt[]>({
    queryKey: ["/api/non-adapts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/non-adapts");
      return await response.json();
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery<NonAdaptStats>({
    queryKey: ["/api/stats/non-adapts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stats/non-adapts");
      return await response.json();
    },
  });

  // Create non-adapt mutation
  const createNonAdapt = useMutation({
    mutationFn: async (data: typeof newNonAdapt) => {
      const response = await apiRequest("POST", "/api/non-adapts", {
        ...data,
        reportedBy: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-adapts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/non-adapts"] });
      toast({
        title: "Non-Adapt Reported",
        description: "The non-adapt case has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewNonAdapt({
        orderId: "",
        patientFeedback: "",
        symptoms: [],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create non-adapt",
        variant: "destructive",
      });
    },
  });

  // Update non-adapt status mutation
  const updateNonAdaptStatus = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof resolution }) => {
      const response = await apiRequest("PATCH", `/api/non-adapts/${id}/status`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/non-adapts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/non-adapts"] });
      toast({
        title: "Non-Adapt Resolved",
        description: "The non-adapt case has been resolved successfully.",
      });
      setIsResolveDialogOpen(false);
      setSelectedNonAdapt(null);
      setResolution({ resolutionType: "", resolution: "", replacementOrderId: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve non-adapt",
        variant: "destructive",
      });
    },
  });

  const handleCreateNonAdapt = () => {
    createNonAdapt.mutate(newNonAdapt);
  };

  const handleResolveNonAdapt = () => {
    if (selectedNonAdapt) {
      updateNonAdaptStatus.mutate({ id: selectedNonAdapt.id, data: resolution });
    }
  };

  const openResolveDialog = (nonAdapt: NonAdapt) => {
    setSelectedNonAdapt(nonAdapt);
    setResolution({
      resolutionType: nonAdapt.resolutionType || "",
      resolution: nonAdapt.resolution || "",
      replacementOrderId: nonAdapt.replacementOrderId || "",
    });
    setIsResolveDialogOpen(true);
  };

  const toggleSymptom = (symptom: string) => {
    setNewNonAdapt((prev) => {
      const symptoms = prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom];
      return { ...prev, symptoms };
    });
  };

  const filteredNonAdapts = nonAdapts?.filter((nonAdapt) => {
    const matchesSearch =
      nonAdapt.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nonAdapt.patientFeedback.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !nonAdapt.resolvedAt) ||
      (statusFilter === "resolved" && nonAdapt.resolvedAt);
    return matchesSearch && matchesStatus;
  });

  if (loadingNonAdapts) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading non-adapts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Non-Adapts Tracking</h1>
          <p className="text-muted-foreground">
            Track and resolve lens adaptation issues
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Non-Adapt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Non-Adapt Case</DialogTitle>
              <DialogDescription>
                Document a lens adaptation issue reported by a patient
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Order ID *</Label>
                <Input
                  placeholder="Enter order ID"
                  value={newNonAdapt.orderId}
                  onChange={(e) => setNewNonAdapt({ ...newNonAdapt, orderId: e.target.value })}
                />
              </div>
              <div>
                <Label>Patient Feedback *</Label>
                <Textarea
                  placeholder="Describe the patient's complaints and feedback"
                  value={newNonAdapt.patientFeedback}
                  onChange={(e) => setNewNonAdapt({ ...newNonAdapt, patientFeedback: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label>Symptoms (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {SYMPTOM_OPTIONS.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={newNonAdapt.symptoms.includes(symptom)}
                        onCheckedChange={() => toggleSymptom(symptom)}
                      />
                      <Label htmlFor={symptom} className="font-normal cursor-pointer">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateNonAdapt}
                disabled={!newNonAdapt.orderId || !newNonAdapt.patientFeedback || newNonAdapt.symptoms.length === 0}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Non-Adapt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Total Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalNonAdapts}</p>
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
              <p className="text-2xl font-bold">{stats.pendingNonAdapts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.resolvedNonAdapts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Avg. Resolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.averageResolutionTime}h</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Non-Adapts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Non-Adapt Cases
          </CardTitle>
          <CardDescription>All reported lens adaptation issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or feedback..."
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
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Symptoms</TableHead>
                <TableHead>Patient Feedback</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNonAdapts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No non-adapt cases found
                  </TableCell>
                </TableRow>
              ) : (
                filteredNonAdapts?.map((nonAdapt) => (
                  <TableRow key={nonAdapt.id}>
                    <TableCell className="font-medium">{nonAdapt.orderId}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {nonAdapt.symptoms.slice(0, 2).map((symptom) => (
                          <Badge key={symptom} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                        {nonAdapt.symptoms.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{nonAdapt.symptoms.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{nonAdapt.patientFeedback}</TableCell>
                    <TableCell>
                      {nonAdapt.resolvedAt ? (
                        <Badge className="bg-green-500">Resolved</Badge>
                      ) : (
                        <Badge className="bg-yellow-500">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(nonAdapt.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {!nonAdapt.resolvedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openResolveDialog(nonAdapt)}
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Non-Adapt Case</DialogTitle>
            <DialogDescription>
              Document the resolution for this adaptation issue
            </DialogDescription>
          </DialogHeader>
          {selectedNonAdapt && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Order ID</Label>
                <p className="font-medium">{selectedNonAdapt.orderId}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Patient Feedback</Label>
                <p className="text-sm">{selectedNonAdapt.patientFeedback}</p>
              </div>
              <div>
                <Label>Resolution Type *</Label>
                <Select
                  value={resolution.resolutionType}
                  onValueChange={(value) => setResolution({ ...resolution, resolutionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resolution Details *</Label>
                <Textarea
                  placeholder="Describe the resolution and actions taken"
                  value={resolution.resolution}
                  onChange={(e) => setResolution({ ...resolution, resolution: e.target.value })}
                  rows={3}
                />
              </div>
              {resolution.resolutionType === "remake" && (
                <div>
                  <Label>Replacement Order ID (Optional)</Label>
                  <Input
                    placeholder="Enter replacement order ID if applicable"
                    value={resolution.replacementOrderId}
                    onChange={(e) => setResolution({ ...resolution, replacementOrderId: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolveNonAdapt}
              disabled={!resolution.resolutionType || !resolution.resolution}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
