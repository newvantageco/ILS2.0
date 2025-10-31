import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Droplets, Calculator } from 'lucide-react';
import { useEffect } from 'react';

interface TonometryData {
  measurements: {
    r: { 
      value1: string; 
      value2: string; 
      value3: string; 
      value4: string; 
      average: string; 
      corrected: string; 
      cornealThickness: string; 
      instrument: string 
    };
    l: { 
      value1: string; 
      value2: string; 
      value3: string; 
      value4: string; 
      average: string; 
      corrected: string; 
      cornealThickness: string; 
      instrument: string 
    };
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
}

interface TonometryTabProps {
  data: TonometryData;
  onChange: (data: TonometryData) => void;
  readonly?: boolean;
}

export default function TonometryTab({ data, onChange, readonly = false }: TonometryTabProps) {
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

  // Auto-calculate average IOP
  const calculateAverage = (values: string[]): string => {
    const nums = values.filter(v => v && !isNaN(parseFloat(v))).map(v => parseFloat(v));
    if (nums.length === 0) return '';
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg.toFixed(1);
  };

  // Effect to auto-calculate averages
  useEffect(() => {
    const rValues = [
      data.measurements.r.value1,
      data.measurements.r.value2,
      data.measurements.r.value3,
      data.measurements.r.value4,
    ];
    const lValues = [
      data.measurements.l.value1,
      data.measurements.l.value2,
      data.measurements.l.value3,
      data.measurements.l.value4,
    ];
    
    const rAvg = calculateAverage(rValues);
    const lAvg = calculateAverage(lValues);
    
    if (rAvg !== data.measurements.r.average) {
      updateField(['measurements', 'r', 'average'], rAvg);
    }
    if (lAvg !== data.measurements.l.average) {
      updateField(['measurements', 'l', 'average'], lAvg);
    }
  }, [
    data.measurements.r.value1,
    data.measurements.r.value2,
    data.measurements.r.value3,
    data.measurements.r.value4,
    data.measurements.l.value1,
    data.measurements.l.value2,
    data.measurements.l.value3,
    data.measurements.l.value4,
  ]);

  return (
    <div className="space-y-6">
      {/* IOP Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            Intraocular Pressure (IOP) Measurements
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Normal range: 10-21 mmHg</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Right Eye */}
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
              <h3 className="text-sm font-semibold text-blue-900 mb-4">Right Eye (OD)</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <div>
                  <Label className="text-xs font-medium">Value 1</Label>
                  <Input
                    value={data.measurements.r.value1 || ''}
                    onChange={(e) => updateField(['measurements', 'r', 'value1'], e.target.value)}
                    placeholder="14"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Value 2</Label>
                  <Input
                    value={data.measurements.r.value2 || ''}
                    onChange={(e) => updateField(['measurements', 'r', 'value2'], e.target.value)}
                    placeholder="15"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Value 3</Label>
                  <Input
                    value={data.measurements.r.value3 || ''}
                    onChange={(e) => updateField(['measurements', 'r', 'value3'], e.target.value)}
                    placeholder="14"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Value 4</Label>
                  <Input
                    value={data.measurements.r.value4 || ''}
                    onChange={(e) => updateField(['measurements', 'r', 'value4'], e.target.value)}
                    placeholder="15"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Calculator className="h-3 w-3" />
                    Average
                  </Label>
                  <Input
                    value={data.measurements.r.average || ''}
                    placeholder="14.5"
                    className="h-9 text-center font-semibold bg-blue-100 border-blue-300"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Corrected</Label>
                  <Input
                    value={data.measurements.r.corrected || ''}
                    onChange={(e) => updateField(['measurements', 'r', 'corrected'], e.target.value)}
                    placeholder="15"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Corneal Thickness (μm)</Label>
                  <Input
                    value={data.measurements.r.cornealThickness || ''}
                    onChange={(e) => updateField(['measurements', 'r', 'cornealThickness'], e.target.value)}
                    placeholder="540 (normal: 520-570)"
                    className="h-9"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Instrument</Label>
                  <Select
                    value={data.measurements.r.instrument || ''}
                    onValueChange={(value) => updateField(['measurements', 'r', 'instrument'], value)}
                    disabled={readonly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select instrument..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nct">NCT (Non-Contact Tonometer)</SelectItem>
                      <SelectItem value="goldmann">Goldmann Applanation</SelectItem>
                      <SelectItem value="icare">iCare</SelectItem>
                      <SelectItem value="tonopen">Tonopen</SelectItem>
                      <SelectItem value="perkins">Perkins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Left Eye */}
            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
              <h3 className="text-sm font-semibold text-green-900 mb-4">Left Eye (OS)</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                <div>
                  <Label className="text-xs font-medium">Value 1</Label>
                  <Input
                    value={data.measurements.l.value1 || ''}
                    onChange={(e) => updateField(['measurements', 'l', 'value1'], e.target.value)}
                    placeholder="14"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Value 2</Label>
                  <Input
                    value={data.measurements.l.value2 || ''}
                    onChange={(e) => updateField(['measurements', 'l', 'value2'], e.target.value)}
                    placeholder="15"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Value 3</Label>
                  <Input
                    value={data.measurements.l.value3 || ''}
                    onChange={(e) => updateField(['measurements', 'l', 'value3'], e.target.value)}
                    placeholder="14"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Value 4</Label>
                  <Input
                    value={data.measurements.l.value4 || ''}
                    onChange={(e) => updateField(['measurements', 'l', 'value4'], e.target.value)}
                    placeholder="15"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Calculator className="h-3 w-3" />
                    Average
                  </Label>
                  <Input
                    value={data.measurements.l.average || ''}
                    placeholder="14.5"
                    className="h-9 text-center font-semibold bg-green-100 border-green-300"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Corrected</Label>
                  <Input
                    value={data.measurements.l.corrected || ''}
                    onChange={(e) => updateField(['measurements', 'l', 'corrected'], e.target.value)}
                    placeholder="15"
                    type="number"
                    step="0.1"
                    className="h-9 text-center"
                    disabled={readonly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Corneal Thickness (μm)</Label>
                  <Input
                    value={data.measurements.l.cornealThickness || ''}
                    onChange={(e) => updateField(['measurements', 'l', 'cornealThickness'], e.target.value)}
                    placeholder="540 (normal: 520-570)"
                    className="h-9"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Instrument</Label>
                  <Select
                    value={data.measurements.l.instrument || ''}
                    onValueChange={(value) => updateField(['measurements', 'l', 'instrument'], value)}
                    disabled={readonly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select instrument..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nct">NCT (Non-Contact Tonometer)</SelectItem>
                      <SelectItem value="goldmann">Goldmann Applanation</SelectItem>
                      <SelectItem value="icare">iCare</SelectItem>
                      <SelectItem value="tonopen">Tonopen</SelectItem>
                      <SelectItem value="perkins">Perkins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Time of Measurement */}
            <div>
              <Label className="text-sm font-medium">Time (nearest hour)</Label>
              <Input
                value={data.time || ''}
                onChange={(e) => updateField(['time'], e.target.value)}
                placeholder="14:30"
                type="time"
                className="h-9 max-w-xs"
                disabled={readonly}
              />
              <p className="text-xs text-muted-foreground mt-1">IOP varies throughout the day - time is important for tracking</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Anaesthetics/Drops */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="h-5 w-5 text-purple-600" />
            Anaesthetics / Mydriatics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Info Given</Label>
            <RadioGroup
              value={data.anaesthetics.infoGiven}
              onValueChange={(value) => updateField(['anaesthetics', 'infoGiven'], value)}
              disabled={readonly}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="info-yes" />
                <Label htmlFor="info-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="info-no" />
                <Label htmlFor="info-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Drops Given - Right Eye</Label>
              <RadioGroup
                value={data.anaesthetics.dropsGiven.r.toString()}
                onValueChange={(value) => updateField(['anaesthetics', 'dropsGiven', 'r'], parseInt(value))}
                disabled={readonly}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="r-drops-1" />
                  <Label htmlFor="r-drops-1" className="font-normal cursor-pointer">1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="r-drops-2" />
                  <Label htmlFor="r-drops-2" className="font-normal cursor-pointer">2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="r-drops-3" />
                  <Label htmlFor="r-drops-3" className="font-normal cursor-pointer">3</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Drops Given - Left Eye</Label>
              <RadioGroup
                value={data.anaesthetics.dropsGiven.l.toString()}
                onValueChange={(value) => updateField(['anaesthetics', 'dropsGiven', 'l'], parseInt(value))}
                disabled={readonly}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="l-drops-1" />
                  <Label htmlFor="l-drops-1" className="font-normal cursor-pointer">1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="l-drops-2" />
                  <Label htmlFor="l-drops-2" className="font-normal cursor-pointer">2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="l-drops-3" />
                  <Label htmlFor="l-drops-3" className="font-normal cursor-pointer">3</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Date and Time Given</Label>
              <Input
                value={data.anaesthetics.dateTimeGiven || ''}
                onChange={(e) => updateField(['anaesthetics', 'dateTimeGiven'], e.target.value)}
                type="datetime-local"
                className="h-9"
                disabled={readonly}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Batch Number</Label>
              <Input
                value={data.anaesthetics.batch || ''}
                onChange={(e) => updateField(['anaesthetics', 'batch'], e.target.value)}
                placeholder="Batch number..."
                className="h-9"
                disabled={readonly}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Expiry Date</Label>
              <Input
                value={data.anaesthetics.expiry || ''}
                onChange={(e) => updateField(['anaesthetics', 'expiry'], e.target.value)}
                type="date"
                className="h-9"
                disabled={readonly}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={data.anaesthetics.notes || ''}
              onChange={(e) => updateField(['anaesthetics', 'notes'], e.target.value)}
              placeholder="Additional notes about drops administration..."
              rows={3}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
