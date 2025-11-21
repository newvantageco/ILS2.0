/**
 * Virtual Try-On Component
 * AR-powered frame selection using face tracking
 * 
 * Research: 94% increase in online conversions
 * Tech: Three.js + MediaPipe Face Mesh
 */

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore - MediaPipe types may not be available
import { FaceMesh } from '@mediapipe/face_mesh';
// @ts-ignore
import { Camera } from '@mediapipe/camera_utils';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Camera as CameraIcon, 
  Download, 
  Share2, 
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Frame {
  id: string;
  name: string;
  brand: string;
  model3dUrl: string;
  thumbnailUrl: string;
  price: string;
  colors: Array<{ name: string; hex: string }>;
}

interface VirtualTryOnProps {
  frames: Frame[];
  onFrameSelect?: (frameId: string) => void;
  onPurchase?: (frameId: string) => void;
}

export function VirtualTryOn({ frames, onFrameSelect, onPurchase }: VirtualTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faceMesh, setFaceMesh] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    initializeFaceTracking();
    return () => {
      // Cleanup
      if (camera) camera.stop();
    };
  }, []);

  const initializeFaceTracking = async () => {
    try {
      // Initialize MediaPipe Face Mesh
      const faceMeshInstance = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMeshInstance.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMeshInstance.onResults(onFaceDetectionResults);
      setFaceMesh(faceMeshInstance);

      // Initialize camera
      if (videoRef.current) {
        const cameraInstance = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await faceMeshInstance.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720,
        });

        await cameraInstance.start();
        setCamera(cameraInstance);
        setIsLoading(false);

        toast({
          title: 'Camera ready!',
          description: 'Select a frame to try on virtually.',
        });
      }
    } catch (error) {
      console.error('Error initializing face tracking:', error);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const onFaceDetectionResults = (results: any) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoRef.current?.videoWidth || 1280;
    canvas.height = videoRef.current?.videoHeight || 720;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face landmarks (for debugging - remove in production)
    if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
      const landmarks = results.multiFaceLandmarks[0];

      // Draw face mesh (optional)
      // drawFaceMesh(ctx, landmarks);

      // Overlay 3D frame if selected
      if (selectedFrame) {
        overlayFrame(ctx, landmarks, selectedFrame);
      }
    }
  };

  const overlayFrame = (ctx: CanvasRenderingContext2D, landmarks: any[], frame: Frame) => {
    // Get key face points for frame positioning
    // Landmarks: 33 (left temple), 263 (right temple), 168 (nose bridge)
    const leftTemple = landmarks[33];
    const rightTemple = landmarks[263];
    const noseBridge = landmarks[168];

    // Calculate frame dimensions based on face width
    const faceWidth = Math.sqrt(
      Math.pow((rightTemple.x - leftTemple.x) * ctx.canvas.width, 2) +
      Math.pow((rightTemple.y - leftTemple.y) * ctx.canvas.height, 2)
    );

    const frameWidth = faceWidth * 1.1; // 10% wider than face
    const frameHeight = frameWidth * 0.3; // Typical glasses aspect ratio

    // Position frame at nose bridge
    const frameX = noseBridge.x * ctx.canvas.width - frameWidth / 2;
    const frameY = noseBridge.y * ctx.canvas.height - frameHeight / 2;

    // TODO: Load and render actual 3D frame model using Three.js
    // For now, draw a placeholder rectangle
    ctx.strokeStyle = frame.colors[0]?.hex || '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(frameX, frameY, frameWidth, frameHeight);
    ctx.stroke();

    // Draw lenses (simple representation)
    const lensWidth = frameWidth * 0.4;
    const lensHeight = frameHeight * 0.8;
    const lensY = frameY + frameHeight * 0.1;

    // Left lens
    ctx.strokeRect(
      frameX + frameWidth * 0.05,
      lensY,
      lensWidth,
      lensHeight
    );

    // Right lens
    ctx.strokeRect(
      frameX + frameWidth * 0.55,
      lensY,
      lensWidth,
      lensHeight
    );

    // Bridge
    ctx.beginPath();
    ctx.moveTo(frameX + frameWidth * 0.45, lensY + lensHeight / 2);
    ctx.lineTo(frameX + frameWidth * 0.55, lensY + lensHeight / 2);
    ctx.stroke();
  };

  const handleFrameSelect = (frame: Frame) => {
    setSelectedFrame(frame);
    onFrameSelect?.(frame.id);
    
    toast({
      title: 'Frame selected',
      description: `Now trying on ${frame.brand} ${frame.name}`,
    });
  };

  const captureSnapshot = () => {
    if (!canvasRef.current || !videoRef.current) return;

    // Create a temporary canvas to combine video and overlay
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) return;

    // Draw video frame
    tempCtx.drawImage(videoRef.current, 0, 0);

    // Draw overlay
    tempCtx.drawImage(canvasRef.current, 0, 0);

    // Download image
    tempCanvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `virtual-tryon-${selectedFrame?.name || 'frame'}.png`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Photo saved!',
        description: 'Your try-on photo has been downloaded.',
      });
    });
  };

  const shareSnapshot = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    // Similar to capture, but use Web Share API
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) return;

    tempCtx.drawImage(videoRef.current, 0, 0);
    tempCtx.drawImage(canvasRef.current, 0, 0);

    tempCanvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'virtual-tryon.png', { type: 'image/png' });

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Virtual Try-On',
            text: `Check out these frames: ${selectedFrame?.brand} ${selectedFrame?.name}`,
            files: [file],
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        toast({
          title: 'Sharing not supported',
          description: 'Your browser does not support sharing. Photo downloaded instead.',
        });
        captureSnapshot();
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-screen p-6">
      {/* Video Feed */}
      <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <CameraIcon className="h-12 w-12 mx-auto mb-4 animate-pulse" />
              <p>Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
          <Button
            size="lg"
            onClick={captureSnapshot}
            disabled={!selectedFrame}
            className="rounded-full"
          >
            <Download className="h-5 w-5 mr-2" />
            Save Photo
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={shareSnapshot}
            disabled={!selectedFrame}
            className="rounded-full"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </Button>
        </div>

        {/* Selected Frame Info */}
        {selectedFrame && (
          <div className="absolute top-6 left-6">
            <Card className="p-4 bg-white/90 backdrop-blur">
              <h3 className="font-semibold">{selectedFrame.brand}</h3>
              <p className="text-sm text-muted-foreground">{selectedFrame.name}</p>
              <p className="font-bold mt-2">{selectedFrame.price}</p>
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={() => onPurchase?.(selectedFrame.id)}
              >
                Add to Cart
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Frame Selector */}
      <div className="w-full lg:w-96 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Select Frames</h2>
        <div className="grid grid-cols-2 gap-4">
          {frames.map((frame) => (
            <Card
              key={frame.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedFrame?.id === frame.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleFrameSelect(frame)}
            >
              <img
                src={frame.thumbnailUrl}
                alt={frame.name}
                className="w-full h-32 object-cover rounded-t"
              />
              <div className="p-3">
                <p className="font-semibold text-sm">{frame.brand}</p>
                <p className="text-xs text-muted-foreground">{frame.name}</p>
                <p className="font-bold mt-1">{frame.price}</p>
                {selectedFrame?.id === frame.id && (
                  <Badge className="mt-2">Trying On</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Note: To fully implement this:
// 1. npm install three @mediapipe/face_mesh @mediapipe/camera_utils
// 2. Load actual 3D frame models using Three.js GLTFLoader
// 3. Implement proper 3D rendering on the canvas
// 4. Add color selection UI
// 5. Add AR session recording
// 6. Optimize for mobile devices
