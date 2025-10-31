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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Save, 
  Eye, 
  User, 
  Calendar as CalendarIcon,
  FileText,
  Activity,
  CheckCircle,
  Glasses,
  Stethoscope,
  Microscope,
  Droplets,
  Target,
  Palette,
  Image as ImageIcon,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Scan,
  Printer,
  Phone,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Import Tab Components
import GeneralHistoryTab from '@/components/eye-exam/GeneralHistoryTab';
import CurrentRxTab from '@/components/eye-exam/CurrentRxTab';
import NewRxTab from '@/components/eye-exam/NewRxTab';
import OphthalmoscopyTab from '@/components/eye-exam/OphthalmoscopyTab';
import SlitLampTab from '@/components/eye-exam/SlitLampTab';
import AdditionalTestsTab from '@/components/eye-exam/AdditionalTestsTab';
import TonometryTab from '@/components/eye-exam/TonometryTab';
import SummaryTab from '@/components/eye-exam/SummaryTab';

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  nhsNumber?: string;
  email?: string;
  customerNumber: string;
  age?: number;
}

interface EyeExaminationData {
  id?: string;
  patientId: string;
  examinationDate: string;
  status: 'in_progress' | 'finalized';
  
  // Tab 1: General History
  generalHistory: {
    schedule: {
      date: string;
      seenBy: string;
      healthcare: 'private' | 'nhs';
      evidence?: string;
      notSeen?: boolean;
    };
    reasonForVisit: string;
    symptoms: {
      visualImpairment?: 'none' | 'visuallyImpaired' | 'severelyVisuallyImpaired';
      flashes?: boolean;
      floaters?: boolean;
      headaches?: boolean;
      other?: string;
    };
    lifestyle: {
      occupation: string;
      occupationNotes?: string;
      clWearer?: 'yes' | 'no';
      vduUser?: 'yes' | 'no';
      smoker?: 'yes' | 'no';
      driver?: 'yes' | 'no';
    };
    medicalHistory: {
      hobbies?: string;
      familyHistory?: string;
      generalHealth?: string;
      allergies?: string;
      medication?: string;
    };
  };
  
  // Tab 2: Current Rx
  currentRx: {
    unaidedVision: {
      r: { distance: string; binocular: string; near: string };
      l: { distance: string; binocular: string; near: string };
    };
    contactLensRx?: {
      brand: string;
      name: string;
      fitting: string;
      r: { sph: string; cyl: string; axis: string; add: string; colour: string; dominant: string; va: string; nearVa: string };
      l: { sph: string; cyl: string; axis: string; add: string; colour: string; dominant: string; va: string; nearVa: string };
    };
    primaryPair: {
      r: { sph: string; cyl: string; axis: string; add: string; prism: string; binocularAcuity: string };
      l: { sph: string; cyl: string; axis: string; add: string; prism: string; binocularAcuity: string };
    };
    secondaryPair?: {
      r: { sph: string; cyl: string; axis: string; add: string; prism: string; binocularAcuity: string };
      l: { sph: string; cyl: string; axis: string; add: string; prism: string; binocularAcuity: string };
    };
  };
  
  // Tab 3: New Rx (Refraction)
  newRx: {
    objective: {
      r: { sph: string; cyl: string; axis: string; va: string };
      l: { sph: string; cyl: string; axis: string; va: string };
    };
    subjective: {
      primaryPair: {
        r: { sph: string; cyl: string; axis: string; va: string; binocularAcuity: string; prism: string; muscleBalance: string; fixationDisparity: string };
        l: { sph: string; cyl: string; axis: string; va: string; binocularAcuity: string; prism: string; muscleBalance: string; fixationDisparity: string };
      };
      nearRx: {
        r: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
        l: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
      };
      intermediateRx: {
        r: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
        l: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
      };
      secondPair?: {
        distanceRx: {
          r: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
          l: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
        };
        nearRx: {
          r: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
          l: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
        };
        intermediateRx: {
          r: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
          l: { sph: string; cyl: string; axis: string; prism: string; binocularAcuity: string };
        };
      };
    };
    notes: {
      toBePrinted: string;
      notPrinted: string;
    };
  };
  
