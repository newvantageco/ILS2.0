import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FileText, 
  DollarSign, 
  Users, 
  BarChart3,
  Heart,
  Shield,
  AlertTriangle,
  ExternalLink,
  Settings,
  Database,
  Stethoscope
} from 'lucide-react';

interface NHSClaimsSummary {
  total_claims: number;
  pending_claims: number;
  approved_claims: number;
  rejected_claims: number;
  total_value: number;
  this_month_claims: number;
  this_month_value: number;
}

interface NHSVoucherStats {
  total_vouchers: number;
  active_vouchers: number;
  redeemed_vouchers: number;
  expired_vouchers: number;
  average_value: number;
  total_value: number;
}

interface NHSSystemStatus {
  claims_service: boolean;
  voucher_service: boolean;
  exemption_service: boolean;
  last_sync: string;
  api_status: 'connected' | 'error' | 'maintenance';
}

export default function NHSIntegrationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch NHS claims summary
  const { data: claimsSummary, isLoading: claimsLoading } = useQuery<NHSClaimsSummary>({
    queryKey: ['/api/nhs/claims/summary'],
    queryFn: async () => {
      const response = await fetch('/api/nhs/claims/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch claims summary');
      }
      return response.json();
    },
  });

  // Fetch NHS voucher statistics
  const { data: voucherStats, isLoading: vouchersLoading } = useQuery<NHSVoucherStats>({
    queryKey: ['/api/nhs/vouchers/statistics'],
    queryFn: async () => {
      const response = await fetch('/api/nhs/vouchers/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch voucher statistics');
      }
      return response.json();
    },
  });

  // Fetch NHS system status
  const { data: systemStatus, isLoading: statusLoading } = useQuery<NHSSystemStatus>({
    queryKey: ['/api/nhs/system/status'],
    queryFn: async () => {
      const response = await fetch('/api/nhs/system/status');
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Sync NHS data mutation
  const syncNHSData = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/nhs/sync', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to sync NHS data');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "NHS Sync Successful",
        description: "NHS data has been synchronized successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/nhs'] });
    },
    onError: () => {
      toast({
        title: "NHS Sync Failed",
        description: "Failed to synchronize NHS data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-blue-600" />
            NHS Integration
          </h1>
          <p className="text-muted-foreground">
            Manage NHS claims, vouchers, and exemptions for UK healthcare compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => syncNHSData.mutate()}
            disabled={syncNHSData.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncNHSData.isPending ? 'animate-spin' : ''}`} />
            Sync NHS Data
          </Button>
          <Button>
            <ExternalLink className="h-4 w-4 mr-2" />
            NHS Portal
          </Button>
        </div>
      </div>

      {/* System Status Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">NHS System Status</h3>
                <p className="text-sm text-blue-700">
                  Last sync: {systemStatus?.last_sync ? new Date(systemStatus.last_sync).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(systemStatus?.api_status || 'error')}>
                {systemStatus?.api_status || 'Unknown'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="exemptions">Exemptions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Status Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Claims Service</CardTitle>
                {systemStatus?.claims_service ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.claims_service ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-muted-foreground">
                  NHS claims processing status
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Voucher Service</CardTitle>
                {systemStatus?.voucher_service ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.voucher_service ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-muted-foreground">
                  NHS voucher validation status
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exemption Service</CardTitle>
                {systemStatus?.exemption_service ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatus?.exemption_service ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-muted-foreground">
                  NHS exemption checking status
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Claims Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Claims Summary
                </CardTitle>
                <CardDescription>
                  Overview of NHS claims processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {claimsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {claimsSummary?.total_claims || 0}
                      </div>
                      <div className="text-sm text-blue-800">Total Claims</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        £{(claimsSummary?.total_value || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-green-800">Total Value</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {claimsSummary?.pending_claims || 0}
                      </div>
                      <div className="text-sm text-yellow-800">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {claimsSummary?.approved_claims || 0}
                      </div>
                      <div className="text-sm text-green-800">Approved</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voucher Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Voucher Statistics
                </CardTitle>
                <CardDescription>
                  Overview of NHS voucher management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {vouchersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {voucherStats?.total_vouchers || 0}
                      </div>
                      <div className="text-sm text-blue-800">Total Vouchers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {voucherStats?.active_vouchers || 0}
                      </div>
                      <div className="text-sm text-green-800">Active</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {voucherStats?.redeemed_vouchers || 0}
                      </div>
                      <div className="text-sm text-purple-800">Redeemed</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {voucherStats?.expired_vouchers || 0}
                      </div>
                      <div className="text-sm text-red-800">Expired</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NHS Claims Management</CardTitle>
              <CardDescription>
                Manage NHS claims submission and processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Claims Management</h3>
                <p className="text-muted-foreground mb-4">
                  Create, submit, and track NHS claims for optical services
                </p>
                <div className="flex gap-2 justify-center">
                  <Button>Create New Claim</Button>
                  <Button variant="outline">View All Claims</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NHS Vouchers</CardTitle>
              <CardDescription>
                Validate and manage NHS optical vouchers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Voucher Management</h3>
                <p className="text-muted-foreground mb-4">
                  Validate NHS vouchers and calculate entitlements
                </p>
                <div className="flex gap-2 justify-center">
                  <Button>Validate Voucher</Button>
                  <Button variant="outline">Voucher History</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exemptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NHS Exemptions</CardTitle>
              <CardDescription>
                Check patient exemptions and entitlements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Exemption Checking</h3>
                <p className="text-muted-foreground mb-4">
                  Verify patient exemptions for NHS services
                </p>
                <div className="flex gap-2 justify-center">
                  <Button>Check Exemption</Button>
                  <Button variant="outline">Exemption Rules</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NHS Integration Settings</CardTitle>
              <CardDescription>
                Configure NHS integration parameters and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="nhs-api-key">NHS API Key</Label>
                  <Input
                    id="nhs-api-key"
                    type="password"
                    placeholder="Enter NHS API key"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="practice-code">Practice Code</Label>
                  <Input
                    id="practice-code"
                    placeholder="Enter practice code"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="nhs-region">NHS Region</Label>
                  <Input
                    id="nhs-region"
                    placeholder="Enter NHS region"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                  <Input
                    id="sync-interval"
                    type="number"
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button>Save Settings</Button>
                <Button variant="outline">Test Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}