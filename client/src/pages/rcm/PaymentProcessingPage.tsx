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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, DollarSign, Download, Filter, CreditCard, Receipt, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  paymentId: string;
  patientName: string;
  claimNumber: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  payer: string;
  checkNumber?: string;
  confirmationNumber?: string;
}

interface PatientAccount {
  id: string;
  patientName: string;
  patientId: string;
  totalBalance: number;
  insuranceBalance: number;
  patientBalance: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  status: string;
}

export default function PaymentProcessingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<PatientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, accountsRes] = await Promise.all([
        fetch('/api/rcm/payments'),
        fetch('/api/rcm/accounts'),
      ]);

      if (!paymentsRes.ok || !accountsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const paymentsData = await paymentsRes.json();
      const accountsData = await accountsRes.json();

      setPayments(paymentsData.data || []);
      setAccounts(accountsData.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive',
      });

      // Mock data for demonstration
      setPayments([
        {
          id: '1',
          paymentId: 'PAY-001234',
          patientName: 'John Doe',
          claimNumber: 'CLM-001234',
          amount: 125.00,
          paymentType: 'insurance',
          paymentMethod: 'ach',
          paymentDate: '2025-11-05',
          status: 'completed',
          payer: 'Blue Cross',
          confirmationNumber: 'ACH-789456123',
        },
        {
          id: '2',
          paymentId: 'PAY-001235',
          patientName: 'Jane Smith',
          claimNumber: 'CLM-001235',
          amount: 50.00,
          paymentType: 'patient',
          paymentMethod: 'credit_card',
          paymentDate: '2025-11-06',
          status: 'completed',
          payer: 'Patient',
          confirmationNumber: 'CC-456789321',
        },
        {
          id: '3',
          paymentId: 'PAY-001236',
          patientName: 'Bob Wilson',
          claimNumber: 'CLM-001236',
          amount: 175.50,
          paymentType: 'insurance',
          paymentMethod: 'check',
          paymentDate: '2025-11-07',
          status: 'pending',
          payer: 'United Healthcare',
          checkNumber: 'CHK-123456',
        },
        {
          id: '4',
          paymentId: 'PAY-001237',
          patientName: 'Alice Johnson',
          claimNumber: 'CLM-001237',
          amount: 30.00,
          paymentType: 'copay',
          paymentMethod: 'cash',
          paymentDate: '2025-11-08',
          status: 'completed',
          payer: 'Patient',
        },
        {
          id: '5',
          paymentId: 'PAY-001238',
          patientName: 'Charlie Brown',
          claimNumber: 'CLM-001238',
          amount: 200.00,
          paymentType: 'insurance',
          paymentMethod: 'ach',
          paymentDate: '2025-11-07',
          status: 'failed',
          payer: 'Medicare',
          confirmationNumber: 'ACH-FAILED-001',
        },
      ]);

      setAccounts([
        {
          id: '1',
          patientName: 'John Doe',
          patientId: 'PT-001234',
          totalBalance: 450.00,
          insuranceBalance: 300.00,
          patientBalance: 150.00,
          lastPaymentDate: '2025-11-05',
          lastPaymentAmount: 125.00,
          status: 'active',
        },
        {
          id: '2',
          patientName: 'Jane Smith',
          patientId: 'PT-001235',
          totalBalance: 0.00,
          insuranceBalance: 0.00,
          patientBalance: 0.00,
          lastPaymentDate: '2025-11-06',
          lastPaymentAmount: 50.00,
          status: 'current',
        },
        {
          id: '3',
          patientName: 'Bob Wilson',
          patientId: 'PT-001236',
          totalBalance: 875.50,
          insuranceBalance: 700.00,
          patientBalance: 175.50,
          lastPaymentDate: '2025-10-15',
          lastPaymentAmount: 100.00,
          status: 'overdue',
        },
        {
          id: '4',
          patientName: 'Alice Johnson',
          patientId: 'PT-001237',
          totalBalance: 89.00,
          insuranceBalance: 0.00,
          patientBalance: 89.00,
          status: 'active',
        },
        {
          id: '5',
          patientName: 'Charlie Brown',
          patientId: 'PT-001238',
          totalBalance: 1250.00,
          insuranceBalance: 1050.00,
          patientBalance: 200.00,
          lastPaymentDate: '2025-09-20',
          lastPaymentAmount: 75.00,
          status: 'overdue',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments =
    typeFilter === 'all'
      ? payments
      : payments.filter((payment) => payment.paymentType === typeFilter);

  const paymentColumns: Column<Payment>[] = [
    {
      key: 'paymentId',
      header: 'Payment ID',
      sortable: true,
      width: '120px',
      render: (payment) => (
        <span className="font-medium text-primary">{payment.paymentId}</span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
    },
    {
      key: 'claimNumber',
      header: 'Claim #',
      sortable: true,
      render: (payment) => (
        <span className="text-sm text-muted-foreground">{payment.claimNumber}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      width: '120px',
      render: (payment) => (
        <span className="font-semibold">${payment.amount.toFixed(2)}</span>
      ),
    },
    {
      key: 'paymentType',
      header: 'Type',
      sortable: true,
      width: '120px',
      render: (payment) => (
        <Badge variant="outline" className="capitalize">
          {payment.paymentType.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      sortable: true,
      width: '120px',
      render: (payment) => (
        <div className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          <span className="text-sm capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Date',
      sortable: true,
      render: (payment) => new Date(payment.paymentDate).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (payment) => <StatusBadge status={payment.status} />,
    },
  ];

  const accountColumns: Column<PatientAccount>[] = [
    {
      key: 'patientId',
      header: 'Patient ID',
      sortable: true,
      width: '120px',
      render: (account) => (
        <span className="font-medium text-primary">{account.patientId}</span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Name',
      sortable: true,
    },
    {
      key: 'totalBalance',
      header: 'Total Balance',
      sortable: true,
      width: '140px',
      render: (account) => (
        <span className={`font-semibold ${account.totalBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
          ${account.totalBalance.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'insuranceBalance',
      header: 'Insurance',
      sortable: true,
      width: '120px',
      render: (account) => `$${account.insuranceBalance.toFixed(2)}`,
    },
    {
      key: 'patientBalance',
      header: 'Patient',
      sortable: true,
      width: '120px',
      render: (account) => `$${account.patientBalance.toFixed(2)}`,
    },
    {
      key: 'lastPaymentDate',
      header: 'Last Payment',
      sortable: true,
      render: (account) =>
        account.lastPaymentDate
          ? new Date(account.lastPaymentDate).toLocaleDateString()
          : 'N/A',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (account) => <StatusBadge status={account.status} />,
    },
  ];

  const handleRowClick = (item: Payment | PatientAccount) => {
    console.log('Navigate to detail:', item.id);
  };

  const handleRecordPayment = () => {
    toast({
      title: 'Payment Recorded',
      description: 'Payment has been successfully recorded',
    });
    setRecordPaymentOpen(false);
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your payment export is being prepared...',
    });
  };

  const typeCounts = {
    all: payments.length,
    insurance: payments.filter((p) => p.paymentType === 'insurance').length,
    patient: payments.filter((p) => p.paymentType === 'patient').length,
    copay: payments.filter((p) => p.paymentType === 'copay').length,
  };

  const totalCollected = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueAccounts = accounts.filter((a) => a.status === 'overdue').length;
  const totalOutstanding = accounts.reduce((sum, a) => sum + a.totalBalance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Processing"
        description="Record and manage patient and insurance payments"
        breadcrumbs={[
          { label: 'Revenue Cycle', url: '/rcm/dashboard' },
          { label: 'Payments' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Record New Payment</DialogTitle>
                  <DialogDescription>
                    Enter payment details to record a new payment transaction
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="patient">Patient</Label>
                    <Input id="patient" placeholder="Search patient..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="claim">Claim Number</Label>
                    <Input id="claim" placeholder="CLM-XXXXXX" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input id="amount" type="number" placeholder="0.00" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Payment Type</Label>
                      <Select>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="patient">Patient</SelectItem>
                          <SelectItem value="copay">Co-pay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="method">Payment Method</Label>
                      <Select>
                        <SelectTrigger id="method">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="ach">ACH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Payment Date</Label>
                      <Input id="date" type="date" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmation">Confirmation Number</Label>
                    <Input id="confirmation" placeholder="Optional" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRecordPaymentOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRecordPayment}>Record Payment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalCollected.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalOutstanding.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.length} patient accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueAccounts}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeCounts.all}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Payments and Accounts */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="accounts">Patient Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {/* Payments Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Transactions</CardTitle>
                  <CardDescription>
                    {typeFilter === 'all'
                      ? 'All payment transactions'
                      : `${typeFilter} payments`}
                  </CardDescription>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="copay">Co-pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredPayments}
                columns={paymentColumns}
                searchable
                searchPlaceholder="Search payments..."
                onRowClick={handleRowClick}
                emptyMessage="No payments found"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Payment Method Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ACH</span>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {payments.filter((p) => p.paymentMethod === 'ach').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Credit Card</span>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {payments.filter((p) => p.paymentMethod === 'credit_card').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Check</span>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {payments.filter((p) => p.paymentMethod === 'check').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cash</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {payments.filter((p) => p.paymentMethod === 'cash').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {/* Patient Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Account Balances</CardTitle>
              <CardDescription>Outstanding balances by patient</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={accounts}
                columns={accountColumns}
                searchable
                searchPlaceholder="Search accounts..."
                onRowClick={handleRowClick}
                emptyMessage="No accounts found"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Overdue Accounts Alert */}
          {overdueAccounts > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-orange-900 dark:text-orange-100">
                    Overdue Accounts Requiring Action
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accounts
                    .filter((a) => a.status === 'overdue')
                    .map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{account.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.patientId} • Last payment:{' '}
                            {account.lastPaymentDate
                              ? new Date(account.lastPaymentDate).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">
                            ${account.totalBalance.toFixed(2)}
                          </p>
                          <Button size="sm" variant="outline">
                            Contact Patient
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common payment processing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Receipt className="mr-2 h-4 w-4" />
              Generate Statement
            </Button>
            <Button variant="outline" className="justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              Process Refund
            </Button>
            <Button variant="outline" className="justify-start">
              <CreditCard className="mr-2 h-4 w-4" />
              Setup Payment Plan
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Download ERA Files
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
