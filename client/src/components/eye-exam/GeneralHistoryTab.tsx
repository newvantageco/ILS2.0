import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface GeneralHistoryData {
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
}

interface GeneralHistoryTabProps {
  data: GeneralHistoryData;
  onChange: (data: GeneralHistoryData) => void;
  readonly?: boolean;
}

export default function GeneralHistoryTab({ data, onChange, readonly = false }: GeneralHistoryTabProps) {
  const updateField = (path: string[], value: any) => {
    const newData = { ...data };
    let current: any = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      {/* Schedule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={readonly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.schedule.date 
                      ? format(new Date(data.schedule.date), 'PPP')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data.schedule.date ? new Date(data.schedule.date) : undefined}
                    onSelect={(date) => updateField(['schedule', 'date'], date?.toISOString())}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Seen By</Label>
              <Input
                value={data.schedule.seenBy || ''}
                onChange={(e) => updateField(['schedule', 'seenBy'], e.target.value)}
                placeholder="Optometrist name..."
                disabled={readonly}
              />
            </div>

            <div>
              <Label>NHS/Private</Label>
              <RadioGroup
                value={data.schedule.healthcare}
                onValueChange={(value) => updateField(['schedule', 'healthcare'], value)}
                disabled={readonly}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="font-normal cursor-pointer">Private</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nhs" id="nhs" />
                    <Label htmlFor="nhs" className="font-normal cursor-pointer">NHS</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Evidence</Label>
              <Input
                value={data.schedule.evidence || ''}
                onChange={(e) => updateField(['schedule', 'evidence'], e.target.value)}
                placeholder="Evidence reference..."
                disabled={readonly}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="notSeen"
                checked={data.schedule.notSeen || false}
                onCheckedChange={(checked) => updateField(['schedule', 'notSeen'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="notSeen" className="font-normal cursor-pointer">Not Seen</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reason for Visit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reason for Visit</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.reasonForVisit || ''}
            onChange={(e) => updateField(['reasonForVisit'], e.target.value)}
            placeholder="Chief complaint and reason for today's examination..."
            rows={4}
            disabled={readonly}
            className={readonly ? 'bg-slate-50' : ''}
          />
        </CardContent>
      </Card>

      {/* History and Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            History and Symptoms / PC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Visual Impairment</Label>
            <RadioGroup
              value={data.symptoms.visualImpairment || 'none'}
              onValueChange={(value) => updateField(['symptoms', 'visualImpairment'], value)}
              disabled={readonly}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="vi-none" />
                <Label htmlFor="vi-none" className="font-normal cursor-pointer">None</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="visuallyImpaired" id="vi-impaired" />
                <Label htmlFor="vi-impaired" className="font-normal cursor-pointer">Visually Impaired</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="severelyVisuallyImpaired" id="vi-severe" />
                <Label htmlFor="vi-severe" className="font-normal cursor-pointer">Severely Visually Impaired</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flashes"
                checked={data.symptoms.flashes || false}
                onCheckedChange={(checked) => updateField(['symptoms', 'flashes'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="flashes" className="font-normal cursor-pointer">Flashes</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="floaters"
                checked={data.symptoms.floaters || false}
                onCheckedChange={(checked) => updateField(['symptoms', 'floaters'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="floaters" className="font-normal cursor-pointer">Floaters</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="headaches"
                checked={data.symptoms.headaches || false}
                onCheckedChange={(checked) => updateField(['symptoms', 'headaches'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="headaches" className="font-normal cursor-pointer">Headaches</Label>
            </div>
          </div>

          <div>
            <Label>Other Symptoms / Notes</Label>
            <Textarea
              value={data.symptoms.other || ''}
              onChange={(e) => updateField(['symptoms', 'other'], e.target.value)}
              placeholder="Additional symptoms, duration, frequency..."
              rows={3}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lifestyle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Occupation</Label>
              <Input
                value={data.lifestyle.occupation || ''}
                onChange={(e) => updateField(['lifestyle', 'occupation'], e.target.value)}
                placeholder="Patient's occupation..."
                disabled={readonly}
              />
            </div>
            
            <div>
              <Label>Occupation Notes</Label>
              <Input
                value={data.lifestyle.occupationNotes || ''}
                onChange={(e) => updateField(['lifestyle', 'occupationNotes'], e.target.value)}
                placeholder="Work environment details..."
                disabled={readonly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm">CL Wearer?</Label>
              <RadioGroup
                value={data.lifestyle.clWearer || 'no'}
                onValueChange={(value) => updateField(['lifestyle', 'clWearer'], value)}
                disabled={readonly}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="cl-yes" />
                  <Label htmlFor="cl-yes" className="font-normal text-sm cursor-pointer">Y</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="cl-no" />
                  <Label htmlFor="cl-no" className="font-normal text-sm cursor-pointer">N</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm">VDU User?</Label>
              <RadioGroup
                value={data.lifestyle.vduUser || 'no'}
                onValueChange={(value) => updateField(['lifestyle', 'vduUser'], value)}
                disabled={readonly}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="vdu-yes" />
                  <Label htmlFor="vdu-yes" className="font-normal text-sm cursor-pointer">Y</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="vdu-no" />
                  <Label htmlFor="vdu-no" className="font-normal text-sm cursor-pointer">N</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm">Smoker?</Label>
              <RadioGroup
                value={data.lifestyle.smoker || 'no'}
                onValueChange={(value) => updateField(['lifestyle', 'smoker'], value)}
                disabled={readonly}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="smoker-yes" />
                  <Label htmlFor="smoker-yes" className="font-normal text-sm cursor-pointer">Y</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="smoker-no" />
                  <Label htmlFor="smoker-no" className="font-normal text-sm cursor-pointer">N</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm">Driver?</Label>
              <RadioGroup
                value={data.lifestyle.driver || 'no'}
                onValueChange={(value) => updateField(['lifestyle', 'driver'], value)}
                disabled={readonly}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="driver-yes" />
                  <Label htmlFor="driver-yes" className="font-normal text-sm cursor-pointer">Y</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="driver-no" />
                  <Label htmlFor="driver-no" className="font-normal text-sm cursor-pointer">N</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Attributes - Medical History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hobbies" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
              <TabsTrigger value="family">Family History</TabsTrigger>
              <TabsTrigger value="health">General Health</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="medication">Medication</TabsTrigger>
            </TabsList>

            <TabsContent value="hobbies" className="mt-4">
              <Textarea
                value={data.medicalHistory.hobbies || ''}
                onChange={(e) => updateField(['medicalHistory', 'hobbies'], e.target.value)}
                placeholder="Patient's hobbies and recreational activities..."
                rows={6}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </TabsContent>

            <TabsContent value="family" className="mt-4">
              <Textarea
                value={data.medicalHistory.familyHistory || ''}
                onChange={(e) => updateField(['medicalHistory', 'familyHistory'], e.target.value)}
                placeholder="Family medical history, inherited conditions, eye diseases..."
                rows={6}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </TabsContent>

            <TabsContent value="health" className="mt-4">
              <Textarea
                value={data.medicalHistory.generalHealth || ''}
                onChange={(e) => updateField(['medicalHistory', 'generalHealth'], e.target.value)}
                placeholder="General medical conditions, surgeries, chronic illnesses..."
                rows={6}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </TabsContent>

            <TabsContent value="allergies" className="mt-4">
              <Textarea
                value={data.medicalHistory.allergies || ''}
                onChange={(e) => updateField(['medicalHistory', 'allergies'], e.target.value)}
                placeholder="Known allergies to medications, drops, materials..."
                rows={6}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </TabsContent>

            <TabsContent value="medication" className="mt-4">
              <Textarea
                value={data.medicalHistory.medication || ''}
                onChange={(e) => updateField(['medicalHistory', 'medication'], e.target.value)}
                placeholder="Current medications and dosages..."
                rows={6}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
