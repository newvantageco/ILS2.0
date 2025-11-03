import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, User, Check, Package, X, ArrowLeft, Mail } from "lucide-react";
import { useLocation } from "wouter";
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
import { useEmail } from "@/hooks/use-email";
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
  const { sendEmail, generateInvoiceHtml, sending: sendingEmail } = useEmail();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);

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
      const response = await fetch('/api/pos/products?inStock=true');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products);
      setFilteredProducts(data.products);
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

  // Filter products based on search and category
  useEffect(() => {
    let filtered = [...products];

    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (productSearchQuery.trim()) {
      const query = productSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.model?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, productSearchQuery]);

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery.trim()) return true; // Show all if search is empty
    
    const query = searchQuery.toLowerCase().trim();
    const name = customer.name?.toLowerCase() || '';
    const email = customer.email?.toLowerCase() || '';
    const customerNumber = customer.customerNumber?.toLowerCase() || '';
    const phone = customer.phone?.toLowerCase() || '';
    
    return name.includes(query) || 
           email.includes(query) || 
           customerNumber.includes(query) ||
           phone.includes(query);
  });

  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const response = await fetch(`/api/pos/products/barcode/${encodeURIComponent(barcode)}`);
      
      if (!response.ok) {
        const error = await response.json();
        toast({
          title: 'Product Not Found',
          description: error.error || 'No product found with this barcode',
          variant: 'destructive',
        });
        return;
      }

      const product = await response.json();
      handleProductSelect(product);
      setBarcodeInput("");
      
      toast({
        title: 'Product Found',
        description: `${product.brand} ${product.model || product.name} added`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to lookup barcode',
        variant: 'destructive',
      });
    }
  };

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

  const handleSendInvoiceEmail = async () => {
    if (!lastTransaction || !lastTransaction.customer.email) {
      toast({
        title: "Cannot Send Email",
        description: "No transaction or customer email available.",
        variant: "destructive",
      });
      return;
    }

    try {
      const htmlContent = generateInvoiceHtml(
        lastTransaction.transaction,
        lastTransaction.customer,
        lastTransaction.items
      );

      await sendEmail({
        to: lastTransaction.customer.email,
        toName: lastTransaction.customer.name,
        subject: `Invoice #${lastTransaction.transaction.transactionNumber || lastTransaction.transaction.id}`,
        htmlContent,
        textContent: `Invoice for transaction ${lastTransaction.transaction.transactionNumber}. Total: $${lastTransaction.items.reduce((sum: number, item: any) => sum + (parseFloat(item.unitPrice) * item.quantity), 0).toFixed(2)}`,
        emailType: "invoice",
        patientId: lastTransaction.customer.id,
        relatedEntityType: "pos_transaction",
        relatedEntityId: lastTransaction.transaction.id,
        metadata: {
          transactionNumber: lastTransaction.transaction.transactionNumber,
          total: lastTransaction.items.reduce((sum: number, item: any) => sum + (parseFloat(item.unitPrice) * item.quantity), 0),
        },
      });

      setShowEmailSuccess(true);
      setTimeout(() => setShowEmailSuccess(false), 3000);
    } catch (error) {
      // Error already handled by useEmail hook
    }
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

      // Store transaction for email sending
      setLastTransaction({
        transaction: result.transaction,
        customer: selectedCustomer,
        items: [
          {
            productName: selectedProduct.name,
            quantity: 1,
            unitPrice: selectedProduct.unitPrice,
          },
        ],
      });

      toast({
        title: "Sale Complete",
        description: `Transaction ${result.transaction.transactionNumber} completed. Total: $${calculateTotal()}`,
        action: selectedCustomer.email ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendInvoiceEmail()}
            disabled={sendingEmail}
          >
            <Mail className="h-4 w-4 mr-2" />
            {sendingEmail ? 'Sending...' : 'Email Invoice'}
          </Button>
        ) : undefined,
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

  const posContent = (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6 z-[9999]">
      {/* Floating Modal Container with Drop Shadow */}
      <div className="w-full max-w-[1400px] h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">Point of Sale</h1>
          <button
            onClick={() => setLocation('/ecp/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md border border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
        </div>

        {/* Main Content - Three Columns */}
        <div className="flex gap-6 flex-1 overflow-hidden p-6">
        {/* Left Column - Navigation Pane */}
        <div className="w-80 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50 rounded-2xl p-4 flex flex-col shadow-lg overflow-hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-300 rounded-lg text-sm shadow-sm"
            />
          </div>
        </div>

        <Separator className="bg-gray-300/50 mb-4" />

        {/* Customer List */}
        <ScrollArea className="flex-1 -mr-2 pr-2">
          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'No customers found' : 'No customers available'}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    selectedCustomer?.id === customer.id
                      ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                      : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-sm">{customer.name}</div>
                      <div className="text-xs opacity-80 truncate">{customer.email}</div>
                      <div className="text-xs opacity-70 mt-0.5">{customer.customerNumber}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Product Selection */}
        <Separator className="bg-gray-300/50 my-6" />
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-900">Products</Label>
          
          {/* Barcode Scanner */}
          <div className="flex gap-2">
            <Input
              placeholder="Scan or enter barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeSearch(barcodeInput);
                }
              }}
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              onClick={() => handleBarcodeSearch(barcodeInput)}
              disabled={!barcodeInput.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Product Search */}
          <Input
            placeholder="Search products..."
            value={productSearchQuery}
            onChange={(e) => setProductSearchQuery(e.target.value)}
            className="text-sm"
          />

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="Frames">Frames</SelectItem>
              <SelectItem value="Lenses">Lenses</SelectItem>
              <SelectItem value="Contact Lenses">Contact Lenses</SelectItem>
              <SelectItem value="Solutions">Solutions</SelectItem>
              <SelectItem value="Accessories">Accessories</SelectItem>
              <SelectItem value="Cases">Cases</SelectItem>
              <SelectItem value="Cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>

          <ScrollArea className="h-56">
            <div className="space-y-3 -mr-2 pr-2">
              {loading ? (
                <div className="text-center py-6 text-gray-500 text-sm">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  {productSearchQuery || selectedCategory !== "all" ? 'No products found' : 'No products available'}
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-200 ${
                      selectedProduct?.id === product.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-900"
                    }`}
                  >
                    <div className="font-medium truncate">{product.brand} {product.model || product.name}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs opacity-80">${product.unitPrice}</span>
                      {product.category && (
                        <span className="text-xs opacity-60">{product.category}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Center Column - Main Content/Display Area */}
      <div className="flex-1 overflow-y-auto">
        <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl h-full rounded-2xl overflow-hidden">
          <div className="p-8 h-full overflow-y-auto">
          {selectedProduct ? (
            <>
              {/* Frame Image */}
              <div className="mb-8">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name || 'Frame'}
                    className="w-full h-80 object-contain bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner"
                  />
                ) : (
                  <div className="w-full h-80 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner">
                    <Package className="h-32 w-32 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-3xl font-bold mb-3 text-gray-900">
                {selectedProduct.brand && `${selectedProduct.brand} `}
                {selectedProduct.model || selectedProduct.name}
              </h2>
              <div className="text-xl text-gray-600 mb-6 font-medium">
                Frame Price: ${selectedProduct.unitPrice}
              </div>

              {/* Colors */}
              {selectedProduct.colorOptions && selectedProduct.colorOptions.length > 0 && (
                <div className="mb-8">
                  <Label className="text-lg font-semibold mb-4 block text-gray-900">Colors</Label>
                  <div className="flex gap-3">
                    {selectedProduct.colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-14 h-14 rounded-full border-3 transition-all duration-200 ${
                          selectedColor === color
                            ? "border-blue-600 ring-4 ring-blue-200 scale-110"
                            : "border-gray-300 hover:border-gray-400 hover:scale-105"
                        }`}
                        style={{ backgroundColor: getColorHex(color) }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-8 bg-gray-200" />

              {/* Prescription Entry */}
              <div className="mb-8">
                <Label className="text-lg font-semibold mb-4 block text-gray-900">Prescription Details</Label>
                
                {/* Right Eye (OD) */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Right Eye (OD)</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">SPH</Label>
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
                        className="text-sm mt-1.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">CYL</Label>
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
                        className="text-sm mt-1.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">AXIS</Label>
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
                        className="text-sm mt-1.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">ADD</Label>
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
                        className="text-sm mt-1.5 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Left Eye (OS) */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Left Eye (OS)</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">SPH</Label>
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
                        className="text-sm mt-1.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">CYL</Label>
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
                        className="text-sm mt-1.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">AXIS</Label>
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
                        className="text-sm mt-1.5 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">ADD</Label>
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
                        className="text-sm mt-1.5 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* PD */}
                <div className="w-40">
                  <Label className="text-xs font-medium text-gray-600">PD (mm)</Label>
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
                    className="text-sm mt-1.5 rounded-lg"
                  />
                </div>
              </div>

              <Separator className="my-8 bg-gray-200" />

              {/* Lens Type */}
              <div className="mb-8">
                <Label className="text-lg font-semibold mb-4 block text-gray-900">Lens Type</Label>
                <Select value={lensType} onValueChange={setLensType}>
                  <SelectTrigger className="h-12 rounded-xl">
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
              <div className="mb-8">
                <Label className="text-lg font-semibold mb-4 block text-gray-900">Lens Material</Label>
                <Select value={lensMaterial} onValueChange={setLensMaterial}>
                  <SelectTrigger className="h-12 rounded-xl">
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
              <div className="mb-8">
                <Label className="text-lg font-semibold mb-4 block text-gray-900">Add-on Coatings</Label>
                <div className="space-y-4">
                  {LENS_COATINGS.map((coating) => (
                    <div key={coating.value} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id={coating.value}
                        checked={selectedCoatings.includes(coating.value)}
                        onCheckedChange={() => handleCoatingToggle(coating.value)}
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor={coating.value}
                        className="text-base flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-700">{coating.label}</span>
                        <Badge variant="secondary" className="text-sm">+${coating.price}</Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Price */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-inner border border-blue-100">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-700">Total:</span>
                  <span className="text-3xl font-bold text-blue-600">${calculateTotal()}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 h-full">
              <Package className="h-40 w-40 mb-6 text-gray-300" />
              <h3 className="text-2xl font-semibold mb-3 text-gray-700">Select a Frame</h3>
              <p className="text-base text-gray-500">Choose a frame from the left panel to begin dispensing</p>
            </div>
          )}
          </div>
        </Card>
      </div>

      {/* Right Column - Action Panel */}
      <div className="w-72 flex flex-col gap-5 overflow-y-auto">
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-auto py-7 text-lg font-semibold rounded-2xl shadow-xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] flex-shrink-0"
          onClick={handleAddToAccount}
          disabled={!selectedCustomer || !selectedProduct}
        >
          <Check className="mr-2 h-6 w-6" />
          Add to Basket
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-full h-auto py-7 text-lg font-semibold bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] flex-shrink-0"
          onClick={handleCancel}
          disabled={!selectedProduct}
        >
          Cancel
        </Button>

        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-auto py-7 text-lg font-semibold rounded-2xl shadow-xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] flex-shrink-0"
          onClick={handleProceedToPayment}
          disabled={!selectedCustomer || !selectedProduct || processing}
        >
          {processing ? 'Processing...' : 'Payment'}
        </Button>

        {/* Customer Info Card */}
        {selectedCustomer && (
          <Card className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg rounded-2xl">
            <h3 className="font-semibold mb-3 text-gray-900 text-base">Selected Customer</h3>
            <div className="text-sm space-y-2">
              <p className="font-semibold text-gray-900 text-base">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
              <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              <Badge variant="secondary" className="mt-3 text-xs">
                {selectedCustomer.customerNumber}
              </Badge>
            </div>
          </Card>
        )}
      </div>
      </div>
      {/* Close Main Content wrapper */}
      </div>
    </div>
  );

  return createPortal(posContent, document.body);
}
