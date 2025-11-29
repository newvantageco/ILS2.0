/**
 * Waitlist Management Page
 *
 * Manages the appointment waitlist queue for patients seeking earlier appointments.
 * Allows staff to view, prioritize, and fulfill waitlist requests when slots become available.
 *
 * SECURITY: Requires admin, company_admin, manager, or receptionist roles
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Search,
  Filter,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  appointmentType: string;
  preferredDate?: string;
  preferredTimeRange?: string;
  flexibility: 'strict' | 'flexible' | 'very_flexible';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  createdAt: string;
  status: 'active' | 'fulfilled' | 'cancelled';
}

export default function WaitlistManagementPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [fulfillmentNotes, setFulfillmentNotes] = useState("");

  const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist'];

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
              You do not have permission to access waitlist management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-red-800">
              <p>
                <strong>Required roles:</strong> Admin, Company Admin, Manager, or Receptionist
              </p>
              <p>
                <strong>Your role:</strong> {user.role}
              </p>
              <p className="pt-2">
                Please contact your administrator if you believe you should have access to this feature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch waitlist entries
  const { data: waitlistData, isLoading, refetch } = useQuery({
    queryKey: ['/api/appointments/waitlist'],
    queryFn: async () => {
      const res = await fetch('/api/appointments/waitlist', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch waitlist');
      }
      return res.json() as Promise<{ success: boolean; entries: WaitlistEntry[] }>;
    },
  });

  // Fulfill waitlist entry mutation
  const fulfillMutation = useMutation({
    mutationFn: async (data: {
      entryId: string;
      appointmentDate: string;
      appointmentTime: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/appointments/waitlist/${data.entryId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          notes: data.notes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fulfill waitlist entry');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Waitlist Entry Fulfilled",
        description: "The patient has been scheduled for an appointment.",
      });
      refetch();
      setFulfillDialogOpen(false);
      resetFulfillForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel waitlist entry mutation
  const cancelMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/appointments/waitlist/${entryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel waitlist entry');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry Cancelled",
        description: "The waitlist entry has been cancelled.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetFulfillForm = () => {
    setSelectedEntry(null);
    setAppointmentDate("");
    setAppointmentTime("");
    setFulfillmentNotes("");
  };

  const handleFulfillClick = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setFulfillDialogOpen(true);
  };

  const handleFulfillSubmit = () => {
    if (!selectedEntry || !appointmentDate || !appointmentTime) {
      toast({
        title: "Validation Error",
        description: "Please provide both appointment date and time.",
        variant: "destructive",
      });
      return;
    }

    fulfillMutation.mutate({
      entryId: selectedEntry.id,
      appointmentDate,
      appointmentTime,
      notes: fulfillmentNotes,
    });
  };

  // Filter and search logic
  const filteredEntries = waitlistData?.entries?.filter((entry) => {
    const matchesSearch = entry.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.appointmentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || entry.appointmentType === filterType;
    const matchesPriority = filterPriority === "all" || entry.priority === filterPriority;
    const isActive = entry.status === 'active';

    return matchesSearch && matchesType && matchesPriority && isActive;
  }) || [];

  // Calculate statistics
  const stats = {
    total: waitlistData?.entries?.filter(e => e.status === 'active').length || 0,
    urgent: waitlistData?.entries?.filter(e => e.status === 'active' && e.priority === 'urgent').length || 0,
    high: waitlistData?.entries?.filter(e => e.status === 'active' && e.priority === 'high').length || 0,
    avgWaitDays: waitlistData?.entries?.length
      ? Math.floor(
          waitlistData.entries
            .filter(e => e.status === 'active')
            .reduce((sum, e) => {
              const daysSince = Math.floor(
                (Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + daysSince;
            }, 0) / Math.max(1, waitlistData.entries.filter(e => e.status === 'active').length)
        )
      : 0,
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Urgent</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-orange-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getFlexibilityBadge = (flexibility: string) => {
    switch (flexibility) {
      case 'strict':
        return <Badge variant="outline" className="bg-red-50">Strict</Badge>;
      case 'flexible':
        return <Badge variant="outline" className="bg-yellow-50">Flexible</Badge>;
      case 'very_flexible':
        return <Badge variant="outline" className="bg-green-50">Very Flexible</Badge>;
      default:
        return <Badge variant="outline">{flexibility}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Waitlist Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage appointment waitlist and fulfill requests when slots become available
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Patients waiting for appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground">
              High priority requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgWaitDays}</div>
            <p className="text-xs text-muted-foreground">
              Days on waitlist
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by patient or appointment type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterType">Appointment Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filterType">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="eye_examination">Eye Examination</SelectItem>
                  <SelectItem value="contact_lens_fitting">Contact Lens Fitting</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterPriority">Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger id="filterPriority">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist Queue ({filteredEntries.length})
          </CardTitle>
          <CardDescription>
            Patients waiting for available appointment slots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No waitlist entries found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Appointment Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Flexibility</TableHead>
                    <TableHead>Preferred Date</TableHead>
                    <TableHead>Preferred Time</TableHead>
                    <TableHead>Wait Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const daysSince = Math.floor(
                      (Date.now() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.patientName}</TableCell>
                        <TableCell>{entry.appointmentType.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{getPriorityBadge(entry.priority)}</TableCell>
                        <TableCell>{getFlexibilityBadge(entry.flexibility)}</TableCell>
                        <TableCell>
                          {entry.preferredDate
                            ? format(parseISO(entry.preferredDate), 'MMM dd, yyyy')
                            : 'Any date'}
                        </TableCell>
                        <TableCell>{entry.preferredTimeRange || 'Any time'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" />
                            {daysSince} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleFulfillClick(entry)}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Fulfill
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelMutation.mutate(entry.id)}
                              className="flex items-center gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fulfill Dialog */}
      <Dialog open={fulfillDialogOpen} onOpenChange={setFulfillDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fulfill Waitlist Request</DialogTitle>
            <DialogDescription>
              Schedule an appointment for {selectedEntry?.patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedEntry && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Appointment Type:</span>
                    <p className="text-muted-foreground">{selectedEntry.appointmentType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>
                    <div className="mt-1">{getPriorityBadge(selectedEntry.priority)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Preferred Date:</span>
                    <p className="text-muted-foreground">
                      {selectedEntry.preferredDate
                        ? format(parseISO(selectedEntry.preferredDate), 'MMM dd, yyyy')
                        : 'Any date'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Preferred Time:</span>
                    <p className="text-muted-foreground">{selectedEntry.preferredTimeRange || 'Any time'}</p>
                  </div>
                </div>
                {selectedEntry.notes && (
                  <div className="pt-2 border-t">
                    <span className="font-medium text-sm">Patient Notes:</span>
                    <p className="text-sm text-muted-foreground mt-1">{selectedEntry.notes}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Appointment Date *</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Appointment Time *</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fulfillmentNotes">Notes (optional)</Label>
              <Textarea
                id="fulfillmentNotes"
                placeholder="Add any notes about the scheduled appointment..."
                value={fulfillmentNotes}
                onChange={(e) => setFulfillmentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFulfillDialogOpen(false);
                resetFulfillForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFulfillSubmit}
              disabled={fulfillMutation.isPending || !appointmentDate || !appointmentTime}
            >
              {fulfillMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
