import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  Users, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Edit,
  Save,
  Plus,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import {
  Dialog,
  DialogContent,
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

interface Company {
  id: string;
  name: string;
  type: 'dispenser' | 'supplier' | 'manufacturer' | 'other';
  registrationNumber: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: 'active' | 'inactive' | 'suspended';
  settings: any;
  createdAt: string;
  updatedAt: string;
}

interface CompanyRelationship {
  id: string;
  supplierId: string;
  dispenserId: string;
  status: 'pending' | 'approved' | 'rejected';
  supplierCompany: Company;
  dispenserCompany: Company;
  createdAt: string;
}

export default function CompanyManagementPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState<Partial<Company>>({});
  const [showNewRelationship, setShowNewRelationship] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch user's company
  const { data: currentUser } = useQuery<{ user: { companyId: string } }>({
    queryKey: ["/api/user"],
  });

  const { data: companyData } = useQuery<{ data: Company }>({
    queryKey: ["/api/companies", currentUser?.user?.companyId],
    enabled: !!currentUser?.user?.companyId,
  });

  // Fetch supplier relationships (for dispensers)
  const { data: supplierRelationships } = useQuery<{ data: CompanyRelationship[] }>({
    queryKey: ["/api/companies/relationships/suppliers"],
  });

  // Fetch dispenser relationships (for suppliers)
  const { data: dispenserRelationships } = useQuery<{ data: CompanyRelationship[] }>({
    queryKey: ["/api/companies/relationships/dispensers"],
  });

  // Fetch all suppliers (for adding new relationships)
  const { data: allSuppliers } = useQuery<Company[]>({
    queryKey: ["/api/companies", "type", "supplier"],
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      const response = await fetch(`/api/companies/${companyData?.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsEditing(false);
      setEditedCompany({});
    },
  });

  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await fetch(`/api/companies/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ supplierId }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies/relationships"] });
      setShowNewRelationship(false);
      setSelectedSupplier("");
    },
  });

  // Approve/reject relationship mutation
  const updateRelationshipMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const response = await fetch(`/api/companies/relationships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies/relationships"] });
    },
  });

  const company = companyData?.data;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedCompany(company || {});
  };

  const handleSave = () => {
    updateMutation.mutate(editedCompany);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-500',
      inactive: 'bg-gray-500',
      suspended: 'bg-red-500',
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      dispenser: 'Dispenser',
      supplier: 'Supplier',
      manufacturer: 'Manufacturer',
      other: 'Other',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Company Management
          </h1>
          <p className="text-muted-foreground">
            Manage your company profile and business relationships
          </p>
        </div>
      </div>

      {/* Company Profile Card */}
      {company && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Company Profile</CardTitle>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSave} size="sm" disabled={updateMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                {isEditing ? (
                  <Input
                    value={editedCompany.name || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany, name: e.target.value })}
                  />
                ) : (
                  <div className="text-lg font-medium">{company.name}</div>
                )}
              </div>

              <div>
                <Label>Type</Label>
                {isEditing ? (
                  <Select
                    value={editedCompany.type || company.type}
                    onValueChange={(value) => setEditedCompany({ ...editedCompany, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dispenser">Dispenser</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge>{getTypeLabel(company.type)}</Badge>
                )}
              </div>

              <div>
                <Label>Registration Number</Label>
                {isEditing ? (
                  <Input
                    value={editedCompany.registrationNumber || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany, registrationNumber: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{company.registrationNumber || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <Label>Status</Label>
                {isEditing ? (
                  <Select
                    value={editedCompany.status || company.status}
                    onValueChange={(value) => setEditedCompany({ ...editedCompany, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getStatusBadge(company.status)}>
                    {company.status.toUpperCase()}
                  </Badge>
                )}
              </div>

              <div>
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editedCompany.contactEmail || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany, contactEmail: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{company.contactEmail || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div>
                <Label>Phone</Label>
                {isEditing ? (
                  <Input
                    value={editedCompany.contactPhone || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany, contactPhone: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{company.contactPhone || 'Not set'}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Address</Label>
                {isEditing ? (
                  <Textarea
                    value={editedCompany.address || ''}
                    onChange={(e) => setEditedCompany({ ...editedCompany, address: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span>{company.address || 'Not set'}</span>
                  </div>
                )}
              </div>
            </div>

            {updateMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {updateMutation.error?.message || "Failed to update company"}
                </AlertDescription>
              </Alert>
            )}

            {updateMutation.isSuccess && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Company updated successfully!</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Supplier Relationships (for Dispensers) */}
      {company?.type === 'dispenser' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Supplier Relationships
              </CardTitle>
              <Dialog open={showNewRelationship} onOpenChange={setShowNewRelationship}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Supplier Relationship</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Supplier</Label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {allSuppliers?.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => createRelationshipMutation.mutate(selectedSupplier)}
                      disabled={!selectedSupplier || createRelationshipMutation.isPending}
                      className="w-full"
                    >
                      Send Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supplierRelationships?.data?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No supplier relationships yet
                </p>
              ) : (
                supplierRelationships?.data?.map((rel) => (
                  <div key={rel.id} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <div className="font-medium">{rel.supplierCompany.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {rel.supplierCompany.contactEmail}
                      </div>
                    </div>
                    <Badge className={getStatusBadge(rel.status)}>
                      {rel.status.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispenser Relationships (for Suppliers) */}
      {company?.type === 'supplier' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dispenser Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dispenserRelationships?.data?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No dispenser relationships yet
                </p>
              ) : (
                dispenserRelationships?.data?.map((rel) => (
                  <div key={rel.id} className="flex justify-between items-center p-4 border rounded">
                    <div>
                      <div className="font-medium">{rel.dispenserCompany.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {rel.dispenserCompany.contactEmail}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(rel.status)}>
                        {rel.status.toUpperCase()}
                      </Badge>
                      {rel.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateRelationshipMutation.mutate({ id: rel.id, status: 'approved' })}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateRelationshipMutation.mutate({ id: rel.id, status: 'rejected' })}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
