/**
 * FaceAnalysisUpload Component
 *
 * Beautiful photo upload interface for face shape analysis.
 * Supports drag-and-drop, webcam capture, and file selection.
 */

import React, { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FaceAnalysisUploadProps {
  patientId: string;
  onAnalysisComplete: (result: any) => void;
  onError?: (error: string) => void;
}

export function FaceAnalysisUpload({
  patientId,
  onAnalysisComplete,
  onError,
}: FaceAnalysisUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError?.("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError?.("Image size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowWebcam(false);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setShowWebcam(true);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Webcam error:", error);
      onError?.("Failed to access webcam. Please check permissions.");
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  // Capture photo from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
      handleFileSelect(file);
      stopWebcam();
    }, "image/jpeg", 0.95);
  };

  // Analyze face
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);
      formData.append("patientId", patientId);

      const response = await fetch("/api/face-analysis/analyze", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze face");
      }

      const result = await response.json();
      onAnalysisComplete(result);
    } catch (error: unknown) {
      console.error("Analysis error:", error);
      onError?.(error.message || "Failed to analyze face");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    stopWebcam();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopWebcam();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!previewUrl && !showWebcam && (
        <Card
          className={`border-2 border-dashed transition-all ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-gray-300 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <ImageIcon className="w-12 h-12 text-primary" />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">Upload Patient Photo</h3>
            <p className="text-sm text-gray-600 mb-6">
              Drag and drop a photo here, or click to browse
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>

              <Button type="button" variant="outline" onClick={startWebcam}>
                <Camera className="w-4 h-4 mr-2" />
                Use Webcam
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />

            <p className="text-xs text-gray-500 mt-4">
              Supported: JPG, PNG, WebP • Max size: 10MB
            </p>
          </div>
        </Card>
      )}

      {/* Webcam View */}
      {showWebcam && (
        <Card>
          <div className="p-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
              />

              <div className="absolute top-4 right-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={stopWebcam}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 justify-center">
              <Button type="button" onClick={capturePhoto} className="flex-1 max-w-xs">
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Preview */}
      {previewUrl && (
        <Card>
          <div className="p-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto rounded-lg max-h-96 object-contain bg-gray-50"
              />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleClear}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex-1"
              >
                Choose Different Photo
              </Button>

              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Analyze Face Shape
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <h4 className="font-semibold text-sm mb-2 text-blue-900">
            📸 Tips for Best Results
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Ensure good lighting (natural light is best)</li>
            <li>• Face the camera directly with neutral expression</li>
            <li>• Remove glasses, hats, or accessories</li>
            <li>• Hair should be pulled back to show face shape clearly</li>
            <li>• Photo should show full face from forehead to chin</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
