import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Calendar as CalendarIcon,
  Save,
  X,
  Glasses,
  User,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  nhsNumber?: string;
  email?: string;
  customerNumber: string;
}

export default function AddOutsideRx() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    prescriptionSource: '',
    prescriptionDate: new Date(),
    examinationDate: new Date(),
    odSphere: '',
    odCylinder: '',
    odAxis: '',
    odAdd: '',
    osSphere: '',
    osCylinder: '',
    osAxis: '',
    osAdd: '',
    pd: '',
    notes: '',
  });

  // Fetch patient list
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/examinations/outside-rx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add outside prescription');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/examinations'] });
      toast({
        title: "Success",
        description: "Outside prescription added successfully",
      });
      setLocation('/ecp/examinations');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    if (!formData.patientId || !formData.prescriptionSource) {
      toast({
        title: "Validation Error",
        description: "Please select a patient and enter prescription source",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveMutation.mutateAsync(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ExternalLink className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Add Outside Prescription</h1>
              <p className="text-sm text-muted-foreground">
                Record prescription from external optometrist or optician
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation('/ecp/examinations')}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Add Prescription
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Outside Prescription</p>
                <p className="text-sm text-amber-700 mt-1">
                  This feature allows you to record prescriptions obtained from other optometrists or opticians. 
                  The record will be marked as "Outside Rx" and automatically finalized.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Patient Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Select Patient *</Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => {
                    const patient = patients.find(p => p.id === value);
                    setSelectedPatient(patient || null);
                    setFormData({ ...formData, patientId: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} - {patient.customerNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date Recorded</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.examinationDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.examinationDate}
                      onSelect={(date) => setFormData({ ...formData, examinationDate: date || new Date() })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {selectedPatient && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">DOB</p>
                  <p className="font-medium">{selectedPatient.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NHS Number</p>
                  <p className="font-medium">{selectedPatient.nhsNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer #</p>
                  <p className="font-medium">{selectedPatient.customerNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{selectedPatient.email || 'N/A'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prescription Source */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle>Prescription Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Prescription Source *</Label>
                <Input
                  placeholder="e.g., Specsavers, Vision Express, Private Optometrist"
                  value={formData.prescriptionSource}
                  onChange={(e) => setFormData({ ...formData, prescriptionSource: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Name of optometrist or optical practice
                </p>
              </div>
              <div>
                <Label>Prescription Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.prescriptionDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.prescriptionDate}
                      onSelect={(date) => setFormData({ ...formData, prescriptionDate: date || new Date() })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prescription Values */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Glasses className="h-5 w-5 text-blue-600" />
              <CardTitle>Prescription Values</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Right Eye (OD) */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Right Eye (OD)</Label>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Sphere</Label>
                  <Input
                    placeholder="0.00"
                    value={formData.odSphere}
                    onChange={(e) => setFormData({ ...formData, odSphere: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cylinder</Label>
                  <Input
                    placeholder="0.00"
                    value={formData.odCylinder}
                    onChange={(e) => setFormData({ ...formData, odCylinder: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Axis</Label>
                  <Input
                    placeholder="0"
                    value={formData.odAxis}
                    onChange={(e) => setFormData({ ...formData, odAxis: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Add</Label>
                  <Input
                    placeholder="0.00"
                    value={formData.odAdd}
                    onChange={(e) => setFormData({ ...formData, odAdd: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Left Eye (OS) */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Left Eye (OS)</Label>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Sphere</Label>
                  <Input
                    placeholder="0.00"
                    value={formData.osSphere}
                    onChange={(e) => setFormData({ ...formData, osSphere: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cylinder</Label>
                  <Input
                    placeholder="0.00"
                    value={formData.osCylinder}
                    onChange={(e) => setFormData({ ...formData, osCylinder: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Axis</Label>
                  <Input
                    placeholder="0"
                    value={formData.osAxis}
                    onChange={(e) => setFormData({ ...formData, osAxis: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Add</Label>
                  <Input
                    placeholder="0.00"
                    value={formData.osAdd}
                    onChange={(e) => setFormData({ ...formData, osAdd: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* PD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Pupillary Distance (PD)</Label>
                <Input
                  placeholder="e.g., 62"
                  value={formData.pd}
                  onChange={(e) => setFormData({ ...formData, pd: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any additional information about this prescription..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-muted-foreground">
                  This prescription will be saved as "Outside Rx" and automatically finalized
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setLocation('/ecp/examinations')}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Add Prescription'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
