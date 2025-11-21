import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Mail, 
  FileText,
  Copy,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface EmailTemplate {
  id: string;
  name: string;
  emailType: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
}

const EMAIL_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "prescription_reminder", label: "Prescription Reminder" },
  { value: "recall_notification", label: "Recall Notification" },
  { value: "appointment_reminder", label: "Appointment Reminder" },
  { value: "order_confirmation", label: "Order Confirmation" },
  { value: "order_update", label: "Order Update" },
  { value: "marketing", label: "Marketing" },
  { value: "general", label: "General" },
];

const COMMON_VARIABLES = [
  { name: "patientName", description: "Patient's full name" },
  { name: "customerName", description: "Customer's name" },
  { name: "prescriptionExpiry", description: "Prescription expiry date" },
  { name: "doctorName", description: "Doctor's name" },
  { name: "clinicPhone", description: "Clinic phone number" },
  { name: "clinicEmail", description: "Clinic email address" },
  { name: "companyName", description: "Company name" },
  { name: "appointmentDate", label: "Appointment date" },
  { name: "invoiceNumber", description: "Invoice number" },
  { name: "orderNumber", description: "Order number" },
  { name: "totalAmount", description: "Total amount" },
  { name: "lastVisitDate", description: "Last visit date" },
];

export default function EmailTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    emailType: "general",
    subject: "",
    htmlContent: "",
    textContent: "",
    variables: [] as string[],
    isDefault: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/emails/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      emailType: "general",
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: [],
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      emailType: template.emailType,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent || "",
      variables: template.variables || [],
      isDefault: template.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingTemplate
        ? `/api/emails/templates/${editingTemplate.id}`
        : "/api/emails/templates";
      
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save template");
      }

      toast({
        title: "Success",
        description: `Template ${editingTemplate ? "updated" : "created"} successfully`,
      });

      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/emails/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      fetchTemplates();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="htmlContent"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.htmlContent;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const variableText = `{{${variable}}}`;

    setFormData({
      ...formData,
      htmlContent: before + variableText + after,
    });

    // Update variables array
    if (!formData.variables.includes(variable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variable],
      }));
    }

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  };

  const copyToSubject = (variable: string) => {
    setFormData({
      ...formData,
      subject: formData.subject + ` {{${variable}}}`,
    });
    
    if (!formData.variables.includes(variable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variable],
      }));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 mt-1">Manage reusable email templates with variables</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {EMAIL_TYPES.find(t => t.value === template.emailType)?.label || template.emailType}
                    </CardDescription>
                  </div>
                  {template.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Subject:</p>
                    <p className="text-sm text-gray-600 truncate">{template.subject}</p>
                  </div>
                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No templates created yet</p>
              <Button onClick={handleCreate} className="mt-4">
                Create Your First Template
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              Use variables like {`{{variableName}}`} in your content
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
            {/* Form Section */}
            <div className="col-span-2 overflow-y-auto space-y-4 pr-2">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>

              <div>
                <Label htmlFor="emailType">Email Type</Label>
                <Select
                  value={formData.emailType}
                  onValueChange={(value) => setFormData({ ...formData, emailType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Welcome {{customerName}}!"
                />
              </div>

              <div>
                <Label htmlFor="htmlContent">HTML Content</Label>
                <Textarea
                  id="htmlContent"
                  name="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  placeholder="<h1>Hello {{customerName}}</h1><p>Welcome to our practice!</p>"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
                <Textarea
                  id="textContent"
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  placeholder="Hello {{customerName}}, Welcome to our practice!"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDefault: checked as boolean })
                  }
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Set as default template for this email type
                </Label>
              </div>
            </div>

            {/* Variable Picker Section */}
            <div className="border-l pl-4 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-3">Available Variables</h3>
              <ScrollArea className="h-[calc(100%-2rem)]">
                <div className="space-y-2">
                  {COMMON_VARIABLES.map((variable) => (
                    <div
                      key={variable.name}
                      className="p-2 border rounded hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <code className="text-xs font-mono text-blue-600">
                          {`{{${variable.name}}}`}
                        </code>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => insertVariable(variable.name)}
                            title="Insert into content"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToSubject(variable.name)}
                            title="Add to subject"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{variable.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editingTemplate ? "Update" : "Create"} Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              {previewTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm text-gray-700 mt-1">{previewTemplate.subject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">HTML Content</Label>
                  <div
                    className="mt-2 p-4 border rounded bg-white"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewTemplate.htmlContent) }}
                  />
                </div>
                {previewTemplate.textContent && (
                  <div>
                    <Label className="text-sm font-medium">Plain Text</Label>
                    <pre className="mt-2 p-4 border rounded bg-gray-50 text-sm whitespace-pre-wrap">
                      {previewTemplate.textContent}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
