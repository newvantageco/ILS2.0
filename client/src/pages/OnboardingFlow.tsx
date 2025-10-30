import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Building2, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Search,
  UserPlus,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  createdAt: string;
  memberCount: number;
}

export default function OnboardingFlow() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [onboardingType, setOnboardingType] = useState<"join" | "create" | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [newCompanyData, setNewCompanyData] = useState({
    name: "",
    industry: "",
    size: "",
    description: "",
  });
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Fetch available companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies/available'],
    enabled: onboardingType === "join",
  });

  // Create new company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof newCompanyData) => {
      const response = await apiRequest("POST", "/api/companies", data);
      return await response.json();
    },
    onSuccess: (company) => {
      toast({
        title: "Company created!",
        description: `${company.name} has been successfully created.`,
      });
      setStep(3);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create company",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Join existing company mutation
  const joinCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await apiRequest("POST", "/api/companies/join", { companyId });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request sent!",
        description: "Your request to join the company is pending approval.",
      });
      setStep(3);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join company",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter companies based on search
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompany = () => {
    if (!newCompanyData.name || !newCompanyData.industry || !newCompanyData.size) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createCompanyMutation.mutate(newCompanyData);
  };

  const handleJoinCompany = () => {
    if (!selectedCompanyId) {
      toast({
        title: "No company selected",
        description: "Please select a company to join.",
        variant: "destructive",
      });
      return;
    }
    joinCompanyMutation.mutate(selectedCompanyId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= num
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded transition-all ${
                      step > num ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-20 mt-2 text-sm text-gray-600">
            <span className={step >= 1 ? "font-semibold text-blue-600" : ""}>Choose Path</span>
            <span className={step >= 2 ? "font-semibold text-blue-600" : ""}>Setup</span>
            <span className={step >= 3 ? "font-semibold text-blue-600" : ""}>Complete</span>
          </div>
        </div>

        {/* Step 1: Choose Onboarding Type */}
        {step === 1 && (
          <Card className="border-2 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <Sparkles className="w-8 h-8 text-blue-600" />
                Welcome to IntegratedLensSystem
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Let's get you set up. Choose how you'd like to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={onboardingType} onValueChange={(val) => setOnboardingType(val as any)}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    onboardingType === "create"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setOnboardingType("create")}
                >
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value="create" id="create" />
                    <div className="flex-1">
                      <Label htmlFor="create" className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Create a New Company
                      </Label>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start fresh by creating your own company profile. You'll be the administrator
                        and can invite team members later.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="secondary">Full Control</Badge>
                        <Badge variant="secondary">Admin Access</Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    onboardingType === "join"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setOnboardingType("join")}
                >
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value="join" id="join" />
                    <div className="flex-1">
                      <Label htmlFor="join" className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-green-600" />
                        Join an Existing Company
                      </Label>
                      <p className="text-sm text-muted-foreground mt-2">
                        Connect with your team by joining a company that's already set up on the platform.
                        Your access will be approved by an administrator.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="secondary">Quick Start</Badge>
                        <Badge variant="secondary">Team Collaboration</Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </RadioGroup>

              <Button
                onClick={() => setStep(2)}
                disabled={!onboardingType}
                className="w-full py-6 text-lg"
                size="lg"
              >
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Setup (Create or Join) */}
        {step === 2 && onboardingType === "create" && (
          <Card className="border-2 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                Create Your Company
              </CardTitle>
              <CardDescription>
                Tell us about your organization. This information helps customize your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Acme Optical Labs"
                  value={newCompanyData.name}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={newCompanyData.industry}
                  onValueChange={(val) => setNewCompanyData({ ...newCompanyData, industry: val })}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="optical_lab">Optical Laboratory</SelectItem>
                    <SelectItem value="ecp">Eye Care Practice</SelectItem>
                    <SelectItem value="manufacturing">Lens Manufacturing</SelectItem>
                    <SelectItem value="distribution">Distribution & Supply</SelectItem>
                    <SelectItem value="retail">Optical Retail</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Company Size *</Label>
                <Select
                  value={newCompanyData.size}
                  onValueChange={(val) => setNewCompanyData({ ...newCompanyData, size: val })}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of your company"
                  value={newCompanyData.description}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleCreateCompany}
                  disabled={createCompanyMutation.isPending}
                  className="flex-1"
                >
                  {createCompanyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Company"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && onboardingType === "join" && (
          <Card className="border-2 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="w-6 h-6 text-green-600" />
                Join a Company
              </CardTitle>
              <CardDescription>
                Search for and select the company you'd like to join.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="search">Search Companies</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by company name or industry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {companiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No companies found matching your search.</p>
                  </div>
                ) : (
                  filteredCompanies.map((company) => (
                    <motion.div
                      key={company.id}
                      whileHover={{ scale: 1.01 }}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedCompanyId === company.id
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {company.industry} • {company.size}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{company.memberCount} members</Badge>
                            <Badge variant="outline">
                              Est. {new Date(company.createdAt).getFullYear()}
                            </Badge>
                          </div>
                        </div>
                        {selectedCompanyId === company.id && (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleJoinCompany}
                  disabled={!selectedCompanyId || joinCompanyMutation.isPending}
                  className="flex-1"
                >
                  {joinCompanyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    "Request to Join"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Completion */}
        {step === 3 && (
          <Card className="border-2 shadow-2xl">
            <CardContent className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-3">All Set!</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {onboardingType === "create"
                  ? "Your company has been created successfully. You can now start using the platform and invite team members."
                  : "Your request has been sent. You'll receive a notification once an administrator approves your access."}
              </p>
              <Button size="lg" onClick={() => setLocation("/")}>
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
