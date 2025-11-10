import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  claims: {
    total: number;
    submitted: number;
    approved: number;
    denied: number;
    pending: number;
  };
  payments: {
    totalCollected: number;
    outstanding: number;
    refunded: number;
  };
  billing: {
    chargesCaptured: number;
    averageReimbursement: number;
    collectionRate: number;
  };
}

export default function RCMDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/rcm/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load RCM statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue Cycle Management</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive claims, payments, and billing automation dashboard
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.claims.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.claims.pending || 0} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats?.payments.totalCollected || 0) / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${((stats?.payments.outstanding || 0) / 100).toLocaleString()} outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.billing.collectionRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Reimbursement</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats?.billing.averageReimbursement || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per claim
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Claims Status */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Status Overview</CardTitle>
          <CardDescription>Current status of all claims in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Submitted</p>
                <p className="text-2xl font-bold">{stats?.claims.submitted || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{stats?.claims.pending || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold">{stats?.claims.approved || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium">Denied</p>
                <p className="text-2xl font-bold">{stats?.claims.denied || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Appealed</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Tabs defaultValue="claims" className="space-y-4">
        <TabsList>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Claims Management</CardTitle>
              <CardDescription>Create, submit, and track insurance claims</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/rcm/claims/create'}>
                  Create New Claim
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/rcm/claims'}>
                  View All Claims
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/rcm/claims?status=pending'}>
                  Review Pending
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                <p><strong>Claim Lifecycle:</strong></p>
                <p>Draft → Submitted → Pending → Approved/Denied → Paid/Appealed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
              <CardDescription>Process payments, refunds, and statements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/rcm/payments/create'}>
                  Record Payment
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/rcm/payments'}>
                  View Payments
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/rcm/refunds'}>
                  Process Refunds
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                <p><strong>Payment Types:</strong> Insurance, Patient, Copay, Deductible, Coinsurance</p>
                <p><strong>Methods:</strong> Cash, Check, Credit Card, ACH, Wire Transfer</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Automation</CardTitle>
              <CardDescription>Automated charge capture and collections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/rcm/charges'}>
                  Capture Charges
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/rcm/collections'}>
                  Collections Queue
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/rcm/fee-schedule'}>
                  Fee Schedule
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                <p><strong>Automated Tasks:</strong></p>
                <p>• Charge capture from encounters</p>
                <p>• Eligibility verification</p>
                <p>• Collections follow-up</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest claims, payments, and billing events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Claim CLM-001234 submitted</p>
                <p className="text-sm text-muted-foreground">Patient: John Doe | Amount: $125.00</p>
              </div>
              <Badge>Submitted</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Payment PMT-005678 received</p>
                <p className="text-sm text-muted-foreground">Insurance | Amount: $98.50</p>
              </div>
              <Badge variant="success">Posted</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Claim CLM-001222 denied</p>
                <p className="text-sm text-muted-foreground">Reason: Missing documentation</p>
              </div>
              <Badge variant="destructive">Denied</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
