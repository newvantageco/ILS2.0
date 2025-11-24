/**
 * FaceAnalysisResults Component
 *
 * Beautiful display of face shape analysis results with confidence scores,
 * measurements, and personalized styling advice.
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Info,
  Heart,
} from "lucide-react";

interface FaceAnalysisResultsProps {
  analysis: {
    id: string;
    faceShape: string;
    faceShapeConfidence: string;
    faceLength?: string;
    faceWidth?: string;
    jawlineWidth?: string;
    foreheadWidth?: string;
    cheekboneWidth?: string;
    skinTone?: string;
    hairColor?: string;
    eyeColor?: string;
    photoUrl: string;
    processingTime?: number;
    analyzedAt: string;
  };
}

const FACE_SHAPE_INFO: Record<
  string,
  {
    description: string;
    characteristics: string[];
    icon: string;
    color: string;
  }
> = {
  oval: {
    description:
      "You have an oval face shape - the most balanced and versatile face shape!",
    characteristics: [
      "Balanced proportions",
      "Gentle curves",
      "Slightly longer than wide",
      "Works with most frame styles",
    ],
    icon: "⭕",
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  round: {
    description: "You have a round face shape with soft, youthful features.",
    characteristics: [
      "Equal length and width",
      "Full cheeks",
      "Soft curves",
      "Best with angular frames",
    ],
    icon: "🔵",
    color: "bg-purple-100 text-purple-700 border-purple-300",
  },
  square: {
    description: "You have a square face shape with strong, defined features.",
    characteristics: [
      "Strong jawline",
      "Angular features",
      "Similar length and width",
      "Best with round or curved frames",
    ],
    icon: "🟦",
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
  },
  heart: {
    description: "You have a heart-shaped face - romantic and distinctive!",
    characteristics: [
      "Wider forehead",
      "Narrow, pointed chin",
      "High cheekbones",
      "Best with bottom-heavy frames",
    ],
    icon: "💙",
    color: "bg-pink-100 text-pink-700 border-pink-300",
  },
  diamond: {
    description: "You have a diamond face shape - rare and striking!",
    characteristics: [
      "Narrow forehead and jaw",
      "Wide cheekbones",
      "Angular features",
      "Best with oval or cat-eye frames",
    ],
    icon: "💎",
    color: "bg-cyan-100 text-cyan-700 border-cyan-300",
  },
  oblong: {
    description: "You have an oblong face shape - elegant and refined.",
    characteristics: [
      "Long and narrow",
      "Elongated features",
      "High forehead",
      "Best with large, round frames",
    ],
    icon: "📏",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  triangle: {
    description: "You have a triangle face shape with distinctive features.",
    characteristics: [
      "Narrow forehead",
      "Wide jawline",
      "Angular chin",
      "Best with top-heavy frames",
    ],
    icon: "🔺",
    color: "bg-amber-100 text-amber-700 border-amber-300",
  },
};

export function FaceAnalysisResults({ analysis }: FaceAnalysisResultsProps) {
  const faceShape = analysis.faceShape.toLowerCase();
  const confidence = parseFloat(analysis.faceShapeConfidence);
  const info = FACE_SHAPE_INFO[faceShape] || FACE_SHAPE_INFO.oval;

  const formatFaceShape = (shape: string) => {
    return shape.charAt(0).toUpperCase() + shape.slice(1);
  };

  const getConfidenceLevel = (conf: number) => {
    if (conf >= 85) return { label: "Very High", color: "text-green-600" };
    if (conf >= 70) return { label: "High", color: "text-blue-600" };
    if (conf >= 50) return { label: "Moderate", color: "text-yellow-600" };
    return { label: "Low", color: "text-orange-600" };
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className={`border-2 ${info.color}`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{info.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {formatFaceShape(faceShape)} Face Shape
                </h2>
                <Badge variant="secondary" className="ml-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Analyzed
                </Badge>
              </div>

              <p className="text-sm mb-3">{info.description}</p>

              {/* Confidence Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Confidence Score</span>
                  <span className={`font-bold ${confidenceLevel.color}`}>
                    {confidence}% • {confidenceLevel.label}
                  </span>
                </div>
                <Progress value={confidence} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo Preview */}
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Analyzed Photo
            </h3>
            <img
              src={analysis.photoUrl}
              alt="Face analysis"
              className="w-full h-auto rounded-lg border-2 border-gray-200"
            />

            {analysis.processingTime && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Analysis completed in {(analysis.processingTime / 1000).toFixed(2)}s
              </p>
            )}
          </div>
        </Card>

        {/* Face Characteristics */}
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Face Characteristics
            </h3>

            <div className="space-y-3">
              {info.characteristics.map((char, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{char}</span>
                </div>
              ))}
            </div>

            {/* Additional Details */}
            {(analysis.skinTone || analysis.hairColor || analysis.eyeColor) && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Additional Details</h4>

                {analysis.skinTone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Skin Tone</span>
                    <span className="font-medium capitalize">{analysis.skinTone}</span>
                  </div>
                )}

                {analysis.hairColor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hair Color</span>
                    <span className="font-medium capitalize">{analysis.hairColor}</span>
                  </div>
                )}

                {analysis.eyeColor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Eye Color</span>
                    <span className="font-medium capitalize">{analysis.eyeColor}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Measurements Card */}
      {(analysis.faceLength ||
        analysis.faceWidth ||
        analysis.jawlineWidth ||
        analysis.foreheadWidth ||
        analysis.cheekboneWidth) && (
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Face Measurements (Relative Proportions)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {analysis.faceLength && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {parseFloat(analysis.faceLength).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Face Length</div>
                </div>
              )}

              {analysis.faceWidth && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {parseFloat(analysis.faceWidth).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Face Width</div>
                </div>
              )}

              {analysis.jawlineWidth && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {parseFloat(analysis.jawlineWidth).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Jawline Width</div>
                </div>
              )}

              {analysis.foreheadWidth && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {parseFloat(analysis.foreheadWidth).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Forehead Width</div>
                </div>
              )}

              {analysis.cheekboneWidth && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {parseFloat(analysis.cheekboneWidth).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Cheekbone Width</div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Values are relative proportions, not absolute measurements
            </p>
          </div>
        </Card>
      )}

      {/* Styling Tips */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <div className="p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-900">
            <Heart className="w-5 h-5" />
            Frame Recommendations for You
          </h3>

          <p className="text-sm text-purple-800 mb-4">
            Based on your {formatFaceShape(faceShape)} face shape, we&apos;ve curated personalized
            frame recommendations that will complement your features beautifully.
          </p>

          <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
            <p className="text-sm font-medium text-purple-900 mb-2">What to look for:</p>
            <ul className="text-sm text-purple-800 space-y-1">
              {info.characteristics.slice(0, 3).map((char, index) => (
                <li key={index}>• {char}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
