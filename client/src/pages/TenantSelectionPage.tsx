/**
 * Tenant Selection Page
 *
 * Shown to users after Google sign-in who need to:
 * - Select an existing company to join
 * - Create a new company
 * - View pending join requests
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Search,
  UserPlus,
  Sparkles,
  Clock,
  Globe,
  Shield,
  Mail,
  MapPin,
  LogOut,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SiGoogle } from "react-icons/si";

interface Company {
  id: string;
  name: string;
  type: string;
  industry: string;
  email: string;
  status: string;
  memberCount: number;
  createdAt: string;
}

interface JoinRequest {
  id: string;
  companyId: string;
  companyName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export default function TenantSelectionPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const [newCompanyData, setNewCompanyData] = useState({
    name: "",
    type: "ecp" as "ecp" | "lab" | "supplier" | "hybrid",
    email: user?.email || "",
    phone: "",
    gocNumber: "",
    practiceType: "",
  });

  // Fetch available companies for joining
  const { data: availableCompanies = [], isLoading: companiesLoading, refetch: refetchCompanies } = useQuery<Company[]>({
    queryKey: ['/api/companies/joinable'],
  });

  // Fetch user's pending join requests
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery<JoinRequest[]>({
    queryKey: ['/api/companies/my-requests'],
  });

  // Filter companies based on search
  const filteredCompanies = availableCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create new company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof newCompanyData) => {
      const response = await apiRequest("POST", "/api/companies", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create company");
      }
      return await response.json();
    },
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Company Created Successfully!",
        description: `${company.name} is now pending approval. You'll be notified once approved.`,
      });
      // Redirect to pending approval page
      setLocation("/pending-approval");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create company",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join company mutation
  const joinCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await apiRequest("POST", "/api/companies/join", { companyId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request to join");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/my-requests'] });
      toast({
        title: "Request Sent!",
        description: "Your request to join has been sent. The company admin will review it shortly.",
      });
      setSelectedCompanyId("");
      // Redirect to pending approval page
      setLocation("/pending-approval");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCompany = () => {
    if (!newCompanyData.name || !newCompanyData.type) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createCompanyMutation.mutate(newCompanyData);
  };

  const handleJoinCompany = () => {
    if (!selectedCompanyId) {
      toast({
        title: "No company selected",
        description: "Please select a company to join.",
        variant: "destructive",
      });
      return;
    }
    joinCompanyMutation.mutate(selectedCompanyId);
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const getCompanyTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ecp: "bg-blue-100 text-blue-800",
      lab: "bg-purple-100 text-purple-800",
      supplier: "bg-green-100 text-green-800",
      hybrid: "bg-orange-100 text-orange-800",
    };
    const labels: Record<string, string> = {
      ecp: "Eye Care Practice",
      lab: "Laboratory",
      supplier: "Supplier",
      hybrid: "Hybrid",
    };
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-sm bg-background/85 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-xl">ILS</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Integrated Lens System</h1>
              <p className="text-xs text-muted-foreground">Enterprise Lens Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <SiGoogle className="w-4 h-4" />
              Signed in with Google
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              Welcome, {user?.firstName || "there"}!
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              To continue, you need to be associated with a company.
              You can join an existing organization or create a new one.
            </p>
          </div>

          {/* Pending Requests Alert */}
          {pendingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                    <Clock className="w-5 h-5" />
                    Pending Join Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-100"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="font-medium">{request.companyName}</p>
                            <p className="text-sm text-muted-foreground">
                              Requested {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Pending Approval
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 h-14 mb-8">
              <TabsTrigger value="join" className="text-base gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserPlus className="w-5 h-5" />
                Join Existing Company
              </TabsTrigger>
              <TabsTrigger value="create" className="text-base gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Building2 className="w-5 h-5" />
                Create New Company
              </TabsTrigger>
            </TabsList>

            {/* Join Company Tab */}
            <TabsContent value="join">
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Join a Company
                  </CardTitle>
                  <CardDescription>
                    Search for your organization and request to join. An administrator will approve your access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search */}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by company name or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => refetchCompanies()}
                      className="h-11 w-11"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Companies List */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {companiesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : filteredCompanies.length === 0 ? (
                      <div className="text-center py-12">
                        <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium mb-2">No Companies Found</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm
                            ? "Try a different search term or create a new company."
                            : "There are no companies available to join yet. Create your own!"}
                        </p>
                        <Button variant="outline" onClick={() => setActiveTab("create")}>
                          Create New Company
                        </Button>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {filteredCompanies.map((company, index) => (
                          <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                            className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                              selectedCompanyId === company.id
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                : "border-border hover:border-primary/40 hover:bg-muted/30"
                            }`}
                            onClick={() => setSelectedCompanyId(company.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  selectedCompanyId === company.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}>
                                  <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{company.name}</h3>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      {company.memberCount} members
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-4 h-4" />
                                      {company.email}
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    {getCompanyTypeBadge(company.type)}
                                  </div>
                                </div>
                              </div>
                              {selectedCompanyId === company.id && (
                                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <Button
                    onClick={handleJoinCompany}
                    disabled={!selectedCompanyId || joinCompanyMutation.isPending}
                    className="w-full h-12 text-base"
                  >
                    {joinCompanyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending Request...
                      </>
                    ) : (
                      <>
                        Request to Join
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Create Company Tab */}
            <TabsContent value="create">
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Create Your Company
                  </CardTitle>
                  <CardDescription>
                    Register your organization on the platform. A platform administrator will review and approve your application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        placeholder="e.g., Vision Care Opticians"
                        value={newCompanyData.name}
                        onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyType">Company Type *</Label>
                      <Select
                        value={newCompanyData.type}
                        onValueChange={(val) => setNewCompanyData({ ...newCompanyData, type: val as any })}
                      >
                        <SelectTrigger id="companyType" className="h-11">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ecp">Eye Care Practice (ECP)</SelectItem>
                          <SelectItem value="lab">Optical Laboratory</SelectItem>
                          <SelectItem value="supplier">Lens Supplier</SelectItem>
                          <SelectItem value="hybrid">Hybrid (ECP + Lab)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="practiceType">Practice Type</Label>
                      <Select
                        value={newCompanyData.practiceType}
                        onValueChange={(val) => setNewCompanyData({ ...newCompanyData, practiceType: val })}
                      >
                        <SelectTrigger id="practiceType" className="h-11">
                          <SelectValue placeholder="Select practice type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="independent">Independent Practice</SelectItem>
                          <SelectItem value="multiple">Multiple Locations</SelectItem>
                          <SelectItem value="hospital">Hospital/NHS</SelectItem>
                          <SelectItem value="domiciliary">Domiciliary</SelectItem>
                          <SelectItem value="chain">Retail Chain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@yourcompany.com"
                        value={newCompanyData.email}
                        onChange={(e) => setNewCompanyData({ ...newCompanyData, email: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Business Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+44 20 1234 5678"
                        value={newCompanyData.phone}
                        onChange={(e) => setNewCompanyData({ ...newCompanyData, phone: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="gocNumber">GOC Registration Number</Label>
                      <Input
                        id="gocNumber"
                        placeholder="e.g., 01-12345"
                        value={newCompanyData.gocNumber}
                        onChange={(e) => setNewCompanyData({ ...newCompanyData, gocNumber: e.target.value })}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for UK-based optical practices. Can be added later if not available.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Info Box */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Platform Admin Approval Required</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        For security and quality assurance, new company registrations require approval from a platform administrator.
                        You'll receive an email notification once your company is approved.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                  <Button
                    onClick={handleCreateCompany}
                    disabled={createCompanyMutation.isPending || !newCompanyData.name || !newCompanyData.type}
                    className="w-full h-12 text-base"
                  >
                    {createCompanyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Company...
                      </>
                    ) : (
                      <>
                        Create Company
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Integrated Lens System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
