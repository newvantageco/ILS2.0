import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Microscope, Checkbox as CheckIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface SlitLampData {
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
      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Microscope className="h-5 w-5 text-blue-600" />
            Slit Lamp Examination Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <Label className="text-sm font-medium mb-3 block">Method</Label>
              <RadioGroup
                value={data.method}
                onValueChange={(value) => updateField(['method'], value)}
                disabled={readonly}
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
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="volk"
                checked={data.volk || false}
                onCheckedChange={(checked) => updateField(['volk'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="volk" className="font-normal cursor-pointer">Volk</Label>
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
    </div>
  );
}
