import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserCircle,
  Eye,
  FileText,
  Calendar,
  ShoppingCart,
  Receipt,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Cake,
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Smartphone,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

interface PatientSummary {
  patient: {
    id: string;
    customerNumber: string;
    name: string;
    dateOfBirth: string | null;
    nhsNumber: string | null;
    email: string | null;
    phone: string | null;
    fullAddress: string | null;
    createdAt: Date;
  };
  stats: {
    totalVisits: number;
    totalOrders: number;
    totalSpent: number;
    pendingBalance: number;
    lastVisit: string | null;
    nextAppointment: string | null;
  };
  appointments: Array<{
    id: string;
    bookingDate: string;
    status: string;
    testRoomName: string | null;
    notes: string | null;
  }>;
  examinations: Array<{
    id: string;
    examinationDate: string;
    examinationType: string | null;
    visualAcuityOd: string | null;
    visualAcuityOs: string | null;
    notes: string | null;
  }>;
  prescriptions: Array<{
    id: string;
    issueDate: string;
    prescriptionType: string | null;
    odSphere: string | null;
    odCylinder: string | null;
    odAxis: string | null;
    osSphere: string | null;
    osCylinder: string | null;
    osAxis: string | null;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    orderDate: string;
    status: string;
    lensType: string;
    lensMaterial: string;
    coating: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    status: string;
    totalAmount: string;
    amountPaid: string;
  }>;
}

