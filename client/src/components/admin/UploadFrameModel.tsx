/**
 * Upload 3D Frame Model Component
 * Admin interface for uploading 3D models for AR try-on
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle2, AlertCircle, FileType, Info } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';

interface Upload3DModelProps {
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

export function UploadFrameModel({ productId, productName, onSuccess }: Upload3DModelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);

      const response = await fetch('/api/upload/3d-model', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Model uploaded! ✨',
        description: 'Frame is now available for AR try-on.',
      });
      setFile(null);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['.gltf', '.glb'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a .gltf or .glb file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (!file) return;

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    uploadMutation.mutate(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileType className="h-5 w-5" />
          Upload 3D Model
        </CardTitle>
        <CardDescription>
          Upload a 3D model for {productName} to enable AR virtual try-on
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Supported formats:</strong> .gltf, .glb (max 50MB)<br />
            <strong>Recommended:</strong> GLB format for better performance
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="3d-model">Select 3D Model File</Label>
          <Input
            id="3d-model"
            type="file"
            accept=".gltf,.glb"
            onChange={handleFileChange}
            disabled={uploadMutation.isPending}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {uploadMutation.isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {uploadMutation.isSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              3D model uploaded successfully! Frame is now AR-enabled.
            </AlertDescription>
          </Alert>
        )}

        {uploadMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {uploadMutation.error.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setFile(null);
            setUploadProgress(0);
          }}
          disabled={!file || uploadMutation.isPending}
        >
          Clear
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Model
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Quick Guide for Creating 3D Models
 */
export function ModelCreationGuide() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">How to Create 3D Models</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <h4 className="font-semibold mb-2">Option 1: Photogrammetry (Easiest)</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Take 20-30 photos of frame from all angles</li>
            <li>Use software like Luma AI, Polycam, or Reality Capture</li>
            <li>Export as GLB format</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Option 2: 3D Modeling Software</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Use Blender (free) or Maya to model frames</li>
            <li>Keep polygon count under 50K for performance</li>
            <li>Export as GLB with textures embedded</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Option 3: Purchase from Manufacturer</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Many frame brands provide 3D models</li>
            <li>Contact your suppliers for CAD files</li>
            <li>Convert to GLB format if needed</li>
          </ul>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Tip:</strong> Start with your best-selling frames to maximize ROI
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
