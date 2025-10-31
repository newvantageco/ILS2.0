import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Glasses, Eye } from 'lucide-react';

interface CurrentRxData {
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
}

interface CurrentRxTabProps {
  data: CurrentRxData;
  onChange: (data: CurrentRxData) => void;
  readonly?: boolean;
}

export default function CurrentRxTab({ data, onChange, readonly = false }: CurrentRxTabProps) {
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
      {/* Unaided Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Unaided Vision
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium text-sm"></th>
                  <th className="text-center py-2 px-4 font-medium text-sm">Distance Rx</th>
                  <th className="text-center py-2 px-4 font-medium text-sm">Binocular</th>
                  <th className="text-center py-2 px-4 font-medium text-sm">Near Rx</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium text-sm">R</td>
                  <td className="py-3 px-4">
                    <Input
                      value={data.unaidedVision.r.distance || ''}
                      onChange={(e) => updateField(['unaidedVision', 'r', 'distance'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      value={data.unaidedVision.r.binocular || ''}
                      onChange={(e) => updateField(['unaidedVision', 'r', 'binocular'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      value={data.unaidedVision.r.near || ''}
                      onChange={(e) => updateField(['unaidedVision', 'r', 'near'], e.target.value)}
                      placeholder="N6"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-sm">L</td>
                  <td className="py-3 px-4">
                    <Input
                      value={data.unaidedVision.l.distance || ''}
                      onChange={(e) => updateField(['unaidedVision', 'l', 'distance'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      value={data.unaidedVision.l.binocular || ''}
                      onChange={(e) => updateField(['unaidedVision', 'l', 'binocular'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Input
                      value={data.unaidedVision.l.near || ''}
                      onChange={(e) => updateField(['unaidedVision', 'l', 'near'], e.target.value)}
                      placeholder="N6"
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

      {/* Contact Lens Rx (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Glasses className="h-5 w-5 text-blue-600" />
              Contact Lens Rx
            </span>
            <Badge variant="secondary">Optional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Brand</Label>
              <Input
                value={data.contactLensRx?.brand || ''}
                onChange={(e) => updateField(['contactLensRx', 'brand'], e.target.value)}
                placeholder="Brand name..."
                className="h-9"
                disabled={readonly}
              />
            </div>
            <div>
              <Label className="text-sm">Name</Label>
              <Input
                value={data.contactLensRx?.name || ''}
                onChange={(e) => updateField(['contactLensRx', 'name'], e.target.value)}
                placeholder="Lens name..."
                className="h-9"
                disabled={readonly}
              />
            </div>
            <div>
              <Label className="text-sm">Fitting</Label>
              <Input
                value={data.contactLensRx?.fitting || ''}
                onChange={(e) => updateField(['contactLensRx', 'fitting'], e.target.value)}
                placeholder="Fitting..."
                className="h-9"
                disabled={readonly}
              />
            </div>
          </div>

          <Separator />

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-xs"></th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Sph</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Cyl</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Axis</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Add</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Colour</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Dominant</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">VA</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">Near VA</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-2 font-medium text-sm">R</td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.r.sph || ''}
                      onChange={(e) => updateField(['contactLensRx', 'r', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.r.cyl || ''}
                      onChange={(e) => updateField(['contactLensRx', 'r', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.r.axis || ''}
                      onChange={(e) => updateField(['contactLensRx', 'r', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.r.add || ''}
                      onChange={(e) => updateField(['contactLensRx', 'r', 'add'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.r.colour || ''}
                      onChange={(e) => updateField(['contactLensRx', 'r', 'colour'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.r.dominant || ''}
                      onChange={(e) => updateField(['contactLensRx', 'r', 'dominant'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.r.va || ''}
                      onChange={(e) => updateField(['contactLensRx', 'r', 'va'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.r.nearVa || ''}
                      onChange={(e) => updateField(['contactLensRx', 'r', 'nearVa'], e.target.value)}
                      placeholder="N6"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2 font-medium text-sm">L</td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.l.sph || ''}
                      onChange={(e) => updateField(['contactLensRx', 'l', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.l.cyl || ''}
                      onChange={(e) => updateField(['contactLensRx', 'l', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.l.axis || ''}
                      onChange={(e) => updateField(['contactLensRx', 'l', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.l.add || ''}
                      onChange={(e) => updateField(['contactLensRx', 'l', 'add'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.l.colour || ''}
                      onChange={(e) => updateField(['contactLensRx', 'l', 'colour'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.l.dominant || ''}
                      onChange={(e) => updateField(['contactLensRx', 'l', 'dominant'], e.target.value)}
                      placeholder=""
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.l.va || ''}
                      onChange={(e) => updateField(['contactLensRx', 'l', 'va'], e.target.value)}
                      placeholder="6/6"
                      className="text-center h-8 text-sm"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={data.contactLensRx?.l.nearVa || ''}
                      onChange={(e) => updateField(['contactLensRx', 'l', 'nearVa'], e.target.value)}
                      placeholder="N6"
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

      {/* Primary Pair (Spectacles) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Glasses className="h-5 w-5 text-blue-600" />
            Primary Pair (Current Spectacles)
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
                  <th className="text-center py-2 px-3 font-medium text-sm">Add</th>
                  <th className="text-center py-2 px-3 font-medium text-sm">Prism</th>
                  <th className="text-center py-2 px-3 font-medium text-sm">Binocular Acuity</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-3 font-medium text-sm">R</td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.r.sph || ''}
                      onChange={(e) => updateField(['primaryPair', 'r', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.r.cyl || ''}
                      onChange={(e) => updateField(['primaryPair', 'r', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.r.axis || ''}
                      onChange={(e) => updateField(['primaryPair', 'r', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.r.add || ''}
                      onChange={(e) => updateField(['primaryPair', 'r', 'add'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.r.prism || ''}
                      onChange={(e) => updateField(['primaryPair', 'r', 'prism'], e.target.value)}
                      placeholder=""
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.r.binocularAcuity || ''}
                      onChange={(e) => updateField(['primaryPair', 'r', 'binocularAcuity'], e.target.value)}
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
                      value={data.primaryPair.l.sph || ''}
                      onChange={(e) => updateField(['primaryPair', 'l', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.l.cyl || ''}
                      onChange={(e) => updateField(['primaryPair', 'l', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.l.axis || ''}
                      onChange={(e) => updateField(['primaryPair', 'l', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.l.add || ''}
                      onChange={(e) => updateField(['primaryPair', 'l', 'add'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.l.prism || ''}
                      onChange={(e) => updateField(['primaryPair', 'l', 'prism'], e.target.value)}
                      placeholder=""
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.primaryPair.l.binocularAcuity || ''}
                      onChange={(e) => updateField(['primaryPair', 'l', 'binocularAcuity'], e.target.value)}
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

      {/* Secondary Pair (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Glasses className="h-5 w-5 text-blue-600" />
              Secondary Pair
            </span>
            <Badge variant="secondary">Optional</Badge>
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
                  <th className="text-center py-2 px-3 font-medium text-sm">Add</th>
                  <th className="text-center py-2 px-3 font-medium text-sm">Prism</th>
                  <th className="text-center py-2 px-3 font-medium text-sm">Binocular Acuity</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-3 font-medium text-sm">R</td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.r.sph || ''}
                      onChange={(e) => updateField(['secondaryPair', 'r', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.r.cyl || ''}
                      onChange={(e) => updateField(['secondaryPair', 'r', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.r.axis || ''}
                      onChange={(e) => updateField(['secondaryPair', 'r', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.r.add || ''}
                      onChange={(e) => updateField(['secondaryPair', 'r', 'add'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.r.prism || ''}
                      onChange={(e) => updateField(['secondaryPair', 'r', 'prism'], e.target.value)}
                      placeholder=""
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.r.binocularAcuity || ''}
                      onChange={(e) => updateField(['secondaryPair', 'r', 'binocularAcuity'], e.target.value)}
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
                      value={data.secondaryPair?.l.sph || ''}
                      onChange={(e) => updateField(['secondaryPair', 'l', 'sph'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.l.cyl || ''}
                      onChange={(e) => updateField(['secondaryPair', 'l', 'cyl'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.l.axis || ''}
                      onChange={(e) => updateField(['secondaryPair', 'l', 'axis'], e.target.value)}
                      placeholder="0"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.l.add || ''}
                      onChange={(e) => updateField(['secondaryPair', 'l', 'add'], e.target.value)}
                      placeholder="0.00"
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.l.prism || ''}
                      onChange={(e) => updateField(['secondaryPair', 'l', 'prism'], e.target.value)}
                      placeholder=""
                      className="text-center h-9"
                      disabled={readonly}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <Input
                      value={data.secondaryPair?.l.binocularAcuity || ''}
                      onChange={(e) => updateField(['secondaryPair', 'l', 'binocularAcuity'], e.target.value)}
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
    </div>
  );
}
