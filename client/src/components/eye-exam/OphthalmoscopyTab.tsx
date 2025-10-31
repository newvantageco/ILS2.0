import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Eye, Activity } from 'lucide-react';

interface OphthalmoscopyData {
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
}

interface OphthalmoscopyTabProps {
  data: OphthalmoscopyData;
  onChange: (data: OphthalmoscopyData) => void;
  readonly?: boolean;
}

export default function OphthalmoscopyTab({ data, onChange, readonly = false }: OphthalmoscopyTabProps) {
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
      {/* Bilateral Ophthalmoscopy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Ophthalmoscopy (Fundus Examination)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Right Eye */}
            <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
              <div className="flex items-center justify-center mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Right Eye (OD)</h3>
              </div>

              <div>
                <Label className="text-sm font-medium">Media</Label>
                <Input
                  value={data.r.media || ''}
                  onChange={(e) => updateField(['r', 'media'], e.target.value)}
                  placeholder="Clear / Hazy / Cataract"
                  className="h-9"
                  disabled={readonly}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Discs</Label>
                <Textarea
                  value={data.r.discs || ''}
                  onChange={(e) => updateField(['r', 'discs'], e.target.value)}
                  placeholder="Healthy, pink, sharp margins / Pale / Swollen"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">C/D Ratio</Label>
                <Input
                  value={data.r.cdRatio || ''}
                  onChange={(e) => updateField(['r', 'cdRatio'], e.target.value)}
                  placeholder="0.3 (normal: 0.2-0.4)"
                  className="h-9"
                  disabled={readonly}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Vessels</Label>
                <Textarea
                  value={data.r.vessels || ''}
                  onChange={(e) => updateField(['r', 'vessels'], e.target.value)}
                  placeholder="Normal caliber, A/V ratio 2:3, no abnormalities"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Fundus</Label>
                <Textarea
                  value={data.r.fundus || ''}
                  onChange={(e) => updateField(['r', 'fundus'], e.target.value)}
                  placeholder="Healthy appearance, no hemorrhages or exudates"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Macula</Label>
                <Textarea
                  value={data.r.macula || ''}
                  onChange={(e) => updateField(['r', 'macula'], e.target.value)}
                  placeholder="Healthy, normal foveal reflex, no drusen"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Periphery</Label>
                <Textarea
                  value={data.r.periphery || ''}
                  onChange={(e) => updateField(['r', 'periphery'], e.target.value)}
                  placeholder="Healthy, no tears, detachments, or lesions"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>
            </div>

            {/* Left Eye */}
            <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
              <div className="flex items-center justify-center mb-4">
                <h3 className="text-lg font-semibold text-green-900">Left Eye (OS)</h3>
              </div>

              <div>
                <Label className="text-sm font-medium">Media</Label>
                <Input
                  value={data.l.media || ''}
                  onChange={(e) => updateField(['l', 'media'], e.target.value)}
                  placeholder="Clear / Hazy / Cataract"
                  className="h-9"
                  disabled={readonly}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Discs</Label>
                <Textarea
                  value={data.l.discs || ''}
                  onChange={(e) => updateField(['l', 'discs'], e.target.value)}
                  placeholder="Healthy, pink, sharp margins / Pale / Swollen"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">C/D Ratio</Label>
                <Input
                  value={data.l.cdRatio || ''}
                  onChange={(e) => updateField(['l', 'cdRatio'], e.target.value)}
                  placeholder="0.3 (normal: 0.2-0.4)"
                  className="h-9"
                  disabled={readonly}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Vessels</Label>
                <Textarea
                  value={data.l.vessels || ''}
                  onChange={(e) => updateField(['l', 'vessels'], e.target.value)}
                  placeholder="Normal caliber, A/V ratio 2:3, no abnormalities"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Fundus</Label>
                <Textarea
                  value={data.l.fundus || ''}
                  onChange={(e) => updateField(['l', 'fundus'], e.target.value)}
                  placeholder="Healthy appearance, no hemorrhages or exudates"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Macula</Label>
                <Textarea
                  value={data.l.macula || ''}
                  onChange={(e) => updateField(['l', 'macula'], e.target.value)}
                  placeholder="Healthy, normal foveal reflex, no drusen"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Periphery</Label>
                <Textarea
                  value={data.l.periphery || ''}
                  onChange={(e) => updateField(['l', 'periphery'], e.target.value)}
                  placeholder="Healthy, no tears, detachments, or lesions"
                  rows={2}
                  disabled={readonly}
                  className={readonly ? 'bg-slate-50' : ''}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Additional Checks (Applies to Both Eyes) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Additional Checks (Binocular)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Motility (Eye Movements)</Label>
            <Textarea
              value={data.motility || ''}
              onChange={(e) => updateField(['motility'], e.target.value)}
              placeholder="Full range of movement OU (both eyes), no restrictions&#10;E.g., 'Smooth pursuits, full EOMs, no nystagmus'"
              rows={3}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Cover Test (Alignment)</Label>
              <Textarea
                value={data.coverTest || ''}
                onChange={(e) => updateField(['coverTest'], e.target.value)}
                placeholder="Distance: Ortho&#10;Near: Ortho&#10;(or specify deviation: 'Exophoria 2∆')"
                rows={3}
                disabled={readonly}
                className={readonly ? 'bg-slate-50' : ''}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Stereopsis (Depth Perception)</Label>
              <Input
                value={data.stereopsis || ''}
                onChange={(e) => updateField(['stereopsis'], e.target.value)}
                placeholder="40 arcsec (normal: 20-60)"
                className="h-9"
                disabled={readonly}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
