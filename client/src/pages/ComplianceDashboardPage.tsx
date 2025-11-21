import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, XCircle, AlertTriangle, FileText, Plus, TrendingUp, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import StatsCard from "@/components/ui/StatsCard";
import { StatsGridSkeleton } from "@/components/ui/LoadingSkeletons";

interface ComplianceCheck {
  id: string;
  companyId: string;
  checkDate: string;
  checkType: string;
  status: string;
  findings: string;
  correctiveActions: string;
  inspector: string;
  nextReviewDate: string;
}

const GOC_COMPLIANCE_ITEMS = [
  {
    category: "Medical Device Regulations",
    items: [
      { id: "mdr-1", name: "Class I Medical Device Registration", description: "Valid registration with Health Canada" },
      { id: "mdr-2", name: "Quality Management System", description: "ISO 13485 certification current" },
      { id: "mdr-3", name: "Device Labeling", description: "Complies with MDR SOR/98-282" },
      { id: "mdr-4", name: "Adverse Event Reporting", description: "System in place for mandatory reporting" },
    ]
  },
  {
    category: "Privacy & Data Protection",
    items: [
      { id: "pdp-1", name: "PIPEDA Compliance", description: "Personal Information Protection in place" },
      { id: "pdp-2", name: "PHI Security", description: "Protected Health Information properly secured" },
      { id: "pdp-3", name: "Consent Management", description: "Patient consent procedures documented" },
      { id: "pdp-4", name: "Data Breach Protocol", description: "Incident response plan established" },
    ]
  },
  {
    category: "Professional Standards",
    items: [
      { id: "ps-1", name: "Optometry Act Compliance", description: "Provincial regulations followed" },
      { id: "ps-2", name: "Record Retention", description: "7-year minimum retention for patient records" },
      { id: "ps-3", name: "Prescription Requirements", description: "Valid Rx required for all dispensing" },
      { id: "ps-4", name: "Licensed Practitioners", description: "All staff properly licensed" },
    ]
  },
];

const UK_COMPLIANCE_ITEMS = [
  {
    category: "MHRA Regulations",
    items: [
      { id: "uk-mdr-1", name: "UKCA Marking", description: "UK Conformity Assessed marking applied" },
      { id: "uk-mdr-2", name: "Medical Device Registration", description: "Registered with MHRA" },
      { id: "uk-mdr-3", name: "UK Quality System", description: "BS EN ISO 13485 compliance" },
      { id: "uk-mdr-4", name: "Vigilance Reporting", description: "MHRA incident reporting system" },
    ]
  },
  {
    category: "Data Protection (UK GDPR)",
    items: [
      { id: "uk-gdpr-1", name: "Data Protection Registration", description: "ICO registration current" },
      { id: "uk-gdpr-2", name: "Lawful Basis Processing", description: "Clear legal basis for data processing" },
      { id: "uk-gdpr-3", name: "Subject Access Rights", description: "SAR procedures documented" },
      { id: "uk-gdpr-4", name: "Data Protection Officer", description: "DPO appointed if required" },
    ]
  },
  {
    category: "Professional Standards (GOC/GOsC)",
    items: [
      { id: "uk-ps-1", name: "GOC Registration", description: "General Optical Council registration" },
      { id: "uk-ps-2", name: "Professional Indemnity", description: "Valid insurance coverage" },
      { id: "uk-ps-3", name: "Clinical Records", description: "8-year retention minimum" },
      { id: "uk-ps-4", name: "Complaints Procedure", description: "Written complaints process" },
    ]
  },
];

