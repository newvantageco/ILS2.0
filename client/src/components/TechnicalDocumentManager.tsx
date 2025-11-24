import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TechnicalDoc {
  id: string;
  documentType: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  materialName: string | null;
  uploadedAt: string;
}

const uploadSchema = z.object({
  documentType: z.enum(["spec_sheet", "certificate", "sds", "compliance", "other"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  fileUrl: z.string().url("Valid file URL is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().optional(),
  materialName: z.string().optional(),
});

function UploadDocumentDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      documentType: "spec_sheet" as const,
      title: "",
      description: "",
      fileUrl: "",
      fileName: "",
      materialName: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof uploadSchema>) => {
      const response = await apiRequest("POST", "/api/technical-documents", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technical-documents"] });
      toast({
        title: "Document uploaded",
        description: "The technical document has been uploaded successfully.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error uploading document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof uploadSchema>) => {
    uploadMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-upload-document">
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Upload Technical Document</DialogTitle>
              <DialogDescription>
                Upload technical specifications, certificates, or compliance documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-document-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="spec_sheet">Specification Sheet</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="sds">Safety Data Sheet (SDS)</SelectItem>
                        <SelectItem value="compliance">Compliance Document</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Document title" data-testid="input-doc-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materialName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Name (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Polycarbonate 1.59 Index" data-testid="input-material-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Additional details about this document" data-testid="input-doc-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/document.pdf" data-testid="input-file-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="document.pdf" data-testid="input-file-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending} data-testid="button-save-document">
                {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function TechnicalDocumentManager() {
  const { toast } = useToast();

  const { data: documents, isLoading } = useQuery<TechnicalDoc[]>({
    queryKey: ["/api/technical-documents"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/technical-documents/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technical-documents"] });
      toast({
        title: "Document deleted",
        description: "The technical document has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      spec_sheet: "bg-blue-500",
      certificate: "bg-green-500",
      sds: "bg-orange-500",
      compliance: "bg-purple-500",
      other: "bg-gray-500",
    };
    return colors[type] || colors.other;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>Technical Document Library</CardTitle>
        <UploadDocumentDialog />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : documents && documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} data-testid={`row-doc-${doc.id}`}>
                  <TableCell>
                    <Badge className={`${getDocumentTypeBadge(doc.documentType)} text-white`}>
                      {doc.documentType.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium" data-testid={`text-doc-title-${doc.id}`}>
                    {doc.title}
                  </TableCell>
                  <TableCell data-testid={`text-material-${doc.id}`}>
                    {doc.materialName || "-"}
                  </TableCell>
                  <TableCell data-testid={`text-filename-${doc.id}`}>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {doc.fileName}
                    </a>
                  </TableCell>
                  <TableCell data-testid={`text-uploaded-${doc.id}`}>
                    {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-doc-${doc.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-documents">
            No technical documents uploaded yet. Click &ldquo;Upload Document&rdquo; to add specifications, certificates, or compliance documents.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
