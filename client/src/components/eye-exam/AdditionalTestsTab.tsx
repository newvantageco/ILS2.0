import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Activity, Eye, Scan, Grid3x3 } from 'lucide-react';

interface AdditionalTestsData {
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
}

interface AdditionalTestsTabProps {
  data: AdditionalTestsData;
  onChange: (data: AdditionalTestsData) => void;
  readonly?: boolean;
}

export default function AdditionalTestsTab({ data, onChange, readonly = false }: AdditionalTestsTabProps) {
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

  return (
    <div className="space-y-6">
      {/* Visual Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Visual Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Instrument</Label>
            <Select
              value={data.visualFields.instrument || ''}
              onValueChange={(value) => updateField(['visualFields', 'instrument'], value)}
              disabled={readonly}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select instrument..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="humphrey">Humphrey Field Analyzer</SelectItem>
                <SelectItem value="octopus">Octopus</SelectItem>
                <SelectItem value="confrontation">Confrontation</SelectItem>
                <SelectItem value="goldmann">Goldmann Perimeter</SelectItem>
                <SelectItem value="fdtfdt">FDT (Frequency Doubling Technology)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Right Eye (OD)</Label>
              <Textarea
                value={data.visualFields.r || ''}
                onChange={(e) => updateField(['visualFields', 'r'], e.target.value)}
                placeholder="Full to confrontation / Describe any defects..."
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vf-r-normal"
                    checked={data.visualFields.normal.r || false}
                    onCheckedChange={(checked) => updateField(['visualFields', 'normal', 'r'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="vf-r-normal" className="font-normal text-sm cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vf-r-abnormal"
                    checked={data.visualFields.abnormal.r || false}
                    onCheckedChange={(checked) => updateField(['visualFields', 'abnormal', 'r'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="vf-r-abnormal" className="font-normal text-sm cursor-pointer">Abnormal</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Left Eye (OS)</Label>
              <Textarea
                value={data.visualFields.l || ''}
                onChange={(e) => updateField(['visualFields', 'l'], e.target.value)}
                placeholder="Full to confrontation / Describe any defects..."
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vf-l-normal"
                    checked={data.visualFields.normal.l || false}
                    onCheckedChange={(checked) => updateField(['visualFields', 'normal', 'l'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="vf-l-normal" className="font-normal text-sm cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vf-l-abnormal"
                    checked={data.visualFields.abnormal.l || false}
                    onCheckedChange={(checked) => updateField(['visualFields', 'abnormal', 'l'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="vf-l-abnormal" className="font-normal text-sm cursor-pointer">Abnormal</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confrontation Test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Confrontation Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Right Eye (OD)</Label>
              <Textarea
                value={data.confrontation.r || ''}
                onChange={(e) => updateField(['confrontation', 'r'], e.target.value)}
                placeholder="Full in all quadrants"
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="conf-r-normal"
                    checked={data.confrontation.normal.r || false}
                    onCheckedChange={(checked) => updateField(['confrontation', 'normal', 'r'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="conf-r-normal" className="font-normal text-sm cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="conf-r-abnormal"
                    checked={data.confrontation.abnormal.r || false}
                    onCheckedChange={(checked) => updateField(['confrontation', 'abnormal', 'r'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="conf-r-abnormal" className="font-normal text-sm cursor-pointer">Abnormal</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Left Eye (OS)</Label>
              <Textarea
                value={data.confrontation.l || ''}
                onChange={(e) => updateField(['confrontation', 'l'], e.target.value)}
                placeholder="Full in all quadrants"
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="conf-l-normal"
                    checked={data.confrontation.normal.l || false}
                    onCheckedChange={(checked) => updateField(['confrontation', 'normal', 'l'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="conf-l-normal" className="font-normal text-sm cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="conf-l-abnormal"
                    checked={data.confrontation.abnormal.l || false}
                    onCheckedChange={(checked) => updateField(['confrontation', 'abnormal', 'l'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="conf-l-abnormal" className="font-normal text-sm cursor-pointer">Abnormal</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wide-Field Imaging */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-purple-600" />
            Wide-Field Imaging
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Instrument</Label>
            <Select
              value={data.wideFieldImaging.instrument || ''}
              onValueChange={(value) => updateField(['wideFieldImaging', 'instrument'], value)}
              disabled={readonly}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select instrument..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="optos">Optos Optomap</SelectItem>
                <SelectItem value="clarus">Clarus</SelectItem>
                <SelectItem value="eidon">Eidon</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Right Eye (OD)</Label>
              <Textarea
                value={data.wideFieldImaging.r || ''}
                onChange={(e) => updateField(['wideFieldImaging', 'r'], e.target.value)}
                placeholder="Image captured, findings..."
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Left Eye (OS)</Label>
              <Textarea
                value={data.wideFieldImaging.l || ''}
                onChange={(e) => updateField(['wideFieldImaging', 'l'], e.target.value)}
                placeholder="Image captured, findings..."
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-orange-600" />
            OCT (Optical Coherence Tomography)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Instrument</Label>
            <Select
              value={data.oct.instrument || ''}
              onValueChange={(value) => updateField(['oct', 'instrument'], value)}
              disabled={readonly}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select instrument..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heidelberg-spectralis">Heidelberg Spectralis</SelectItem>
                <SelectItem value="zeiss-cirrus">Zeiss Cirrus</SelectItem>
                <SelectItem value="topcon-3d">Topcon 3D OCT</SelectItem>
                <SelectItem value="optovue">Optovue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Right Eye (OD)</Label>
              <Textarea
                value={data.oct.r || ''}
                onChange={(e) => updateField(['oct', 'r'], e.target.value)}
                placeholder="Scan performed, retinal layers normal..."
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Left Eye (OS)</Label>
              <Textarea
                value={data.oct.l || ''}
                onChange={(e) => updateField(['oct', 'l'], e.target.value)}
                placeholder="Scan performed, retinal layers normal..."
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amsler Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-red-600" />
            Amsler Grid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Right Eye (OD)</Label>
              <Textarea
                value={data.amsler.r || ''}
                onChange={(e) => updateField(['amsler', 'r'], e.target.value)}
                placeholder="No distortion, all lines straight"
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="amsler-r-normal"
                    checked={data.amsler.normal.r || false}
                    onCheckedChange={(checked) => updateField(['amsler', 'normal', 'r'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="amsler-r-normal" className="font-normal text-sm cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="amsler-r-abnormal"
                    checked={data.amsler.abnormal.r || false}
                    onCheckedChange={(checked) => updateField(['amsler', 'abnormal', 'r'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="amsler-r-abnormal" className="font-normal text-sm cursor-pointer">Abnormal</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Left Eye (OS)</Label>
              <Textarea
                value={data.amsler.l || ''}
                onChange={(e) => updateField(['amsler', 'l'], e.target.value)}
                placeholder="No distortion, all lines straight"
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="amsler-l-normal"
                    checked={data.amsler.normal.l || false}
                    onCheckedChange={(checked) => updateField(['amsler', 'normal', 'l'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="amsler-l-normal" className="font-normal text-sm cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="amsler-l-abnormal"
                    checked={data.amsler.abnormal.l || false}
                    onCheckedChange={(checked) => updateField(['amsler', 'abnormal', 'l'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="amsler-l-abnormal" className="font-normal text-sm cursor-pointer">Abnormal</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colour Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-pink-600" />
            Colour Vision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Test Used</Label>
            <Select
              value={data.colourVision.test || ''}
              onValueChange={(value) => updateField(['colourVision', 'test'], value)}
              disabled={readonly}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select test..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ishihara">Ishihara Plates</SelectItem>
                <SelectItem value="d15">D-15 (Farnsworth)</SelectItem>
                <SelectItem value="fm100">FM-100 (Farnsworth-Munsell)</SelectItem>
                <SelectItem value="city">City University Test</SelectItem>
                <SelectItem value="hardy-rand-rittler">Hardy-Rand-Rittler</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Right Eye (OD)</Label>
              <Textarea
                value={data.colourVision.r || ''}
                onChange={(e) => updateField(['colourVision', 'r'], e.target.value)}
                placeholder="Normal, all plates read correctly"
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="colour-r-normal"
                    checked={data.colourVision.normal.r || false}
                    onCheckedChange={(checked) => updateField(['colourVision', 'normal', 'r'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="colour-r-normal" className="font-normal text-sm cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="colour-r-abnormal"
                    checked={data.colourVision.abnormal.r || false}
                    onCheckedChange={(checked) => updateField(['colourVision', 'abnormal', 'r'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="colour-r-abnormal" className="font-normal text-sm cursor-pointer">Abnormal</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Left Eye (OS)</Label>
              <Textarea
                value={data.colourVision.l || ''}
                onChange={(e) => updateField(['colourVision', 'l'], e.target.value)}
                placeholder="Normal, all plates read correctly"
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="colour-l-normal"
                    checked={data.colourVision.normal.l || false}
                    onCheckedChange={(checked) => updateField(['colourVision', 'normal', 'l'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="colour-l-normal" className="font-normal text-sm cursor-pointer">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="colour-l-abnormal"
                    checked={data.colourVision.abnormal.l || false}
                    onCheckedChange={(checked) => updateField(['colourVision', 'abnormal', 'l'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="colour-l-abnormal" className="font-normal text-sm cursor-pointer">Abnormal</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
