/**
 * Dispense Slip Component
 * 
 * Printable dispense slip with company branding for British optical standards
 * Includes left/right PD, prescription details, GOC compliance
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface DispenseSlipProps {
  order: any;
  prescription: any;
  patient: any;
  company: any;
  dispenser: {
    name: string;
    gocNumber?: string;
  };
}

export function DispenseSlip({ 
  order, 
  prescription, 
  patient, 
  company, 
  dispenser 
}: DispenseSlipProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Convert to PDF using browser print to PDF
    window.print();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const branding = company?.brandingSettings || {};
  const primaryColor = branding.primaryColor || "#0f172a";
  const secondaryColor = branding.secondaryColor || "#3b82f6";

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden mb-6 flex gap-4">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Slip
        </Button>
        <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Dispense Slip - Printable */}
      <Card className="p-8 print:shadow-none print:border-0" id="dispense-slip">
        {/* Company Header */}
        <div className="border-b-2 pb-6 mb-6" style={{ borderColor: primaryColor }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {company?.companyLogoUrl && (
                <img 
                  src={company.companyLogoUrl} 
                  alt={company.name}
                  className="h-20 w-auto object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
                  {company?.name || "Optical Practice"}
                </h1>
                {company?.gocNumber && branding.showGocNumber && (
                  <p className="text-sm text-gray-600">
                    GOC Registration: {company.gocNumber}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right text-sm">
              {company?.phone && <p>{company.phone}</p>}
              {company?.email && <p>{company.email}</p>}
              {company?.address && (
                <div className="mt-2">
                  {company.address.street && <p>{company.address.street}</p>}
                  {company.address.city && <p>{company.address.city}</p>}
                  {company.address.postcode && <p>{company.address.postcode}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
            SPECTACLE DISPENSING RECORD
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            (General Optical Council Compliant)
          </p>
        </div>

        {/* Patient & Order Information */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-3" style={{ color: secondaryColor }}>
              Patient Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{patient?.name || `${patient?.firstName} ${patient?.lastName}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date of Birth:</span>
                <span>{patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : "N/A"}</span>
              </div>
              {patient?.nhsNumber && (
                <div className="flex justify-between">
                  <span className="font-medium">NHS Number:</span>
                  <span>{patient.nhsNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Contact:</span>
                <span>{patient?.phone || patient?.email}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3" style={{ color: secondaryColor }}>
              Order Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Order Number:</span>
                <span>{order?.orderNumber || order?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Order Date:</span>
                <span>{order?.createdAt ? formatDate(order.createdAt) : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Dispense Date:</span>
                <span>{formatDate(new Date())}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Dispensed By:</span>
                <span>{dispenser.name}</span>
              </div>
              {dispenser.gocNumber && (
                <div className="flex justify-between">
                  <span className="font-medium">GOC Number:</span>
                  <span>{dispenser.gocNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prescription Details - British Standards Format */}
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-4" style={{ color: secondaryColor }}>
            Prescription Details
          </h3>
          
          <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: primaryColor }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left font-semibold">Eye</th>
                  <th className="p-3 text-center font-semibold">Sphere</th>
                  <th className="p-3 text-center font-semibold">Cylinder</th>
                  <th className="p-3 text-center font-semibold">Axis</th>
                  <th className="p-3 text-center font-semibold">Add</th>
                  <th className="p-3 text-center font-semibold">Prism</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-medium">Right (OD)</td>
                  <td className="p-3 text-center">{prescription?.odSphere || "—"}</td>
                  <td className="p-3 text-center">{prescription?.odCylinder || "—"}</td>
                  <td className="p-3 text-center">{prescription?.odAxis || "—"}</td>
                  <td className="p-3 text-center">{prescription?.odAdd || "—"}</td>
                  <td className="p-3 text-center text-xs">
                    {prescription?.odPrismHorizontal || prescription?.odPrismVertical ? (
                      <>
                        {prescription.odPrismHorizontal && `${prescription.odPrismHorizontal}Δ H`}
                        {prescription.odPrismVertical && ` ${prescription.odPrismVertical}Δ V`}
                        {prescription.odPrismBase && ` (${prescription.odPrismBase})`}
                      </>
                    ) : "—"}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-medium">Left (OS)</td>
                  <td className="p-3 text-center">{prescription?.osSphere || "—"}</td>
                  <td className="p-3 text-center">{prescription?.osCylinder || "—"}</td>
                  <td className="p-3 text-center">{prescription?.osAxis || "—"}</td>
                  <td className="p-3 text-center">{prescription?.osAdd || "—"}</td>
                  <td className="p-3 text-center text-xs">
                    {prescription?.osPrismHorizontal || prescription?.osPrismVertical ? (
                      <>
                        {prescription.osPrismHorizontal && `${prescription.osPrismHorizontal}Δ H`}
                        {prescription.osPrismVertical && ` ${prescription.osPrismVertical}Δ V`}
                        {prescription.osPrismBase && ` (${prescription.osPrismBase})`}
                      </>
                    ) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pupillary Distance - British Standards (Separate L/R) */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="border rounded-lg p-4" style={{ borderColor: secondaryColor }}>
              <h4 className="font-semibold mb-3">Pupillary Distance (PD)</h4>
              <div className="space-y-2 text-sm">
                {prescription?.pdRight && prescription?.pdLeft ? (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Right (OD):</span>
                      <span className="font-mono">{prescription.pdRight} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Left (OS):</span>
                      <span className="font-mono">{prescription.pdLeft} mm</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Total Binocular:</span>
                      <span className="font-mono">{prescription.binocularPd || (parseFloat(prescription.pdRight) + parseFloat(prescription.pdLeft)).toFixed(1)} mm</span>
                    </div>
                  </>
                ) : prescription?.binocularPd ? (
                  <div className="flex justify-between">
                    <span className="font-medium">Binocular PD:</span>
                    <span className="font-mono">{prescription.binocularPd} mm</span>
                  </div>
                ) : prescription?.pd ? (
                  <div className="flex justify-between">
                    <span className="font-medium">PD:</span>
                    <span className="font-mono">{prescription.pd} mm</span>
                  </div>
                ) : (
                  <p className="text-gray-500">Not specified</p>
                )}
                
                {prescription?.nearPd && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Near PD:</span>
                    <span className="font-mono">{prescription.nearPd} mm</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4" style={{ borderColor: secondaryColor }}>
              <h4 className="font-semibold mb-3">Additional Measurements</h4>
              <div className="space-y-2 text-sm">
                {prescription?.backVertexDistance && (
                  <div className="flex justify-between">
                    <span className="font-medium">Back Vertex Distance:</span>
                    <span className="font-mono">{prescription.backVertexDistance} mm</span>
                  </div>
                )}
                {order?.fittingHeightRight && (
                  <div className="flex justify-between">
                    <span className="font-medium">Fitting Height (R):</span>
                    <span className="font-mono">{order.fittingHeightRight} mm</span>
                  </div>
                )}
                {order?.fittingHeightLeft && (
                  <div className="flex justify-between">
                    <span className="font-medium">Fitting Height (L):</span>
                    <span className="font-mono">{order.fittingHeightLeft} mm</span>
                  </div>
                )}
                {prescription?.prescriptionType && (
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="capitalize">{prescription.prescriptionType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Frame & Lens Details */}
        {order?.frameDetails && (
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4" style={{ color: secondaryColor }}>
              Frame & Lens Specifications
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p><span className="font-medium">Frame:</span> {order.frameDetails.brand} {order.frameDetails.model}</p>
                {order.frameDetails.color && <p><span className="font-medium">Color:</span> {order.frameDetails.color}</p>}
              </div>
              <div>
                {order.lensType && <p><span className="font-medium">Lens Type:</span> {order.lensType}</p>}
                {order.lensMaterial && <p><span className="font-medium">Lens Material:</span> {order.lensMaterial}</p>}
                {order.lensCoating && <p><span className="font-medium">Coating:</span> {order.lensCoating}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {(prescription?.dispensingNotes || order?.aftercareNotes) && (
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4" style={{ color: secondaryColor }}>
              Special Instructions & Aftercare
            </h3>
            {prescription?.dispensingNotes && (
              <p className="text-sm mb-2"><span className="font-medium">Dispensing Notes:</span> {prescription.dispensingNotes}</p>
            )}
            {order?.aftercareNotes && (
              <p className="text-sm"><span className="font-medium">Aftercare:</span> {order.aftercareNotes}</p>
            )}
          </div>
        )}

        {/* Aftercare Information */}
        {branding.includeAftercare && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Aftercare Guidance</h3>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Clean lenses regularly with appropriate lens cleaner</li>
              <li>Store spectacles in a protective case when not in use</li>
              <li>Return for adjustments if discomfort occurs</li>
              <li>Report any visual difficulties immediately</li>
              <li>Annual eye examinations recommended</li>
            </ul>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border-t-2 pt-4">
            <p className="text-sm font-medium mb-8">Patient Signature</p>
            <p className="text-xs text-gray-600">
              I confirm receipt of the spectacles described above and have been advised on their use and care.
            </p>
          </div>
          <div className="border-t-2 pt-4">
            <p className="text-sm font-medium mb-8">Dispenser Signature</p>
            <p className="text-xs text-gray-600">
              {dispenser.name}
              {dispenser.gocNumber && ` - GOC: ${dispenser.gocNumber}`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 pt-6 text-center text-xs text-gray-600" style={{ borderColor: primaryColor }}>
          {branding.dispenseSlipFooter || (
            <p>This document complies with General Optical Council requirements for dispensing records.</p>
          )}
          <p className="mt-2">Printed on {formatDate(new Date())}</p>
        </div>
      </Card>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }

            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            #dispense-slip {
              page-break-inside: avoid;
            }
          }
        `}
      </style>
    </div>
  );
}

export default DispenseSlip;
