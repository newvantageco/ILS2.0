import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, UserCheck, AlertCircle, Clipboard, Printer, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { generatePrescriptionPrint } from './PrescriptionPrint';

interface FinalRxData {
  r: {
    sphere: string;
    cylinder: string;
    axis: string;
    prism: string;
    add: string;
    va: string;
  };
  l: {
    sphere: string;
    cylinder: string;
    axis: string;
    prism: string;
    add: string;
    va: string;
  };
  binocularVA: string;
}

interface SummaryData {
  rxStatus: string; // 'new-rx' | 'no-change' | 'updated' | 'not-issued'
  voucher: boolean;
  referral: {
    hospitalReferral: boolean;
    gpReferral: boolean;
    urgentReferral: boolean;
    routineReferral: boolean;
  };
  dispensing: {
    gos: boolean;
    distanceOnly: boolean;
    varifocals: boolean;
    bifocals: boolean;
    reading: boolean;
    sunglasses: boolean;
  };
  handoverNotes: string;
  recallManagement: {
    selectedRecallGroup: string;
    assignedRecalls: Array<{
      id: string;
      groupName: string;
      dueDate: string;
    }>;
  };
}

interface SummaryTabProps {
  data: SummaryData;
  onChange: (data: SummaryData) => void;
  readonly?: boolean;
  finalRxDistance?: FinalRxData;
  finalRxNear?: FinalRxData;
  finalRxIntermediate?: FinalRxData;
  availableRecallGroups?: Array<{ id: string; name: string; defaultMonths: number }>;
  onFinalize?: () => void;
  patientData?: {
    name: string;
    dob: string;
    address?: string;
  };
  practitionerData?: {
    name: string;
    gocNumber?: string;
  };
  practiceData?: {
    name: string;
    address: string;
    phone?: string;
  };
  examinationDate?: string;
}

