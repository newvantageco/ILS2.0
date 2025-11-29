/**
 * Dispenser Handoff Queue Page
 *
 * Critical workflow bridge between clinical (ECP) and retail (Dispenser) operations.
 * Shows recently completed eye examinations ready for dispensing, enabling smooth
 * patient handoff from optometrist to optical dispenser for frame selection and sales.
 *
 * SECURITY: Requires dispenser, ecp, admin, company_admin, or manager roles
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  UserCheck,
  Eye,
  Clock,
  CheckCircle2,
  Shield,
  ArrowRight,
  RefreshCw,
  Users,
  AlertCircle,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";

interface ExaminationHandoff {
  id: string;
  patientId: string;
  patientName: string;
  examinationDate: string;
  status: 'completed' | 'finalized';
  ecpId: string;
  performedBy: string;
  diagnosis: string;
  managementPlan: string;
}

export default function DispenserHandoffPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState("2");
  const [selectedExam, setSelectedExam] = useState<ExaminationHandoff | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'dispenser', 'ecp'];

  // Role-based access control
  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="h-6 w-6" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-red-700">
              You do not have permission to access the dispenser handoff queue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-red-800">
              <p>
                <strong>Required roles:</strong> Admin, Company Admin, Manager, Dispenser, or ECP
              </p>
              <p>
                <strong>Your role:</strong> {user.role}
              </p>
              <p className="pt-2">
                This feature enables smooth patient handoff from clinical to retail operations.
                Please contact your administrator if you believe you should have access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch recent examinations ready for handoff
  const { data: handoffData, isLoading, refetch } = useQuery({
    queryKey: ['/api/examinations/recent', timeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/examinations/recent?hours=${timeFilter}&status=completed`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch handoff queue');
      }
      const data = await res.json();
      return {
        examinations: data.examinations as ExaminationHandoff[],
        count: data.count,
        hours: data.hours,
      };
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleClaimPatient = (exam: ExaminationHandoff) => {
    setSelectedExam(exam);
    setClaimDialogOpen(true);
  };

  const handleProceedToDispensing = () => {
    if (!selectedExam) return;

    toast({
      title: "Patient Claimed",
      description: `${selectedExam.patientName} is ready for dispensing. Redirecting to POS...`,
    });

    // Close dialog and navigate to POS or patient profile
    setClaimDialogOpen(false);

    // In a real implementation, this would navigate to POS with pre-loaded patient data
    // window.location.href = `/ecp/pos?patientId=${selectedExam.patientId}`;
  };

  // Calculate statistics
  const stats = {
    total: handoffData?.examinations?.length || 0,
    urgent: handoffData?.examinations?.filter(e =>
      e.diagnosis?.toLowerCase().includes('urgent') ||
      e.diagnosis?.toLowerCase().includes('refer')
    ).length || 0,
    withPrescription: handoffData?.examinations?.filter(e =>
      e.managementPlan?.toLowerCase().includes('prescription') ||
      e.managementPlan?.toLowerCase().includes('spectacles') ||
      e.managementPlan?.toLowerCase().includes('glasses')
    ).length || 0,
  };

  const getTimeSinceExam = (examDate: string) => {
    try {
      return formatDistanceToNow(parseISO(examDate), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getPriorityBadge = (exam: ExaminationHandoff) => {
    const diagnosis = exam.diagnosis?.toLowerCase() || '';

    if (diagnosis.includes('urgent') || diagnosis.includes('refer')) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Urgent
        </Badge>
      );
    }

    if (diagnosis.includes('follow-up') || diagnosis.includes('monitor')) {
      return <Badge variant="default" className="bg-orange-500">Follow-up</Badge>;
    }

    return <Badge variant="outline" className="bg-green-50">Routine</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-8 w-8" />
            Dispenser Handoff Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Recently completed examinations ready for optical dispensing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 1 hour</SelectItem>
              <SelectItem value="2">Last 2 hours</SelectItem>
              <SelectItem value="4">Last 4 hours</SelectItem>
              <SelectItem value="8">Last 8 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients in Queue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Ready for dispensing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Prescription</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.withPrescription}</div>
            <p className="text-xs text-muted-foreground">
              Ready for frame selection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Handoff Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Examination Queue ({handoffData?.count || 0})
          </CardTitle>
          <CardDescription>
            Patients who completed their eye examination in the last {timeFilter} hour(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !handoffData?.examinations || handoffData.examinations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No patients in handoff queue</p>
              <p className="text-sm mt-2">
                Completed examinations will appear here automatically
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Examined By</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Management Plan</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handoffData.examinations.map((exam) => (
                    <TableRow key={exam.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                            {exam.patientName.charAt(0).toUpperCase()}
                          </div>
                          {exam.patientName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {exam.performedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{getTimeSinceExam(exam.examinationDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(exam)}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm">
                          {exam.diagnosis || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm">
                          {exam.managementPlan || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleClaimPatient(exam)}
                          className="flex items-center gap-1"
                        >
                          <UserCheck className="h-4 w-4" />
                          Claim Patient
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim Patient Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Claim Patient for Dispensing</DialogTitle>
            <DialogDescription>
              Start dispensing workflow for {selectedExam?.patientName}
            </DialogDescription>
          </DialogHeader>

          {selectedExam && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <span className="text-sm font-medium">Patient:</span>
                  <p className="text-sm text-muted-foreground mt-1">{selectedExam.patientName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Examined By:</span>
                  <p className="text-sm text-muted-foreground mt-1">{selectedExam.performedBy}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Examination Date:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(selectedExam.examinationDate), 'PPp')}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <div className="mt-1">{getPriorityBadge(selectedExam)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <span className="text-sm font-medium">Diagnosis:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedExam.diagnosis || 'No diagnosis recorded'}
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <span className="text-sm font-medium">Management Plan:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedExam.managementPlan || 'No management plan recorded'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Next Steps:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-blue-800">
                    <li>Review prescription details with patient</li>
                    <li>Assist with frame selection and measurements</li>
                    <li>Process order through Point of Sale system</li>
                    <li>Schedule collection or delivery</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setClaimDialogOpen(false);
                setSelectedExam(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceedToDispensing}
              className="flex items-center gap-2"
            >
              Proceed to Dispensing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
