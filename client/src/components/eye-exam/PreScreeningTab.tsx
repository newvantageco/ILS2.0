import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Scan, Ruler, Eye } from 'lucide-react';

interface PreScreeningData {
  avms: {
    odSphere: string;
    odCylinder: string;
    odAxis: string;
    osSphere: string;
    osCylinder: string;
    osAxis: string;
    pupilDistanceOd: string;
    pupilDistanceOs: string;
    notes: string;
  };
  focimetry: {
    odSphere: string;
    odCylinder: string;
    odAxis: string;
    odAdd: string;
    osSphere: string;
    osCylinder: string;
    osAxis: string;
    osAdd: string;
    lensType: string;
    notes: string;
  };
  phorias: {
    distancePhoria: string;
    distancePhoriaValue: string;
    nearPhoria: string;
    nearPhoriaValue: string;
    verticalPhoria: string;
    notes: string;
  };
  sectionNotes: string;
}

interface PreScreeningTabProps {
  data: PreScreeningData;
  onChange: (data: PreScreeningData) => void;
  readonly?: boolean;
}

// PERFORMANCE: Memoize to prevent unnecessary re-renders
const PreScreeningTab = memo(function PreScreeningTab({ data, onChange, readonly = false }: PreScreeningTabProps) {
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
      {/* AVMS - Automated Visual Measurement System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-blue-600" />
            AVMS (Automated Visual Measurement System)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Right Eye */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Right Eye (OD)</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Sphere</Label>
                <Input
                  type="text"
                  value={data.avms?.odSphere || ''}
                  onChange={(e) => updateField(['avms', 'odSphere'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Cylinder</Label>
                <Input
                  type="text"
                  value={data.avms?.odCylinder || ''}
                  onChange={(e) => updateField(['avms', 'odCylinder'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Axis</Label>
                <Input
                  type="text"
                  value={data.avms?.odAxis || ''}
                  onChange={(e) => updateField(['avms', 'odAxis'], e.target.value)}
                  placeholder="0"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">PD (mm)</Label>
                <Input
                  type="text"
                  value={data.avms?.pupilDistanceOd || ''}
                  onChange={(e) => updateField(['avms', 'pupilDistanceOd'], e.target.value)}
                  placeholder="32.0"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Left Eye */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Left Eye (OS)</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Sphere</Label>
                <Input
                  type="text"
                  value={data.avms?.osSphere || ''}
                  onChange={(e) => updateField(['avms', 'osSphere'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Cylinder</Label>
                <Input
                  type="text"
                  value={data.avms?.osCylinder || ''}
                  onChange={(e) => updateField(['avms', 'osCylinder'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Axis</Label>
                <Input
                  type="text"
                  value={data.avms?.osAxis || ''}
                  onChange={(e) => updateField(['avms', 'osAxis'], e.target.value)}
                  placeholder="0"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">PD (mm)</Label>
                <Input
                  type="text"
                  value={data.avms?.pupilDistanceOs || ''}
                  onChange={(e) => updateField(['avms', 'pupilDistanceOs'], e.target.value)}
                  placeholder="32.0"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={data.avms?.notes || ''}
              onChange={(e) => updateField(['avms', 'notes'], e.target.value)}
              placeholder="Additional findings or observations..."
              rows={2}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Focimetry */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Ruler className="h-5 w-5 text-green-600" />
            Focimetry (Current Lens Measurement)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Lens Type</Label>
            <Input
              type="text"
              value={data.focimetry?.lensType || ''}
              onChange={(e) => updateField(['focimetry', 'lensType'], e.target.value)}
              placeholder="Single vision / Bifocal / Varifocal"
              disabled={readonly}
              className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
            />
          </div>

          {/* Right Eye */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Right Eye (OD)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Sphere</Label>
                <Input
                  type="text"
                  value={data.focimetry?.odSphere || ''}
                  onChange={(e) => updateField(['focimetry', 'odSphere'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Cylinder</Label>
                <Input
                  type="text"
                  value={data.focimetry?.odCylinder || ''}
                  onChange={(e) => updateField(['focimetry', 'odCylinder'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Axis</Label>
                <Input
                  type="text"
                  value={data.focimetry?.odAxis || ''}
                  onChange={(e) => updateField(['focimetry', 'odAxis'], e.target.value)}
                  placeholder="0"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Add</Label>
                <Input
                  type="text"
                  value={data.focimetry?.odAdd || ''}
                  onChange={(e) => updateField(['focimetry', 'odAdd'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Left Eye */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Left Eye (OS)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Sphere</Label>
                <Input
                  type="text"
                  value={data.focimetry?.osSphere || ''}
                  onChange={(e) => updateField(['focimetry', 'osSphere'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Cylinder</Label>
                <Input
                  type="text"
                  value={data.focimetry?.osCylinder || ''}
                  onChange={(e) => updateField(['focimetry', 'osCylinder'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Axis</Label>
                <Input
                  type="text"
                  value={data.focimetry?.osAxis || ''}
                  onChange={(e) => updateField(['focimetry', 'osAxis'], e.target.value)}
                  placeholder="0"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Add</Label>
                <Input
                  type="text"
                  value={data.focimetry?.osAdd || ''}
                  onChange={(e) => updateField(['focimetry', 'osAdd'], e.target.value)}
                  placeholder="0.00"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={data.focimetry?.notes || ''}
              onChange={(e) => updateField(['focimetry', 'notes'], e.target.value)}
              placeholder="Lens condition, coating observations..."
              rows={2}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Phorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            Phorias (Muscle Balance)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Distance Phoria</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={data.phorias?.distancePhoria || ''}
                  onChange={(e) => updateField(['phorias', 'distancePhoria'], e.target.value)}
                  placeholder="Ortho / Exo / Eso"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
                <Input
                  type="text"
                  value={data.phorias?.distancePhoriaValue || ''}
                  onChange={(e) => updateField(['phorias', 'distancePhoriaValue'], e.target.value)}
                  placeholder="Value (Δ)"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Near Phoria</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={data.phorias?.nearPhoria || ''}
                  onChange={(e) => updateField(['phorias', 'nearPhoria'], e.target.value)}
                  placeholder="Ortho / Exo / Eso"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
                <Input
                  type="text"
                  value={data.phorias?.nearPhoriaValue || ''}
                  onChange={(e) => updateField(['phorias', 'nearPhoriaValue'], e.target.value)}
                  placeholder="Value (Δ)"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Vertical Phoria</Label>
            <Input
              type="text"
              value={data.phorias?.verticalPhoria || ''}
              onChange={(e) => updateField(['phorias', 'verticalPhoria'], e.target.value)}
              placeholder="None / R hyperphoria / L hyperphoria"
              disabled={readonly}
              className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={data.phorias?.notes || ''}
              onChange={(e) => updateField(['phorias', 'notes'], e.target.value)}
              placeholder="Additional observations..."
              rows={2}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Notes - 500 character limit */}
      <Card className="border-2 border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="text-lg">Pre-Screening Notes</CardTitle>
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
              placeholder="Enter any issues, concerns, or observations from pre-screening tests (max 500 characters)..."
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
});

export default PreScreeningTab;
