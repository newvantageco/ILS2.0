import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, EyeOff, FileText } from "lucide-react";
import { useState } from "react";
import type { OMAData } from "@shared/omaParser";

interface OMAViewerProps {
  omaData: {
    filename: string;
    content: string;
    parsedData: OMAData;
  };
  orderId?: string;
}

export function OMAViewer({ omaData }: OMAViewerProps) {
  const [showRawData, setShowRawData] = useState(false);
  const { filename, content, parsedData } = omaData;

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                OMA File Attached
              </CardTitle>
              <CardDescription>{filename}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              data-testid="button-download-oma"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Prescription Data */}
      {(parsedData.prescription?.rightEye || parsedData.prescription?.leftEye) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prescription Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Right Eye */}
              {parsedData.prescription.rightEye && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Badge variant="outline">OD</Badge>
                    Right Eye
                  </h4>
                  <div className="space-y-2 text-sm">
                    {parsedData.prescription.rightEye.sphere && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sphere:</span>
                        <span className="font-medium font-mono">{parsedData.prescription.rightEye.sphere}</span>
                      </div>
                    )}
                    {parsedData.prescription.rightEye.cylinder && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cylinder:</span>
                        <span className="font-medium font-mono">{parsedData.prescription.rightEye.cylinder}</span>
                      </div>
                    )}
                    {parsedData.prescription.rightEye.axis && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Axis:</span>
                        <span className="font-medium font-mono">{parsedData.prescription.rightEye.axis}°</span>
                      </div>
                    )}
                    {parsedData.prescription.rightEye.add && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Add:</span>
                        <span className="font-medium font-mono">{parsedData.prescription.rightEye.add}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Left Eye */}
              {parsedData.prescription.leftEye && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Badge variant="outline">OS</Badge>
                    Left Eye
                  </h4>
                  <div className="space-y-2 text-sm">
                    {parsedData.prescription.leftEye.sphere && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sphere:</span>
                        <span className="font-medium font-mono">{parsedData.prescription.leftEye.sphere}</span>
                      </div>
                    )}
                    {parsedData.prescription.leftEye.cylinder && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cylinder:</span>
                        <span className="font-medium font-mono">{parsedData.prescription.leftEye.cylinder}</span>
                      </div>
                    )}
                    {parsedData.prescription.leftEye.axis && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Axis:</span>
                        <span className="font-medium font-mono">{parsedData.prescription.leftEye.axis}°</span>
                      </div>
                    )}
                    {parsedData.prescription.leftEye.add && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Add:</span>
                        <span className="font-medium font-mono">{parsedData.prescription.leftEye.add}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {parsedData.prescription.pd && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pupillary Distance (PD):</span>
                  <span className="font-medium font-mono">{parsedData.prescription.pd} mm</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Number */}
      {parsedData.jobNumber && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Job Number:</span>
              <span className="font-medium font-mono">{parsedData.jobNumber}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frame Information */}
      {parsedData.frameInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frame Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {parsedData.frameInfo.type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{parsedData.frameInfo.type}</span>
                </div>
              )}
              {parsedData.frameInfo.size && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium font-mono">{parsedData.frameInfo.size}</span>
                </div>
              )}
              {parsedData.frameInfo.bridge && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bridge:</span>
                  <span className="font-medium font-mono">{parsedData.frameInfo.bridge}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracing Data */}
      {parsedData.tracing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tracing Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {parsedData.tracing.side && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Side:</span>
                  <span className="font-medium">{parsedData.tracing.side}</span>
                </div>
              )}
              {parsedData.tracing.rawData && (
                <div className="space-y-2">
                  <span className="text-muted-foreground">Data Points:</span>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                    {parsedData.tracing.rawData.substring(0, 200)}
                    {parsedData.tracing.rawData.length > 200 && '...'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw OMA Data Toggle */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawData(!showRawData)}
            className="w-full"
            data-testid="button-toggle-raw-data"
          >
            {showRawData ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Raw Data
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Raw Data
              </>
            )}
          </Button>

          {showRawData && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">All Fields:</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                <pre>{JSON.stringify(parsedData.raw, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
