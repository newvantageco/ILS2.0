import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, AlertCircle, TrendingUp, DollarSign, Zap, Star, Sparkles, Lightbulb } from "lucide-react";
import type { AiRecommendationResponse, RecommendationTier } from "@shared/schema";

interface AIDispensingAssistantProps {
  orderId: string;
  recommendations: AiRecommendationResponse | null;
  loading: boolean;
  onAcceptRecommendation?: (tier: "BEST" | "BETTER" | "GOOD") => void;
}

export function AIDispensingAssistant({
  orderId,
  recommendations,
  loading,
  onAcceptRecommendation,
}: AIDispensingAssistantProps) {
  const [selectedTier, setSelectedTier] = useState<"BEST" | "BETTER" | "GOOD" | null>(null);
  const [expandedContext, setExpandedContext] = useState<Set<number>>(new Set());

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            AI Dispensing Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-gray-600 mt-2">Analyzing prescription and clinical notes...</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Dispensing Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No recommendations could be generated. Please ensure clinical notes are provided.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const confidencePercent = (recommendations.clinicalConfidenceScore * 100).toFixed(0);
  const tiers = recommendations.recommendations;

  const toggleContext = (index: number) => {
    const newExpanded = new Set(expandedContext);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedContext(newExpanded);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Zap className="w-6 h-6 text-blue-600" />
                AI Dispensing Assistant: Recommended Solution
              </CardTitle>
              <CardDescription className="text-blue-700 mt-2">
                Based on Rx +1.50 -1.00 x 090 Add +2.25 & Clinical Notes
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-600">Clinical Confidence</div>
              <div className="text-2xl font-bold text-blue-600">{confidencePercent}%</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600 font-medium">Analysis Method</div>
              <div className="text-gray-900">Three-Legged AI Model</div>
            </div>
            <div>
              <div className="text-gray-600 font-medium">Data Sources</div>
              <div className="text-gray-900">LIMS + NLP + Catalog</div>
            </div>
            <div>
              <div className="text-gray-600 font-medium">Recommendations</div>
              <div className="text-gray-900">{tiers.length} Options</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiered Recommendations */}
      <Tabs defaultValue="BEST" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {tiers.map((tier) => (
            <TabsTrigger key={tier.tier} value={tier.tier} className="flex items-center gap-2">
              {tier.tier === "BEST" && <><Sparkles className="h-4 w-4" /> Best</>}
              {tier.tier === "BETTER" && <><Star className="h-4 w-4" /> Better</>}
              {tier.tier === "GOOD" && <><Lightbulb className="h-4 w-4" /> Good</>}
            </TabsTrigger>
          ))}
        </TabsList>

        {tiers.map((tier) => (
          <TabsContent key={tier.tier} value={tier.tier} className="space-y-4">
            <Card className={getTierBorderClass(tier.tier)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTierIcon(tier.tier)}
                      {tier.tier === "BEST" && "BEST (Recommended)"}
                      {tier.tier === "BETTER" && "BETTER (Good Alternative)"}
                      {tier.tier === "GOOD" && "GOOD (Budget-Compliant)"}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${tier.retailPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Your Retail Price</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lens & Coating Specs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Lens</div>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600">Type:</span> <span className="font-medium">{tier.lens.type}</span></div>
                      <div><span className="text-gray-600">Material:</span> <span className="font-medium">{tier.lens.material}</span></div>
                      <div><span className="text-gray-600">Design:</span> <span className="font-medium">{tier.lens.design}</span></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Coating</div>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600">Type:</span> <span className="font-medium">{tier.coating.name}</span></div>
                      <div className="pt-1 flex flex-wrap gap-1">
                        {tier.coating.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Justification */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-blue-900 mb-2">Why it&apos;s recommended:</div>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {tier.clinicalJustification}
                  </p>
                </div>

                {/* Lifestyle Justification */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-semibold text-green-900 mb-2">For your lifestyle:</div>
                  <p className="text-sm text-green-900 leading-relaxed">
                    {tier.lifeStyleJustification}
                  </p>
                </div>

                {/* Clinical Context */}
                {tier.clinicalContext.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700">Clinical Factors Considered:</div>
                    <div className="space-y-2">
                      {tier.clinicalContext.map((context, idx) => (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleContext(idx)}
                            className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-700">
                                {context.tag.replace(/_/g, " ")}
                              </span>
                            </div>
                            <span className="text-gray-400">
                              {expandedContext.has(idx) ? "−" : "+"}
                            </span>
                          </button>
                          {expandedContext.has(idx) && (
                            <div className="px-4 py-3 bg-white border-t border-gray-200 text-sm text-gray-600">
                              {context.justification}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match Score & In Stock */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Match Score</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(tier.matchScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2" style={{width: "100px"}}>
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${tier.matchScore * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => {
                    setSelectedTier(tier.tier);
                    onAcceptRecommendation?.(tier.tier);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {tier.tier === "BEST" && "Accept Best Recommendation"}
                  {tier.tier === "BETTER" && "Accept Alternative"}
                  {tier.tier === "GOOD" && "Accept Budget Option"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Footer Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          This AI recommendation is powered by our proprietary three-legged model: LIMS manufacturing data
          (optometry-trained), NLP clinical analysis, and your catalog pricing. It provides transparent,
          clinically-justified recommendations you can share directly with your customers.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function getTierBorderClass(tier: string): string {
  switch (tier) {
    case "BEST":
      return "border-4 border-green-500 shadow-lg";
    case "BETTER":
      return "border-2 border-blue-400 shadow-md";
    case "GOOD":
      return "border-2 border-gray-300";
    default:
      return "";
  }
}

function getTierIcon(tier: string) {
  switch (tier) {
    case "BEST":
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    case "BETTER":
      return <Check className="w-5 h-5 text-blue-600" />;
    case "GOOD":
      return <DollarSign className="w-5 h-5 text-gray-600" />;
    default:
      return null;
  }
}
