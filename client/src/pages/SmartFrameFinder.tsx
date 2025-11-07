/**
 * Smart Frame Finder Page
 *
 * AI-Powered Frame Recommendation System
 * Upload a photo, analyze face shape, get personalized frame recommendations.
 */

import React, { useState } from "react";
import { useSearchParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaceAnalysisUpload } from "@/components/FaceAnalysisUpload";
import { FaceAnalysisResults } from "@/components/FaceAnalysisResults";
import { FrameRecommendationCard } from "@/components/FrameRecommendationCard";
import {
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

export default function SmartFrameFinder() {
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");

  const [step, setStep] = useState<"select-patient" | "upload" | "results">("select-patient");
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patientIdFromUrl || "");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    style: "all",
    material: "all",
    gender: "all",
    priceRange: "all",
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Patient search
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Search for patients
  const handleSearchPatients = async () => {
    if (!patientSearchQuery.trim()) return;

    setLoadingPatients(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/patients/search?query=${encodeURIComponent(patientSearchQuery)}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search patients");
      }

      const data = await response.json();
      setPatients(data);
    } catch (err: any) {
      setError(err.message || "Failed to search patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  // Handle patient selection
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setStep("upload");
  };

  // Handle analysis complete
  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result.analysis);
    setRecommendations(result.recommendations);
    setStep("results");
    setSuccess("Face analysis complete! Check out your personalized recommendations below.");
    setError(null);
  };

  // Handle analysis error
  const handleAnalysisError = (errorMsg: string) => {
    setError(errorMsg);
    setSuccess(null);
  };

  // Track recommendation interaction
  const trackInteraction = async (recommendationId: string, interaction: string) => {
    try {
      await fetch(`/api/face-analysis/recommendations/${recommendationId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ interaction }),
      });
    } catch (err) {
      console.error("Failed to track interaction:", err);
    }
  };

  // Filter recommendations
  const filteredRecommendations = recommendations.filter((rec) => {
    const product = rec.product;
    const characteristics = rec.characteristics;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.model?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Style filter
    if (filters.style !== "all" && characteristics.frameStyle !== filters.style) {
      return false;
    }

    // Material filter
    if (filters.material !== "all" && characteristics.frameMaterial !== filters.material) {
      return false;
    }

    // Gender filter
    if (
      filters.gender !== "all" &&
      characteristics.gender !== filters.gender &&
      characteristics.gender !== "unisex"
    ) {
      return false;
    }

    // Price range filter
    if (filters.priceRange !== "all") {
      const price = parseFloat(product.unitPrice);
      const [min, max] = filters.priceRange.split("-").map(Number);
      if (price < min || price > max) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Smart Frame Finder</h1>
            <p className="text-gray-600">
              AI-powered face analysis & personalized frame recommendations
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          <Badge variant={step === "select-patient" ? "default" : "secondary"}>
            {step !== "select-patient" && <CheckCircle2 className="w-3 h-3 mr-1" />}
            1. Select Patient
          </Badge>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <Badge
            variant={
              step === "upload" ? "default" : step === "results" ? "secondary" : "outline"
            }
          >
            {step === "results" && <CheckCircle2 className="w-3 h-3 mr-1" />}
            2. Upload Photo
          </Badge>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <Badge variant={step === "results" ? "default" : "outline"}>
            3. View Recommendations
          </Badge>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Patient Selection */}
      {step === "select-patient" && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select a Patient</h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearchPatients()}
                className="flex-1"
              />
              <Button onClick={handleSearchPatients} disabled={loadingPatients}>
                {loadingPatients ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {patients.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {patients.map((patient) => (
                  <Card
                    key={patient.id}
                    className="p-4 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectPatient(patient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{patient.email}</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {patients.length === 0 && patientSearchQuery && !loadingPatients && (
              <p className="text-center text-gray-500 py-8">
                No patients found. Try a different search term.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Upload Photo */}
      {step === "upload" && selectedPatientId && (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setStep("select-patient")}>
            ← Change Patient
          </Button>

          <FaceAnalysisUpload
            patientId={selectedPatientId}
            onAnalysisComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
          />
        </div>
      )}

      {/* Step 3: Results & Recommendations */}
      {step === "results" && analysisResult && (
        <div className="space-y-8">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setAnalysisResult(null);
                setRecommendations([]);
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              Analyze Again
            </Button>
          </div>

          {/* Analysis Results */}
          <FaceAnalysisResults analysis={analysisResult} />

          {/* Recommendations Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Your Personalized Recommendations</h2>
                <p className="text-gray-600">
                  {filteredRecommendations.length} frames perfectly matched to your face shape
                </p>
              </div>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>

                <Input
                  placeholder="Search frames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />

                <Select value={filters.style} onValueChange={(v) => setFilters({ ...filters, style: v })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="oval">Oval</SelectItem>
                    <SelectItem value="cat_eye">Cat Eye</SelectItem>
                    <SelectItem value="aviator">Aviator</SelectItem>
                    <SelectItem value="wayfarer">Wayfarer</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.material}
                  onValueChange={(v) => setFilters({ ...filters, material: v })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="acetate">Acetate</SelectItem>
                    <SelectItem value="titanium">Titanium</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.gender}
                  onValueChange={(v) => setFilters({ ...filters, gender: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.priceRange}
                  onValueChange={(v) => setFilters({ ...filters, priceRange: v })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-100">Under $100</SelectItem>
                    <SelectItem value="100-200">$100 - $200</SelectItem>
                    <SelectItem value="200-300">$200 - $300</SelectItem>
                    <SelectItem value="300-9999">$300+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Recommendations Grid */}
            {filteredRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecommendations.map((rec) => (
                  <FrameRecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onLike={() => trackInteraction(rec.id, "like")}
                    onView={() => trackInteraction(rec.id, "view")}
                    onDismiss={() => trackInteraction(rec.id, "dismiss")}
                    onAddToCart={() => {
                      trackInteraction(rec.id, "purchase");
                      // TODO: Integrate with POS
                      alert("Add to cart integration coming soon!");
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-500">No frames match your current filters.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilters({ style: "all", material: "all", gender: "all", priceRange: "all" });
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
