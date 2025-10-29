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
  Search,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient?: {
    name: string;
    email?: string;
  };
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paymentMethod?: "cash" | "card" | "insurance" | "credit";
  totalAmount: string;
  amountPaid: string;
  invoiceDate: string;
  lineItems: InvoiceLineItem[];
  createdAt: string;
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const downloadPdfMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invoices/${id}/pdf`, {
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
      
      // Get invoice number from the invoices list
      const invoice = invoices?.find(inv => inv.id === id);
      a.download = `invoice-${invoice?.invoiceNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "PDF Downloaded",
        description: "The invoice PDF has been downloaded.",
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
      const res = await apiRequest("POST", `/api/invoices/${id}/email`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send email");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "The invoice has been emailed to the patient.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices?.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.patient?.name.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

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

  const totalRevenue = invoices?.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0;
  const paidInvoices = invoices?.filter(inv => inv.status === "paid").length || 0;
  const pendingAmount = invoices?.filter(inv => inv.status !== "paid" && inv.status !== "cancelled")
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all sales invoices
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {invoices?.length || 0} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>All Invoices</CardTitle>
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-invoices"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredInvoices || filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No invoices found" : "No invoices yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Invoices will appear here after sales are completed"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.patient?.name || "N/A"}</div>
                          {invoice.patient?.email && (
                            <div className="text-xs text-muted-foreground">{invoice.patient.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${parseFloat(invoice.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)} variant="secondary">
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.paymentMethod ? (
                          <span className="capitalize">{invoice.paymentMethod}</span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPdfMutation.mutate(invoice.id)}
                            disabled={downloadPdfMutation.isPending}
                            data-testid={`button-download-pdf-${invoice.id}`}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          {invoice.patient?.email && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => emailMutation.mutate(invoice.id)}
                              disabled={emailMutation.isPending}
                              data-testid={`button-email-invoice-${invoice.id}`}
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

      {filteredInvoices && filteredInvoices.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredInvoices.length} of {invoices?.length} invoices
        </div>
      )}
    </div>
  );
}
