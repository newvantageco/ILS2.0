import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Save, 
  Printer, 
  Send, 
  Eye, 
  User, 
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  Glasses,
  Stethoscope,
  Camera,
  Microscope,
  Droplets,
  Target,
  X,
  Lock,
  ShieldCheck
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

interface EyeExamination {
  id: string;
  patientId: string;
  examinationDate: string;
  status: 'in_progress' | 'finalized';
  reasonForVisit: string;
  medicalHistory: any;
  visualAcuity: any;
  refraction: any;
  binocularVision: any;
  eyeHealth: any;
  equipmentReadings: any;
  notes: string;
  // Clinical sections
  symptoms?: string;
  history?: string;
  medication?: string;
  previousRx?: any;
  currentRx?: any;
  autoRefraction?: any;
  subjective?: any;
  binocularity?: any;
  ophthalmoscopy?: any;
  tonometry?: any;
  additionalTests?: any;
  recommendations?: string;
  recall?: string;
  clinicalNotes?: string;
}

export default function EyeExamination() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('history');
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is optometrist or admin (for testing)
  const isOptometrist = user?.enhancedRole === 'optometrist' || user?.role === 'ecp' || user?.role === 'platform_admin' || user?.role === 'admin';
  const canEdit = isOptometrist;

  // Debug logging
  useEffect(() => {
    console.log('🔍 EyeExamination Debug:', {
      userRole: user?.role,
      enhancedRole: user?.enhancedRole,
      isOptometrist,
      canEdit,
      userId: user?.id
    });
  }, [user, isOptometrist, canEdit]);

  // Form state
  const [formData, setFormData] = useState<Partial<EyeExamination>>({
    status: 'in_progress',
    reasonForVisit: '',
    symptoms: '',
    history: '',
    medication: '',
    notes: '',
    recommendations: '',
    recall: '',
    clinicalNotes: '',
    previousRx: {},
    currentRx: {},
    autoRefraction: {},
    subjective: {},
    binocularity: {},
    visualAcuity: {},
    ophthalmoscopy: {},
    tonometry: {},
    additionalTests: {},
  });

  // Fetch examination if editing
  const { data: examination } = useQuery<EyeExamination>({
    queryKey: [`/api/examinations/${id}`],
    enabled: !!id,
  });

  // Fetch patient list
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (examination) {
      setFormData(examination);
      const patient = patients.find(p => p.id === examination.patientId);
      if (patient) setSelectedPatient(patient);
    }
  }, [examination, patients]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<EyeExamination>) => {
      const url = id ? `/api/examinations/${id}` : '/api/examinations';
      const method = id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save examination');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/examinations'] });
      setIsSaving(false);
    },
  });

  const handleSave = async (status: 'in_progress' | 'finalized' = 'in_progress') => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "Only optometrists can edit examination records",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({ ...formData, status });
      toast({
        title: "Success",
        description: "Examination saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save examination",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "Only optometrists can finalize examinations",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm('Finalize this examination? This cannot be undone.')) {
      await handleSave('finalized');
      setLocation('/ecp/examinations');
    }
  };

  // Refraction input component
  const RefractionInput = ({ 
    label, 
    side, 
    values, 
    onChange 
  }: { 
    label: string; 
    side: 'od' | 'os'; 
    values: any; 
    onChange: (field: string, value: string) => void;
  }) => (
    <div className="grid grid-cols-4 gap-2">
      <div>
        <Label className="text-xs">Sphere</Label>
        <Input
          placeholder="0.00"
          value={values[`${side}Sphere`] || ''}
          onChange={(e) => onChange(`${side}Sphere`, e.target.value)}
          className="h-8"
          disabled={!canEdit}
          readOnly={!canEdit}
        />
      </div>
      <div>
        <Label className="text-xs">Cyl</Label>
        <Input
          placeholder="0.00"
          value={values[`${side}Cyl`] || ''}
          onChange={(e) => onChange(`${side}Cyl`, e.target.value)}
          className="h-8"
          disabled={!canEdit}
          readOnly={!canEdit}
        />
      </div>
      <div>
        <Label className="text-xs">Axis</Label>
        <Input
          placeholder="0"
          value={values[`${side}Axis`] || ''}
          onChange={(e) => onChange(`${side}Axis`, e.target.value)}
          className="h-8"
          disabled={!canEdit}
          readOnly={!canEdit}
        />
      </div>
      <div>
        <Label className="text-xs">Add</Label>
        <Input
          placeholder="0.00"
          value={values[`${side}Add`] || ''}
          onChange={(e) => onChange(`${side}Add`, e.target.value)}
          className="h-8"
          disabled={!canEdit}
          readOnly={!canEdit}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900">
                  {id ? 'View' : 'New'} Eye Examination
                </h1>
                {!canEdit && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Read Only
                  </Badge>
                )}
                {canEdit && (user?.role === 'platform_admin' || user?.role === 'admin') && (
                  <Badge variant="default" className="flex items-center gap-1 bg-purple-600">
                    <ShieldCheck className="h-3 w-3" />
                    Admin Access
                  </Badge>
                )}
                {canEdit && (user?.enhancedRole === 'optometrist' || user?.role === 'ecp') && (
                  <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                    <ShieldCheck className="h-3 w-3" />
                    Optometrist
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {canEdit 
                  ? 'Comprehensive clinical record & prescription' 
                  : 'View-only access - Contact optometrist to make changes'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation('/ecp/examinations')}>
              <X className="mr-2 h-4 w-4" />
              {canEdit ? 'Cancel' : 'Back'}
            </Button>
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSave('in_progress')}
                  disabled={isSaving || examination?.status === 'finalized'}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button 
                  onClick={handleFinalize} 
                  disabled={isSaving || examination?.status === 'finalized'}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalize
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Patient Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>Select Patient</Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => {
                    const patient = patients.find(p => p.id === value);
                    setSelectedPatient(patient || null);
                    setFormData({ ...formData, patientId: value });
                  }}
                  disabled={!canEdit || !!id}
                >
                  <SelectTrigger className={!canEdit || !!id ? 'bg-slate-50' : ''}>
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
                <Label>Examination Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={!canEdit}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.examinationDate 
                        ? format(new Date(formData.examinationDate), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.examinationDate ? new Date(formData.examinationDate) : undefined}
                      onSelect={(date) => setFormData({ ...formData, examinationDate: date?.toISOString() })}
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

        {/* Clinical Examination Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-2">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="history">
                <FileText className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="refraction">
                <Glasses className="mr-2 h-4 w-4" />
                Refraction
              </TabsTrigger>
              <TabsTrigger value="binocular">
                <Eye className="mr-2 h-4 w-4" />
                Binocular
              </TabsTrigger>
              <TabsTrigger value="health">
                <Stethoscope className="mr-2 h-4 w-4" />
                Eye Health
              </TabsTrigger>
              <TabsTrigger value="tests">
                <Activity className="mr-2 h-4 w-4" />
                Tests
              </TabsTrigger>
              <TabsTrigger value="summary">
                <CheckCircle className="mr-2 h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>
          </div>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reason for Visit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Chief Complaint</Label>
                    <Textarea
                      placeholder="Patient's main reason for visit..."
                      value={formData.reasonForVisit || ''}
                      onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                      rows={3}
                      disabled={!canEdit}
                      readOnly={!canEdit}
                      className={!canEdit ? 'bg-slate-50' : ''}
                    />
                  </div>
                  <div>
                    <Label>Symptoms</Label>
                    <Textarea
                      placeholder="Detailed symptoms, duration, frequency..."
                      value={formData.symptoms || ''}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                      rows={4}
                      disabled={!canEdit}
                      readOnly={!canEdit}
                      className={!canEdit ? 'bg-slate-50' : ''}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Medical History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>General Health</Label>
                    <Textarea
                      placeholder="Medical conditions, surgeries, family history..."
                      value={formData.history || ''}
                      onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Current Medications</Label>
                    <Textarea
                      placeholder="List all medications and dosages..."
                      value={formData.medication || ''}
                      onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Previous Prescription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Right Eye (OD)</Label>
                  <RefractionInput
                    label="OD"
                    side="od"
                    values={formData.previousRx || {}}
                    onChange={(field, value) => {
                      setFormData({
                        ...formData,
                        previousRx: { ...formData.previousRx, [field]: value }
                      });
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Left Eye (OS)</Label>
                  <RefractionInput
                    label="OS"
                    side="os"
                    values={formData.previousRx || {}}
                    onChange={(field, value) => {
                      setFormData({
                        ...formData,
                        previousRx: { ...formData.previousRx, [field]: value }
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refraction Tab */}
          <TabsContent value="refraction" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Auto-Refraction</CardTitle>
                    <Badge variant="secondary">
                      <Camera className="mr-1 h-3 w-3" />
                      Auto
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Right Eye (OD)</Label>
                    <RefractionInput
                      label="OD"
                      side="od"
                      values={formData.autoRefraction || {}}
                      onChange={(field, value) => {
                        setFormData({
                          ...formData,
                          autoRefraction: { ...formData.autoRefraction, [field]: value }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Left Eye (OS)</Label>
                    <RefractionInput
                      label="OS"
                      side="os"
                      values={formData.autoRefraction || {}}
                      onChange={(field, value) => {
                        setFormData({
                          ...formData,
                          autoRefraction: { ...formData.autoRefraction, [field]: value }
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Subjective Refraction</CardTitle>
                    <Badge variant="default">
                      <Eye className="mr-1 h-3 w-3" />
                      Final Rx
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Right Eye (OD)</Label>
                    <RefractionInput
                      label="OD"
                      side="od"
                      values={formData.subjective || {}}
                      onChange={(field, value) => {
                        setFormData({
                          ...formData,
                          subjective: { ...formData.subjective, [field]: value }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Left Eye (OS)</Label>
                    <RefractionInput
                      label="OS"
                      side="os"
                      values={formData.subjective || {}}
                      onChange={(field, value) => {
                        setFormData({
                          ...formData,
                          subjective: { ...formData.subjective, [field]: value }
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Acuity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>OD Unaided</Label>
                    <Input
                      placeholder="6/6"
                      value={formData.visualAcuity?.odUnaided || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        visualAcuity: { ...formData.visualAcuity, odUnaided: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>OD Aided</Label>
                    <Input
                      placeholder="6/6"
                      value={formData.visualAcuity?.odAided || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        visualAcuity: { ...formData.visualAcuity, odAided: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>OS Unaided</Label>
                    <Input
                      placeholder="6/6"
                      value={formData.visualAcuity?.osUnaided || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        visualAcuity: { ...formData.visualAcuity, osUnaided: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>OS Aided</Label>
                    <Input
                      placeholder="6/6"
                      value={formData.visualAcuity?.osAided || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        visualAcuity: { ...formData.visualAcuity, osAided: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Binocular Tab */}
          <TabsContent value="binocular" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Binocular Vision Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cover Test (Distance)</Label>
                    <Input
                      placeholder="Ortho"
                      value={formData.binocularity?.coverTestDistance || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        binocularity: { ...formData.binocularity, coverTestDistance: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Cover Test (Near)</Label>
                    <Input
                      placeholder="Ortho"
                      value={formData.binocularity?.coverTestNear || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        binocularity: { ...formData.binocularity, coverTestNear: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Stereopsis</Label>
                    <Input
                      placeholder="40 arcsec"
                      value={formData.binocularity?.stereopsis || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        binocularity: { ...formData.binocularity, stereopsis: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Near Point of Convergence</Label>
                    <Input
                      placeholder="6 cm"
                      value={formData.binocularity?.npc || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        binocularity: { ...formData.binocularity, npc: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Accommodation</Label>
                    <Input
                      placeholder="Normal"
                      value={formData.binocularity?.accommodation || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        binocularity: { ...formData.binocularity, accommodation: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Pupil Reactions</Label>
                    <Input
                      placeholder="PERRLA"
                      value={formData.binocularity?.pupils || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        binocularity: { ...formData.binocularity, pupils: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Detailed binocular vision findings..."
                    value={formData.binocularity?.notes || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      binocularity: { ...formData.binocularity, notes: e.target.value }
                    })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Eye Health Tab */}
          <TabsContent value="health" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Microscope className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Ophthalmoscopy</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Right Eye (OD)</Label>
                    <Textarea
                      placeholder="Disc: Healthy, pink, sharp margins
C/D ratio: 0.3
Macula: Healthy, normal foveal reflex
Vessels: Normal caliber, no abnormalities
Periphery: Healthy, no lesions"
                      value={formData.ophthalmoscopy?.od || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        ophthalmoscopy: { ...formData.ophthalmoscopy, od: e.target.value }
                      })}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>Left Eye (OS)</Label>
                    <Textarea
                      placeholder="Disc: Healthy, pink, sharp margins
C/D ratio: 0.3
Macula: Healthy, normal foveal reflex
Vessels: Normal caliber, no abnormalities
Periphery: Healthy, no lesions"
                      value={formData.ophthalmoscopy?.os || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        ophthalmoscopy: { ...formData.ophthalmoscopy, os: e.target.value }
                      })}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Anterior Eye</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Right Eye (OD)</Label>
                    <Textarea
                      placeholder="Lids & Lashes: Normal
Conjunctiva: White and quiet
Cornea: Clear
AC: Deep and quiet
Iris: Normal pattern
Lens: Clear"
                      value={formData.ophthalmoscopy?.odAnterior || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        ophthalmoscopy: { ...formData.ophthalmoscopy, odAnterior: e.target.value }
                      })}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>Left Eye (OS)</Label>
                    <Textarea
                      placeholder="Lids & Lashes: Normal
Conjunctiva: White and quiet
Cornea: Clear
AC: Deep and quiet
Iris: Normal pattern
Lens: Clear"
                      value={formData.ophthalmoscopy?.osAnterior || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        ophthalmoscopy: { ...formData.ophthalmoscopy, osAnterior: e.target.value }
                      })}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Tonometry & Additional Tests</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>IOP - Right Eye (OD)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="14"
                        value={formData.tonometry?.od || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          tonometry: { ...formData.tonometry, od: e.target.value }
                        })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">mmHg</span>
                    </div>
                  </div>
                  <div>
                    <Label>IOP - Left Eye (OS)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="14"
                        value={formData.tonometry?.os || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          tonometry: { ...formData.tonometry, os: e.target.value }
                        })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">mmHg</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Visual Fields</Label>
                  <Textarea
                    placeholder="Confrontation test: Full to confrontation OU
No defects detected"
                    value={formData.additionalTests?.visualFields || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      additionalTests: { ...formData.additionalTests, visualFields: e.target.value }
                    })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Color Vision</Label>
                  <Textarea
                    placeholder="Ishihara plates: Normal
No color deficiency detected"
                    value={formData.additionalTests?.colorVision || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      additionalTests: { ...formData.additionalTests, colorVision: e.target.value }
                    })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Other Tests Performed</Label>
                  <Textarea
                    placeholder="List any additional tests and findings..."
                    value={formData.additionalTests?.other || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      additionalTests: { ...formData.additionalTests, other: e.target.value }
                    })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clinical Summary & Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Assessment & Diagnosis</Label>
                  <Textarea
                    placeholder="Summary of findings and clinical assessment..."
                    value={formData.clinicalNotes || ''}
                    onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Management Plan & Recommendations</Label>
                  <Textarea
                    placeholder="Treatment plan, recommendations, advice given to patient..."
                    value={formData.recommendations || ''}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Recall Period</Label>
                    <Select
                      value={formData.recall || ''}
                      onValueChange={(value) => setFormData({ ...formData, recall: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recall period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6months">6 Months</SelectItem>
                        <SelectItem value="12months">12 Months</SelectItem>
                        <SelectItem value="18months">18 Months</SelectItem>
                        <SelectItem value="24months">24 Months</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Next Appointment</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Pick a date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Additional Clinical Notes</Label>
                  <Textarea
                    placeholder="Any additional notes, observations, or follow-up required..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-muted-foreground">
                      Review all sections before finalizing
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Record
                    </Button>
                    <Button variant="outline">
                      <Send className="mr-2 h-4 w-4" />
                      Create Prescription
                    </Button>
                    <Button onClick={handleFinalize}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalize Examination
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