// PERFORMANCE: Memoize to prevent unnecessary re-renders
const SummaryTab = memo(function SummaryTab({
  data,
  onChange,
  readonly = false,
  finalRxDistance,
  finalRxNear,
  finalRxIntermediate,
  availableRecallGroups = [],
  onFinalize,
  patientData,
  practitionerData,
  practiceData,
  examinationDate
}: SummaryTabProps) {
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

  const addRecallGroup = () => {
    if (!data.recallManagement.selectedRecallGroup) return;
    
    const group = availableRecallGroups.find(g => g.id === data.recallManagement.selectedRecallGroup);
    if (!group) return;

    // Check if already assigned
    if (data.recallManagement.assignedRecalls.find(r => r.groupName === group.name)) {
      return;
    }

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + group.defaultMonths);

    const newRecall = {
      id: group.id,
      groupName: group.name,
      dueDate: format(dueDate, 'yyyy-MM-dd')
    };

    updateField(
      ['recallManagement', 'assignedRecalls'],
      [...data.recallManagement.assignedRecalls, newRecall]
    );
    updateField(['recallManagement', 'selectedRecallGroup'], '');
  };

  const removeRecall = (groupName: string) => {
    updateField(
      ['recallManagement', 'assignedRecalls'],
      data.recallManagement.assignedRecalls.filter(r => r.groupName !== groupName)
    );
  };

  const handlePrintPrescription = () => {
    if (!patientData || !practitionerData || !practiceData) {
      alert('Missing required data for prescription printing');
      return;
    }

    // Calculate expiry date (2 years from examination)
    const examDate = examinationDate ? new Date(examinationDate) : new Date();
    const expiryDate = new Date(examDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);

    generatePrescriptionPrint({
      patientName: patientData.name,
      patientDOB: patientData.dob,
      patientAddress: patientData.address,
      examinationDate: examinationDate || new Date().toISOString(),
      practitionerName: practitionerData.name,
      practitionerGOC: practitionerData.gocNumber,
      practiceName: practiceData.name,
      practiceAddress: practiceData.address,
      practicePhone: practiceData.phone,
      distance: finalRxDistance ? {
        r: {
          sphere: finalRxDistance.r.sphere,
          cylinder: finalRxDistance.r.cylinder,
          axis: finalRxDistance.r.axis,
          prism: finalRxDistance.r.prism,
          add: finalRxDistance.r.add
        },
        l: {
          sphere: finalRxDistance.l.sphere,
          cylinder: finalRxDistance.l.cylinder,
          axis: finalRxDistance.l.axis,
          prism: finalRxDistance.l.prism,
          add: finalRxDistance.l.add
        },
        binocularVA: finalRxDistance.binocularVA
      } : undefined,
      near: finalRxNear ? {
        r: {
          sphere: finalRxNear.r.sphere,
          cylinder: finalRxNear.r.cylinder,
          axis: finalRxNear.r.axis,
          prism: finalRxNear.r.prism
        },
        l: {
          sphere: finalRxNear.l.sphere,
          cylinder: finalRxNear.l.cylinder,
          axis: finalRxNear.l.axis,
          prism: finalRxNear.l.prism
        },
        binocularVA: finalRxNear.binocularVA
      } : undefined,
      intermediate: finalRxIntermediate ? {
        r: {
          sphere: finalRxIntermediate.r.sphere,
          cylinder: finalRxIntermediate.r.cylinder,
          axis: finalRxIntermediate.r.axis,
          prism: finalRxIntermediate.r.prism
        },
        l: {
          sphere: finalRxIntermediate.l.sphere,
          cylinder: finalRxIntermediate.l.cylinder,
          axis: finalRxIntermediate.l.axis,
          prism: finalRxIntermediate.l.prism
        },
        binocularVA: finalRxIntermediate.binocularVA
      } : undefined,
      notes: data.handoverNotes,
      voucherEligible: data.voucher,
      expiryDate: expiryDate.toISOString()
    });
  };

  const renderRxGrid = (rxData: FinalRxData | undefined, title: string, color: string) => {
    if (!rxData) return null;

    return (
      <Card className={`border-2 ${color}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Eye</th>
                  <th className="text-left p-2 font-medium">Sphere</th>
                  <th className="text-left p-2 font-medium">Cylinder</th>
                  <th className="text-left p-2 font-medium">Axis</th>
                  <th className="text-left p-2 font-medium">Prism</th>
                  <th className="text-left p-2 font-medium">Add</th>
                  <th className="text-left p-2 font-medium">VA</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">R</td>
                  <td className="p-2">{rxData.r.sphere || '-'}</td>
                  <td className="p-2">{rxData.r.cylinder || '-'}</td>
                  <td className="p-2">{rxData.r.axis || '-'}</td>
                  <td className="p-2">{rxData.r.prism || '-'}</td>
                  <td className="p-2">{rxData.r.add || '-'}</td>
                  <td className="p-2">{rxData.r.va || '-'}</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">L</td>
                  <td className="p-2">{rxData.l.sphere || '-'}</td>
                  <td className="p-2">{rxData.l.cylinder || '-'}</td>
                  <td className="p-2">{rxData.l.axis || '-'}</td>
                  <td className="p-2">{rxData.l.prism || '-'}</td>
                  <td className="p-2">{rxData.l.add || '-'}</td>
                  <td className="p-2">{rxData.l.va || '-'}</td>
                </tr>
                {rxData.binocularVA && (
                  <tr className="border-t">
                    <td className="p-2 font-medium" colSpan={6}>Binocular VA</td>
                    <td className="p-2 font-semibold">{rxData.binocularVA}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Final Prescription Summary */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Final Prescription Summary</h3>
        </div>
        
        <div className="space-y-4">
          {renderRxGrid(finalRxDistance, 'Distance Prescription', 'border-green-300 bg-green-50')}
          {renderRxGrid(finalRxNear, 'Near Prescription', 'border-blue-300 bg-blue-50')}
          {renderRxGrid(finalRxIntermediate, 'Intermediate Prescription', 'border-purple-300 bg-purple-50')}
          
          {!finalRxDistance && !finalRxNear && !finalRxIntermediate && (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No prescription data entered in Tab 3 (New Rx)</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Rx Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clipboard className="h-5 w-5 text-green-600" />
            Prescription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.rxStatus || ''}
            onValueChange={(value) => updateField(['rxStatus'], value)}
            disabled={readonly}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new-rx" id="status-new" />
              <Label htmlFor="status-new" className="font-normal cursor-pointer">New Rx Issued</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no-change" id="status-no-change" />
              <Label htmlFor="status-no-change" className="font-normal cursor-pointer">No Change - Continue with Current Rx</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="updated" id="status-updated" />
              <Label htmlFor="status-updated" className="font-normal cursor-pointer">Rx Updated (Minor Change)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not-issued" id="status-not-issued" />
              <Label htmlFor="status-not-issued" className="font-normal cursor-pointer">Rx Not Issued (Patient Declined/Not Required)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Voucher & Referral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NHS Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="voucher-eligible"
                checked={data.voucher || false}
                onCheckedChange={(checked) => updateField(['voucher'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="voucher-eligible" className="font-normal cursor-pointer">
                Patient Eligible for NHS Optical Voucher
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Referrals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hospital-referral"
                checked={data.referral.hospitalReferral || false}
                onCheckedChange={(checked) => updateField(['referral', 'hospitalReferral'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="hospital-referral" className="font-normal cursor-pointer">Hospital Referral</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gp-referral"
                checked={data.referral.gpReferral || false}
                onCheckedChange={(checked) => updateField(['referral', 'gpReferral'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="gp-referral" className="font-normal cursor-pointer">GP Referral</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgent-referral"
                checked={data.referral.urgentReferral || false}
                onCheckedChange={(checked) => updateField(['referral', 'urgentReferral'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="urgent-referral" className="font-normal cursor-pointer text-red-600">Urgent Referral</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="routine-referral"
                checked={data.referral.routineReferral || false}
                onCheckedChange={(checked) => updateField(['referral', 'routineReferral'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="routine-referral" className="font-normal cursor-pointer">Routine Referral</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dispensing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispensing Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disp-gos"
                checked={data.dispensing.gos || false}
                onCheckedChange={(checked) => updateField(['dispensing', 'gos'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="disp-gos" className="font-normal cursor-pointer">GOS</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disp-distance"
                checked={data.dispensing.distanceOnly || false}
                onCheckedChange={(checked) => updateField(['dispensing', 'distanceOnly'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="disp-distance" className="font-normal cursor-pointer">Distance Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disp-varifocals"
                checked={data.dispensing.varifocals || false}
                onCheckedChange={(checked) => updateField(['dispensing', 'varifocals'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="disp-varifocals" className="font-normal cursor-pointer">Varifocals</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disp-bifocals"
                checked={data.dispensing.bifocals || false}
                onCheckedChange={(checked) => updateField(['dispensing', 'bifocals'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="disp-bifocals" className="font-normal cursor-pointer">Bifocals</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disp-reading"
                checked={data.dispensing.reading || false}
                onCheckedChange={(checked) => updateField(['dispensing', 'reading'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="disp-reading" className="font-normal cursor-pointer">Reading</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disp-sunglasses"
                checked={data.dispensing.sunglasses || false}
                onCheckedChange={(checked) => updateField(['dispensing', 'sunglasses'], checked)}
                disabled={readonly}
              />
              <Label htmlFor="disp-sunglasses" className="font-normal cursor-pointer">Sunglasses</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Handover Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-600" />
            Handover Notes to Dispensing Optician
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.handoverNotes || ''}
            onChange={(e) => updateField(['handoverNotes'], e.target.value)}
            placeholder="Important dispensing considerations, lens recommendations, frame requirements, patient preferences..."
            rows={4}
            disabled={readonly}
            className={readonly ? 'bg-slate-50' : ''}
          />
        </CardContent>
      </Card>

      {/* Recall Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Recall Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available Recall Groups */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Available Recall Groups</Label>
            <div className="flex gap-2">
              <select
                value={data.recallManagement.selectedRecallGroup || ''}
                onChange={(e) => updateField(['recallManagement', 'selectedRecallGroup'], e.target.value)}
                disabled={readonly}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select recall group...</option>
                {availableRecallGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.defaultMonths} months)
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={addRecallGroup}
                disabled={readonly || !data.recallManagement.selectedRecallGroup}
                size="sm"
              >
                Add Recall
              </Button>
            </div>
          </div>

          {/* Assigned Recalls */}
          {data.recallManagement.assignedRecalls.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Assigned Recall Groups</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium">Recall Group</th>
                      <th className="text-left p-3 font-medium">Due Date</th>
                      <th className="text-right p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recallManagement.assignedRecalls.map((recall, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="p-3">
                          <Badge variant="outline">{recall.groupName}</Badge>
                        </td>
                        <td className="p-3">
                          <Input
                            type="date"
                            value={recall.dueDate || ''}
                            onChange={(e) => {
                              const updated = [...data.recallManagement.assignedRecalls];
                              updated[index].dueDate = e.target.value;
                              updateField(['recallManagement', 'assignedRecalls'], updated);
                            }}
                            disabled={readonly}
                            className="h-8 max-w-[160px]"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecall(recall.groupName)}
                            disabled={readonly}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Actions */}
      {(finalRxDistance || finalRxNear || finalRxIntermediate) && data.rxStatus === 'new-rx' && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Prescription Actions</h3>
                <p className="text-sm text-slate-600">
                  Print or email the prescription to the patient
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handlePrintPrescription}
                  className="bg-white hover:bg-slate-50"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Prescription
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled
                  className="bg-white hover:bg-slate-50"
                  title="Email functionality coming soon"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Email Prescription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finalization */}
      {onFinalize && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Ready to Finalize Examination?</h3>
                <p className="text-sm text-slate-600">
                  Once finalized, this examination will be marked as complete and saved to the patient&apos;s record.
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                onClick={onFinalize}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserCheck className="h-5 w-5 mr-2" />
                Finalize Examination
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default SummaryTab;
