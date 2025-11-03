import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import AddPatientModal from "@/components/AddPatientModal";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/hooks/useAuth";

interface Patient {
  id: string;
  customerNumber: string;
  name: string;
  dateOfBirth: string | null;
  nhsNumber: string | null;
  email: string | null;
  phone: string | null;
  fullAddress: string | null;
  createdAt: Date;
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useAuth();
  
  // Check if user is optometrist (can create clinical examinations)
  const canCreateExamination = user?.enhancedRole === 'optometrist' || user?.role === 'ecp' || user?.role === 'platform_admin' || user?.role === 'admin' || user?.role === 'company_admin';

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const filteredPatients = patients?.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(query) ||
      patient.customerNumber.toLowerCase().includes(query) ||
      patient.nhsNumber?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={5} columns={6} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground mt-1">
            Manage patient records and examinations
          </p>
        </div>
        <Button 
          data-testid="button-add-patient"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <AddPatientModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1">
              <CardTitle>Patient Records</CardTitle>
              <CardDescription>View and manage patient information</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, NHS number, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-patients"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredPatients || filteredPatients.length === 0 ? (
            <EmptyState
              icon={UserCircle}
              title={searchQuery ? "No patients found" : "No patients yet"}
              description={
                searchQuery
                  ? "Try adjusting your search query"
                  : "Start by adding your first patient"
              }
              action={
                !searchQuery
                  ? {
                      label: "Add Patient",
                      onClick: () => setIsAddModalOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer #</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>NHS Number</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id} data-testid={`row-patient-${patient.id}`}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {patient.customerNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`text-patient-name-${patient.id}`}>{patient.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.dateOfBirth ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{patient.dateOfBirth}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.nhsNumber ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {patient.nhsNumber}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {patient.email && (
                            <div className="text-muted-foreground">{patient.email}</div>
                          )}
                          {patient.phone && (
                            <div className="text-muted-foreground">{patient.phone}</div>
                          )}
                          {!patient.email && !patient.phone && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canCreateExamination && (
                            <Link href={`/ecp/examination/new?patientId=${patient.id}`}>
                              <Button 
                                size="sm" 
                                variant="default"
                                data-testid={`button-new-test-${patient.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                New Examination
                              </Button>
                            </Link>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled
                            data-testid={`button-view-history-${patient.id}`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            History
                          </Button>
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

      {filteredPatients && filteredPatients.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredPatients.length} of {patients?.length} patients
        </div>
      )}
    </div>
  );
}
