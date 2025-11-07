/**
 * FrameRecommendationCard Component
 *
 * Beautiful card displaying frame recommendations with AI match scores,
 * interactive actions, and purchase integration.
 */

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ShoppingCart,
  Sparkles,
  Eye,
  X,
  Info,
  TrendingUp,
  Package,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FrameRecommendationCardProps {
  recommendation: {
    id: string;
    product: {
      id: string;
      name: string;
      brand: string;
      model: string;
      description: string;
      imageUrl: string;
      unitPrice: string;
      stockQuantity: number;
      barcode: string;
    };
    characteristics: {
      frameStyle: string;
      frameMaterial: string;
      frameSize: string;
      gender: string;
      colorFamily: string;
      style: string;
      hasNosePads: boolean;
      isAdjustable: boolean;
      lensWidth?: string;
      bridgeWidth?: string;
      templeLength?: string;
    };
    matchScore: number;
    matchReason: string;
    rank: number;
  };
  onLike?: () => void;
  onAddToCart?: () => void;
  onDismiss?: () => void;
  onView?: () => void;
}

export function FrameRecommendationCard({
  recommendation,
  onLike,
  onAddToCart,
  onDismiss,
  onView,
}: FrameRecommendationCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const { product, characteristics, matchScore, matchReason, rank } = recommendation;

  const getMatchBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-700 border-green-300";
    if (score >= 75) return "bg-blue-100 text-blue-700 border-blue-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getMatchLabel = (score: number) => {
    if (score >= 90) return "Perfect Match";
    if (score >= 75) return "Great Match";
    if (score >= 60) return "Good Match";
    return "Compatible";
  };

  const formatStyle = (style: string) => {
    return style
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleView = () => {
    onView?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group relative">
      {/* Best Match Badge */}
      {rank === 1 && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            #1 Best Match
          </Badge>
        </div>
      )}

      {/* Dismiss Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDismiss}
      >
        <X className="w-4 h-4" />
      </Button>

      {/* Product Image */}
      <div
        className="relative h-64 bg-gray-100 cursor-pointer overflow-hidden"
        onClick={handleView}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Stock Status */}
        {product.stockQuantity <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg">
              Out of Stock
            </Badge>
          </div>
        )}

        {/* Match Score Overlay */}
        <div className="absolute bottom-2 left-2">
          <Badge className={`${getMatchBadgeColor(matchScore)} border-2 font-semibold`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {matchScore}% {getMatchLabel(matchScore)}
          </Badge>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-3">
        {/* Title & Price */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg leading-tight">
                {product.brand} {product.model}
              </h3>
              {product.name && product.name !== `${product.brand} ${product.model}` && (
                <p className="text-sm text-gray-600">{product.name}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary">
                ${parseFloat(product.unitPrice).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Match Reason */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-900">{matchReason}</p>
          </div>
        </div>

        {/* Frame Specs */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {formatStyle(characteristics.frameStyle)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {formatStyle(characteristics.frameMaterial)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {characteristics.frameSize}
          </Badge>
          {characteristics.gender && (
            <Badge variant="outline" className="text-xs capitalize">
              {characteristics.gender}
            </Badge>
          )}
        </div>

        {/* Features */}
        {(characteristics.hasNosePads || characteristics.isAdjustable) && (
          <div className="flex gap-2 text-xs text-gray-600">
            {characteristics.hasNosePads && <span>• Adjustable Nose Pads</span>}
            {characteristics.isAdjustable && <span>• Adjustable Fit</span>}
          </div>
        )}

        {/* Measurements */}
        {(characteristics.lensWidth ||
          characteristics.bridgeWidth ||
          characteristics.templeLength) && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
            <div className="font-medium mb-1">Measurements:</div>
            <div className="flex gap-3">
              {characteristics.lensWidth && (
                <span>Lens: {characteristics.lensWidth}mm</span>
              )}
              {characteristics.bridgeWidth && (
                <span>Bridge: {characteristics.bridgeWidth}mm</span>
              )}
              {characteristics.templeLength && (
                <span>Temple: {characteristics.templeLength}mm</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? "border-red-500 text-red-500" : ""}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save to favorites</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm" onClick={handleView} className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>

          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={product.stockQuantity <= 0}
            className="flex-1"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>

        {/* Stock Warning */}
        {product.stockQuantity > 0 && product.stockQuantity <= 3 && (
          <div className="text-xs text-orange-600 text-center bg-orange-50 rounded p-2">
            Only {product.stockQuantity} left in stock!
          </div>
        )}
      </div>
    </Card>
  );
}
