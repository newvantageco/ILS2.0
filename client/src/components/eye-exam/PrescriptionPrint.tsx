import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';

interface PrescriptionData {
  patientName: string;
  patientDOB: string;
  patientAddress?: string;
  examinationDate: string;
  practitionerName: string;
  practitionerGOC?: string;
  practiceName: string;
  practiceAddress: string;
  practicePhone?: string;
  distance?: {
    r: { sphere: string; cylinder: string; axis: string; prism?: string; add?: string };
    l: { sphere: string; cylinder: string; axis: string; prism?: string; add?: string };
    binocularVA?: string;
  };
  near?: {
    r: { sphere: string; cylinder: string; axis: string; prism?: string };
    l: { sphere: string; cylinder: string; axis: string; prism?: string };
    binocularVA?: string;
  };
  intermediate?: {
    r: { sphere: string; cylinder: string; axis: string; prism?: string };
    l: { sphere: string; cylinder: string; axis: string; prism?: string };
    binocularVA?: string;
  };
  notes?: string;
  voucherEligible?: boolean;
  expiryDate?: string;
}

export const PrescriptionPrintTemplate = ({ data }: { data: PrescriptionData }) => {
  return (
    <div className="prescription-print-template bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">OPTICAL PRESCRIPTION</h1>
            <div className="text-sm">
              <p className="font-semibold">{data.practiceName}</p>
              <p>{data.practiceAddress}</p>
              {data.practicePhone && <p>Tel: {data.practicePhone}</p>}
            </div>
          </div>
          <div className="text-right text-sm">
            <p><strong>Date:</strong> {format(new Date(data.examinationDate), 'dd/MM/yyyy')}</p>
            {data.expiryDate && (
              <p><strong>Valid Until:</strong> {format(new Date(data.expiryDate), 'dd/MM/yyyy')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Patient Details */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Patient Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Name:</strong> {data.patientName}</p>
            <p><strong>Date of Birth:</strong> {format(new Date(data.patientDOB), 'dd/MM/yyyy')}</p>
          </div>
          {data.patientAddress && (
            <div>
              <p><strong>Address:</strong> {data.patientAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Distance Prescription */}
      {data.distance && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 bg-green-50 border-2 border-green-300 px-3 py-2 rounded">
            Distance Prescription
          </h2>
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Eye</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Sphere</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Cylinder</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Axis</th>
                {(data.distance.r.prism || data.distance.l.prism) && (
                  <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Prism</th>
                )}
                {(data.distance.r.add || data.distance.l.add) && (
                  <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Add</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-3 py-2 font-semibold">R (Right)</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.r.sphere || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.r.cylinder || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.r.axis || '-'}</td>
                {(data.distance.r.prism || data.distance.l.prism) && (
                  <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.r.prism || '-'}</td>
                )}
                {(data.distance.r.add || data.distance.l.add) && (
                  <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.r.add || '-'}</td>
                )}
              </tr>
              <tr>
                <td className="border border-gray-400 px-3 py-2 font-semibold">L (Left)</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.l.sphere || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.l.cylinder || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.l.axis || '-'}</td>
                {(data.distance.r.prism || data.distance.l.prism) && (
                  <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.l.prism || '-'}</td>
                )}
                {(data.distance.r.add || data.distance.l.add) && (
                  <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.distance.l.add || '-'}</td>
                )}
              </tr>
            </tbody>
          </table>
          {data.distance.binocularVA && (
            <p className="text-sm mt-2"><strong>Binocular Visual Acuity:</strong> {data.distance.binocularVA}</p>
          )}
        </div>
      )}

      {/* Near Prescription */}
      {data.near && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 bg-blue-50 border-2 border-blue-300 px-3 py-2 rounded">
            Near/Reading Prescription
          </h2>
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Eye</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Sphere</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Cylinder</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Axis</th>
                {(data.near.r.prism || data.near.l.prism) && (
                  <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Prism</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-3 py-2 font-semibold">R (Right)</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.near.r.sphere || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.near.r.cylinder || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.near.r.axis || '-'}</td>
                {(data.near.r.prism || data.near.l.prism) && (
                  <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.near.r.prism || '-'}</td>
                )}
              </tr>
              <tr>
                <td className="border border-gray-400 px-3 py-2 font-semibold">L (Left)</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.near.l.sphere || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.near.l.cylinder || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.near.l.axis || '-'}</td>
                {(data.near.r.prism || data.near.l.prism) && (
                  <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.near.l.prism || '-'}</td>
                )}
              </tr>
            </tbody>
          </table>
          {data.near.binocularVA && (
            <p className="text-sm mt-2"><strong>Binocular Visual Acuity:</strong> {data.near.binocularVA}</p>
          )}
        </div>
      )}

      {/* Intermediate Prescription */}
      {data.intermediate && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 bg-purple-50 border-2 border-purple-300 px-3 py-2 rounded">
            Intermediate Prescription
          </h2>
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left font-semibold">Eye</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Sphere</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Cylinder</th>
                <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Axis</th>
                {(data.intermediate.r.prism || data.intermediate.l.prism) && (
                  <th className="border border-gray-400 px-3 py-2 text-center font-semibold">Prism</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-3 py-2 font-semibold">R (Right)</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.intermediate.r.sphere || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.intermediate.r.cylinder || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.intermediate.r.axis || '-'}</td>
                {(data.intermediate.r.prism || data.intermediate.l.prism) && (
                  <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.intermediate.r.prism || '-'}</td>
                )}
              </tr>
              <tr>
                <td className="border border-gray-400 px-3 py-2 font-semibold">L (Left)</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.intermediate.l.sphere || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.intermediate.l.cylinder || '-'}</td>
                <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.intermediate.l.axis || '-'}</td>
                {(data.intermediate.r.prism || data.intermediate.l.prism) && (
                  <td className="border border-gray-400 px-3 py-2 text-center font-mono">{data.intermediate.l.prism || '-'}</td>
                )}
              </tr>
            </tbody>
          </table>
          {data.intermediate.binocularVA && (
            <p className="text-sm mt-2"><strong>Binocular Visual Acuity:</strong> {data.intermediate.binocularVA}</p>
          )}
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Additional Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}

      {/* NHS Voucher */}
      {data.voucherEligible && (
        <div className="mb-6 bg-blue-50 border-2 border-blue-300 p-3 rounded">
          <p className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            Patient is eligible for NHS Optical Voucher
          </p>
        </div>
      )}

      {/* Practitioner Signature */}
      <div className="mt-8 pt-6 border-t-2 border-gray-300">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm mb-2"><strong>Examined by:</strong></p>
            <p className="text-base font-semibold">{data.practitionerName}</p>
            {data.practitionerGOC && (
              <p className="text-sm">GOC Registration: {data.practitionerGOC}</p>
            )}
          </div>
          <div className="text-right">
            <div className="border-b-2 border-black w-48 mb-1"></div>
            <p className="text-xs">Signature</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-gray-600">
        <p><strong>Important:</strong> This prescription is valid for 2 years from the date of examination. 
        Please take this prescription to your dispensing optician. If you have any questions, 
        please contact the practice.</p>
      </div>

    </div>
  );
};