export default function ComplianceDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<"canada" | "uk">("canada");
  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [checkNotes, setCheckNotes] = useState("");

  // Fetch compliance checks
  const { data: complianceChecks, isLoading } = useQuery<ComplianceCheck[]>({
    queryKey: ["/api/ecp/goc-compliance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ecp/goc-compliance");
      return await response.json();
    },
  });

  // Create compliance check mutation
  const createCheck = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ecp/goc-compliance", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/goc-compliance"] });
      toast({
        title: "Compliance Check Recorded",
        description: "The compliance check has been saved successfully.",
      });
      setIsCheckDialogOpen(false);
      setCheckedItems(new Set());
      setCheckNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record compliance check",
        variant: "destructive",
      });
    },
  });

  const toggleItem = (itemId: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSubmitCheck = () => {
    const complianceItems = selectedJurisdiction === "canada" ? GOC_COMPLIANCE_ITEMS : UK_COMPLIANCE_ITEMS;
    const totalItems = complianceItems.reduce((sum, cat) => sum + cat.items.length, 0);
    const passedItems = checkedItems.size;
    const compliancePercentage = Math.round((passedItems / totalItems) * 100);

    createCheck.mutate({
      checkType: selectedJurisdiction === "canada" ? "GOC_AUDIT" : "UK_MHRA_AUDIT",
      status: compliancePercentage >= 90 ? "compliant" : compliancePercentage >= 70 ? "minor_issues" : "major_issues",
      findings: `${passedItems}/${totalItems} items compliant (${compliancePercentage}%)`,
      correctiveActions: checkNotes,
      inspector: "Self-Assessment",
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    });
  };

  const complianceItems = selectedJurisdiction === "canada" ? GOC_COMPLIANCE_ITEMS : UK_COMPLIANCE_ITEMS;
  const totalItems = complianceItems.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = checkedItems.size;
  const compliancePercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
      case "minor_issues":
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Minor Issues</Badge>;
      case "major_issues":
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Major Issues</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 via-emerald-500 to-green-500 p-6 text-white shadow-lg"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Regulatory Compliance Dashboard</h1>
              <p className="text-white/80">Monitor compliance with Canadian (GOC) and UK (MHRA) regulations</p>
            </div>
          </div>
        </motion.div>
        <StatsGridSkeleton count={3} />
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Calculate stats for StatsCards
  const compliantCount = complianceChecks?.filter(c => c.status === "compliant").length || 0;
  const minorIssuesCount = complianceChecks?.filter(c => c.status === "minor_issues").length || 0;
  const majorIssuesCount = complianceChecks?.filter(c => c.status === "major_issues").length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Modern Gradient Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 via-emerald-500 to-green-500 p-6 text-white shadow-lg"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Regulatory Compliance Dashboard</h1>
              <p className="text-white/80">Monitor compliance with Canadian (GOC) and UK (MHRA) regulations</p>
            </div>
          </div>
          <Dialog open={isCheckDialogOpen} onOpenChange={setIsCheckDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Plus className="h-4 w-4 mr-2" />
                New Compliance Check
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Regulatory Compliance Assessment</DialogTitle>
              <DialogDescription>
                Complete this checklist to assess compliance status
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Jurisdiction</Label>
                <Select value={selectedJurisdiction} onValueChange={(value: any) => {
                  setSelectedJurisdiction(value);
                  setCheckedItems(new Set());
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canada">🇨🇦 Canada (Health Canada / GOC)</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom (MHRA / GOC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Compliance Progress</Label>
                  <span className="text-sm font-medium">{completedItems}/{totalItems} items ({compliancePercentage}%)</span>
                </div>
                <Progress value={compliancePercentage} className="h-2" />
              </div>

              <div className="space-y-6">
                {complianceItems.map((category) => (
                  <Card key={category.category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {category.items.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={item.id}
                            checked={checkedItems.has(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={item.id} className="font-medium cursor-pointer">
                              {item.name}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <Label>Notes / Corrective Actions Required</Label>
                <Textarea
                  placeholder="Document any findings, corrective actions needed, or additional notes..."
                  value={checkNotes}
                  onChange={(e) => setCheckNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCheckDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCheck}>
                <Shield className="h-4 w-4 mr-2" />
                Submit Assessment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </motion.div>

      {/* Compliance Overview with StatsCard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Compliant Checks"
          value={compliantCount.toString()}
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Minor Issues"
          value={minorIssuesCount.toString()}
          icon={AlertTriangle}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Major Issues"
          value={majorIssuesCount.toString()}
          icon={XCircle}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Compliance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Check History
          </CardTitle>
          <CardDescription>Previous compliance assessments and audits</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Next Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceChecks?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No compliance checks recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                complianceChecks?.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>{new Date(check.checkDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {check.checkType.includes("UK") ? "🇬🇧 UK" : "🇨🇦 Canada"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(check.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{check.findings}</TableCell>
                    <TableCell>{check.inspector}</TableCell>
                    <TableCell>{new Date(check.nextReviewDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Compliance Requirements Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="canada">
            <TabsList>
              <TabsTrigger value="canada">🇨🇦 Canada</TabsTrigger>
              <TabsTrigger value="uk">🇬🇧 United Kingdom</TabsTrigger>
            </TabsList>
            <TabsContent value="canada" className="space-y-4 mt-4">
              {GOC_COMPLIANCE_ITEMS.map((category) => (
                <div key={category.category}>
                  <h4 className="font-semibold mb-2">{category.category}</h4>
                  <ul className="space-y-1 ml-4">
                    {category.items.map((item) => (
                      <li key={item.id} className="text-sm text-muted-foreground">
                        • {item.name}: {item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="uk" className="space-y-4 mt-4">
              {UK_COMPLIANCE_ITEMS.map((category) => (
                <div key={category.category}>
                  <h4 className="font-semibold mb-2">{category.category}</h4>
                  <ul className="space-y-1 ml-4">
                    {category.items.map((item) => (
                      <li key={item.id} className="text-sm text-muted-foreground">
                        • {item.name}: {item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
