import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Mail, Eye, EyeOff, Copy } from "lucide-react";

interface Company {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt: string;
}

interface NewCompanyForm {
  companyName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ecp" | "lab_tech" | "engineer" | "supplier";
  contactPhone: string;
  address: string;
}

export default function CompanyManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  
  const [formData, setFormData] = useState<NewCompanyForm>({
    companyName: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "ecp",
    contactPhone: "",
    address: "",
  });

  // Fetch all companies
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const res = await fetch("/api/admin/companies");
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: NewCompanyForm) => {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create company");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setIsDialogOpen(false);
      setGeneratedPassword(data.password);
      
      toast({
        title: "✅ Company created successfully",
        description: `Login credentials sent to ${formData.email}`,
      });

      // Reset form
      setFormData({
        companyName: "",
        email: "",
        firstName: "",
        lastName: "",
        role: "ecp",
        contactPhone: "",
        address: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resend credentials mutation
  const resendCredentialsMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const res = await fetch(`/api/admin/companies/${companyId}/resend-credentials`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to resend credentials");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Credentials sent",
        description: "Login details have been emailed to the company",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCompanyMutation.mutate(formData);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "📋 Copied",
      description: "Password copied to clipboard",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "ecp":
        return "bg-blue-100 text-blue-800";
      case "lab_tech":
        return "bg-green-100 text-green-800";
      case "engineer":
        return "bg-orange-100 text-orange-800";
      case "supplier":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Company Management
              </h1>
              <p className="text-gray-600">
                Add and manage company accounts
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Create a new company account. Login credentials will be auto-generated and emailed.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({ ...formData, companyName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecp">Eye Care Provider (ECP)</SelectItem>
                        <SelectItem value="lab_tech">Lab Technician</SelectItem>
                        <SelectItem value="engineer">Engineer</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPhone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCompanyMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {createCompanyMutation.isPending ? "Creating..." : "Create & Send Credentials"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Password Display Dialog */}
        {generatedPassword && (
          <Dialog open={!!generatedPassword} onOpenChange={() => setGeneratedPassword("")}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>✅ Company Created Successfully</DialogTitle>
                <DialogDescription>
                  Login credentials have been sent to {formData.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Generated Password</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={generatedPassword}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPasswordToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Save this password securely. It has been emailed to the company, but you may need it for initial setup.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => setGeneratedPassword("")}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Companies</CardTitle>
            <CardDescription>
              Manage all company accounts in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No companies found. Add your first company above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(company.role)}>
                          {company.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(company.accountStatus)}>
                          {company.accountStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(company.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendCredentialsMutation.mutate(company.id)}
                          disabled={resendCredentialsMutation.isPending}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Resend Credentials
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
