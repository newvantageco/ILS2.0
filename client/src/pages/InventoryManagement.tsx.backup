import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface Product {
  id: string;
  sku: string | null;
  brand: string | null;
  model: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  barcode: string | null;
  imageUrl: string | null;
  colorOptions: string[] | null;
  cost: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  unitPrice: string;
  taxRate: string;
  isActive: boolean;
  isPrescriptionRequired: boolean;
}

interface ProductFormData {
  sku: string;
  brand: string;
  model: string;
  name: string;
  description: string;
  category: string;
  barcode: string;
  imageUrl: string;
  colorOptions: string;
  cost: string;
  stockQuantity: number;
  lowStockThreshold: number;
  unitPrice: string;
  taxRate: string;
  isActive: boolean;
  isPrescriptionRequired: boolean;
}

const CATEGORIES = [
  "Frames",
  "Lenses",
  "Contact Lenses",
  "Solutions",
  "Accessories",
  "Cases",
  "Cleaning",
  "Other"
];

export default function InventoryManagement() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    sku: "",
    brand: "",
    model: "",
    name: "",
    description: "",
    category: "Frames",
    barcode: "",
    imageUrl: "",
    colorOptions: "",
    cost: "",
    stockQuantity: 0,
    lowStockThreshold: 10,
    unitPrice: "",
    taxRate: "0",
    isActive: true,
    isPrescriptionRequired: false,
  });

  // Stock adjustment state
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, categoryFilter, stockFilter, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pos/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.model?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === "low") {
      filtered = filtered.filter(p => p.stockQuantity <= p.lowStockThreshold);
    } else if (stockFilter === "out") {
      filtered = filtered.filter(p => p.stockQuantity === 0);
    } else if (stockFilter === "in") {
      filtered = filtered.filter(p => p.stockQuantity > 0);
    }

    setFilteredProducts(filtered);
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      brand: "",
      model: "",
      name: "",
      description: "",
      category: "Frames",
      barcode: "",
      imageUrl: "",
      colorOptions: "",
      cost: "",
      stockQuantity: 0,
      lowStockThreshold: 10,
      unitPrice: "",
      taxRate: "0",
      isActive: true,
      isPrescriptionRequired: false,
    });
  };

  const handleAddProduct = async () => {
    try {
      // Parse color options from comma-separated string
      const colors = formData.colorOptions
        ? formData.colorOptions.split(',').map(c => c.trim()).filter(c => c)
        : [];

      const response = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          colorOptions: colors,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add product');
      }

      toast({
        title: 'Success',
        description: 'Product added successfully',
      });

      setShowAddDialog(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    try {
      const colors = formData.colorOptions
        ? formData.colorOptions.split(',').map(c => c.trim()).filter(c => c)
        : [];

      const response = await fetch(`/api/inventory/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          colorOptions: colors,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });

      setShowEditDialog(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/inventory/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });

      fetchProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !adjustmentReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the adjustment',
        variant: 'destructive',
      });
      return;
    }

    try {
      const quantity = adjustmentType === "add" ? adjustmentQuantity : -adjustmentQuantity;
      
      const response = await fetch(`/api/inventory/products/${selectedProduct.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          reason: adjustmentReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to adjust stock');
      }

      toast({
        title: 'Success',
        description: 'Stock adjusted successfully',
      });

      setShowAdjustDialog(false);
      setSelectedProduct(null);
      setAdjustmentQuantity(0);
      setAdjustmentReason("");
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      sku: product.sku || "",
      brand: product.brand || "",
      model: product.model || "",
      name: product.name || "",
      description: product.description || "",
      category: product.category || "Frames",
      barcode: product.barcode || "",
      imageUrl: product.imageUrl || "",
      colorOptions: product.colorOptions?.join(', ') || "",
      cost: product.cost || "",
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      unitPrice: product.unitPrice,
      taxRate: product.taxRate,
      isActive: product.isActive,
      isPrescriptionRequired: product.isPrescriptionRequired,
    });
    setShowEditDialog(true);
  };

  const openAdjustDialog = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentType("add");
    setAdjustmentQuantity(0);
    setAdjustmentReason("");
    setShowAdjustDialog(true);
  };

  const getLowStockCount = () => {
    return products.filter(p => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(p => p.stockQuantity === 0).length;
  };

  const getTotalValue = () => {
    return products.reduce((sum, p) => sum + (parseFloat(p.unitPrice) * p.stockQuantity), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory and stock levels
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-yellow-600">{getLowStockCount()}</div>
              {getLowStockCount() > 0 && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-destructive">{getOutOfStockCount()}</div>
              {getOutOfStockCount() > 0 && <AlertTriangle className="h-5 w-5 text-destructive" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalValue().toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, brand, model, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading inventory...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or add a new product
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU/Barcode</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name || 'Product'}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {product.brand} {product.model || product.name}
                            </div>
                            {product.colorOptions && product.colorOptions.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {product.colorOptions.length} colors
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {product.sku && <div>SKU: {product.sku}</div>}
                          {product.barcode && <div className="text-muted-foreground">{product.barcode}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            product.stockQuantity === 0 ? 'text-destructive' :
                            product.stockQuantity <= product.lowStockThreshold ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {product.stockQuantity}
                          </span>
                          {product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0 && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Threshold: {product.lowStockThreshold}
                        </div>
                      </TableCell>
                      <TableCell>${product.unitPrice}</TableCell>
                      <TableCell>
                        {product.cost ? `$${product.cost}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAdjustDialog(product)}
                            title="Adjust Stock"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditProduct}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              Current Stock: <span className="font-bold text-foreground">{selectedProduct?.stockQuantity}</span>
            </div>
            
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Input
                placeholder="e.g., Received shipment, Damaged items, Inventory count correction"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm">
                New Stock: <span className="font-bold">
                  {adjustmentType === "add" 
                    ? (selectedProduct?.stockQuantity || 0) + adjustmentQuantity
                    : Math.max(0, (selectedProduct?.stockQuantity || 0) - adjustmentQuantity)
                  }
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>Cancel</Button>
            <Button onClick={handleStockAdjustment}>Adjust Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product Form Component
function ProductForm({ 
  formData, 
  setFormData 
}: { 
  formData: ProductFormData; 
  setFormData: (data: ProductFormData) => void;
}) {
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Aviator Sunglasses"
          />
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Brand</Label>
          <Input
            value={formData.brand}
            onChange={(e) => updateField('brand', e.target.value)}
            placeholder="e.g., Ray-Ban"
          />
        </div>
        <div className="space-y-2">
          <Label>Model</Label>
          <Input
            value={formData.model}
            onChange={(e) => updateField('model', e.target.value)}
            placeholder="e.g., RB3025"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Product description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>SKU</Label>
        <Input
          value={formData.sku}
          onChange={(e) => updateField('sku', e.target.value)}
          placeholder="e.g., FRM-001"
        />
      </div>
      <div className="space-y-2">
        <Label>Barcode</Label>
        <Input
          value={formData.barcode}
          onChange={(e) => updateField('barcode', e.target.value)}
          placeholder="e.g., 123456789"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label>Product Image</Label>
      <ImageUpload
        currentImageUrl={formData.imageUrl}
        onImageUploaded={(url) => updateField('imageUrl', url)}
        uploadType="product"
      />
      <p className="text-xs text-muted-foreground">
        Or enter an image URL manually:
      </p>
      <Input
        value={formData.imageUrl}
        onChange={(e) => updateField('imageUrl', e.target.value)}
        placeholder="https://example.com/image.jpg"
      />
    </div>      <div className="space-y-2">
        <Label>Color Options (comma-separated)</Label>
        <Input
          value={formData.colorOptions}
          onChange={(e) => updateField('colorOptions', e.target.value)}
          placeholder="e.g., Black, Tortoise, Blue"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Cost Price</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => updateField('cost', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Unit Price *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => updateField('unitPrice', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Tax Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.taxRate}
            onChange={(e) => updateField('taxRate', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Initial Stock</Label>
          <Input
            type="number"
            value={formData.stockQuantity}
            onChange={(e) => updateField('stockQuantity', parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Low Stock Threshold</Label>
          <Input
            type="number"
            value={formData.lowStockThreshold}
            onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value) || 10)}
            placeholder="10"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => updateField('isActive', e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPrescriptionRequired"
            checked={formData.isPrescriptionRequired}
            onChange={(e) => updateField('isPrescriptionRequired', e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="isPrescriptionRequired">Requires Prescription</Label>
        </div>
      </div>
    </div>
  );
}
