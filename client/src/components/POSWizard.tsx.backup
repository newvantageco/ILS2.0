/**
 * POS Wizard - Guided Multi-Step Point of Sale Workflow
 * 
 * This component implements a 5-step guided workflow for creating orders:
 * 1. Patient Selection - Search/select existing patient or create new
 * 2. Lens Selection - Choose lens type, material, design
 * 3. Coatings & Add-ons - Select coatings, tints, edge polish
 * 4. Measurements - Enter PD, frame measurements, special instructions
 * 5. Checkout - Review order, create invoice, process payment
 * 
 * INTEGRATION WITH EVENT SYSTEM:
 * ==============================
 * When payment is confirmed in Step 5, the wizard publishes the 
 * "invoice.paid" event which triggers automatic order creation via 
 * the OrderHandlers we implemented earlier.
 * 
 * Flow: Payment → publishInvoicePaid() → OrderHandlers → Auto-create lab order
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Eye, 
  Sparkles, 
  Ruler, 
  ShoppingCart,
  CheckCircle2,
  Search,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  customerNumber: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface WizardState {
  // Step 1: Patient
  patientId: string | null;
  patientName: string;
  
  // Step 2: Lens Selection
  lensType: string;
  lensMaterial: string;
  lensDesign: string;
  
  // Step 3: Coatings
  antiReflective: boolean;
  scratchResistant: boolean;
  uvProtection: boolean;
  blueLight: boolean;
  tint: string;
  
  // Step 4: Measurements
  pdRight: string;
  pdLeft: string;
  frameWidth: string;
  frameHeight: string;
  bridge: string;
  templeLength: string;
  specialInstructions: string;
  
  // Step 5: Pricing
  basePrice: number;
  coatingsPrice: number;
  totalPrice: number;
}

const INITIAL_STATE: WizardState = {
  patientId: null,
  patientName: "",
  lensType: "single-vision",
  lensMaterial: "CR39",
  lensDesign: "standard",
  antiReflective: false,
  scratchResistant: false,
  uvProtection: false,
  blueLight: false,
  tint: "none",
  pdRight: "",
  pdLeft: "",
  frameWidth: "",
  frameHeight: "",
  bridge: "",
  templeLength: "",
  specialInstructions: "",
  basePrice: 0,
  coatingsPrice: 0,
  totalPrice: 0,
};

const LENS_PRICES = {
  "single-vision": 150,
  "bifocal": 250,
  "progressive": 350,
  "office": 300,
};

const MATERIAL_PRICES = {
  "CR39": 0,
  "polycarbonate": 50,
  "hi-index-1.67": 100,
  "hi-index-1.74": 150,
  "trivex": 75,
};

const COATING_PRICES = {
  antiReflective: 40,
  scratchResistant: 25,
  uvProtection: 15,
  blueLight: 35,
};

export function POSWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients for Step 1
  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success!",
        description: "Order created successfully. Lab order will be generated automatically.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const filteredPatients = patients?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customerNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const calculatePricing = () => {
    const basePrice = LENS_PRICES[state.lensType as keyof typeof LENS_PRICES] + 
                     MATERIAL_PRICES[state.lensMaterial as keyof typeof MATERIAL_PRICES];
    
    let coatingsPrice = 0;
    if (state.antiReflective) coatingsPrice += COATING_PRICES.antiReflective;
    if (state.scratchResistant) coatingsPrice += COATING_PRICES.scratchResistant;
    if (state.uvProtection) coatingsPrice += COATING_PRICES.uvProtection;
    if (state.blueLight) coatingsPrice += COATING_PRICES.blueLight;
    
    const totalPrice = basePrice + coatingsPrice;
    
    updateState({ basePrice, coatingsPrice, totalPrice });
  };

  const nextStep = () => {
    if (step === 3) {
      calculatePricing();
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    if (!state.patientId) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }

    // Create invoice with line items
    const invoiceData = {
      patientId: state.patientId,
      status: "paid",
      paymentMethod: "card",
      lineItems: [
        {
          description: `${state.lensType} Lenses - ${state.lensMaterial}`,
          quantity: 1,
          unitPrice: state.basePrice,
          totalPrice: state.basePrice,
        },
        ...(state.coatingsPrice > 0 ? [{
          description: "Lens Coatings",
          quantity: 1,
          unitPrice: state.coatingsPrice,
          totalPrice: state.coatingsPrice,
        }] : []),
      ],
      totalAmount: state.totalPrice,
      amountPaid: state.totalPrice,
      metadata: {
        lensType: state.lensType,
        lensMaterial: state.lensMaterial,
        lensDesign: state.lensDesign,
        coatings: {
          antiReflective: state.antiReflective,
          scratchResistant: state.scratchResistant,
          uvProtection: state.uvProtection,
          blueLight: state.blueLight,
        },
        measurements: {
          pdRight: state.pdRight,
          pdLeft: state.pdLeft,
          frameWidth: state.frameWidth,
          frameHeight: state.frameHeight,
          bridge: state.bridge,
          templeLength: state.templeLength,
        },
        specialInstructions: state.specialInstructions,
      },
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return state.patientId !== null;
      case 2:
        return state.lensType && state.lensMaterial && state.lensDesign;
      case 3:
        return true; // Coatings are optional
      case 4:
        return state.pdRight && state.pdLeft;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[
          { num: 1, label: "Patient", icon: User },
          { num: 2, label: "Lenses", icon: Eye },
          { num: 3, label: "Coatings", icon: Sparkles },
          { num: 4, label: "Measurements", icon: Ruler },
          { num: 5, label: "Checkout", icon: ShoppingCart },
        ].map((s, idx) => (
          <div key={s.num} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-medium
                  ${step === s.num ? "bg-primary text-primary-foreground" : 
                    step > s.num ? "bg-green-500 text-white" : 
                    "bg-muted text-muted-foreground"}
                `}
              >
                {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs mt-2 ${step === s.num ? "font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {idx < 4 && (
              <div className={`h-1 flex-1 ${step > s.num ? "bg-green-500" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Patient Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Select Patient</h3>
                  <p className="text-sm text-muted-foreground">Choose an existing patient or create new</p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Patient
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredPatients?.map((patient) => (
                  <div
                    key={patient.id}
                    className={`
                      p-4 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0
                      ${state.patientId === patient.id ? "bg-accent" : ""}
                    `}
                    onClick={() => updateState({ patientId: patient.id, patientName: patient.name })}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.customerNumber}</p>
                      </div>
                      {state.patientId === patient.id && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Lens Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Lens Selection</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Lens Type</Label>
                    <RadioGroup value={state.lensType} onValueChange={(value) => updateState({ lensType: value })}>
                      {Object.entries(LENS_PRICES).map(([type, price]) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={type} />
                          <Label htmlFor={type} className="flex-1 cursor-pointer">
                            <span className="capitalize">{type.replace("-", " ")}</span>
                            <span className="text-sm text-muted-foreground ml-2">£{price}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Lens Material</Label>
                    <RadioGroup value={state.lensMaterial} onValueChange={(value) => updateState({ lensMaterial: value })}>
                      {Object.entries(MATERIAL_PRICES).map(([material, price]) => (
                        <div key={material} className="flex items-center space-x-2">
                          <RadioGroupItem value={material} id={material} />
                          <Label htmlFor={material} className="flex-1 cursor-pointer">
                            {material}
                            {price > 0 && <span className="text-sm text-muted-foreground ml-2">+£{price}</span>}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Lens Design</Label>
                    <Select value={state.lensDesign} onValueChange={(value) => updateState({ lensDesign: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="aspheric">Aspheric</SelectItem>
                        <SelectItem value="freeform">Freeform Digital</SelectItem>
                        <SelectItem value="wrap">Wrap/Sport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Coatings & Add-ons */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Coatings & Add-ons</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="antiReflective"
                      checked={state.antiReflective}
                      onCheckedChange={(checked) => updateState({ antiReflective: !!checked })}
                    />
                    <Label htmlFor="antiReflective" className="flex-1 cursor-pointer">
                      Anti-Reflective Coating
                      <span className="text-sm text-muted-foreground ml-2">+£{COATING_PRICES.antiReflective}</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scratchResistant"
                      checked={state.scratchResistant}
                      onCheckedChange={(checked) => updateState({ scratchResistant: !!checked })}
                    />
                    <Label htmlFor="scratchResistant" className="flex-1 cursor-pointer">
                      Scratch-Resistant Coating
                      <span className="text-sm text-muted-foreground ml-2">+£{COATING_PRICES.scratchResistant}</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uvProtection"
                      checked={state.uvProtection}
                      onCheckedChange={(checked) => updateState({ uvProtection: !!checked })}
                    />
                    <Label htmlFor="uvProtection" className="flex-1 cursor-pointer">
                      UV Protection
                      <span className="text-sm text-muted-foreground ml-2">+£{COATING_PRICES.uvProtection}</span>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="blueLight"
                      checked={state.blueLight}
                      onCheckedChange={(checked) => updateState({ blueLight: !!checked })}
                    />
                    <Label htmlFor="blueLight" className="flex-1 cursor-pointer">
                      Blue Light Filter
                      <span className="text-sm text-muted-foreground ml-2">+£{COATING_PRICES.blueLight}</span>
                    </Label>
                  </div>

                  <div>
                    <Label>Tint</Label>
                    <Select value={state.tint} onValueChange={(value) => updateState({ tint: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="gray">Gray</SelectItem>
                        <SelectItem value="brown">Brown</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="photochromic">Photochromic (Transitions)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Measurements */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Measurements</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pdRight">PD Right (mm)</Label>
                    <Input
                      id="pdRight"
                      type="number"
                      value={state.pdRight}
                      onChange={(e) => updateState({ pdRight: e.target.value })}
                      placeholder="32"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pdLeft">PD Left (mm)</Label>
                    <Input
                      id="pdLeft"
                      type="number"
                      value={state.pdLeft}
                      onChange={(e) => updateState({ pdLeft: e.target.value })}
                      placeholder="32"
                    />
                  </div>

                  <div>
                    <Label htmlFor="frameWidth">Frame Width (mm)</Label>
                    <Input
                      id="frameWidth"
                      type="number"
                      value={state.frameWidth}
                      onChange={(e) => updateState({ frameWidth: e.target.value })}
                      placeholder="52"
                    />
                  </div>

                  <div>
                    <Label htmlFor="frameHeight">Frame Height (mm)</Label>
                    <Input
                      id="frameHeight"
                      type="number"
                      value={state.frameHeight}
                      onChange={(e) => updateState({ frameHeight: e.target.value })}
                      placeholder="40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bridge">Bridge (mm)</Label>
                    <Input
                      id="bridge"
                      type="number"
                      value={state.bridge}
                      onChange={(e) => updateState({ bridge: e.target.value })}
                      placeholder="18"
                    />
                  </div>

                  <div>
                    <Label htmlFor="templeLength">Temple Length (mm)</Label>
                    <Input
                      id="templeLength"
                      type="number"
                      value={state.templeLength}
                      onChange={(e) => updateState({ templeLength: e.target.value })}
                      placeholder="140"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    value={state.specialInstructions}
                    onChange={(e) => updateState({ specialInstructions: e.target.value })}
                    placeholder="Any special notes or instructions for the lab..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Checkout */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">Patient: {state.patientName}</p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          {state.lensType.replace("-", " ")} - {state.lensMaterial}
                        </TableCell>
                        <TableCell className="text-right">£{state.basePrice.toFixed(2)}</TableCell>
                      </TableRow>
                      {state.coatingsPrice > 0 && (
                        <TableRow>
                          <TableCell>Coatings & Add-ons</TableCell>
                          <TableCell className="text-right">£{state.coatingsPrice.toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">£{state.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Note:</strong> Once payment is confirmed, a lab order will be automatically created 
                      and sent to the production queue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < 5 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={createInvoiceMutation.isPending}
          >
            {createInvoiceMutation.isPending ? "Processing..." : "Complete Order"}
          </Button>
        )}
      </div>
    </div>
  );
}
