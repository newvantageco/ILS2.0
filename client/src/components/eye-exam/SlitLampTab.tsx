import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Microscope } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface SlitLampData {
  gradingSystem?: 'EFRON' | 'CLRU' | 'Other';
  method: 'direct' | 'indirect' | 'both';
  volk?: boolean;
  conjunctiva: {
    r: { conjunctivalRedness: number; limbalRedness: number; papillaryConjunctivitis: number; cornea: number; cornerNotes?: string };
    l: { conjunctivalRedness: number; limbalRedness: number; papillaryConjunctivitis: number; cornea: number; cornerNotes?: string };
  };
  cornea: {
    r: { cornealNeovascularisation: number; cornealOedema: number; cornealInfiltrate: number; cornealStain: number; spk?: number; spkPattern?: string };
    l: { cornealNeovascularisation: number; cornealOedema: number; cornealInfiltrate: number; cornealStain: number; spk?: number; spkPattern?: string };
  };
  lidsLashes: {
    r: { epithelialMicrocysts: number; blepharitis: number; meibomianGlandDysfunction: number; otherFindings: string };
    l: { epithelialMicrocysts: number; blepharitis: number; meibomianGlandDysfunction: number; otherFindings: string };
  };
  sectionNotes?: string;
}

interface SlitLampTabProps {
  data: SlitLampData;
  onChange: (data: SlitLampData) => void;
  readonly?: boolean;
}

const GradingControl = ({ 
  value, 
  onChange, 
  label, 
  readonly = false 
}: { 
  value: number; 
  onChange: (val: number) => void; 
  label: string;
  readonly?: boolean;
}) => (
  <div className="space-y-2">
    <Label className="text-xs font-medium">{label}</Label>
    <RadioGroup
      value={value.toString()}
      onValueChange={(val) => onChange(parseInt(val))}
      disabled={readonly}
      className="flex space-x-2"
    >
      {[0, 1, 2, 3, 4].map((grade) => (
        <div key={grade} className="flex flex-col items-center">
          <RadioGroupItem 
            value={grade.toString()} 
            id={`${label}-${grade}`}
            className="mb-1"
          />
          <Label 
            htmlFor={`${label}-${grade}`}
            className="text-xs font-normal cursor-pointer"
          >
            {grade}
          </Label>
        </div>
      ))}
    </RadioGroup>
  </div>
);

