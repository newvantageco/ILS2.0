import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema, type InsertSupplier, type User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type SupplierRecord = User & {
  accountNumber?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: InsertSupplier["address"] | null;
};

interface SupplierManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierRecord | null;
}

export function SupplierManagementDialog({
  open,
  onOpenChange,
  supplier,
}: SupplierManagementDialogProps) {
  const { toast } = useToast();
  const isEditing = !!supplier;

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      organizationName: "",
      email: "",
      accountNumber: "",
      contactEmail: "",
      contactPhone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
    },
  });

  useEffect(() => {
    if (open && supplier) {
      form.reset({
        organizationName: supplier.organizationName || "",
        email: supplier.email || "",
        accountNumber: supplier.accountNumber || "",
        contactEmail: supplier.contactEmail || "",
        contactPhone: supplier.contactPhone || "",
        address: supplier.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
      });
    } else if (open && !supplier) {
      form.reset({
        organizationName: "",
        email: "",
        accountNumber: "",
        contactEmail: "",
        contactPhone: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
      });
    }
  }, [open, supplier, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Supplier created",
        description: "The supplier has been created successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating supplier",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("PATCH", `/api/suppliers/${supplier?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Supplier updated",
        description: "The supplier has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating supplier",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSupplier) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-supplier-management">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEditing ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the supplier information below."
              : "Enter the details for the new supplier."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ABC Lens Company"
                      data-testid="input-organization-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ACCT-12345"
                      data-testid="input-account-number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="supplier@example.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="orders@example.com"
                        data-testid="input-contact-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="(555) 123-4567"
                      data-testid="input-contact-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>Address</Label>
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Street Address"
                        data-testid="input-address-street"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="City"
                          data-testid="input-address-city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="State/Province"
                          data-testid="input-address-state"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Zip/Postal Code"
                          data-testid="input-address-zip"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Country"
                          data-testid="input-address-country"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-supplier"
              >
                {isEditing ? "Update Supplier" : "Add Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
