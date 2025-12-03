/**
 * Enhanced Prescriptions Page
 *
 * Improvements over original PrescriptionsPage.tsx:
 * - DataTableAdvanced with pagination, sorting, filtering
 * - Bulk actions (bulk email, bulk PDF download)
 * - Advanced filters (status, date range)
 * - CSV export
 * - Row selection
 * - Animations with framer-motion
 * - Better loading states
 * - Row actions dropdown
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Mail,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EmptyState } from "@/components/EmptyState";
import {
  DataTableAdvanced,
  DataTableColumnHeader,
  DataTableRowActions
} from "@/components/ui/DataTableAdvanced";
import { pageVariants } from "@/lib/animations";
import { StaggeredList, StaggeredItem } from "@/components/ui/AnimatedComponents";

interface Prescription {
  id: string;
  issueDate: Date;
  expiryDate: Date | null;
  odSphere: string | null;
  odCylinder: string | null;
  odAxis: string | null;
  odAdd: string | null;
  osSphere: string | null;
  osCylinder: string | null;
  osAxis: string | null;
  osAdd: string | null;
  pd: string | null;
  isSigned: boolean;
  signedAt: Date | null;
  patient: {
    name: string;
    email: string | null;
  };
}

export default function PrescriptionsPageEnhanced() {
  const { toast } = useToast();

  const { data: prescriptions, isLoading, error, refetch } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });

  // Bulk PDF download mutation
  const bulkDownloadPdfMutation = useMutation({
    mutationFn: async (prescriptionIds: string[]) => {
      // Download PDFs for multiple prescriptions
      for (const id of prescriptionIds) {
        const response = await fetch(`/api/prescriptions/${id}/pdf`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/pdf",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to download PDF for prescription ${id}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prescription-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Small delay between downloads to avoid overwhelming browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    },
    onSuccess: (_, prescriptionIds) => {
      toast({
        title: "PDFs Downloaded",
        description: `Downloaded ${prescriptionIds.length} prescription PDF(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download PDFs",
        variant: "destructive",
      });
    },
  });

  // Bulk email mutation
  const bulkEmailMutation = useMutation({
    mutationFn: async (prescriptionIds: string[]) => {
      // API call to send bulk emails
      const response = await apiRequest("POST", "/api/prescriptions/bulk/email", {
        prescriptionIds,
      });
      return await response.json();
    },
    onSuccess: (_, prescriptionIds) => {
      toast({
        title: "Emails Sent",
        description: `Sent ${prescriptionIds.length} prescription email(s)`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send bulk emails",
        variant: "destructive",
      });
    },
  });

  // Single PDF download mutation
  const downloadPdfMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/prescriptions/${id}/pdf`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/pdf",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to download PDF" }));
        throw new Error(errorData.message || "Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "PDF Downloaded",
        description: "The prescription PDF has been downloaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download PDF",
        variant: "destructive",
      });
    },
  });

  // Single email mutation
  const emailMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/prescriptions/${id}/email`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "The prescription has been emailed to the patient.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    },
  });

  // Delete prescription mutation
  const deletePrescriptionMutation = useMutation({
    mutationFn: async (prescriptionId: string) => {
      const response = await apiRequest("DELETE", `/api/prescriptions/${prescriptionId}`);
      if (!response.ok) throw new Error("Failed to delete prescription");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Prescription deleted",
        description: "Prescription has been deleted successfully",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
    },
  });

  // Define columns
  const columns: ColumnDef<Prescription>[] = [
    {
      accessorKey: "patient.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Patient Name" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.patient.name}</div>
          {row.original.patient.email && (
            <div className="text-sm text-muted-foreground">
              {row.original.patient.email}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Issue Date" />,
      cell: ({ row }) => format(new Date(row.getValue("issueDate")), "dd/MM/yyyy"),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry Date" />,
      cell: ({ row }) => {
        const expiry = row.getValue("expiryDate") as Date | null;
        return expiry ? format(new Date(expiry), "dd/MM/yyyy") : "—";
      },
    },
    {
      accessorKey: "odSphere",
      header: "Right Eye (OD)",
      cell: ({ row }) => (
        <div className="text-sm font-mono">
          <div>SPH: {row.original.odSphere || "—"}</div>
          <div>CYL: {row.original.odCylinder || "—"}</div>
        </div>
      ),
    },
    {
      accessorKey: "osSphere",
      header: "Left Eye (OS)",
      cell: ({ row }) => (
        <div className="text-sm font-mono">
          <div>SPH: {row.original.osSphere || "—"}</div>
          <div>CYL: {row.original.osCylinder || "—"}</div>
        </div>
      ),
    },
    {
      accessorKey: "isSigned",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isSigned = row.getValue("isSigned") as boolean;
        return isSigned ? (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Signed
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Unsigned
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === "signed") {
          return row.getValue(id) === true;
        }
        if (value === "unsigned") {
          return row.getValue(id) === false;
        }
        return true;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const prescription = row.original;
        return (
          <DataTableRowActions
            actions={[
              {
                label: "Download PDF",
                icon: <Download className="h-4 w-4" />,
                onClick: () => downloadPdfMutation.mutate(prescription.id),
              },
              ...(prescription.patient.email && prescription.isSigned ? [{
                label: "Email to Patient",
                icon: <Mail className="h-4 w-4" />,
                onClick: () => emailMutation.mutate(prescription.id),
              }] : []),
              {
                label: "View Details",
                icon: <Eye className="h-4 w-4" />,
                onClick: () => {
                  window.location.href = `/prescriptions/${prescription.id}`;
                },
              },
              {
                label: "Delete",
                icon: <Trash2 className="h-4 w-4" />,
                variant: "destructive" as const,
                onClick: () => {
                  if (confirm(`Are you sure you want to delete this prescription?`)) {
                    deletePrescriptionMutation.mutate(prescription.id);
                  }
                },
              },
            ]}
          />
        );
      },
    },
  ];

  if (error) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage optical prescriptions
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={FileText}
              title="Error loading prescriptions"
              description="We couldn't load your prescriptions. Please try again."
              action={{
                label: "Retry",
                onClick: () => refetch(),
              }}
            />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage optical prescriptions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {prescriptions && prescriptions.length > 0 && (
        <StaggeredList className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StaggeredItem>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prescriptions.length}</div>
              </CardContent>
            </Card>
          </StaggeredItem>

          <StaggeredItem>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Signed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {prescriptions.filter(p => p.isSigned).length}
                </div>
              </CardContent>
            </Card>
          </StaggeredItem>

          <StaggeredItem>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unsigned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {prescriptions.filter(p => !p.isSigned).length}
                </div>
              </CardContent>
            </Card>
          </StaggeredItem>
        </StaggeredList>
      )}

      {/* Advanced DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Prescriptions</CardTitle>
          <CardDescription>
            View and manage optical prescriptions with advanced filtering and bulk actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!prescriptions || prescriptions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No prescriptions yet"
              description="Prescriptions will appear here after eye examinations"
            />
          ) : (
            <DataTableAdvanced
              data={prescriptions}
              columns={columns}
              enableFiltering
              enableRowSelection
              enableExport
              enableColumnVisibility
              globalFilterPlaceholder="Search by patient name, email..."
              filterConfigs={[
                {
                  column: "isSigned",
                  label: "Status",
                  type: "select",
                  options: [
                    { label: "Signed", value: "signed" },
                    { label: "Unsigned", value: "unsigned" },
                  ],
                },
              ]}
              bulkActions={[
                {
                  label: "Download PDFs",
                  icon: <Download className="h-4 w-4" />,
                  onClick: (selectedPrescriptions) => {
                    const prescriptionIds = selectedPrescriptions.map(p => p.id);
                    bulkDownloadPdfMutation.mutate(prescriptionIds);
                  },
                },
                {
                  label: "Email to Patients",
                  icon: <Mail className="h-4 w-4" />,
                  onClick: (selectedPrescriptions) => {
                    const signedWithEmail = selectedPrescriptions.filter(
                      p => p.isSigned && p.patient.email
                    );

                    if (signedWithEmail.length === 0) {
                      toast({
                        title: "No emails to send",
                        description: "Selected prescriptions must be signed and have patient emails",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (signedWithEmail.length < selectedPrescriptions.length) {
                      toast({
                        title: "Warning",
                        description: `Only ${signedWithEmail.length} of ${selectedPrescriptions.length} prescriptions can be emailed (must be signed with email)`,
                      });
                    }

                    const prescriptionIds = signedWithEmail.map(p => p.id);
                    bulkEmailMutation.mutate(prescriptionIds);
                  },
                },
              ]}
              exportFileName="prescriptions"
              pageSize={20}
              pageSizeOptions={[10, 20, 50, 100]}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
