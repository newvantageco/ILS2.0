import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SupplierManagementDialog } from "./SupplierManagementDialog";
import type { User } from "@shared/schema";

type SupplierRecord = User & {
  accountNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: Record<string, unknown> | null;
};

export function SuppliersTable() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierRecord | null>(null);
  const { toast } = useToast();

  const { data: suppliers, isLoading } = useQuery<SupplierRecord[]>({
    queryKey: ["/api/suppliers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/suppliers/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Supplier deleted",
        description: "The supplier has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting supplier",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  };

  const handleEdit = (supplier: SupplierRecord) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDeleteClick = (supplier: SupplierRecord) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (supplierToDelete) {
      deleteMutation.mutate(supplierToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Suppliers</CardTitle>
          <Button onClick={handleAddNew} data-testid="button-add-supplier">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </CardHeader>
        <CardContent>
          {!suppliers || suppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No suppliers found. Add your first supplier to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell className="font-medium" data-testid={`text-org-name-${supplier.id}`}>
                      {supplier.organizationName || "N/A"}
                    </TableCell>
                    <TableCell data-testid={`text-account-number-${supplier.id}`}>
                      {supplier.accountNumber || "N/A"}
                    </TableCell>
                    <TableCell data-testid={`text-contact-email-${supplier.id}`}>
                      {supplier.contactEmail || supplier.email || "N/A"}
                    </TableCell>
                    <TableCell data-testid={`text-contact-phone-${supplier.id}`}>
                      {supplier.contactPhone || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                          data-testid={`button-edit-supplier-${supplier.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(supplier)}
                          data-testid={`button-delete-supplier-${supplier.id}`}
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

      <SupplierManagementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-supplier">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supplier "{supplierToDelete?.organizationName}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
