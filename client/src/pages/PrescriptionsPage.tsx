import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileText, 
  Download,
  Mail,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

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

export default function PrescriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });

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
        description: error.message || "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

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
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredPrescriptions = prescriptions?.filter((prescription) => {
    const query = searchQuery.toLowerCase();
    return prescription.patient.name.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage optical prescriptions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle className="flex-1">All Prescriptions</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-prescriptions"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredPrescriptions || filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No prescriptions found" : "No prescriptions yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Prescriptions will appear here after eye examinations"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Right Eye (OD)</TableHead>
                    <TableHead>Left Eye (OS)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id} data-testid={`row-prescription-${prescription.id}`}>
                      <TableCell className="font-medium">
                        <div>
                          <div data-testid={`text-prescription-patient-${prescription.id}`}>
                            {prescription.patient.name}
                          </div>
                          {prescription.patient.email && (
                            <div className="text-sm text-muted-foreground">
                              {prescription.patient.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(prescription.issueDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {prescription.expiryDate
                          ? format(new Date(prescription.expiryDate), "dd/MM/yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          <div>SPH: {prescription.odSphere || "—"}</div>
                          <div>CYL: {prescription.odCylinder || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          <div>SPH: {prescription.osSphere || "—"}</div>
                          <div>CYL: {prescription.osCylinder || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {prescription.isSigned ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Unsigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPdfMutation.mutate(prescription.id)}
                            disabled={downloadPdfMutation.isPending}
                            data-testid={`button-download-pdf-${prescription.id}`}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          {prescription.patient.email && prescription.isSigned && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => emailMutation.mutate(prescription.id)}
                              disabled={emailMutation.isPending}
                              data-testid={`button-email-prescription-${prescription.id}`}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredPrescriptions && filteredPrescriptions.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredPrescriptions.length} of {prescriptions?.length} prescriptions
        </div>
      )}
    </div>
  );
}