// Utility function to generate print-friendly prescription
export const generatePrescriptionPrint = (data: PrescriptionData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print prescription');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Optical Prescription - ${data.patientName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20mm; }
          @page { size: A4; margin: 15mm; }
          @media print { body { padding: 0; } }
          .border-b-2 { border-bottom: 2px solid black; }
          .border-b { border-bottom: 1px solid #d1d5db; }
          .border-t-2 { border-top: 2px solid #d1d5db; }
          .border-t { border-top: 1px solid #d1d5db; }
          .pb-4 { padding-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mt-8 { margin-top: 2rem; }
          .mt-6 { margin-top: 1.5rem; }
          .mt-2 { margin-top: 0.5rem; }
          .pt-6 { padding-top: 1.5rem; }
          .pt-4 { padding-top: 1rem; }
          .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .p-3 { padding: 0.75rem; }
          .text-2xl { font-size: 1.5rem; line-height: 2rem; }
          .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
          .text-base { font-size: 1rem; line-height: 1.5rem; }
          .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .text-xs { font-size: 0.75rem; line-height: 1rem; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-mono { font-family: monospace; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-gray-600 { color: #4b5563; }
          .bg-green-50 { background-color: #f0fdf4; }
          .bg-blue-50 { background-color: #eff6ff; }
          .bg-purple-50 { background-color: #faf5ff; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .border-green-300 { border-color: #86efac; }
          .border-blue-300 { border-color: #93c5fd; }
          .border-purple-300 { border-color: #d8b4fe; }
          .border-gray-300 { border-color: #d1d5db; }
          .border-gray-400 { border-color: #9ca3af; }
          .border-2 { border-width: 2px; }
          .border { border-width: 1px; }
          .rounded { border-radius: 0.25rem; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-start { align-items: flex-start; }
          .items-end { align-items: flex-end; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gap-4 { gap: 1rem; }
          table { width: 100%; border-collapse: collapse; border: 2px solid #9ca3af; }
          th, td { border: 1px solid #9ca3af; padding: 0.5rem 0.75rem; }
          th { background-color: #f3f4f6; font-weight: 600; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
          .w-48 { width: 12rem; }
          .border-b-black { border-bottom-color: black; }
        </style>
      </head>
      <body>
        <div>
          <!-- Header -->
          <div class="border-b-2 pb-4 mb-6">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-2xl font-bold mb-2">OPTICAL PRESCRIPTION</h1>
                <div class="text-sm">
                  <p class="font-semibold">${data.practiceName}</p>
                  <p>${data.practiceAddress}</p>
                  ${data.practicePhone ? `<p>Tel: ${data.practicePhone}</p>` : ''}
                </div>
              </div>
              <div class="text-right text-sm">
                <p><strong>Date:</strong> ${format(new Date(data.examinationDate), 'dd/MM/yyyy')}</p>
                ${data.expiryDate ? `<p><strong>Valid Until:</strong> ${format(new Date(data.expiryDate), 'dd/MM/yyyy')}</p>` : ''}
              </div>
            </div>
          </div>

          <!-- Patient Details -->
          <div class="mb-6">
            <h2 class="text-lg font-bold mb-3 border-b pb-2">Patient Details</h2>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Name:</strong> ${data.patientName}</p>
                <p><strong>Date of Birth:</strong> ${format(new Date(data.patientDOB), 'dd/MM/yyyy')}</p>
              </div>
              ${data.patientAddress ? `<div><p><strong>Address:</strong> ${data.patientAddress}</p></div>` : ''}
            </div>
          </div>

          <!-- Distance Prescription -->
          ${data.distance ? `
            <div class="mb-6">
              <h2 class="text-lg font-bold mb-3 bg-green-50 border-2 border-green-300 px-3 py-2 rounded">
                Distance Prescription
              </h2>
              <table>
                <thead>
                  <tr>
                    <th class="text-left">Eye</th>
                    <th class="text-center">Sphere</th>
                    <th class="text-center">Cylinder</th>
                    <th class="text-center">Axis</th>
                    ${(data.distance.r.prism || data.distance.l.prism) ? '<th class="text-center">Prism</th>' : ''}
                    ${(data.distance.r.add || data.distance.l.add) ? '<th class="text-center">Add</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-semibold">R (Right)</td>
                    <td class="text-center font-mono">${data.distance.r.sphere || '-'}</td>
                    <td class="text-center font-mono">${data.distance.r.cylinder || '-'}</td>
                    <td class="text-center font-mono">${data.distance.r.axis || '-'}</td>
                    ${(data.distance.r.prism || data.distance.l.prism) ? `<td class="text-center font-mono">${data.distance.r.prism || '-'}</td>` : ''}
                    ${(data.distance.r.add || data.distance.l.add) ? `<td class="text-center font-mono">${data.distance.r.add || '-'}</td>` : ''}
                  </tr>
                  <tr>
                    <td class="font-semibold">L (Left)</td>
                    <td class="text-center font-mono">${data.distance.l.sphere || '-'}</td>
                    <td class="text-center font-mono">${data.distance.l.cylinder || '-'}</td>
                    <td class="text-center font-mono">${data.distance.l.axis || '-'}</td>
                    ${(data.distance.r.prism || data.distance.l.prism) ? `<td class="text-center font-mono">${data.distance.l.prism || '-'}</td>` : ''}
                    ${(data.distance.r.add || data.distance.l.add) ? `<td class="text-center font-mono">${data.distance.l.add || '-'}</td>` : ''}
                  </tr>
                </tbody>
              </table>
              ${data.distance.binocularVA ? `<p class="text-sm mt-2"><strong>Binocular Visual Acuity:</strong> ${data.distance.binocularVA}</p>` : ''}
            </div>
          ` : ''}

          <!-- Near Prescription -->
          ${data.near ? `
            <div class="mb-6">
              <h2 class="text-lg font-bold mb-3 bg-blue-50 border-2 border-blue-300 px-3 py-2 rounded">
                Near/Reading Prescription
              </h2>
              <table>
                <thead>
                  <tr>
                    <th class="text-left">Eye</th>
                    <th class="text-center">Sphere</th>
                    <th class="text-center">Cylinder</th>
                    <th class="text-center">Axis</th>
                    ${(data.near.r.prism || data.near.l.prism) ? '<th class="text-center">Prism</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-semibold">R (Right)</td>
                    <td class="text-center font-mono">${data.near.r.sphere || '-'}</td>
                    <td class="text-center font-mono">${data.near.r.cylinder || '-'}</td>
                    <td class="text-center font-mono">${data.near.r.axis || '-'}</td>
                    ${(data.near.r.prism || data.near.l.prism) ? `<td class="text-center font-mono">${data.near.r.prism || '-'}</td>` : ''}
                  </tr>
                  <tr>
                    <td class="font-semibold">L (Left)</td>
                    <td class="text-center font-mono">${data.near.l.sphere || '-'}</td>
                    <td class="text-center font-mono">${data.near.l.cylinder || '-'}</td>
                    <td class="text-center font-mono">${data.near.l.axis || '-'}</td>
                    ${(data.near.r.prism || data.near.l.prism) ? `<td class="text-center font-mono">${data.near.l.prism || '-'}</td>` : ''}
                  </tr>
                </tbody>
              </table>
              ${data.near.binocularVA ? `<p class="text-sm mt-2"><strong>Binocular Visual Acuity:</strong> ${data.near.binocularVA}</p>` : ''}
            </div>
          ` : ''}

          <!-- Intermediate Prescription -->
          ${data.intermediate ? `
            <div class="mb-6">
              <h2 class="text-lg font-bold mb-3 bg-purple-50 border-2 border-purple-300 px-3 py-2 rounded">
                Intermediate Prescription
              </h2>
              <table>
                <thead>
                  <tr>
                    <th class="text-left">Eye</th>
                    <th class="text-center">Sphere</th>
                    <th class="text-center">Cylinder</th>
                    <th class="text-center">Axis</th>
                    ${(data.intermediate.r.prism || data.intermediate.l.prism) ? '<th class="text-center">Prism</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-semibold">R (Right)</td>
                    <td class="text-center font-mono">${data.intermediate.r.sphere || '-'}</td>
                    <td class="text-center font-mono">${data.intermediate.r.cylinder || '-'}</td>
                    <td class="text-center font-mono">${data.intermediate.r.axis || '-'}</td>
                    ${(data.intermediate.r.prism || data.intermediate.l.prism) ? `<td class="text-center font-mono">${data.intermediate.r.prism || '-'}</td>` : ''}
                  </tr>
                  <tr>
                    <td class="font-semibold">L (Left)</td>
                    <td class="text-center font-mono">${data.intermediate.l.sphere || '-'}</td>
                    <td class="text-center font-mono">${data.intermediate.l.cylinder || '-'}</td>
                    <td class="text-center font-mono">${data.intermediate.l.axis || '-'}</td>
                    ${(data.intermediate.r.prism || data.intermediate.l.prism) ? `<td class="text-center font-mono">${data.intermediate.l.prism || '-'}</td>` : ''}
                  </tr>
                </tbody>
              </table>
              ${data.intermediate.binocularVA ? `<p class="text-sm mt-2"><strong>Binocular Visual Acuity:</strong> ${data.intermediate.binocularVA}</p>` : ''}
            </div>
          ` : ''}

          <!-- Notes -->
          ${data.notes ? `
            <div class="mb-6">
              <h2 class="text-lg font-bold mb-3 border-b pb-2">Additional Notes</h2>
              <p class="text-sm whitespace-pre-wrap">${data.notes}</p>
            </div>
          ` : ''}

          <!-- NHS Voucher -->
          ${data.voucherEligible ? `
            <div class="mb-6 bg-blue-50 border-2 border-blue-300 p-3 rounded">
              <p class="text-sm font-semibold">
                <svg class="inline h-4 w-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Patient is eligible for NHS Optical Voucher
              </p>
            </div>
          ` : ''}

          <!-- Practitioner Signature -->
          <div class="mt-8 pt-6 border-t-2">
            <div class="flex justify-between items-end">
              <div>
                <p class="text-sm mb-2"><strong>Examined by:</strong></p>
                <p class="text-base font-semibold">${data.practitionerName}</p>
                ${data.practitionerGOC ? `<p class="text-sm">GOC Registration: ${data.practitionerGOC}</p>` : ''}
              </div>
              <div class="text-right">
                <div style="border-bottom: 2px solid black; width: 12rem; margin-bottom: 0.25rem;"></div>
                <p class="text-xs">Signature</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-6 pt-4 border-t text-xs text-gray-600">
            <p><strong>Important:</strong> This prescription is valid for 2 years from the date of examination. 
            Please take this prescription to your dispensing optician. If you have any questions, 
            please contact the practice.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
