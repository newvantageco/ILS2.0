import { useState, useEffect } from 'react';
import { PageHeader, DataTable, StatusBadge, Column } from '@/components/healthcare';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, FileText, Download, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Claim {
  id: string;
  claimNumber: string;
  patientName: string;
  provider: string;
  serviceDate: string;
  amount: number;
  status: string;
  payer: string;
  submittedDate?: string;
}

export default function ClaimsManagementPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/rcm/claims');
      if (!response.ok) throw new Error('Failed to fetch claims');
      const data = await response.json();
      setClaims(data.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load claims',
        variant: 'destructive',
      });
      // Mock data for demonstration
      setClaims([
        {
          id: '1',
          claimNumber: 'CLM-001234',
          patientName: 'John Doe',
          provider: 'Dr. Smith',
          serviceDate: '2025-11-01',
          amount: 125.00,
          status: 'submitted',
          payer: 'Blue Cross',
          submittedDate: '2025-11-02',
        },
        {
          id: '2',
          claimNumber: 'CLM-001235',
          patientName: 'Jane Smith',
          provider: 'Dr. Johnson',
          serviceDate: '2025-11-03',
          amount: 250.00,
          status: 'approved',
          payer: 'Aetna',
          submittedDate: '2025-11-04',
        },
        {
          id: '3',
          claimNumber: 'CLM-001236',
          patientName: 'Bob Wilson',
          provider: 'Dr. Brown',
          serviceDate: '2025-11-05',
          amount: 175.50,
          status: 'pending',
          payer: 'United Healthcare',
          submittedDate: '2025-11-06',
        },
        {
          id: '4',
          claimNumber: 'CLM-001237',
          patientName: 'Alice Johnson',
          provider: 'Dr. Davis',
          serviceDate: '2025-11-07',
          amount: 89.00,
          status: 'denied',
          payer: 'Cigna',
          submittedDate: '2025-11-08',
        },
        {
          id: '5',
          claimNumber: 'CLM-001238',
          patientName: 'Charlie Brown',
          provider: 'Dr. Miller',
          serviceDate: '2025-11-08',
          amount: 300.00,
          status: 'draft',
          payer: 'Medicare',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims =
    statusFilter === 'all'
      ? claims
      : claims.filter((claim) => claim.status === statusFilter);

  const columns: Column<Claim>[] = [
    {
      key: 'claimNumber',
      header: 'Claim #',
      sortable: true,
      width: '120px',
      render: (claim) => (
        <span className="font-medium text-primary">{claim.claimNumber}</span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
    },
    {
      key: 'provider',
      header: 'Provider',
      sortable: true,
    },
    {
      key: 'payer',
      header: 'Payer',
      sortable: true,
    },
    {
      key: 'serviceDate',
      header: 'Service Date',
      sortable: true,
      render: (claim) => new Date(claim.serviceDate).toLocaleDateString(),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      width: '120px',
      render: (claim) => `$${claim.amount.toFixed(2)}`,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (claim) => <StatusBadge status={claim.status} />,
    },
  ];

  const handleRowClick = (claim: Claim) => {
    // Navigate to claim detail page
    console.log('Navigate to claim:', claim.id);
  };

  const handleCreateClaim = () => {
    console.log('Create new claim');
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your claims export is being prepared...',
    });
  };

  const statusCounts = {
    all: claims.length,
    draft: claims.filter((c) => c.status === 'draft').length,
    submitted: claims.filter((c) => c.status === 'submitted').length,
    pending: claims.filter((c) => c.status === 'pending').length,
    approved: claims.filter((c) => c.status === 'approved').length,
    denied: claims.filter((c) => c.status === 'denied').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims Management"
        description="Manage and track insurance claims throughout their lifecycle"
        breadcrumbs={[
          { label: 'Revenue Cycle', url: '/rcm/dashboard' },
          { label: 'Claims' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleCreateClaim}>
              <Plus className="mr-2 h-4 w-4" />
              New Claim
            </Button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className={statusFilter === 'all' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('all')}
            >
              View all
            </Button>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'draft' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.draft}</div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('draft')}
            >
              View drafts
            </Button>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'submitted' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.submitted}</div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('submitted')}
            >
              View submitted
            </Button>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'approved' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.approved}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('approved')}
            >
              View approved
            </Button>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'denied' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.denied}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('denied')}
            >
              View denied
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Claims List</CardTitle>
              <CardDescription>
                {statusFilter === 'all'
                  ? 'All claims'
                  : `Claims with status: ${statusFilter}`}
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Claims</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredClaims}
            columns={columns}
            searchable
            searchPlaceholder="Search claims..."
            onRowClick={handleRowClick}
            emptyMessage="No claims found"
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common claim management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Batch Submit Claims
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Download ERA Files
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