export default function SlitLampTab({ data, onChange, readonly = false }: SlitLampTabProps) {
  const updateField = (path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone to avoid mutation
    let current: any = newData;

    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    onChange(newData);
  };

  const remainingChars = 500 - (data.sectionNotes?.length || 0);

  return (
    <div className="space-y-6">
      {/* Grading System & Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Microscope className="h-5 w-5 text-blue-600" />
            Slit Lamp Examination Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Grading System</Label>
              <Select
                value={data.gradingSystem || 'EFRON'}
                onValueChange={(value) => updateField(['gradingSystem'], value)}
                disabled={readonly}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select grading system..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFRON">EFRON Grading Scale</SelectItem>
                  <SelectItem value="CLRU">CLRU Grading Scale</SelectItem>
                  <SelectItem value="Other">Other/Custom</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                {data.gradingSystem === 'EFRON' && 'EFRON: 0-4 photographic grading scale'}
                {data.gradingSystem === 'CLRU' && 'CLRU (Cornea & Contact Lens Research Unit)'}
                {data.gradingSystem === 'Other' && 'Custom grading system'}
                {!data.gradingSystem && 'EFRON: 0-4 photographic grading scale'}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Examination Method</Label>
              <div className="flex items-center gap-6">
                <RadioGroup
                  value={data.method}
                  onValueChange={(value) => updateField(['method'], value)}
                  disabled={readonly}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct" id="method-direct" />
                    <Label htmlFor="method-direct" className="font-normal cursor-pointer">Direct</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indirect" id="method-indirect" />
                    <Label htmlFor="method-indirect" className="font-normal cursor-pointer">Indirect</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="method-both" />
                    <Label htmlFor="method-both" className="font-normal cursor-pointer">Both</Label>
                  </div>
                </RadioGroup>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="volk"
                    checked={data.volk || false}
                    onCheckedChange={(checked) => updateField(['volk'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="volk" className="font-normal cursor-pointer">Volk Lens</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conjunctiva (0-4 Grading) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conjunctiva (0-4 Grading)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">0 = None, 1 = Trace, 2 = Mild, 3 = Moderate, 4 = Severe</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Right Eye */}
            <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
              <h3 className="text-sm font-semibold text-blue-900 mb-4">Right Eye (OD)</h3>
              
              <GradingControl
                value={data.conjunctiva.r.conjunctivalRedness}
                onChange={(val) => updateField(['conjunctiva', 'r', 'conjunctivalRedness'], val)}
                label="Conjunctival Redness"
                readonly={readonly}
              />

              <GradingControl
                value={data.conjunctiva.r.limbalRedness}
                onChange={(val) => updateField(['conjunctiva', 'r', 'limbalRedness'], val)}
                label="Limbal Redness"
                readonly={readonly}
              />

              <GradingControl
                value={data.conjunctiva.r.papillaryConjunctivitis}
                onChange={(val) => updateField(['conjunctiva', 'r', 'papillaryConjunctivitis'], val)}
                label="Papillary Conjunctivitis"
                readonly={readonly}
              />

              <GradingControl
                value={data.conjunctiva.r.cornea}
                onChange={(val) => updateField(['conjunctiva', 'r', 'cornea'], val)}
                label="Cornea"
                readonly={readonly}
              />

              <div className="mt-4">
                <Label className="text-xs font-medium">Corner/Limbus Notes</Label>
                <Input
                  value={data.conjunctiva.r.cornerNotes || ''}
                  onChange={(e) => updateField(['conjunctiva', 'r', 'cornerNotes'], e.target.value)}
                  placeholder="Nasal/temporal corner findings..."
                  className="h-9 mt-2"
                  disabled={readonly}
                />
              </div>
            </div>

            {/* Left Eye */}
            <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
              <h3 className="text-sm font-semibold text-green-900 mb-4">Left Eye (OS)</h3>
              
              <GradingControl
                value={data.conjunctiva.l.conjunctivalRedness}
                onChange={(val) => updateField(['conjunctiva', 'l', 'conjunctivalRedness'], val)}
                label="Conjunctival Redness"
                readonly={readonly}
              />

              <GradingControl
                value={data.conjunctiva.l.limbalRedness}
                onChange={(val) => updateField(['conjunctiva', 'l', 'limbalRedness'], val)}
                label="Limbal Redness"
                readonly={readonly}
              />

              <GradingControl
                value={data.conjunctiva.l.papillaryConjunctivitis}
                onChange={(val) => updateField(['conjunctiva', 'l', 'papillaryConjunctivitis'], val)}
                label="Papillary Conjunctivitis"
                readonly={readonly}
              />

              <GradingControl
                value={data.conjunctiva.l.cornea}
                onChange={(val) => updateField(['conjunctiva', 'l', 'cornea'], val)}
                label="Cornea"
                readonly={readonly}
              />

              <div className="mt-4">
                <Label className="text-xs font-medium">Corner/Limbus Notes</Label>
                <Input
                  value={data.conjunctiva.l.cornerNotes || ''}
                  onChange={(e) => updateField(['conjunctiva', 'l', 'cornerNotes'], e.target.value)}
                  placeholder="Nasal/temporal corner findings..."
                  className="h-9 mt-2"
                  disabled={readonly}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cornea (0-4 Grading) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cornea (0-4 Grading)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Right Eye */}
            <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
              <h3 className="text-sm font-semibold text-blue-900 mb-4">Right Eye (OD)</h3>
              
              <GradingControl
                value={data.cornea.r.cornealNeovascularisation}
                onChange={(val) => updateField(['cornea', 'r', 'cornealNeovascularisation'], val)}
                label="Corneal Neovascularisation"
                readonly={readonly}
              />

              <GradingControl
                value={data.cornea.r.cornealOedema}
                onChange={(val) => updateField(['cornea', 'r', 'cornealOedema'], val)}
                label="Corneal Oedema"
                readonly={readonly}
              />

              <GradingControl
                value={data.cornea.r.cornealInfiltrate}
                onChange={(val) => updateField(['cornea', 'r', 'cornealInfiltrate'], val)}
                label="Corneal Infiltrate"
                readonly={readonly}
              />

              <GradingControl
                value={data.cornea.r.cornealStain}
                onChange={(val) => updateField(['cornea', 'r', 'cornealStain'], val)}
                label="Corneal Stain"
                readonly={readonly}
              />

              <GradingControl
                value={data.cornea.r.spk || 0}
                onChange={(val) => updateField(['cornea', 'r', 'spk'], val)}
                label="SPK (Superficial Punctate Keratitis)"
                readonly={readonly}
              />

              <div className="mt-4">
                <Label className="text-xs font-medium">SPK Pattern/Location</Label>
                <Input
                  value={data.cornea.r.spkPattern || ''}
                  onChange={(e) => updateField(['cornea', 'r', 'spkPattern'], e.target.value)}
                  placeholder="Central, inferior, 3-9 o'clock, etc."
                  className="h-9 mt-2"
                  disabled={readonly}
                />
              </div>
            </div>

            {/* Left Eye */}
            <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
              <h3 className="text-sm font-semibold text-green-900 mb-4">Left Eye (OS)</h3>
              
              <GradingControl
                value={data.cornea.l.cornealNeovascularisation}
                onChange={(val) => updateField(['cornea', 'l', 'cornealNeovascularisation'], val)}
                label="Corneal Neovascularisation"
                readonly={readonly}
              />

              <GradingControl
                value={data.cornea.l.cornealOedema}
                onChange={(val) => updateField(['cornea', 'l', 'cornealOedema'], val)}
                label="Corneal Oedema"
                readonly={readonly}
              />

              <GradingControl
                value={data.cornea.l.cornealInfiltrate}
                onChange={(val) => updateField(['cornea', 'l', 'cornealInfiltrate'], val)}
                label="Corneal Infiltrate"
                readonly={readonly}
              />

              <GradingControl
                value={data.cornea.l.cornealStain}
                onChange={(val) => updateField(['cornea', 'l', 'cornealStain'], val)}
                label="Corneal Stain"
                readonly={readonly}
              />

              <GradingControl
                value={data.cornea.l.spk || 0}
                onChange={(val) => updateField(['cornea', 'l', 'spk'], val)}
                label="SPK (Superficial Punctate Keratitis)"
                readonly={readonly}
              />

              <div className="mt-4">
                <Label className="text-xs font-medium">SPK Pattern/Location</Label>
                <Input
                  value={data.cornea.l.spkPattern || ''}
                  onChange={(e) => updateField(['cornea', 'l', 'spkPattern'], e.target.value)}
                  placeholder="Central, inferior, 3-9 o'clock, etc."
                  className="h-9 mt-2"
                  disabled={readonly}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lids & Lashes (0-4 Grading) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lids & Lashes (0-4 Grading)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Right Eye */}
            <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
              <h3 className="text-sm font-semibold text-blue-900 mb-4">Right Eye (OD)</h3>
              
              <GradingControl
                value={data.lidsLashes.r.epithelialMicrocysts}
                onChange={(val) => updateField(['lidsLashes', 'r', 'epithelialMicrocysts'], val)}
                label="Epithelial Microcysts"
                readonly={readonly}
              />

              <GradingControl
                value={data.lidsLashes.r.blepharitis}
                onChange={(val) => updateField(['lidsLashes', 'r', 'blepharitis'], val)}
                label="Blepharitis"
                readonly={readonly}
              />

              <GradingControl
                value={data.lidsLashes.r.meibomianGlandDysfunction}
                onChange={(val) => updateField(['lidsLashes', 'r', 'meibomianGlandDysfunction'], val)}
                label="Meibomian Gland Dysfunction (MGD)"
                readonly={readonly}
              />

              <div className="mt-4">
                <Label className="text-xs font-medium">Other Findings</Label>
                <Input
                  value={data.lidsLashes.r.otherFindings || ''}
                  onChange={(e) => updateField(['lidsLashes', 'r', 'otherFindings'], e.target.value)}
                  placeholder="Additional observations..."
                  className="h-9 mt-2"
                  disabled={readonly}
                />
              </div>
            </div>

            {/* Left Eye */}
            <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
              <h3 className="text-sm font-semibold text-green-900 mb-4">Left Eye (OS)</h3>
              
              <GradingControl
                value={data.lidsLashes.l.epithelialMicrocysts}
                onChange={(val) => updateField(['lidsLashes', 'l', 'epithelialMicrocysts'], val)}
                label="Epithelial Microcysts"
                readonly={readonly}
              />

              <GradingControl
                value={data.lidsLashes.l.blepharitis}
                onChange={(val) => updateField(['lidsLashes', 'l', 'blepharitis'], val)}
                label="Blepharitis"
                readonly={readonly}
              />

              <GradingControl
                value={data.lidsLashes.l.meibomianGlandDysfunction}
                onChange={(val) => updateField(['lidsLashes', 'l', 'meibomianGlandDysfunction'], val)}
                label="Meibomian Gland Dysfunction (MGD)"
                readonly={readonly}
              />

              <div className="mt-4">
                <Label className="text-xs font-medium">Other Findings</Label>
                <Input
                  value={data.lidsLashes.l.otherFindings || ''}
                  onChange={(e) => updateField(['lidsLashes', 'l', 'otherFindings'], e.target.value)}
                  placeholder="Additional observations..."
                  className="h-9 mt-2"
                  disabled={readonly}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Notes - 500 character limit */}
      <Card className="border-2 border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="text-lg">Slit Lamp Examination Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <Label className="text-sm font-medium">Additional Issues or Observations</Label>
              <span className={`text-xs ${remainingChars < 0 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                {data.sectionNotes?.length || 0}/500 characters
              </span>
            </div>
            <Textarea
              value={data.sectionNotes || ''}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  updateField(['sectionNotes'], e.target.value);
                }
              }}
              placeholder="Enter any issues, concerns, or observations from slit lamp examination (max 500 characters)..."
              rows={4}
              disabled={readonly}
              maxLength={500}
              className={`${readonly ? 'bg-slate-50' : ''} ${remainingChars < 50 && remainingChars >= 0 ? 'border-amber-400' : ''} ${remainingChars < 0 ? 'border-red-500' : ''}`}
            />
            {remainingChars < 50 && remainingChars >= 0 && (
              <p className="text-xs text-amber-600">
                {remainingChars} characters remaining
              </p>
            )}
            {remainingChars < 0 && (
              <p className="text-xs text-red-600 font-medium">
                Character limit exceeded by {Math.abs(remainingChars)} characters
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
