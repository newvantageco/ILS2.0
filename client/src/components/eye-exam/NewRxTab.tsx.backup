import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye, Camera, CheckCircle, FileText } from 'lucide-react';

interface NewRxData {
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
}

interface NewRxTabProps {
  data: NewRxData;
  onChange: (data: NewRxData) => void;
  readonly?: boolean;
}

// PERFORMANCE: Memoize to prevent unnecessary re-renders when parent updates
const NewRxTab = memo(function NewRxTab({ data, onChange, readonly = false }: NewRxTabProps) {
  const updateField = (path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone to avoid mutation
    let current: any = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        // Initialize with proper structure for nested objects
        if (path[i] === 'secondPair') {
          current[path[i]] = {
            distanceRx: {
              r: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' },
              l: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' }
            },
            nearRx: {
              r: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' },
              l: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' }
            },
            intermediateRx: {
              r: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' },
              l: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' }
            }
          };
        } else if (path[i] === 'distanceRx' || path[i] === 'nearRx' || path[i] === 'intermediateRx') {
          current[path[i]] = {
            r: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' },
            l: { sph: '', cyl: '', axis: '', prism: '', binocularAcuity: '' }
          };
        } else {
          current[path[i]] = {};
        }
      }
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      {/* Objective/Auto-Refraction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Objective (Retinoscopy/Auto-Refractor)
            <Badge variant="secondary" className="ml-2">Starting Point</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-sm"></th>
                  <th className="text-center py-2 px-3 font-medium text-sm">Sphere</th>
                  <th className="text-center py-2 px-3 font-medium text-sm">Cyl</th>
                  <th className="text-center py-2 px-3 font-medium text-sm">Axis</th>
                  <th className="text-center py-2 px-3 font-medium text-sm">VA</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-3 font-medium text-sm">R</td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.objective.r.sph || ''}
                      onChange={(e) => updateField(['objective', 'r', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.objective.r.cyl || ''}
                      onChange={(e) => updateField(['objective', 'r', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.objective.r.axis || ''}
                      onChange={(e) => updateField(['objective', 'r', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.objective.r.va || ''}
                      onChange={(e) => updateField(['objective', 'r', 'va'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium text-sm">L</td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.objective.l.sph || ''}
                      onChange={(e) => updateField(['objective', 'l', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.objective.l.cyl || ''}
                      onChange={(e) => updateField(['objective', 'l', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.objective.l.axis || ''}
                      onChange={(e) => updateField(['objective', 'l', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.objective.l.va || ''}
                      onChange={(e) => updateField(['objective', 'l', 'va'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Subjective Refraction (Distance) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Subjective Refraction (Distance)
            <Badge variant="secondary" className="ml-2">"Better 1 or 2?"</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-xs"></th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Sphere</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Cyl</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Axis</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">VA</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Bin. Acuity</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Prism</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Muscle Bal.</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Fix. Disp.</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-2 font-medium">R</td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.r.sph || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.r.cyl || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.r.axis || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.r.va || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'va'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.r.binocularAcuity || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'binocularAcuity'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.r.prism || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'prism'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.r.muscleBalance || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'muscleBalance'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.r.fixationDisparity || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'fixationDisparity'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium">L</td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.l.sph || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.l.cyl || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.l.axis || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.l.va || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'va'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.l.binocularAcuity || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'binocularAcuity'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.l.prism || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'prism'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.l.muscleBalance || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'muscleBalance'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.subjective.primaryPair.l.fixationDisparity || ''}
                      onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'fixationDisparity'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* FINAL RX ISSUED - THREE SEPARATE GRIDS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-slate-900">Rx Issued</h2>
          <Badge variant="default" className="bg-green-600">Final Prescription</Badge>
        </div>

        {/* Distance Prescription */}
        <Card className="border-2 border-green-200 bg-green-50/30">
          <CardHeader className="bg-green-100/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-700" />
              Distance Prescription
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="border-b border-green-200">
                    <th className="text-left py-2 px-3 font-medium text-sm bg-green-50"></th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-green-50">Sphere</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-green-50">Cyl</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-green-50">Axis</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-green-50">Prism</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-green-50">Binocular Acuity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-3 font-semibold text-sm">R</td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.r.sph || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'sph'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.r.cyl || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'cyl'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.r.axis || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'axis'], e.target.value)}
                        placeholder="0"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.r.prism || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'prism'], e.target.value)}
                        placeholder=""
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.r.binocularAcuity || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'r', 'binocularAcuity'], e.target.value)}
                        placeholder="6/6"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-sm">L</td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.l.sph || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'sph'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.l.cyl || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'cyl'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.l.axis || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'axis'], e.target.value)}
                        placeholder="0"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.l.prism || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'prism'], e.target.value)}
                        placeholder=""
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.primaryPair.l.binocularAcuity || ''}
                        onChange={(e) => updateField(['subjective', 'primaryPair', 'l', 'binocularAcuity'], e.target.value)}
                        placeholder="6/6"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Near Prescription */}
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader className="bg-blue-100/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-700" />
              Near Prescription (Reading)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="border-b border-blue-200">
                    <th className="text-left py-2 px-3 font-medium text-sm bg-blue-50"></th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-blue-50">Sphere</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-blue-50">Cyl</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-blue-50">Axis</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-blue-50">Prism</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-blue-50">Binocular Acuity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-3 font-semibold text-sm">R</td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.r.sph || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'r', 'sph'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.r.cyl || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'r', 'cyl'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.r.axis || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'r', 'axis'], e.target.value)}
                        placeholder="0"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.r.prism || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'r', 'prism'], e.target.value)}
                        placeholder=""
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.r.binocularAcuity || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'r', 'binocularAcuity'], e.target.value)}
                        placeholder="N6"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-sm">L</td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.l.sph || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'l', 'sph'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.l.cyl || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'l', 'cyl'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.l.axis || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'l', 'axis'], e.target.value)}
                        placeholder="0"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.l.prism || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'l', 'prism'], e.target.value)}
                        placeholder=""
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.nearRx.l.binocularAcuity || ''}
                        onChange={(e) => updateField(['subjective', 'nearRx', 'l', 'binocularAcuity'], e.target.value)}
                        placeholder="N6"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Intermediate Prescription */}
        <Card className="border-2 border-purple-200 bg-purple-50/30">
          <CardHeader className="bg-purple-100/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-700" />
              Intermediate Prescription (Computer/Desk Work)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="border-b border-purple-200">
                    <th className="text-left py-2 px-3 font-medium text-sm bg-purple-50"></th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-purple-50">Sphere</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-purple-50">Cyl</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-purple-50">Axis</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-purple-50">Prism</th>
                    <th className="text-center py-2 px-3 font-medium text-sm bg-purple-50">Binocular Acuity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-3 font-semibold text-sm">R</td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.r.sph || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'r', 'sph'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.r.cyl || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'r', 'cyl'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.r.axis || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'r', 'axis'], e.target.value)}
                        placeholder="0"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.r.prism || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'r', 'prism'], e.target.value)}
                        placeholder=""
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.r.binocularAcuity || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'r', 'binocularAcuity'], e.target.value)}
                        placeholder="6/9"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-sm">L</td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.l.sph || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'l', 'sph'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.l.cyl || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'l', 'cyl'], e.target.value)}
                        placeholder="0.00"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.l.axis || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'l', 'axis'], e.target.value)}
                        placeholder="0"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.l.prism || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'l', 'prism'], e.target.value)}
                        placeholder=""
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={data.subjective.intermediateRx.l.binocularAcuity || ''}
                        onChange={(e) => updateField(['subjective', 'intermediateRx', 'l', 'binocularAcuity'], e.target.value)}
                        placeholder="6/9"
                        className="text-center h-9 font-semibold"
                        disabled={readonly}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Notes - To Be Printed on Rx
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.notes.toBePrinted || ''}
              onChange={(e) => updateField(['notes', 'toBePrinted'], e.target.value)}
              placeholder="Patient-facing notes that will appear on the prescription...&#10;E.g., 'For distance driving only', 'Progressive lenses recommended', etc."
              rows={6}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Notes - Not Printed (Internal Only)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={data.notes.notPrinted || ''}
              onChange={(e) => updateField(['notes', 'notPrinted'], e.target.value)}
              placeholder="Internal clinical notes...&#10;E.g., 'Patient struggling with adaptation', 'Consider referral if no improvement', etc."
              rows={6}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default NewRxTab;
