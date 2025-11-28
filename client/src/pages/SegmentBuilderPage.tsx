import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Users,
  Plus,
  X,
  Eye,
  Edit,
  Trash2,
  Filter,
  Save,
  AlertCircle,
  Target,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager'];

interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: FilterCriteria;
  patientCount?: number;
  createdAt: string;
  updatedAt?: string;
}

interface FilterCriteria {
  filters: Filter[];
  logic: 'AND' | 'OR';
}

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string | number;
}

const FILTER_FIELDS = [
  { value: 'age', label: 'Age', type: 'number' },
  { value: 'lastVisit', label: 'Last Visit', type: 'date' },
  { value: 'totalSpent', label: 'Total Spent', type: 'number' },
  { value: 'hasEmail', label: 'Has Email', type: 'boolean' },
  { value: 'hasPhone', label: 'Has Phone', type: 'boolean' },
  { value: 'recallDue', label: 'Recall Due', type: 'boolean' },
  { value: 'appointmentStatus', label: 'Appointment Status', type: 'select' },
];

const OPERATORS = {
  number: [
    { value: 'eq', label: 'equals' },
    { value: 'gt', label: 'greater than' },
    { value: 'lt', label: 'less than' },
    { value: 'gte', label: 'greater than or equal' },
    { value: 'lte', label: 'less than or equal' },
  ],
  date: [
    { value: 'after', label: 'after' },
    { value: 'before', label: 'before' },
    { value: 'within', label: 'within last (days)' },
  ],
  boolean: [
    { value: 'is', label: 'is' },
  ],
  select: [
    { value: 'is', label: 'is' },
    { value: 'not', label: 'is not' },
  ],
};

export default function SegmentBuilderPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showDialog, setShowDialog] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to manage segments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch segments
  const { data: segmentsData, isLoading: segmentsLoading } = useQuery({
    queryKey: ['/api/communications/segments'],
    queryFn: async () => {
      const res = await fetch('/api/communications/segments', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch segments');
      return res.json();
    },
  });

  const segments: Segment[] = segmentsData?.segments || [];

  // Preview segment
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['/api/communications/segments/preview', filters, logic],
    queryFn: async () => {
      const res = await fetch('/api/communications/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ criteria: { filters, logic } }),
      });
      if (!res.ok) throw new Error('Failed to preview');
      return res.json();
    },
    enabled: filters.length > 0,
  });

  const previewCount = previewData?.count || 0;
  const previewPatients = previewData?.patients || [];

  // Create segment mutation
  const createMutation = useMutation({
    mutationFn: async (segment: { name: string; description: string; criteria: FilterCriteria }) => {
      const res = await fetch('/api/communications/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(segment),
      });
      if (!res.ok) throw new Error('Failed to create segment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/segments'] });
      toast({ title: "Segment Created", description: "Patient segment has been saved." });
      resetForm();
      setShowDialog(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create segment.", variant: "destructive" });
    },
  });

  // Update segment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, segment }: { id: string; segment: { name: string; description: string; criteria: FilterCriteria } }) => {
      const res = await fetch(`/api/communications/segments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(segment),
      });
      if (!res.ok) throw new Error('Failed to update segment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/segments'] });
      toast({ title: "Segment Updated", description: "Changes have been saved." });
      resetForm();
      setShowDialog(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update segment.", variant: "destructive" });
    },
  });

  // Delete segment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/communications/segments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete segment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/segments'] });
      toast({ title: "Segment Deleted", description: "Segment has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete segment.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setFilters([]);
    setLogic('AND');
    setEditingSegment(null);
  };

  const handleNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setName(segment.name);
    setDescription(segment.description);
    setFilters(segment.criteria.filters);
    setLogic(segment.criteria.logic);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter a segment name.", variant: "destructive" });
      return;
    }

    if (filters.length === 0) {
      toast({ title: "Filters Required", description: "Please add at least one filter.", variant: "destructive" });
      return;
    }

    const segment = {
      name,
      description,
      criteria: { filters, logic },
    };

    if (editingSegment) {
      updateMutation.mutate({ id: editingSegment.id, segment });
    } else {
      createMutation.mutate(segment);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { id: Date.now().toString(), field: 'age', operator: 'gt', value: '' }]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const getFieldType = (field: string) => {
    return FILTER_FIELDS.find(f => f.value === field)?.type || 'number';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-purple-600" />
            Patient Segments
          </h1>
          <p className="text-muted-foreground">
            Create and manage targeted patient audiences
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Segment
        </Button>
      </div>

      {/* Segments List */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Segments</CardTitle>
          <CardDescription>Reusable patient audiences for campaigns and messaging</CardDescription>
        </CardHeader>
        <CardContent>
          {segmentsLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : segments.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No segments yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first patient segment to target specific audiences
              </p>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">{segment.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{segment.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {segment.criteria.filters.length} filter{segment.criteria.filters.length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {segment.patientCount !== undefined ? (
                        <Badge>{segment.patientCount.toLocaleString()}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(segment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this segment?')) {
                              deleteMutation.mutate(segment.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Segment Builder Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSegment ? 'Edit Segment' : 'Create New Segment'}
            </DialogTitle>
            <DialogDescription>
              Define criteria to target specific patient groups
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name & Description */}
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input
                placeholder="e.g., High-value patients"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Filter Logic */}
            <div className="space-y-2">
              <Label>Match Logic</Label>
              <Select value={logic} onValueChange={(v: 'AND' | 'OR') => setLogic(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">Match ALL filters (AND)</SelectItem>
                  <SelectItem value="OR">Match ANY filter (OR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Filters</Label>
                <Button variant="outline" size="sm" onClick={addFilter}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </div>

              {filters.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No filters yet. Add filters to define your segment.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filters.map((filter, idx) => {
                    const fieldType = getFieldType(filter.field);
                    const operators = OPERATORS[fieldType as keyof typeof OPERATORS] || OPERATORS.number;

                    return (
                      <div key={filter.id} className="flex items-center gap-2 p-3 border rounded-lg">
                        {idx > 0 && (
                          <Badge variant="outline" className="mr-2">
                            {logic}
                          </Badge>
                        )}

                        <Select
                          value={filter.field}
                          onValueChange={(value) => updateFilter(filter.id, { field: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FILTER_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operators.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {fieldType === 'boolean' ? (
                          <Select
                            value={filter.value.toString()}
                            onValueChange={(value) => updateFilter(filter.id, { value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={fieldType === 'number' ? 'number' : 'text'}
                            placeholder="Value..."
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            className="flex-1"
                          />
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(filter.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Preview */}
            {filters.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Preview</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchPreview()}
                    disabled={previewLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${previewLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {previewLoading ? 'Calculating...' : `${previewCount.toLocaleString()} patients`}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Match the selected criteria
                </p>
                {previewCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Patients
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Segment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Patients Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Segment Preview</DialogTitle>
            <DialogDescription>
              {previewCount} patient{previewCount !== 1 ? 's' : ''} match the criteria
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewPatients.map((patient: any) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.email || patient.phone || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
