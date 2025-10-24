import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PrescriptionData {
  od: {
    sphere: string;
    cylinder: string;
    axis: string;
    add?: string;
  };
  os: {
    sphere: string;
    cylinder: string;
    axis: string;
    add?: string;
  };
  pd?: string;
}

interface PrescriptionDisplayProps {
  prescription: PrescriptionData;
  className?: string;
}

export function PrescriptionDisplay({ prescription, className }: PrescriptionDisplayProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Prescription Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Eye</TableHead>
                <TableHead className="font-semibold text-center">SPH</TableHead>
                <TableHead className="font-semibold text-center">CYL</TableHead>
                <TableHead className="font-semibold text-center">AXIS</TableHead>
                {prescription.od.add && (
                  <TableHead className="font-semibold text-center">ADD</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">OD (Right)</TableCell>
                <TableCell className="text-center font-mono">{prescription.od.sphere}</TableCell>
                <TableCell className="text-center font-mono">{prescription.od.cylinder}</TableCell>
                <TableCell className="text-center font-mono">{prescription.od.axis}</TableCell>
                {prescription.od.add && (
                  <TableCell className="text-center font-mono">{prescription.od.add}</TableCell>
                )}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">OS (Left)</TableCell>
                <TableCell className="text-center font-mono">{prescription.os.sphere}</TableCell>
                <TableCell className="text-center font-mono">{prescription.os.cylinder}</TableCell>
                <TableCell className="text-center font-mono">{prescription.os.axis}</TableCell>
                {prescription.os.add && (
                  <TableCell className="text-center font-mono">{prescription.os.add}</TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {prescription.pd && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium">Pupillary Distance (PD):</span>
            <span className="text-sm font-mono">{prescription.pd} mm</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
