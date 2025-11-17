import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { createOptimisticHandlers, optimisticArrayUpdate, optimisticAdd, optimisticRemove } from "@/lib/optimisticUpdates";
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
import { Search, FileText, Plus, Copy, Trash2, Star, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionTemplate {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  sphere: number;
  cylinder: number;
  axis: number;
  addition?: number;
  prism?: number;
  prismDirection?: string;
  pupillaryDistance?: number;
  lensType: string;
  lensIndex: string;
  coating?: string;
  usageCount: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

const LENS_TYPES = [
  { value: "single_vision", label: "Single Vision" },
  { value: "bifocal", label: "Bifocal" },
  { value: "progressive", label: "Progressive" },
  { value: "reading", label: "Reading" },
];

const LENS_INDICES = [
  { value: "1.5", label: "1.5 Standard" },
  { value: "1.56", label: "1.56 Mid-Index" },
  { value: "1.6", label: "1.6 High-Index" },
  { value: "1.67", label: "1.67 High-Index" },
  { value: "1.74", label: "1.74 Ultra High-Index" },
];

const COATINGS = [
  { value: "none", label: "None" },
  { value: "anti_reflective", label: "Anti-Reflective" },
  { value: "scratch_resistant", label: "Scratch-Resistant" },
  { value: "uv_protection", label: "UV Protection" },
  { value: "blue_light", label: "Blue Light Filter" },
  { value: "photochromic", label: "Photochromic" },
  { value: "premium_ar", label: "Premium AR Package" },
];

export default function PrescriptionTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrescriptionTemplate | null>(null);
  
  // Form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    sphere: 0,
    cylinder: 0,
    axis: 0,
    addition: 0,
    prism: 0,
    prismDirection: "",
    pupillaryDistance: 62,
    lensType: "single_vision",
    lensIndex: "1.5",
    coating: "none",
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery<PrescriptionTemplate[]>({
    queryKey: ["/api/ecp/prescription-templates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ecp/prescription-templates");
      return await response.json();
    },
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      const response = await apiRequest("POST", "/api/ecp/prescription-templates", data);
      return await response.json();
    },
    ...createOptimisticHandlers<any[], typeof templateForm>({
      queryKey: ["/api/ecp/prescription-templates"],
      updater: (oldData, variables) => {
        const newTemplate = {
          id: `temp-${Date.now()}`,
          ...variables,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return optimisticAdd(oldData, newTemplate) || [];
      },
      successMessage: "Template Created",
      errorMessage: "Failed to create template",
    }),
    onSuccess: () => {
      resetForm();
      setIsCreateDialogOpen(false);
    },
  });

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof templateForm }) => {
      const response = await apiRequest("PUT", `/api/ecp/prescription-templates/${id}`, data);
      return await response.json();
    },
    ...createOptimisticHandlers<any[], { id: string; data: typeof templateForm }>({
      queryKey: ["/api/ecp/prescription-templates"],
      updater: (oldData, variables) => {
        return optimisticArrayUpdate(oldData, variables.id, (template) => ({
          ...template,
          ...variables.data,
          updatedAt: new Date().toISOString(),
        })) || [];
      },
      successMessage: "Template Updated",
      errorMessage: "Failed to update template",
    }),
    onSuccess: () => {
      resetForm();
      setEditingTemplate(null);
      setIsCreateDialogOpen(false);
    },
  });

  // Use template mutation (increments usage count)
  const useTemplate = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/ecp/prescription-templates/${id}/use`, {});
      return await response.json();
    },
    ...createOptimisticHandlers<any[], string>({
      queryKey: ["/api/ecp/prescription-templates"],
      updater: (oldData, templateId) => {
        return optimisticArrayUpdate(oldData, templateId, (template) => ({
          ...template,
          usageCount: (template.usageCount || 0) + 1,
          lastUsed: new Date().toISOString(),
        })) || [];
      },
      successMessage: "Template applied",
      errorMessage: "Failed to apply template",
    }),
  });

  const resetForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      sphere: 0,
      cylinder: 0,
      axis: 0,
      addition: 0,
      prism: 0,
      prismDirection: "",
      pupillaryDistance: 62,
      lensType: "single_vision",
      lensIndex: "1.5",
      coating: "none",
    });
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplate.mutate(templateForm);
    }
  };

  const openEditDialog = (template: PrescriptionTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      sphere: template.sphere,
      cylinder: template.cylinder,
      axis: template.axis,
      addition: template.addition || 0,
      prism: template.prism || 0,
      prismDirection: template.prismDirection || "",
      pupillaryDistance: template.pupillaryDistance || 62,
      lensType: template.lensType,
      lensIndex: template.lensIndex,
      coating: template.coating || "none",
    });
    setIsCreateDialogOpen(true);
  };

  const openDuplicateDialog = (template: PrescriptionTemplate) => {
    setEditingTemplate(null);
    setTemplateForm({
      name: `${template.name} (Copy)`,
      description: template.description || "",
      sphere: template.sphere,
      cylinder: template.cylinder,
      axis: template.axis,
      addition: template.addition || 0,
      prism: template.prism || 0,
      prismDirection: template.prismDirection || "",
      pupillaryDistance: template.pupillaryDistance || 62,
      lensType: template.lensType,
      lensIndex: template.lensIndex,
      coating: template.coating || "none",
    });
    setIsCreateDialogOpen(true);
  };

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescription Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable prescription templates for faster ordering
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingTemplate(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create Prescription Template"}
              </DialogTitle>
              <DialogDescription>
                Save frequently used prescription specifications for quick access
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Template Name *</Label>
                  <Input
                    placeholder="e.g., Standard Distance, Reading Glasses"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Optional description of this template"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Prescription Values</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Sphere (SPH)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={templateForm.sphere}
                      onChange={(e) => setTemplateForm({ ...templateForm, sphere: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Cylinder (CYL)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={templateForm.cylinder}
                      onChange={(e) => setTemplateForm({ ...templateForm, cylinder: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Axis</Label>
                    <Input
                      type="number"
                      min="0"
                      max="180"
                      value={templateForm.axis}
                      onChange={(e) => setTemplateForm({ ...templateForm, axis: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Addition (ADD)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={templateForm.addition}
                      onChange={(e) => setTemplateForm({ ...templateForm, addition: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Prism</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={templateForm.prism}
                      onChange={(e) => setTemplateForm({ ...templateForm, prism: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Prism Direction</Label>
                    <Input
                      placeholder="e.g., Base In/Out"
                      value={templateForm.prismDirection}
                      onChange={(e) => setTemplateForm({ ...templateForm, prismDirection: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Pupillary Distance (PD)</Label>
                    <Input
                      type="number"
                      value={templateForm.pupillaryDistance}
                      onChange={(e) => setTemplateForm({ ...templateForm, pupillaryDistance: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Lens Specifications</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Lens Type *</Label>
                    <Select value={templateForm.lensType} onValueChange={(value) => setTemplateForm({ ...templateForm, lensType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LENS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lens Index *</Label>
                    <Select value={templateForm.lensIndex} onValueChange={(value) => setTemplateForm({ ...templateForm, lensIndex: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LENS_INDICES.map((index) => (
                          <SelectItem key={index.value} value={index.value}>
                            {index.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Coating</Label>
                    <Select value={templateForm.coating} onValueChange={(value) => setTemplateForm({ ...templateForm, coating: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COATINGS.map((coating) => (
                          <SelectItem key={coating.value} value={coating.value}>
                            {coating.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
                setEditingTemplate(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!templateForm.name}>
                <FileText className="h-4 w-4 mr-2" />
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{templates?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Most Popular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium truncate">
              {templates?.reduce((prev, curr) => (curr.usageCount > prev.usageCount ? curr : prev), templates[0])?.name || "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {templates?.reduce((sum, t) => sum + t.usageCount, 0) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>Browse and manage your prescription templates</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prescription</TableHead>
                <TableHead>Lens Type</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <p>SPH: {template.sphere > 0 ? '+' : ''}{template.sphere}</p>
                        <p>CYL: {template.cylinder > 0 ? '+' : ''}{template.cylinder} | Axis: {template.axis}°</p>
                        {template.addition && template.addition > 0 && <p>ADD: +{template.addition}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {LENS_TYPES.find(t => t.value === template.lensType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span>{template.usageCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => useTemplate.mutate(template.id)}>
                          Use
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(template)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDuplicateDialog(template)}>
                          <Copy className="h-4 w-4" />
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
    </div>
  );
}