  // Tab 4: Ophthalmoscopy
  ophthalmoscopy: {
    r: {
      media: string;
      discs: string;
      cdRatio: string;
      vessels: string;
      fundus: string;
      macula: string;
      periphery: string;
    };
    l: {
      media: string;
      discs: string;
      cdRatio: string;
      vessels: string;
      fundus: string;
      macula: string;
      periphery: string;
    };
    motility: string;
    coverTest: string;
    stereopsis: string;
  };
  
  // Tab 5: Slit Lamp
  slitLamp: {
    method: 'direct' | 'indirect' | 'both';
    volk?: boolean;
    conjunctiva: {
      r: { conjunctivalRedness: number; limbalRedness: number; papillaryConjunctivitis: number; cornea: number };
      l: { conjunctivalRedness: number; limbalRedness: number; papillaryConjunctivitis: number; cornea: number };
    };
    cornea: {
      r: { cornealNeovascularisation: number; cornealOedema: number; cornealInfiltrate: number; cornealStain: number };
      l: { cornealNeovascularisation: number; cornealOedema: number; cornealInfiltrate: number; cornealStain: number };
    };
    lidsLashes: {
      r: { epithelialMicrocysts: number; blepharitis: number; meibomianGlandDysfunction: number; otherFindings: string };
      l: { epithelialMicrocysts: number; blepharitis: number; meibomianGlandDysfunction: number; otherFindings: string };
    };
  };
  
  // Tab 6: Additional Tests
  additionalTests: {
    visualFields: {
      instrument: string;
      r: string;
      l: string;
      normal: { r: boolean; l: boolean };
      abnormal: { r: boolean; l: boolean };
    };
    confrontation: {
      r: string;
      l: string;
      normal: { r: boolean; l: boolean };
      abnormal: { r: boolean; l: boolean };
    };
    wideFieldImaging: {
      instrument: string;
      r: string;
      l: string;
    };
    oct: {
      instrument: string;
      r: string;
      l: string;
    };
    amsler: {
      r: string;
      l: string;
      normal: { r: boolean; l: boolean };
      abnormal: { r: boolean; l: boolean };
    };
    colourVision: {
      test: string;
      r: string;
      l: string;
      normal: { r: boolean; l: boolean };
      abnormal: { r: boolean; l: boolean };
    };
  };
  
  // Tab 7: Tonometry
  tonometry: {
    measurements: {
      r: { value1: string; value2: string; value3: string; value4: string; average: string; corrected: string; cornealThickness: string; instrument: string };
      l: { value1: string; value2: string; value3: string; value4: string; average: string; corrected: string; cornealThickness: string; instrument: string };
    };
    time: string;
    anaesthetics: {
      infoGiven: 'yes' | 'no';
      dropsGiven: { r: 1 | 2 | 3; l: 1 | 2 | 3 };
      dateTimeGiven: string;
      batch: string;
      expiry: string;
      notes: string;
    };
  };
  
  // Tab 8: Eye Sketch
  eyeSketch: {
    anteriorRight: string; // Base64 or drawing data
    anteriorLeft: string;
    fundusRight: string;
    fundusLeft: string;
    lens: string[];
    fundus: string[];
  };
  
  // Tab 9: Image Viewer
  images: {
    importedImages: Array<{ id: string; dateAssigned: string; name: string }>;
    procedures: string[];
  };
  
  // Tab 10: Summary
  summary: {
    rxIssued: {
      status: 'firstRx' | 'repeatRx' | 'stableRx' | 'updatedRxNeeded' | 'referal';
      voucherIssued: 'yes' | 'no';
      referredForInvestigation: boolean;
    };
    dispensing: {
      reasons: string[];
      handoverNotes: string;
    };
    recall: {
      availableGroups: Array<{ groupName: string; duration: string; recurring: boolean }>;
      assignedRecalls: Array<{ date: string; group: string; step: string; dueDate: string; recurring: boolean }>;
    };
  };
  
