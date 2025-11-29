/**
 * Company Approval Dashboard
 *
 * Platform admin dashboard for managing company registrations
 * and approvals across the platform.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Globe,
  Shield,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Building,
  UserCheck,
  UserX,
  TrendingUp,
  ArrowUpRight,
  Star,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string | null;
  status: string;
  gocNumber: string | null;
  practiceType: string | null;
  subscriptionPlan: string;
  createdAt: string;
  createdBy: string | null;
  memberCount: number;
  pendingCount?: number;
}

interface PendingMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  createdAt: string;
}

export default function CompanyApprovalDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending companies
  const { data: pendingCompanies = [], isLoading: pendingLoading, refetch: refetchPending } = useQuery<Company[]>({
    queryKey: ["/api/companies/pending"],
  });

  // Fetch all companies
  const { data: allCompanies = [], isLoading: allLoading, refetch: refetchAll } = useQuery<Company[]>({
    queryKey: ["/api/companies/all"],
  });

  // Fetch pending members for a company
  const { data: pendingMembers = [] } = useQuery<PendingMember[]>({
    queryKey: ["/api/companies", selectedCompany?.id, "pending-members"],
    enabled: !!selectedCompany?.id,
  });

  // Approve company mutation
  const approveCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await apiRequest("POST", `/api/companies/${companyId}/approve`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve company");
      }
      return await response.json();
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/all"] });
      toast({
        title: "Company Approved",
        description: "The company has been approved and activated.",
      });
      setShowApproveDialog(false);
      setSelectedCompany(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject company mutation
  const rejectCompanyMutation = useMutation({
    mutationFn: async ({ companyId, reason }: { companyId: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/companies/${companyId}/reject`, { reason });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject company");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/all"] });
      toast({
        title: "Company Rejected",
        description: "The company registration has been rejected.",
      });
      setShowRejectDialog(false);
      setSelectedCompany(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter companies
  const filteredAllCompanies = allCompanies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      active: { label: "Active", className: "bg-green-100 text-green-800" },
      pending_approval: { label: "Pending Approval", className: "bg-yellow-100 text-yellow-800" },
      suspended: { label: "Suspended", className: "bg-red-100 text-red-800" },
      deactivated: { label: "Deactivated", className: "bg-gray-100 text-gray-800" },
    };
    const badge = badges[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      ecp: { label: "ECP", className: "bg-blue-100 text-blue-800" },
      lab: { label: "Laboratory", className: "bg-purple-100 text-purple-800" },
      supplier: { label: "Supplier", className: "bg-green-100 text-green-800" },
      hybrid: { label: "Hybrid", className: "bg-orange-100 text-orange-800" },
    };
    const badge = badges[type] || { label: type, className: "bg-gray-100 text-gray-800" };
    return <Badge variant="outline" className={badge.className}>{badge.label}</Badge>;
  };

  // Stats
  const stats = {
    pending: pendingCompanies.length,
    active: allCompanies.filter((c) => c.status === "active").length,
    total: allCompanies.length,
    pendingMembers: allCompanies.reduce((acc, c) => acc + (c.pendingCount || 0), 0),
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48" />

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Company Approvals</h1>
              <p className="text-white/90 mt-1">
                Review and manage company registrations across the platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 hover:border-yellow-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            {stats.pending > 0 && (
              <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Requires attention
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-green-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Companies</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              Operating normally
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-orange-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Members</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingMembers}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all companies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="h-12">
            <TabsTrigger value="pending" className="text-base gap-2 px-6">
              <Clock className="w-4 h-4" />
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-base gap-2 px-6">
              <Building2 className="w-4 h-4" />
              All Companies
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                refetchPending();
                refetchAll();
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pending Companies Tab */}
        <TabsContent value="pending">
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pendingCompanies.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  No companies are waiting for approval. Check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {pendingCompanies.map((company, index) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-white hover:shadow-lg transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{company.name}</CardTitle>
                              <div className="flex gap-2 mt-1">
                                {getTypeBadge(company.type)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{company.email}</span>
                          </div>
                          {company.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.gocNumber && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Shield className="w-4 h-4" />
                              <span>GOC: {company.gocNumber}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                          <Clock className="w-4 h-4" />
                          <span>Applied {new Date(company.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowRejectDialog(true);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowApproveDialog(true);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* All Companies Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>All Companies</CardTitle>
                  <CardDescription>
                    View and manage all registered companies on the platform
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending_approval">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {allLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAllCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{company.name}</p>
                                <p className="text-sm text-muted-foreground">{company.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(company.type)}</TableCell>
                          <TableCell>{getStatusBadge(company.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {company.subscriptionPlan.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{company.memberCount}</span>
                              {(company.pendingCount || 0) > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{company.pendingCount} pending
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedCompany(company);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {company.status === "pending_approval" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowApproveDialog(true);
                                    }}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
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
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Approve Company
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve <strong>{selectedCompany?.name}</strong>?
              This will activate the company and notify the owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">What happens next:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Company status changes to Active
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Company owner becomes Company Admin
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Owner receives email notification
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedCompany && approveCompanyMutation.mutate(selectedCompany.id)}
              disabled={approveCompanyMutation.isPending}
            >
              {approveCompanyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Company
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Company
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject <strong>{selectedCompany?.name}</strong>?
              Please provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Warning:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Company will be deactivated
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Owner will need to create a new company
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedCompany &&
                rejectCompanyMutation.mutate({
                  companyId: selectedCompany.id,
                  reason: rejectionReason,
                })
              }
              disabled={rejectCompanyMutation.isPending || !rejectionReason.trim()}
            >
              {rejectCompanyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Company
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Details
            </DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedCompany.name}</h3>
                  <div className="flex gap-2 mt-2">
                    {getTypeBadge(selectedCompany.type)}
                    {getStatusBadge(selectedCompany.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedCompany.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedCompany.phone || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">GOC Number</Label>
                  <p className="font-medium">{selectedCompany.gocNumber || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Practice Type</Label>
                  <p className="font-medium capitalize">
                    {selectedCompany.practiceType?.replace("_", " ") || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Subscription Plan</Label>
                  <p className="font-medium capitalize">
                    {selectedCompany.subscriptionPlan.replace("_", " ")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Members</Label>
                  <p className="font-medium">{selectedCompany.memberCount}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(selectedCompany.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedCompany?.status === "pending_approval" && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setShowDetailsDialog(false);
                  setShowApproveDialog(true);
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