export default function PatientProfile() {
  const [, params] = useRoute("/ecp/patients/:id");
  const patientId = params?.id;

  const { data: summary, isLoading, error, refetch } = useQuery<PatientSummary>({
    queryKey: [`/api/patients/${patientId}/summary`],
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <Link href="/ecp/patients">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>
        </Link>
        <ErrorState
          title="Couldn't load patient profile"
          message="We had trouble loading this patient's information. Please try again."
          error={error || undefined}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Patient not found</p>
              <Link href="/ecp/patients">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patients
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { patient, stats, appointments, examinations, prescriptions, orders, invoices } = summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ecp/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{patient.name}</h1>
            <p className="text-muted-foreground">Patient #{patient.customerNumber}</p>
          </div>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {patient.dateOfBirth && (
              <div className="flex items-start gap-3">
                <Cake className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{format(new Date(patient.dateOfBirth), "MMM d, yyyy")}</p>
                </div>
              </div>
            )}
            {patient.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{patient.email}</p>
                </div>
              </div>
            )}
            {patient.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{patient.phone}</p>
                </div>
              </div>
            )}
            {patient.nhsNumber && (
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">NHS Number</p>
                  <p className="font-medium">{patient.nhsNumber}</p>
                </div>
              </div>
            )}
            {patient.fullAddress && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{patient.fullAddress}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Total Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalVisits}</p>
            {stats.lastVisit && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {format(new Date(stats.lastVisit), "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£{stats.totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pending Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£{stats.pendingBalance.toFixed(2)}</p>
            {stats.nextAppointment && (
              <p className="text-xs text-muted-foreground mt-1">
                Next: {format(new Date(stats.nextAppointment), "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed data */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="examinations" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Examinations ({examinations.length})
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prescriptions ({prescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communications
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>Patient appointment history</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No appointments found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Test Room</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>{format(new Date(apt.bookingDate), "MMM d, yyyy HH:mm")}</TableCell>
                        <TableCell>{apt.testRoomName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={apt.status === "scheduled" ? "default" : "secondary"}>
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{apt.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examinations Tab */}
        <TabsContent value="examinations">
          <Card>
            <CardHeader>
              <CardTitle>Eye Examinations</CardTitle>
              <CardDescription>Clinical examination records</CardDescription>
            </CardHeader>
            <CardContent>
              {examinations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No examinations found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>VA (OD)</TableHead>
                      <TableHead>VA (OS)</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examinations.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>{format(new Date(exam.examinationDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{exam.examinationType || "Standard"}</TableCell>
                        <TableCell>{exam.visualAcuityOd || "—"}</TableCell>
                        <TableCell>{exam.visualAcuityOs || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{exam.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
              <CardDescription>Prescription history</CardDescription>
            </CardHeader>
            <CardContent>
              {prescriptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No prescriptions found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>OD</TableHead>
                      <TableHead>OS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((rx) => (
                      <TableRow key={rx.id}>
                        <TableCell>{format(new Date(rx.issueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{rx.prescriptionType || "Standard"}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {rx.odSphere} {rx.odCylinder} {rx.odAxis}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {rx.osSphere} {rx.osCylinder} {rx.osAxis}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Order history and tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lens Type</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Coating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{format(new Date(order.orderDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              order.status === "completed" ? "default" :
                              order.status === "in_progress" ? "secondary" :
                              "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.lensType}</TableCell>
                        <TableCell>{order.lensMaterial}</TableCell>
                        <TableCell>{order.coating}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Billing and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No invoices found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const total = parseFloat(invoice.totalAmount);
                      const paid = parseFloat(invoice.amountPaid);
                      const balance = total - paid;
                      
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{format(new Date(invoice.invoiceDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                invoice.status === "paid" ? "default" :
                                invoice.status === "draft" ? "secondary" :
                                "outline"
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>£{total.toFixed(2)}</TableCell>
                          <TableCell>£{paid.toFixed(2)}</TableCell>
                          <TableCell className={balance > 0 ? "text-orange-600 font-medium" : ""}>
                            £{balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications">
          <PatientCommunications patientId={patientId!} patient={patient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Patient Communications Component
function PatientCommunications({ patientId, patient }: { patientId: string; patient: any }) {
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/communications/messages/recipient/${patientId}`],
    queryFn: async () => {
      const res = await fetch(`/api/communications/messages/recipient/${patientId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  const { data: scheduledData, isLoading: scheduledLoading } = useQuery({
    queryKey: [`/api/communications/messages/scheduled-patient-${patientId}`],
    queryFn: async () => {
      const res = await fetch(`/api/communications/messages/scheduled?recipientId=${patientId}`, {
        credentials: 'include',
      });
      if (!res.ok) return { messages: [] };
      return res.json();
    },
  });

  const messages = messagesData?.messages || [];
  const scheduledMessages = scheduledData?.messages || [];
  const totalMessages = messages.length + scheduledMessages.length;

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Send className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any }> = {
      sent: { variant: "default", icon: CheckCircle2 },
      delivered: { variant: "default", icon: CheckCircle2 },
      opened: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: XCircle },
      scheduled: { variant: "secondary", icon: Clock },
    };

    const config = variants[status] || variants.sent;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isLoading = messagesLoading || scheduledLoading;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMessages}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {messages.length} sent, {scheduledMessages.length} scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {messages.filter((m: any) => ['delivered', 'opened'].includes(m.status)).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {messages.length > 0 &&
                `${((messages.filter((m: any) => ['delivered', 'opened'].includes(m.status)).length / messages.length) * 100).toFixed(1)}% delivery rate`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {messages.filter((m: any) => m.status === 'opened').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {messages.filter((m: any) => ['delivered', 'opened'].includes(m.status)).length > 0 &&
                `${((messages.filter((m: any) => m.status === 'opened').length / messages.filter((m: any) => ['delivered', 'opened'].includes(m.status)).length) * 100).toFixed(1)}% open rate`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Message History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>
                Messages sent to {patient.name}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href={`/ecp/preferences`}>
                <Button variant="outline" size="sm">
                  Preferences
                </Button>
              </Link>
              <Link href={`/ecp/templates`}>
                <Button size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : totalMessages === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No communications yet</h3>
              <p className="text-muted-foreground mb-4">
                No messages have been sent to this patient
              </p>
              <Link href={`/ecp/templates`}>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send First Message
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scheduled Messages */}
              {scheduledMessages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Scheduled Messages ({scheduledMessages.length})
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scheduled For</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Subject/Content</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledMessages.map((msg: any) => (
                        <TableRow key={msg.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(msg.scheduledFor), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getChannelIcon(msg.channel)}
                              <span className="capitalize">{msg.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {msg.subject || msg.body.substring(0, 50)}...
                          </TableCell>
                          <TableCell>
                            {msg.campaignName || msg.workflowName || 'Direct'}
                          </TableCell>
                          <TableCell>{getStatusBadge('scheduled')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Sent Messages */}
              {messages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message History ({messages.length})
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Subject/Content</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Opened</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages
                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((msg: any) => (
                        <TableRow key={msg.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(msg.createdAt), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getChannelIcon(msg.channel)}
                              <span className="capitalize">{msg.channel}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {msg.subject || msg.body.substring(0, 50)}...
                          </TableCell>
                          <TableCell>
                            {msg.campaignName || msg.workflowName || 'Direct'}
                          </TableCell>
                          <TableCell>{getStatusBadge(msg.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {msg.deliveredAt ? format(new Date(msg.deliveredAt), "HH:mm") : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {msg.openedAt ? format(new Date(msg.openedAt), "HH:mm") : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
