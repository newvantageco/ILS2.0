import { useState, useEffect } from "react";
import { Search, User, Check, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  CustomerProfile,
  PrescriptionData,
  LENS_TYPES,
  LENS_MATERIALS,
  LENS_COATINGS,
} from "@/types/optical-pos";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
}

interface Product {
  id: string;
  name: string | null;
  brand?: string | null;
  model?: string | null;
  imageUrl?: string | null;
  colorOptions?: string[] | null;
  unitPrice: string;
  stockQuantity: number;
  category?: string | null;
  sku?: string | null;
}

export default function OpticalPOSPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Prescription state
  const [prescription, setPrescription] = useState<PrescriptionData>({
    od: { sph: "", cyl: "", axis: "", add: "" },
    os: { sph: "", cyl: "", axis: "", add: "" },
    pd: undefined,
  });

  // Lens options state
  const [lensType, setLensType] = useState<string>("single-vision");
  const [lensMaterial, setLensMaterial] = useState<string>("polycarbonate");
  const [selectedCoatings, setSelectedCoatings] = useState<string[]>([]);

  // Fetch patients (customers) on mount
  useEffect(() => {
    fetchPatients();
    fetchProducts();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      
      const data = await response.json();
      const formattedCustomers: CustomerProfile[] = data.map((patient: Patient) => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        customerNumber: `PAT-${patient.id.slice(0, 8).toUpperCase()}`,
        dateOfBirth: patient.dateOfBirth,
      }));
      setCustomers(formattedCustomers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load patients',
        variant: 'destructive',
      });
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pos/products?inStock=true&category=Frames');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customerNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    // Set default color if available
    if (product.colorOptions && product.colorOptions.length > 0) {
      setSelectedColor(product.colorOptions[0]);
    } else {
      setSelectedColor('');
    }
  };

  const handleCoatingToggle = (coatingValue: string) => {
    setSelectedCoatings((prev) =>
      prev.includes(coatingValue)
        ? prev.filter((c) => c !== coatingValue)
        : [...prev, coatingValue]
    );
  };

  const calculateTotal = () => {
    if (!selectedProduct) return "0.00";
    
    let total = parseFloat(selectedProduct.unitPrice);
    
    // Add lens material cost
    const material = LENS_MATERIALS.find(m => m.value === lensMaterial);
    if (material) total += material.price;
    
    // Add coating costs
    selectedCoatings.forEach(coating => {
      const coatingOption = LENS_COATINGS.find(c => c.value === coating);
      if (coatingOption) total += coatingOption.price;
    });
    
    return total.toFixed(2);
  };

  const handleAddToAccount = async () => {
    if (!selectedCustomer) {
      toast({
        title: "No Customer Selected",
        description: "Please select a customer before adding to account.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProduct) {
      toast({
        title: "No Product Selected",
        description: "Please select a frame before adding to account.",
        variant: "destructive",
      });
      return;
    }

    // Here you would save the order configuration to the customer's account
    // This would typically involve creating a draft order or saved configuration

    toast({
      title: "Added to Account",
      description: `Order configuration saved to ${selectedCustomer.name}'s account.`,
    });
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    setSelectedColor("");
    setPrescription({
      od: { sph: "", cyl: "", axis: "", add: "" },
      os: { sph: "", cyl: "", axis: "", add: "" },
      pd: undefined,
    });
    setLensType("single-vision");
    setLensMaterial("polycarbonate");
    setSelectedCoatings([]);
    
    toast({
      title: "Cancelled",
      description: "Dispensing process cancelled.",
    });
  };

  const handleProceedToPayment = async () => {
    if (!selectedCustomer) {
      toast({
        title: "No Customer Selected",
        description: "Please select a customer before proceeding to payment.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProduct) {
      toast({
        title: "No Product Selected",
        description: "Please select a frame before proceeding to payment.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);

      // Calculate lens material cost
      const material = LENS_MATERIALS.find(m => m.value === lensMaterial);
      const materialCost = material ? material.price : 0;

      // Calculate coating costs
      let coatingsCost = 0;
      selectedCoatings.forEach(coating => {
        const coatingOption = LENS_COATINGS.find(c => c.value === coating);
        if (coatingOption) coatingsCost += coatingOption.price;
      });

      const transactionData = {
        patientId: selectedCustomer.id,
        items: [
          {
            productId: selectedProduct.id,
            quantity: 1,
            unitPrice: selectedProduct.unitPrice,
            discountAmount: '0',
          },
          // Add lens costs as additional line items if needed
          // This is a simplified version - you might want to create separate products for lenses
        ],
        paymentMethod: 'card',
        discountAmount: '0',
        notes: `Prescription: OD SPH:${prescription.od.sph} CYL:${prescription.od.cyl} AXIS:${prescription.od.axis} | OS SPH:${prescription.os.sph} CYL:${prescription.os.cyl} AXIS:${prescription.os.axis} | Lens Type: ${lensType} | Material: ${lensMaterial} | Coatings: ${selectedCoatings.join(', ')}`,
      };

      const response = await fetch('/api/pos/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transaction failed');
      }

      const result = await response.json();

      toast({
        title: "Sale Complete",
        description: `Transaction ${result.transaction.transactionNumber} completed. Total: $${calculateTotal()}`,
      });

      // Clear selection
      handleCancel();
      setSelectedCustomer(null);
    } catch (error: any) {
      toast({
        title: 'Transaction Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getColorHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'Black': '#000000',
      'Tortoise': '#8B4513',
      'Blue': '#4A90E2',
      'Green': '#50C878',
      'Yellow': '#FFD700',
      'Red': '#ef4444',
      'Gray': '#6b7280',
      'White': '#f3f4f6',
      'Brown': '#8B4513',
      'Purple': '#a855f7',
      'Pink': '#ec4899',
      'Orange': '#f97316',
    };
    return colorMap[colorName] || '#6b7280';
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 bg-white p-4 rounded-lg">
      {/* Left Column - Customer & Order Management */}
      <div className="w-80 bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search customers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300"
            />
          </div>
        </div>

        <Separator className="bg-gray-200 mb-4" />

        {/* Customer List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No customers found' : 'No customers available'}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCustomer?.id === customer.id
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{customer.name}</div>
                      <div className="text-xs opacity-80 truncate">{customer.email}</div>
                      <div className="text-xs opacity-70">{customer.customerNumber}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Product Selection */}
        <Separator className="bg-gray-200 my-4" />
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Select Frame</Label>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No frames available</div>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedProduct?.id === product.id
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium truncate">{product.brand} {product.model || product.name}</div>
                    <div className="text-xs opacity-80">${product.unitPrice}</div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Center Column - Product & Dispensing Details */}
      <div className="flex-1 overflow-y-auto">
        <Card className="bg-white p-6">
          {selectedProduct ? (
            <>
              {/* Frame Image */}
              <div className="mb-6">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name || 'Frame'}
                    className="w-full h-64 object-contain bg-gray-100 rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-2xl font-bold mb-2">
                {selectedProduct.brand && `${selectedProduct.brand} `}
                {selectedProduct.model || selectedProduct.name}
              </h2>
              <div className="text-lg text-gray-600 mb-4">
                Frame Price: ${selectedProduct.unitPrice}
              </div>

              {/* Colors */}
              {selectedProduct.colorOptions && selectedProduct.colorOptions.length > 0 && (
                <div className="mb-6">
                  <Label className="text-base font-semibold mb-3 block">Colors</Label>
                  <div className="flex gap-2">
                    {selectedProduct.colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          selectedColor === color
                            ? "border-blue-600 ring-2 ring-blue-300"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: getColorHex(color) }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-6" />

              {/* Prescription Entry */}
              <div className="mb-6">
                <Label className="text-base font-semibold mb-3 block">Prescription Details</Label>
                
                {/* Right Eye (OD) */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Right Eye (OD)</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">SPH</Label>
                      <Input
                        type="text"
                        placeholder="±0.00"
                        value={prescription.od.sph}
                        onChange={(e) =>
                          setPrescription({
                            ...prescription,
                            od: { ...prescription.od, sph: e.target.value },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CYL</Label>
                      <Input
                        type="text"
                        placeholder="±0.00"
                        value={prescription.od.cyl}
                        onChange={(e) =>
                          setPrescription({
                            ...prescription,
                            od: { ...prescription.od, cyl: e.target.value },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">AXIS</Label>
                      <Input
                        type="text"
                        placeholder="1-180"
                        value={prescription.od.axis}
                        onChange={(e) =>
                          setPrescription({
                            ...prescription,
                            od: { ...prescription.od, axis: e.target.value },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ADD</Label>
                      <Input
                        type="text"
                        placeholder="+0.00"
                        value={prescription.od.add}
                        onChange={(e) =>
                          setPrescription({
                            ...prescription,
                            od: { ...prescription.od, add: e.target.value },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Left Eye (OS) */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Left Eye (OS)</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">SPH</Label>
                      <Input
                        type="text"
                        placeholder="±0.00"
                        value={prescription.os.sph}
                        onChange={(e) =>
                          setPrescription({
                            ...prescription,
                            os: { ...prescription.os, sph: e.target.value },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CYL</Label>
                      <Input
                        type="text"
                        placeholder="±0.00"
                        value={prescription.os.cyl}
                        onChange={(e) =>
                          setPrescription({
                            ...prescription,
                            os: { ...prescription.os, cyl: e.target.value },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">AXIS</Label>
                      <Input
                        type="text"
                        placeholder="1-180"
                        value={prescription.os.axis}
                        onChange={(e) =>
                          setPrescription({
                            ...prescription,
                            os: { ...prescription.os, axis: e.target.value },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ADD</Label>
                      <Input
                        type="text"
                        placeholder="+0.00"
                        value={prescription.os.add}
                        onChange={(e) =>
                          setPrescription({
                            ...prescription,
                            os: { ...prescription.os, add: e.target.value },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* PD */}
                <div className="w-32">
                  <Label className="text-xs">PD (mm)</Label>
                  <Input
                    type="number"
                    placeholder="62"
                    value={prescription.pd || ""}
                    onChange={(e) =>
                      setPrescription({
                        ...prescription,
                        pd: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              <Separator className="my-6" />

              {/* Lens Type */}
              <div className="mb-6">
                <Label className="text-base font-semibold mb-3 block">Lens Type</Label>
                <Select value={lensType} onValueChange={setLensType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lens Material */}
              <div className="mb-6">
                <Label className="text-base font-semibold mb-3 block">Lens Material</Label>
                <Select value={lensMaterial} onValueChange={setLensMaterial}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LENS_MATERIALS.map((material) => (
                      <SelectItem key={material.value} value={material.value}>
                        {material.label} {material.price > 0 && `(+$${material.price})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lens Coatings */}
              <div className="mb-6">
                <Label className="text-base font-semibold mb-3 block">Add-on Coatings</Label>
                <div className="space-y-3">
                  {LENS_COATINGS.map((coating) => (
                    <div key={coating.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={coating.value}
                        checked={selectedCoatings.includes(coating.value)}
                        onCheckedChange={() => handleCoatingToggle(coating.value)}
                      />
                      <label
                        htmlFor={coating.value}
                        className="text-sm flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <span>{coating.label}</span>
                        <Badge variant="secondary">+${coating.price}</Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Price */}
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-2xl text-blue-600">${calculateTotal()}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Package className="h-32 w-32 mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">Select a Frame</h3>
              <p>Choose a frame from the left panel to begin dispensing</p>
            </div>
          )}
        </Card>
      </div>

      {/* Right Column - Actions */}
      <div className="w-64 flex flex-col gap-4">
        <Button
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-auto py-6 text-base"
          onClick={handleAddToAccount}
          disabled={!selectedCustomer || !selectedProduct}
        >
          <Check className="mr-2 h-5 w-5" />
          Add to Customer Account
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-full h-auto py-6 text-base"
          onClick={handleCancel}
          disabled={!selectedProduct}
        >
          Cancel
        </Button>

        <Button
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white h-auto py-6 text-base"
          onClick={handleProceedToPayment}
          disabled={!selectedCustomer || !selectedProduct || processing}
        >
          {processing ? 'Processing...' : 'Proceed to Payment'}
        </Button>

        {/* Customer Info Card */}
        {selectedCustomer && (
          <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-2 text-gray-900">Selected Customer</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
              <p className="text-xs text-gray-600">{selectedCustomer.email}</p>
              <p className="text-xs text-gray-600">{selectedCustomer.phone}</p>
              <Badge variant="secondary" className="mt-2">
                {selectedCustomer.customerNumber}
              </Badge>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
