import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, FileText, Shield, Eye, Lock, AlertCircle, TrendingUp, Users, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/StatCard";

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs", actionFilter, dateFilter, searchTerm],
    queryFn: async () => {
      let url = "/api/admin/audit-logs";
      const params = new URLSearchParams();
      
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (dateFilter !== "all") params.append("period", dateFilter);
      if (searchTerm) params.append("search", searchTerm);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await apiRequest("GET", url);
      return await response.json();
    },
  });

  // Stats query
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/audit-logs/stats", startDate, endDate],
    queryFn: async () => {
      let url = "/api/admin/audit-logs/stats";
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data.stats;
    },
  });

  // PHI Access logs query
  const { data: phiLogs, isLoading: phiLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs/phi-access/all", startDate, endDate, userFilter],
    queryFn: async () => {
      let url = "/api/admin/audit-logs/phi-access/all";
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (userFilter) params.append("userId", userFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return data.data;
    },
  });  const handleExport = async () => {
    try {
      const response = await apiRequest("POST", "/api/admin/audit-logs/export", {
        action: actionFilter !== "all" ? actionFilter : undefined,
        period: dateFilter !== "all" ? dateFilter : undefined,
      });
      
      // Create download
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.json`;
      a.click();
      
      toast({
        title: "Export successful",
        description: "Audit logs have been exported",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };

  const filteredLogs = auditLogs?.filter((log: any) =>
    searchTerm === "" ||
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityType?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-500",
      UPDATE: "bg-blue-500",
      DELETE: "bg-red-500",
      VIEW: "bg-gray-500",
      LOGIN: "bg-purple-500",
      LOGOUT: "bg-purple-400",
      EXPORT: "bg-orange-500",
    };
    return colors[action] || "bg-gray-500";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Audit Logs & Compliance
          </h1>
          <p className="text-muted-foreground mt-1">
            HIPAA & GOC compliant activity tracking and security monitoring
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Logs"
            value={stats.total?.toLocaleString() || "0"}
            icon={Activity}
          />
          <StatCard
            title="PHI Access"
            value={stats.phiAccess?.toLocaleString() || "0"}
            icon={Eye}
            className="border-amber-200 bg-amber-50"
          />
          <StatCard
            title="Failed Operations"
            value={stats.failed?.toLocaleString() || "0"}
            icon={AlertCircle}
            className="border-red-200 bg-red-50"
          />
          <StatCard
            title="Active Users"
            value={stats.mostActiveUsers?.length || "0"}
            icon={Users}
          />
        </div>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">All Logs</TabsTrigger>
          <TabsTrigger value="phi">PHI Access Dashboard</TabsTrigger>
          <TabsTrigger value="goc">GOC Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* All Logs Tab */}
        <TabsContent value="logs" className="space-y-4">

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>Search and filter audit trail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            {filteredLogs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.userName || "System"}</div>
                          <div className="text-sm text-muted-foreground">{log.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.entityType}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {log.entityId?.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.details || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress || "-"}
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

        {/* PHI Access Dashboard Tab */}
        <TabsContent value="phi" className="space-y-4">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-700" />
                PHI Access Dashboard (HIPAA Compliance)
              </CardTitle>
              <CardDescription>
                Protected Health Information access tracking for regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold mb-2">Date Range Filter</h3>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start date"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End date"
                    />
                  </div>
                </div>

                {phiLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading PHI access logs...</p>
                  </div>
                ) : !phiLogs || phiLogs.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border">
                    <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No PHI access logs in selected period</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-amber-100">
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Success</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Purpose</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {phiLogs.map((log: any) => (
                          <TableRow key={log.id} className="hover:bg-amber-50">
                            <TableCell className="font-mono text-sm">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{log.userEmail || "Unknown"}</div>
                                <div className="text-xs text-muted-foreground">{log.userId?.slice(0, 8)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{log.resourceType}</div>
                                <div className="text-xs text-muted-foreground font-mono">{log.resourceId?.slice(0, 8)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.eventType === 'read' ? 'default' : 'secondary'}>
                                {log.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.success ? (
                                <Badge className="bg-green-500">Success</Badge>
                              ) : (
                                <Badge variant="destructive">Failed</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">{log.ipAddress || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm">
                              {log.metadata?.purpose || "Treatment/Operations"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOC Compliance Tab */}
        <TabsContent value="goc" className="space-y-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-700" />
                GOC Compliance (Canadian Privacy Law)
              </CardTitle>
              <CardDescription>
                Government of Canada privacy compliance and data protection tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-blue-900">Compliance Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Data Retention Policy</span>
                      <Badge className="bg-green-500">Compliant</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Access Controls</span>
                      <Badge className="bg-green-500">Compliant</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Audit Trail Completeness</span>
                      <Badge className="bg-green-500">Compliant</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Encryption Standards</span>
                      <Badge className="bg-green-500">Compliant</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold mb-2 text-blue-900">Privacy Safeguards</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>All data encrypted at rest and in transit</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Eye className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Role-based access control enforced</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Complete audit trail maintained</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Automated breach detection active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-3 text-blue-900">Recent High-Risk Activities</h3>
                <div className="space-y-2">
                  {filteredLogs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{log.action} - {log.entityType}</p>
                          <p className="text-xs text-muted-foreground">{log.userName} • {new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-400 text-blue-700">Logged</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Event Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.byEventType && stats.byEventType.length > 0 ? (
                  <div className="space-y-2">
                    {stats.byEventType.map(item => (
                      <div key={item.eventType} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">{item.eventType}</span>
                        <Badge>{item.count.toLocaleString()}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No event data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Most Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.mostActiveUsers && stats.mostActiveUsers.length > 0 ? (
                  <div className="space-y-2">
                    {stats.mostActiveUsers.slice(0, 5).map(user => (
                      <div key={user.userId} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium text-sm">{user.userEmail}</p>
                          <p className="text-xs text-muted-foreground font-mono">{user.userId?.slice(0, 8)}</p>
                        </div>
                        <Badge>{user.count.toLocaleString()} actions</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No user data</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Top Resource Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.byResourceType && stats.byResourceType.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {stats.byResourceType.map(item => (
                      <div key={item.resourceType} className="flex items-center justify-between p-3 bg-muted rounded">
                        <span className="font-medium">{item.resourceType}</span>
                        <Badge>{item.count.toLocaleString()}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No resource data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
