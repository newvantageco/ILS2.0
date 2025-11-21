/**
 * AR Virtual Try-On Page
 * Full-screen AR experience for trying on frames
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { VirtualTryOn } from '@/components/ar/VirtualTryOn';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Info,
  Sparkles 
} from 'lucide-react';

interface Frame {
  id: string;
  name: string;
  brand: string;
  model3dUrl: string;
  thumbnailUrl: string;
  price: string;
  colors: Array<{ name: string; hex: string }>;
  inStock: number;
}

export function ARTryOnPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch AR-enabled frames
  const { data: framesData, isLoading } = useQuery({
    queryKey: ['ar-frames'],
    queryFn: async () => {
      const response = await fetch('/api/ar-try-on/frames', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch frames');
      return response.json();
    },
  });

  // Create AR session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ar-try-on/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
    },
  });

  // Save favorite frame
  const saveFavoriteMutation = useMutation({
    mutationFn: async ({ frameId, screenshot }: { frameId: string; screenshot?: string }) => {
      const response = await fetch('/api/ar-try-on/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          productId: frameId,
          screenshot,
        }),
      });
      if (!response.ok) throw new Error('Failed to save favorite');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Added to favorites! ❤️',
        description: 'Frame saved to your favorites.',
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (frameId: string) => {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: frameId,
          quantity: 1,
        }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Added to cart! 🛒',
        description: 'Frame added to your shopping cart.',
      });
    },
  });

  // Initialize session on mount
  useEffect(() => {
    if (!sessionId) {
      createSessionMutation.mutate();
    }
  }, []);

  // End session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        fetch(`/api/ar-try-on/session/${sessionId}/end`, {
          method: 'PUT',
          credentials: 'include',
          body: JSON.stringify({
            startedAt: Date.now(),
          }),
        });
      }
    };
  }, [sessionId]);

  if (isLoading || !framesData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Sparkles className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading AR Experience...</p>
        </div>
      </div>
    );
  }

  if (framesData.frames.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="p-12 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No AR-Enabled Frames Yet</h2>
          <p className="text-muted-foreground mb-6">
            Upload 3D models for your frames to enable virtual try-on.
          </p>
          <Button onClick={() => navigate('/inventory')}>
            Manage Inventory
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Badge variant="secondary" className="bg-white/90">
            <Sparkles className="h-3 w-3 mr-1" />
            AR Try-On
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/cart')}
            className="text-white hover:bg-white/20"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
        <Card className="bg-white/90 backdrop-blur p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-primary" />
            <span>Position your face in the camera and select a frame to try on</span>
          </div>
        </Card>
      </div>

      {/* AR Experience */}
      <VirtualTryOn
        frames={framesData.frames}
        onFrameSelect={(frameId) => {
          // Track frame selection
          console.log('Frame selected:', frameId);
        }}
        onPurchase={(frameId) => {
          addToCartMutation.mutate(frameId);
        }}
      />

      {/* Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-4">
        <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/ar-try-on/favorites')}
            className="bg-white/90"
          >
            <Heart className="h-4 w-4 mr-2" />
            My Favorites
          </Button>
        </div>
      </div>
    </div>
  );
}
