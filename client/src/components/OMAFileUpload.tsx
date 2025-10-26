import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OMAFileUploadProps {
  orderId?: string;
  onUploadSuccess?: () => void;
  onFileSelect?: (fileContent: string, filename: string) => void;
  showInline?: boolean;
}

export function OMAFileUpload({ orderId, onUploadSuccess, onFileSelect, showInline = false }: OMAFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.oma')) {
      setError('Please select a valid .oma file');
      return;
    }

    setError(null);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSelectedFile({ name: file.name, content });
      
      // If in inline mode, pass data to parent
      if (showInline && onFileSelect) {
        onFileSelect(content, file.name);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
    };
    
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !orderId) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/oma`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: selectedFile.content,
          filename: selectedFile.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to upload file');
      }

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (showInline && onFileSelect) {
      onFileSelect('', '');
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".oma"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-oma-file"
      />

      {!selectedFile ? (
        <Card className="border-dashed hover-elevate active-elevate-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Upload OMA File</p>
              <p className="text-sm text-muted-foreground">
                Click to select a .oma file or drag and drop
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.content.length / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!showInline && (
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={isUploading}
                    data-testid="button-upload-oma"
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemove}
                  data-testid="button-remove-oma"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
