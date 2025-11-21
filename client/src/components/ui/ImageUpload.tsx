import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  uploadType?: "product" | "profile";
  className?: string;
}

export function ImageUpload({ 
  currentImageUrl, 
  onImageUploaded, 
  uploadType = "product",
  className = "" 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, GIF, or WebP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('uploadType', uploadType);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      setPreviewUrl(data.url);
      onImageUploaded(data.url);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      // Reset preview on error
      setPreviewUrl(currentImageUrl || "");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl("");
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border bg-muted">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {uploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleClick}
              disabled={uploading}
              className="shadow-lg"
            >
              <Upload className="h-4 w-4 mr-1" />
              Change
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={uploading}
              className="shadow-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full h-48 rounded-lg border-2 border-dashed border-border hover:border-primary bg-muted hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-12 w-12" />
              <div className="text-sm font-medium">Click to upload image</div>
              <div className="text-xs">PNG, JPG, GIF or WebP (Max 5MB)</div>
            </>
          )}
        </button>
      )}
    </div>
  );
}