  notes: string;
}

export default function EyeExaminationComprehensive() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general-history');
  const [isSaving, setIsSaving] = useState(false);
  
  // Get patientId from URL query params if creating new exam from patients page
  const urlParams = new URLSearchParams(window.location.search);
  const urlPatientId = urlParams.get('patientId');

  const canEdit = user?.enhancedRole === 'optometrist' || user?.role === 'ecp' || user?.role === 'platform_admin' || user?.role === 'admin';

  // Form state - comprehensive data structure
  const [formData, setFormData] = useState<Partial<EyeExaminationData>>({
    status: 'in_progress',
    generalHistory: {
      schedule: {
        date: new Date().toISOString(),
        seenBy: '',
        healthcare: 'private',
      },
      reasonForVisit: '',
      symptoms: {},
      lifestyle: {
        occupation: '',
      },
      medicalHistory: {},
    },
    currentRx: {
      unaidedVision: {
        r: { distance: '', binocular: '', near: '' },
        l: { distance: '', binocular: '', near: '' },
      },
      primaryPair: {
        r: { sph: '', cyl: '', axis: '', add: '', prism: '', binocularAcuity: '' },
        l: { sph: '', cyl: '', axis: '', add: '', prism: '', binocularAcuity: '' },
      },
    },
    newRx: {
      objective: {
        r: { sph: '', cyl: '', axis: '', va: '' },
        l: { sph: '', cyl: '', axis: '', va: '' },
      },
      subjective: {
        primaryPair: {
          r: { sph: '', cyl: '', axis: '', va: '', binocularAcuity: '', prism: '', muscleBalance: '', fixationDisparity: '' },
          l: { sph: '', cyl: '', axis: '', va: '', binocularAcuity: '', prism: '', muscleBalance: '', fixationDisparity: '' },
        },
        nearRx: {
          r: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' },
          l: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' },
        },
        intermediateRx: {
          r: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' },
          l: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' },
        },
      },
      notes: {
        toBePrinted: '',
        notPrinted: '',
      },
    },
    ophthalmoscopy: {
      r: { media: '', discs: '', cdRatio: '', vessels: '', fundus: '', macula: '', periphery: '' },
      l: { media: '', discs: '', cdRatio: '', vessels: '', fundus: '', macula: '', periphery: '' },
      motility: '',
      coverTest: '',
      stereopsis: '',
    },
    slitLamp: {
      method: 'direct',
      conjunctiva: {
        r: { conjunctivalRedness: 0, limbalRedness: 0, papillaryConjunctivitis: 0, cornea: 0 },
        l: { conjunctivalRedness: 0, limbalRedness: 0, papillaryConjunctivitis: 0, cornea: 0 },
      },
      cornea: {
        r: { cornealNeovascularisation: 0, cornealOedema: 0, cornealInfiltrate: 0, cornealStain: 0 },
        l: { cornealNeovascularisation: 0, cornealOedema: 0, cornealInfiltrate: 0, cornealStain: 0 },
      },
      lidsLashes: {
        r: { epithelialMicrocysts: 0, blepharitis: 0, meibomianGlandDysfunction: 0, otherFindings: '' },
        l: { epithelialMicrocysts: 0, blepharitis: 0, meibomianGlandDysfunction: 0, otherFindings: '' },
      },
    },
    additionalTests: {
      visualFields: { instrument: '', r: '', l: '', normal: { r: false, l: false }, abnormal: { r: false, l: false } },
      confrontation: { r: '', l: '', normal: { r: false, l: false }, abnormal: { r: false, l: false } },
      wideFieldImaging: { instrument: '', r: '', l: '' },
      oct: { instrument: '', r: '', l: '' },
      amsler: { r: '', l: '', normal: { r: false, l: false }, abnormal: { r: false, l: false } },
      colourVision: { test: '', r: '', l: '', normal: { r: false, l: false }, abnormal: { r: false, l: false } },
    },
    tonometry: {
      measurements: {
        r: { value1: '', value2: '', value3: '', value4: '', average: '', corrected: '', cornealThickness: '', instrument: '' },
        l: { value1: '', value2: '', value3: '', value4: '', average: '', corrected: '', cornealThickness: '', instrument: '' },
      },
      time: '',
      anaesthetics: {
        infoGiven: 'no',
        dropsGiven: { r: 1, l: 1 },
        dateTimeGiven: '',
        batch: '',
        expiry: '',
        notes: '',
      },
    },
    eyeSketch: {
      anteriorRight: '',
      anteriorLeft: '',
      fundusRight: '',
      fundusLeft: '',
      lens: [],
      fundus: [],
    },
    images: {
      importedImages: [],
      procedures: [],
    },
    summary: {
      rxIssued: {
        status: 'firstRx',
        voucherIssued: 'no',
        referredForInvestigation: false,
      },
      dispensing: {
        reasons: [],
        handoverNotes: '',
      },
      recall: {
        availableGroups: [
          { groupName: 'CL/2 Month Recall', duration: '1 Year', recurring: false },
          { groupName: 'IMPORTED - 1 Month', duration: '1 Month', recurring: false },
          { groupName: 'IMPORTED - 1 Year', duration: '1 Year', recurring: false },
          { groupName: 'IMPORTED - 13 Months', duration: '13 Months', recurring: false },
          { groupName: 'IMPORTED - 2 Years', duration: '2 Years', recurring: false },
          { groupName: 'IMPORTED - 3 months', duration: '3 Months', recurring: false },
          { groupName: 'IMPORTED - 3 Years', duration: '3 Years', recurring: false },
          { groupName: 'IMPORTED - 6 Months', duration: '6 Months', recurring: false },
          { groupName: 'IMPORTED - CL 1 Week', duration: '1 Week', recurring: false },
          { groupName: 'IMPORTED - CL 1 Year', duration: '1 Year', recurring: false },
          { groupName: 'IMPORTED - CL 2 Weeks', duration: '2 Weeks', recurring: false },
          { groupName: 'IMPORTED - CL 3 month', duration: '3 Months', recurring: false },
        ],
        assignedRecalls: [],
      },
    },
    notes: '',
  });

  // Fetch patient list
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch previous examinations for selected patient
  const { data: previousExaminations = [] } = useQuery({
    queryKey: ['/api/examinations', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient?.id) return [];
      const response = await fetch(`/api/examinations?patientId=${selectedPatient.id}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      const allExams = await response.json();
      // Filter out current examination and sort by date
      return allExams
        .filter((exam: any) => exam.id !== id)
        .sort((a: any, b: any) => new Date(b.examinationDate).getTime() - new Date(a.examinationDate).getTime())
        .slice(0, 10); // Show last 10 exams
    },
    enabled: !!selectedPatient?.id,
  });

  // Fetch examination if editing
  const { data: examination } = useQuery({
    queryKey: [`/api/examinations/${id}`],
    enabled: !!id,
  });

  // Auto-select patient from URL parameter
  useEffect(() => {
    if (urlPatientId && patients.length > 0 && !selectedPatient) {
      const patient = patients.find((p: Patient) => p.id === urlPatientId);
      if (patient) {
        setSelectedPatient(patient);
        setFormData(prev => ({ ...prev, patientId: urlPatientId }));
      }
    }
  }, [urlPatientId, patients, selectedPatient]);

  useEffect(() => {
    if (examination) {
      // Merge examination data with form structure
      const examData = examination as Partial<EyeExaminationData>;
      setFormData(prevData => ({
        ...prevData,
        ...examData,
      }));
      if (examData.patientId) {
        const patient = patients.find((p: Patient) => p.id === examData.patientId);
        if (patient) setSelectedPatient(patient);
      }
    }
  }, [examination, patients]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<EyeExaminationData>) => {
      const url = id ? `/api/examinations/${id}` : '/api/examinations';
      const method = id ? 'PUT' : 'POST';
      
      // Send comprehensive data structure directly to backend
      const payload = {
        patientId: data.patientId,
        examinationDate: data.examinationDate || new Date().toISOString(),
        status: data.status || 'in_progress',
        generalHistory: data.generalHistory,
        currentRx: data.currentRx,
        newRx: data.newRx,
        ophthalmoscopy: data.ophthalmoscopy,
        slitLamp: data.slitLamp,
        additionalTests: data.additionalTests,
        tonometry: data.tonometry,
        eyeSketch: data.eyeSketch,
        images: data.images,
        summary: data.summary,
        notes: data.notes || '',
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to save examination' }));
        throw new Error(error.error || 'Failed to save examination');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/examinations'] });
      setIsSaving(false);
      toast({
        title: "Success",
        description: "Examination saved successfully",
      });
    },
    onError: () => {
      setIsSaving(false);
      toast({
        title: "Error",
        description: "Failed to save examination",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "Only optometrists can edit examination records",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    await saveMutation.mutateAsync(formData);
  };

  const handleFinalize = async () => {
    if (!canEdit) return;
    if (confirm('Finalize this examination? This cannot be undone.')) {
      setFormData({ ...formData, status: 'finalized' });
      await handleSave();
      setLocation('/ecp/examinations');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate average IOP
  const calculateAverageIOP = (values: string[]) => {
    const nums = values.filter(v => v && !isNaN(parseFloat(v))).map(v => parseFloat(v));
    if (nums.length === 0) return '';
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg.toFixed(1);
  };

  // Auto-calculate IOP averages when values change
  useEffect(() => {
    if (formData.tonometry?.measurements) {
      const rValues = [
        formData.tonometry.measurements.r.value1,
        formData.tonometry.measurements.r.value2,
        formData.tonometry.measurements.r.value3,
        formData.tonometry.measurements.r.value4,
      ];
      const lValues = [
        formData.tonometry.measurements.l.value1,
        formData.tonometry.measurements.l.value2,
        formData.tonometry.measurements.l.value3,
        formData.tonometry.measurements.l.value4,
      ];
      
      const rAvg = calculateAverageIOP(rValues);
      const lAvg = calculateAverageIOP(lValues);
      
      if (rAvg !== formData.tonometry.measurements.r.average || lAvg !== formData.tonometry.measurements.l.average) {
        setFormData(prev => ({
          ...prev,
          tonometry: {
            ...prev.tonometry!,
            measurements: {
              ...prev.tonometry!.measurements,
              r: { ...prev.tonometry!.measurements.r, average: rAvg },
              l: { ...prev.tonometry!.measurements.l, average: lAvg },
            },
          },
        }));
      }
    }
  }, [
    formData.tonometry?.measurements?.r.value1,
    formData.tonometry?.measurements?.r.value2,
    formData.tonometry?.measurements?.r.value3,
    formData.tonometry?.measurements?.r.value4,
    formData.tonometry?.measurements?.l.value1,
    formData.tonometry?.measurements?.l.value2,
    formData.tonometry?.measurements?.l.value3,
    formData.tonometry?.measurements?.l.value4,
  ]);

  const tabs = [
    { id: 'general-history', label: 'General History', icon: FileText, disabled: false },
    { id: 'current-rx', label: 'Current Rx', icon: Glasses, disabled: false },
    { id: 'new-rx', label: 'New Rx', icon: Eye, disabled: false },
    { id: 'ophthalmoscopy', label: 'Ophthalmoscopy', icon: Eye, disabled: false },
    { id: 'slit-lamp', label: 'Slit Lamp', icon: Microscope, disabled: false },
    { id: 'additional-tests', label: 'Additional Tests', icon: Activity, disabled: false },
    { id: 'tonometry', label: 'Tonometry', icon: Droplets, disabled: false },
    { id: 'eye-sketch', label: 'Eye Sketch', icon: Palette, disabled: true },
    { id: 'image-viewer', label: 'Image Viewer', icon: ImageIcon, disabled: true },
    { id: 'summary', label: 'Summary', icon: ClipboardList, disabled: false },
  ];

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
  const canGoPrevious = currentTabIndex > 0;
  const canGoNext = currentTabIndex < tabs.length - 1;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/ecp/examinations')} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              
              <Separator orientation="vertical" className="h-8" />
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-slate-900">Eye Examination</h1>
                  <p className="text-xs text-slate-500">
                    {formData.generalHistory?.schedule.date ? format(new Date(formData.generalHistory.schedule.date), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center gap-2">
                {selectedPatient ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{selectedPatient.name}</p>
                      <p className="text-xs text-slate-500">#{selectedPatient.customerNumber} • DOB: {selectedPatient.dateOfBirth}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <User className="h-4 w-4 text-slate-400" />
                    <Select
                      value={formData.patientId}
                      onValueChange={(value) => {
                        const patient = patients.find(p => p.id === value);
                        setSelectedPatient(patient || null);
                        setFormData({ ...formData, patientId: value });
                      }}
                      disabled={!canEdit || !!id}
                    >
                      <SelectTrigger className="w-64 h-8">
                        <SelectValue placeholder="Select patient..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} - #{patient.customerNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Previous ({previousExaminations.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-3 border-b bg-slate-50">
                    <h3 className="font-semibold text-sm">Previous Examinations</h3>
                  </div>
                  <ScrollArea className="h-80">
                    {previousExaminations.length > 0 ? (
                      <div className="p-2 space-y-2">
                        {previousExaminations.map((exam: any) => (
                          <button
                            key={exam.id}
                            onClick={() => {
                              if (confirm('Load this examination? Unsaved changes will be lost.')) {
                                window.location.href = `/ecp/examination/${exam.id}`;
                              }
                            }}
                            className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-sm font-medium">
                                {format(new Date(exam.examinationDate), 'dd MMM yyyy')}
                              </span>
                              <Badge variant={exam.status === 'finalized' ? 'default' : 'secondary'} className="text-xs">
                                {exam.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {exam.reasonForVisit || 'Eye Examination'}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        {selectedPatient ? 'No previous examinations' : 'Select a patient first'}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              {canEdit && (
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Content - No Sidebar */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* Horizontal Tab Navigation */}
          <div className="bg-white border-b sticky top-[57px] z-40">
            <ScrollArea className="w-full">
              <div className="px-6">
                <TabsList className="inline-flex h-14 bg-transparent w-auto rounded-none p-0 gap-0">
                  {tabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id} 
                      disabled={tab.disabled}
                      className="relative h-14 rounded-none border-b-2 border-transparent px-6 py-4 text-sm font-medium text-slate-600 transition-all hover:text-slate-900 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </ScrollArea>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-6 bg-slate-50 overflow-auto">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* TAB 1: GENERAL HISTORY */}
                <TabsContent value="general-history" className="space-y-4 m-0">
                  <GeneralHistoryTab
                    data={formData.generalHistory!}
                    onChange={(data) => setFormData({ ...formData, generalHistory: data })}
                    readonly={!canEdit}
                  />
                </TabsContent>

                {/* TAB 2: CURRENT RX */}
                <TabsContent value="current-rx" className="space-y-4 mt-4">
                  <CurrentRxTab
                    data={formData.currentRx!}
                    onChange={(data) => setFormData({ ...formData, currentRx: data })}
                    readonly={!canEdit}
                  />
                </TabsContent>

                {/* TAB 3: NEW RX */}
                <TabsContent value="new-rx" className="space-y-4 mt-4">
                  <NewRxTab
                    data={formData.newRx!}
                    onChange={(data) => setFormData({ ...formData, newRx: data })}
                    readonly={!canEdit}
                  />
                </TabsContent>

                {/* TAB 4: OPHTHALMOSCOPY */}
                <TabsContent value="ophthalmoscopy" className="space-y-4 mt-4">
                  <OphthalmoscopyTab
                    data={formData.ophthalmoscopy!}
                    onChange={(data) => setFormData({ ...formData, ophthalmoscopy: data })}
                    readonly={!canEdit}
                  />
                </TabsContent>

                {/* TAB 5: SLIT LAMP */}
                <TabsContent value="slit-lamp" className="space-y-4 mt-4">
                  <SlitLampTab
                    data={formData.slitLamp!}
                    onChange={(data) => setFormData({ ...formData, slitLamp: data })}
                    readonly={!canEdit}
                  />
                </TabsContent>

                {/* TAB 6: ADDITIONAL TESTS */}
                <TabsContent value="additional-tests" className="space-y-4 mt-4">
                  <AdditionalTestsTab
                    data={formData.additionalTests!}
                    onChange={(data) => setFormData({ ...formData, additionalTests: data })}
                    readonly={!canEdit}
                  />
                </TabsContent>

                {/* TAB 7: TONOMETRY */}
                <TabsContent value="tonometry" className="space-y-4 mt-4">
                  <TonometryTab
                    data={formData.tonometry!}
                    onChange={(data) => setFormData({ ...formData, tonometry: data })}
                    readonly={!canEdit}
                  />
                </TabsContent>

                {/* TAB 8: EYE SKETCH - Placeholder */}
                <TabsContent value="eye-sketch" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Eye Sketch - Coming Soon
                      </CardTitle>
                      <CardDescription>Canvas-based drawing functionality will be implemented in Phase 2</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-slate-500">
                        This tab will include interactive canvas areas for drawing anterior segment and fundus diagrams.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 9: IMAGE VIEWER - Placeholder */}
                <TabsContent value="image-viewer" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Image Viewer - Coming Soon
                      </CardTitle>
                      <CardDescription>Image management and viewing functionality will be implemented in Phase 2</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-slate-500">
                        This tab will allow importing and viewing retinal images, OCT scans, and other diagnostic imaging.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB 10: SUMMARY */}
                <TabsContent value="summary" className="space-y-4 mt-4">
                  <SummaryTab
                    data={{
                      rxStatus: formData.summary?.rxIssued?.status || '',
                      voucher: formData.summary?.rxIssued?.voucherIssued === 'yes',
                      referral: {
                        hospitalReferral: false,
                        gpReferral: false,
                        urgentReferral: false,
                        routineReferral: false
                      },
                      dispensing: {
                        gos: false,
                        distanceOnly: false,
                        varifocals: false,
                        bifocals: false,
                        reading: false,
                        sunglasses: false
                      },
                      handoverNotes: formData.summary?.dispensing?.handoverNotes || '',
                      recallManagement: {
                        selectedRecallGroup: '',
                        assignedRecalls: formData.summary?.recall?.assignedRecalls?.map(r => ({
                          id: r.group,
                          groupName: r.group,
                          dueDate: r.dueDate
                        })) || []
                      }
                    }}
                    onChange={(data) => {
                      const summary = {
                        rxIssued: {
                          status: data.rxStatus as any,
                          voucherIssued: data.voucher ? 'yes' as const : 'no' as const,
                          referredForInvestigation: data.referral.hospitalReferral || data.referral.gpReferral
                        },
                        dispensing: {
                          reasons: Object.entries(data.dispensing).filter(([_, v]) => v).map(([k]) => k),
                          handoverNotes: data.handoverNotes
                        },
                        recall: {
                          availableGroups: formData.summary?.recall?.availableGroups || [],
                          assignedRecalls: data.recallManagement.assignedRecalls.map(r => ({
                            date: new Date().toISOString(),
                            group: r.groupName,
                            step: 'pending',
                            dueDate: r.dueDate,
                            recurring: false
                          }))
                        }
                      };
                      setFormData({ ...formData, summary });
                    }}
                    readonly={!canEdit}
                    finalRxDistance={formData.newRx?.subjective?.primaryPair ? {
                      r: {
                        sphere: formData.newRx.subjective.primaryPair.r.sph,
                        cylinder: formData.newRx.subjective.primaryPair.r.cyl,
                        axis: formData.newRx.subjective.primaryPair.r.axis,
                        prism: formData.newRx.subjective.primaryPair.r.prism,
                        add: '',
                        va: formData.newRx.subjective.primaryPair.r.va
                      },
                      l: {
                        sphere: formData.newRx.subjective.primaryPair.l.sph,
                        cylinder: formData.newRx.subjective.primaryPair.l.cyl,
                        axis: formData.newRx.subjective.primaryPair.l.axis,
                        prism: formData.newRx.subjective.primaryPair.l.prism,
                        add: '',
                        va: formData.newRx.subjective.primaryPair.l.va
                      },
                      binocularVA: formData.newRx.subjective.primaryPair.r.binocularAcuity
                    } : undefined}
                    finalRxNear={formData.newRx?.subjective?.nearRx ? {
                      r: {
                        sphere: formData.newRx.subjective.nearRx.r.sph,
                        cylinder: formData.newRx.subjective.nearRx.r.cyl,
                        axis: formData.newRx.subjective.nearRx.r.axis,
                        prism: formData.newRx.subjective.nearRx.r.prism,
                        add: '',
                        va: ''
                      },
                      l: {
                        sphere: formData.newRx.subjective.nearRx.l.sph,
                        cylinder: formData.newRx.subjective.nearRx.l.cyl,
                        axis: formData.newRx.subjective.nearRx.l.axis,
                        prism: formData.newRx.subjective.nearRx.l.prism,
                        add: '',
                        va: ''
                      },
                      binocularVA: formData.newRx.subjective.nearRx.r.binocularAcuity
                    } : undefined}
                    finalRxIntermediate={formData.newRx?.subjective?.intermediateRx ? {
                      r: {
                        sphere: formData.newRx.subjective.intermediateRx.r.sph,
                        cylinder: formData.newRx.subjective.intermediateRx.r.cyl,
                        axis: formData.newRx.subjective.intermediateRx.r.axis,
                        prism: formData.newRx.subjective.intermediateRx.r.prism,
                        add: '',
                        va: ''
                      },
                      l: {
                        sphere: formData.newRx.subjective.intermediateRx.l.sph,
                        cylinder: formData.newRx.subjective.intermediateRx.l.cyl,
                        axis: formData.newRx.subjective.intermediateRx.l.axis,
                        prism: formData.newRx.subjective.intermediateRx.l.prism,
                        add: '',
                        va: ''
                      },
                      binocularVA: formData.newRx.subjective.intermediateRx.r.binocularAcuity
                    } : undefined}
                    availableRecallGroups={[
                      { id: 'cl-2month', name: 'CL/2 Month Recall', defaultMonths: 2 },
                      { id: '1month', name: '1 Month', defaultMonths: 1 },
                      { id: '3month', name: '3 Months', defaultMonths: 3 },
                      { id: '6month', name: '6 Months', defaultMonths: 6 },
                      { id: '1year', name: '1 Year', defaultMonths: 12 },
                      { id: '13month', name: '13 Months', defaultMonths: 13 },
                      { id: '2year', name: '2 Years', defaultMonths: 24 },
                      { id: '3year', name: '3 Years', defaultMonths: 36 },
                    ]}
                    onFinalize={handleFinalize}
                    patientData={selectedPatient ? {
                      name: selectedPatient.name,
                      dob: selectedPatient.dateOfBirth,
                      address: undefined // Could be fetched from patient details if available
                    } : undefined}
                    practitionerData={user ? {
                      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Practitioner',
                      gocNumber: user.gocRegistrationNumber || undefined
                    } : undefined}
                    practiceData={{
                      name: user?.organizationName || 'Integrated Lens System',
                      address: user?.address ? (typeof user.address === 'string' ? user.address : JSON.stringify(user.address)) : 'Practice Address',
                      phone: user?.contactPhone || undefined
                    }}
                    examinationDate={formData.examinationDate}
                  />
                </TabsContent>

              {/* Navigation Footer */}
              <div className="flex justify-between pt-4 border-t bg-white rounded-lg p-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab(tabs[currentTabIndex - 1].id)}
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-2">
                  {activeTab === 'summary' && canEdit && (
                    <Button onClick={handleFinalize} variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalize Examination
                    </Button>
                  )}
                  <Button 
                    onClick={handlePrint} 
                    variant="outline"
                    size="sm"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab(tabs[currentTabIndex + 1].id)}
                  disabled={!canGoNext}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
