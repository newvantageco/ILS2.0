import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Circle, Layers, Focus } from 'lucide-react';

interface SupplementaryTestsData {
  pupils: {
    odSize: string;
    odReaction: string;
    odApd: boolean;
    osSize: string;
    osReaction: string;
    osApd: boolean;
    notes: string;
  };
  coverTest: {
    distanceDeviation: string;
    distanceType: string;
    distanceAmount: string;
    nearDeviation: string;
    nearType: string;
    nearAmount: string;
    recovery: string;
    notes: string;
  };
  stereopsis: {
    test: string;
    result: string;
    seconds: string;
    normal: boolean;
    reduced: boolean;
    absent: boolean;
    notes: string;
  };
  convergence: {
    npcBreak: string;
    npcRecovery: string;
    npaBreak: string;
    npaRecovery: string;
    notes: string;
  };
  sectionNotes: string;
}

interface SupplementaryTestsTabProps {
  data: SupplementaryTestsData;
  onChange: (data: SupplementaryTestsData) => void;
  readonly?: boolean;
}

// PERFORMANCE: Memoize to prevent unnecessary re-renders
const SupplementaryTestsTab = memo(function SupplementaryTestsTab({ data, onChange, readonly = false }: SupplementaryTestsTabProps) {
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
      {/* Pupils */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Circle className="h-5 w-5 text-blue-600" />
            Pupil Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Right Eye */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Right Eye (OD)</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600">Size (mm)</Label>
                  <Input
                    type="text"
                    value={data.pupils?.odSize || ''}
                    onChange={(e) => updateField(['pupils', 'odSize'], e.target.value)}
                    placeholder="3.0 - 7.0 mm"
                    disabled={readonly}
                    className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Reaction to Light</Label>
                  <Select
                    value={data.pupils?.odReaction || ''}
                    onValueChange={(value) => updateField(['pupils', 'odReaction'], value)}
                    disabled={readonly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brisk">Brisk</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="sluggish">Sluggish</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="od-apd"
                    checked={data.pupils?.odApd || false}
                    onCheckedChange={(checked) => updateField(['pupils', 'odApd'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="od-apd" className="font-normal text-sm cursor-pointer">
                    APD (Afferent Pupillary Defect)
                  </Label>
                </div>
              </div>
            </div>

            {/* Left Eye */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Left Eye (OS)</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600">Size (mm)</Label>
                  <Input
                    type="text"
                    value={data.pupils?.osSize || ''}
                    onChange={(e) => updateField(['pupils', 'osSize'], e.target.value)}
                    placeholder="3.0 - 7.0 mm"
                    disabled={readonly}
                    className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Reaction to Light</Label>
                  <Select
                    value={data.pupils?.osReaction || ''}
                    onValueChange={(value) => updateField(['pupils', 'osReaction'], value)}
                    disabled={readonly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brisk">Brisk</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="sluggish">Sluggish</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="os-apd"
                    checked={data.pupils?.osApd || false}
                    onCheckedChange={(checked) => updateField(['pupils', 'osApd'], checked)}
                    disabled={readonly}
                  />
                  <Label htmlFor="os-apd" className="font-normal text-sm cursor-pointer">
                    APD (Afferent Pupillary Defect)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={data.pupils?.notes || ''}
              onChange={(e) => updateField(['pupils', 'notes'], e.target.value)}
              placeholder="Anisocoria, irregular shape, additional observations..."
              rows={2}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cover Test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Cover Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Distance */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Distance (6m)</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Deviation</Label>
                <Select
                  value={data.coverTest?.distanceDeviation || ''}
                  onValueChange={(value) => updateField(['coverTest', 'distanceDeviation'], value)}
                  disabled={readonly}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orthophoria">Orthophoria</SelectItem>
                    <SelectItem value="esophoria">Esophoria</SelectItem>
                    <SelectItem value="exophoria">Exophoria</SelectItem>
                    <SelectItem value="hyperphoria">Hyperphoria</SelectItem>
                    <SelectItem value="esotropia">Esotropia (Manifest)</SelectItem>
                    <SelectItem value="exotropia">Exotropia (Manifest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Type</Label>
                <Select
                  value={data.coverTest?.distanceType || ''}
                  onValueChange={(value) => updateField(['coverTest', 'distanceType'], value)}
                  disabled={readonly}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="latent">Latent (Phoria)</SelectItem>
                    <SelectItem value="manifest">Manifest (Tropia)</SelectItem>
                    <SelectItem value="intermittent">Intermittent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Amount (Δ)</Label>
                <Input
                  type="text"
                  value={data.coverTest?.distanceAmount || ''}
                  onChange={(e) => updateField(['coverTest', 'distanceAmount'], e.target.value)}
                  placeholder="Prism diopters"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Near */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Near (33cm)</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-600">Deviation</Label>
                <Select
                  value={data.coverTest?.nearDeviation || ''}
                  onValueChange={(value) => updateField(['coverTest', 'nearDeviation'], value)}
                  disabled={readonly}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orthophoria">Orthophoria</SelectItem>
                    <SelectItem value="esophoria">Esophoria</SelectItem>
                    <SelectItem value="exophoria">Exophoria</SelectItem>
                    <SelectItem value="hyperphoria">Hyperphoria</SelectItem>
                    <SelectItem value="esotropia">Esotropia (Manifest)</SelectItem>
                    <SelectItem value="exotropia">Exotropia (Manifest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Type</Label>
                <Select
                  value={data.coverTest?.nearType || ''}
                  onValueChange={(value) => updateField(['coverTest', 'nearType'], value)}
                  disabled={readonly}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="latent">Latent (Phoria)</SelectItem>
                    <SelectItem value="manifest">Manifest (Tropia)</SelectItem>
                    <SelectItem value="intermittent">Intermittent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-600">Amount (Δ)</Label>
                <Input
                  type="text"
                  value={data.coverTest?.nearAmount || ''}
                  onChange={(e) => updateField(['coverTest', 'nearAmount'], e.target.value)}
                  placeholder="Prism diopters"
                  disabled={readonly}
                  className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Recovery</Label>
            <Input
              type="text"
              value={data.coverTest?.recovery || ''}
              onChange={(e) => updateField(['coverTest', 'recovery'], e.target.value)}
              placeholder="Quick / Slow / No recovery"
              disabled={readonly}
              className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={data.coverTest?.notes || ''}
              onChange={(e) => updateField(['coverTest', 'notes'], e.target.value)}
              placeholder="Additional observations, alternating cover test results..."
              rows={2}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stereopsis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            Stereopsis (Depth Perception)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Test Used</Label>
              <Select
                value={data.stereopsis?.test || ''}
                onValueChange={(value) => updateField(['stereopsis', 'test'], value)}
                disabled={readonly}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select test..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tno">TNO Test</SelectItem>
                  <SelectItem value="titmus">Titmus Fly Test</SelectItem>
                  <SelectItem value="randot">Randot Stereotest</SelectItem>
                  <SelectItem value="lang">Lang Stereotest</SelectItem>
                  <SelectItem value="frisby">Frisby Stereotest</SelectItem>
                  <SelectItem value="worth-4-dot">Worth 4-Dot Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Result (seconds of arc)</Label>
              <Input
                type="text"
                value={data.stereopsis?.seconds || ''}
                onChange={(e) => updateField(['stereopsis', 'seconds'], e.target.value)}
                placeholder="40, 60, 100, 200, 400..."
                disabled={readonly}
                className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Assessment</Label>
            <div className="flex items-center space-x-6 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stereo-normal"
                  checked={data.stereopsis?.normal || false}
                  onCheckedChange={(checked) => updateField(['stereopsis', 'normal'], checked)}
                  disabled={readonly}
                />
                <Label htmlFor="stereo-normal" className="font-normal text-sm cursor-pointer">
                  Normal (≤60")
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stereo-reduced"
                  checked={data.stereopsis?.reduced || false}
                  onCheckedChange={(checked) => updateField(['stereopsis', 'reduced'], checked)}
                  disabled={readonly}
                />
                <Label htmlFor="stereo-reduced" className="font-normal text-sm cursor-pointer">
                  Reduced (>60")
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stereo-absent"
                  checked={data.stereopsis?.absent || false}
                  onCheckedChange={(checked) => updateField(['stereopsis', 'absent'], checked)}
                  disabled={readonly}
                />
                <Label htmlFor="stereo-absent" className="font-normal text-sm cursor-pointer">
                  Absent
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={data.stereopsis?.notes || ''}
              onChange={(e) => updateField(['stereopsis', 'notes'], e.target.value)}
              placeholder="Patient response, difficulty level, additional observations..."
              rows={2}
              disabled={readonly}
              className={readonly ? 'bg-slate-50' : ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Convergence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Focus className="h-5 w-5 text-orange-600" />
            Convergence Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NPC - Near Point of Convergence */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">NPC (Near Point of Convergence)</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-slate-600">Break (cm)</Label>
                  <Input
                    type="text"
                    value={data.convergence?.npcBreak || ''}
                    onChange={(e) => updateField(['convergence', 'npcBreak'], e.target.value)}
                    placeholder="5-10 cm normal"
                    disabled={readonly}
                    className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Recovery (cm)</Label>
                  <Input
                    type="text"
                    value={data.convergence?.npcRecovery || ''}
                    onChange={(e) => updateField(['convergence', 'npcRecovery'], e.target.value)}
                    placeholder="7-12 cm normal"
                    disabled={readonly}
                    className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* NPA - Near Point of Accommodation */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">NPA (Near Point of Accommodation)</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-slate-600">Break (cm)</Label>
                  <Input
                    type="text"
                    value={data.convergence?.npaBreak || ''}
                    onChange={(e) => updateField(['convergence', 'npaBreak'], e.target.value)}
                    placeholder="Varies with age"
                    disabled={readonly}
                    className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Recovery (cm)</Label>
                  <Input
                    type="text"
                    value={data.convergence?.npaRecovery || ''}
                    onChange={(e) => updateField(['convergence', 'npaRecovery'], e.target.value)}
                    placeholder="Varies with age"
                    disabled={readonly}
                    className={`h-9 ${readonly ? 'bg-slate-50' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={data.convergence?.notes || ''}
              onChange={(e) => updateField(['convergence', 'notes'], e.target.value)}
              placeholder="Diplopia, suppression, patient symptoms during test..."
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
          <CardTitle className="text-lg">Supplementary Tests Notes</CardTitle>
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
              placeholder="Enter any issues, concerns, or observations from supplementary tests (max 500 characters)..."
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

export default SupplementaryTestsTab;
