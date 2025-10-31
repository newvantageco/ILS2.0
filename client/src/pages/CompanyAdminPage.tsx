import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  Users, 
  Truck, 
  Settings, 
  Save,
  ShoppingCart,
  UserPlus,
  Loader2,
} from "lucide-react";
import ShopifyIntegrationSettings from "@/components/ShopifyIntegrationSettings";

interface Company {
  id: string;
  name: string;
  type: string;
  status: string;
  email: string;
  phone: string | null;
  website: string | null;
  address: any;
  subscriptionPlan: string;
  settings: any;
}

interface CompanyUser {
  id: string;
  email: string;
  name: string;
  role: string;
  accountStatus: string;
}

interface Supplier {
  id: string;
  name: string;
  status: string;
  approvedAt: Date | null;
}

export default function CompanyAdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    enhancedRole: "",
    gocNumber: "",
    contactPhone: "",
    gocRegistrationType: "",
    professionalQualifications: "",
  });

  // Fetch company profile
  const { data: company, isLoading: loadingCompany } = useQuery<Company>({
    queryKey: ["/api/company-admin/profile"],
  });

  // Fetch company users
  const { data: companyUsers, isLoading: loadingUsers } = useQuery<CompanyUser[]>({
    queryKey: ["/api/company-admin/users"],
  });

  // Fetch supplier relationships
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/company-admin/suppliers"],
  });

  const [companyForm, setCompanyForm] = useState({
    name: company?.name || "",
    email: company?.email || "",
    phone: company?.phone || "",
    website: company?.website || "",
    address: {
      street: company?.address?.street || "",
      city: company?.address?.city || "",
      postcode: company?.address?.postcode || "",
    },
  });

  // Update company profile mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/company-admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update company");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-admin/profile"] });
      toast({
        title: "Company Updated",
        description: "Company profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveCompany = () => {
    updateCompanyMutation.mutate(companyForm);
  };

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/company-admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add user");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-admin/users"] });
      setShowAddUserDialog(false);
      setNewUserForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        enhancedRole: "",
        gocNumber: "",
        contactPhone: "",
        gocRegistrationType: "",
        professionalQualifications: "",
      });
      toast({
        title: "User Added Successfully",
        description: `Temporary password: ${data.temporaryPassword}. Please share this securely with the user.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddUser = () => {
    if (!newUserForm.firstName || !newUserForm.lastName || !newUserForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in first name, last name, and email",
        variant: "destructive",
      });
      return;
    }

    if (!newUserForm.role && !newUserForm.enhancedRole) {
      toast({
        title: "Role Required",
        description: "Please select a role for the user",
        variant: "destructive",
      });
      return;
    }

    if ((newUserForm.enhancedRole === "optometrist" || newUserForm.role === "ecp") && !newUserForm.gocNumber) {
      toast({
        title: "GOC Number Required",
        description: "GOC registration number is required for optometrists and ECPs",
        variant: "destructive",
      });
      return;
    }

    addUserMutation.mutate(newUserForm);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Company Administration
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your company profile, users, and supplier relationships
          </p>
        </div>
        {company && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {company.subscriptionPlan}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company Profile
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          {user?.role === 'ecp' && (
            <TabsTrigger value="integrations" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Integrations
            </TabsTrigger>
          )}
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingCompany ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading company data...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyForm.name}
                        onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Contact Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Phone Number</Label>
                      <Input
                        id="companyPhone"
                        value={companyForm.phone}
                        onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                        placeholder="+44 20 1234 5678"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyWebsite">Website</Label>
                      <Input
                        id="companyWebsite"
                        value={companyForm.website}
                        onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                        placeholder="https://www.company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={companyForm.address.street}
                          onChange={(e) => setCompanyForm({
                            ...companyForm,
                            address: { ...companyForm.address, street: e.target.value }
                          })}
                          placeholder="123 High Street"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={companyForm.address.city}
                          onChange={(e) => setCompanyForm({
                            ...companyForm,
                            address: { ...companyForm.address, city: e.target.value }
                          })}
                          placeholder="London"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input
                          id="postcode"
                          value={companyForm.address.postcode}
                          onChange={(e) => setCompanyForm({
                            ...companyForm,
                            address: { ...companyForm.address, postcode: e.target.value }
                          })}
                          placeholder="SW1A 1AA"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleSaveCompany}
                      disabled={updateCompanyMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Company Users</CardTitle>
                  <CardDescription>
                    View and manage users in your company
                  </CardDescription>
                </div>
                <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Add a new user to your company. They will receive login credentials via email.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={newUserForm.firstName}
                            onChange={(e) =>
                              setNewUserForm({ ...newUserForm, firstName: e.target.value })
                            }
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={newUserForm.lastName}
                            onChange={(e) =>
                              setNewUserForm({ ...newUserForm, lastName: e.target.value })
                            }
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserForm.email}
                          onChange={(e) =>
                            setNewUserForm({ ...newUserForm, email: e.target.value })
                          }
                          placeholder="john.doe@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Phone</Label>
                        <Input
                          id="contactPhone"
                          value={newUserForm.contactPhone}
                          onChange={(e) =>
                            setNewUserForm({ ...newUserForm, contactPhone: e.target.value })
                          }
                          placeholder="+44 20 1234 5678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="enhancedRole">Role *</Label>
                        <Select
                          value={newUserForm.enhancedRole}
                          onValueChange={(value) =>
                            setNewUserForm({ ...newUserForm, enhancedRole: value, role: value === "optometrist" ? "ecp" : "ecp" })
                          }
                        >
                          <SelectTrigger id="enhancedRole">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="optometrist">Optometrist</SelectItem>
                            <SelectItem value="dispenser">Dispenser</SelectItem>
                            <SelectItem value="retail_assistant">Retail Assistant</SelectItem>
                            <SelectItem value="lab_tech">Lab Technician</SelectItem>
                            <SelectItem value="engineer">Engineer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(newUserForm.enhancedRole === "optometrist" || newUserForm.role === "ecp") && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="gocNumber">GOC Registration Number *</Label>
                            <Input
                              id="gocNumber"
                              value={newUserForm.gocNumber}
                              onChange={(e) =>
                                setNewUserForm({ ...newUserForm, gocNumber: e.target.value })
                              }
                              placeholder="GOC-12345"
                            />
                            <p className="text-sm text-muted-foreground">
                              General Optical Council registration number
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gocRegistrationType">GOC Registration Type</Label>
                            <Select
                              value={newUserForm.gocRegistrationType}
                              onValueChange={(value) =>
                                setNewUserForm({ ...newUserForm, gocRegistrationType: value })
                              }
                            >
                              <SelectTrigger id="gocRegistrationType">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="optometrist">Optometrist</SelectItem>
                                <SelectItem value="dispensing_optician">Dispensing Optician</SelectItem>
                                <SelectItem value="ophthalmologist">Ophthalmologist</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="professionalQualifications">Professional Qualifications</Label>
                            <Input
                              id="professionalQualifications"
                              value={newUserForm.professionalQualifications}
                              onChange={(e) =>
                                setNewUserForm({ ...newUserForm, professionalQualifications: e.target.value })
                              }
                              placeholder="e.g., BSc (Hons) Optometry"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddUserDialog(false)}
                        disabled={addUserMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddUser}
                        disabled={addUserMutation.isPending}
                      >
                        {addUserMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading users...
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.accountStatus === "active"
                                  ? "default"
                                  : user.accountStatus === "suspended"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {user.accountStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Relationships</CardTitle>
              <CardDescription>
                Manage your approved suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSuppliers ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading suppliers...
                </div>
              ) : suppliers && suppliers.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approved Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={supplier.status === "approved" ? "default" : "secondary"}
                            >
                              {supplier.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {supplier.approvedAt
                              ? new Date(supplier.approvedAt).toLocaleDateString()
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No suppliers configured yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab (ECP only) */}
        {user?.role === 'ecp' && (
          <TabsContent value="integrations" className="space-y-4">
            <ShopifyIntegrationSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
