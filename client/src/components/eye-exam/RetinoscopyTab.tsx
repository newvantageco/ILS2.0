import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Lightbulb } from 'lucide-react';

interface RetinoscopyData {
  workingDistance: string;
  odSphere: string;
  odCylinder: string;
  odAxis: string;
  odNotes: string;
  osSphere: string;
  osCylinder: string;
  osAxis: string;
  osNotes: string;
  neutralizationNotes: string;
  sectionNotes: string;
}

interface RetinoscopyTabProps {
  data: RetinoscopyData;
  onChange: (data: RetinoscopyData) => void;
  readonly?: boolean;
}

// PERFORMANCE: Memoize to prevent unnecessary re-renders
const RetinoscopyTab = memo(function RetinoscopyTab({ data, onChange, readonly = false }: RetinoscopyTabProps) {
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
      {/* Working Distance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Retinoscopy Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Working Distance (cm)</Label>
              <Input
                type="text"
                value={data.workingDistance || ''}
                onChange={(e) => updateField(['workingDistance'], e.target.value)}
                placeholder="50, 67, 100..."
                disabled={readonly}
                className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
              />
              <p className="text-xs text-slate-500 mt-1">
                Common: 50cm (-2.00D), 67cm (-1.50D), 100cm (-1.00D)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Eye Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Right Eye (OD) - Retinoscopy Findings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Sphere</Label>
              <Input
                type="text"
                value={data.odSphere || ''}
                onChange={(e) => updateField(['odSphere'], e.target.value)}
                placeholder="+0.00 or -0.00"
                disabled={readonly}
                className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Cylinder</Label>
              <Input
                type="text"
                value={data.odCylinder || ''}
                onChange={(e) => updateField(['odCylinder'], e.target.value)}
                placeholder="+0.00 or -0.00"
                disabled={readonly}
                className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Axis</Label>
              <Input
                type="text"
                value={data.odAxis || ''}
                onChange={(e) => updateField(['odAxis'], e.target.value)}
                placeholder="0 - 180"
                disabled={readonly}
                className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">OD Observations</Label>
            <Textarea
              value={data.odNotes || ''}
              onChange={(e) => updateField(['odNotes'], e.target.value)}
              placeholder="Reflex quality, movement, neutralization point..."
              rows={2}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Left Eye Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Left Eye (OS) - Retinoscopy Findings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Sphere</Label>
              <Input
                type="text"
                value={data.osSphere || ''}
                onChange={(e) => updateField(['osSphere'], e.target.value)}
                placeholder="+0.00 or -0.00"
                disabled={readonly}
                className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Cylinder</Label>
              <Input
                type="text"
                value={data.osCylinder || ''}
                onChange={(e) => updateField(['osCylinder'], e.target.value)}
                placeholder="+0.00 or -0.00"
                disabled={readonly}
                className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Axis</Label>
              <Input
                type="text"
                value={data.osAxis || ''}
                onChange={(e) => updateField(['osAxis'], e.target.value)}
                placeholder="0 - 180"
                disabled={readonly}
                className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">OS Observations</Label>
            <Textarea
              value={data.osNotes || ''}
              onChange={(e) => updateField(['osNotes'], e.target.value)}
              placeholder="Reflex quality, movement, neutralization point..."
              rows={2}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Neutralization Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Retinoscopy Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-sm font-medium">Neutralization & General Findings</Label>
            <Textarea
              value={data.neutralizationNotes || ''}
              onChange={(e) => updateField(['neutralizationNotes'], e.target.value)}
              placeholder="Working distance compensation, scissor reflex, media opacity observations, comparison with auto-refractor..."
              rows={3}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Notes - 500 character limit */}
      <Card className="border-2 border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="text-lg">Retinoscopy Section Notes</CardTitle>
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
              placeholder="Enter any issues, concerns, or observations from retinoscopy (max 500 characters)..."
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

export default RetinoscopyTab;
