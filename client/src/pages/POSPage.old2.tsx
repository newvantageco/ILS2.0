import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  X,
  Receipt,
  ArrowRight,
  Package
} from 'lucide-react';

interface Product {
  id: string;
  name: string | null;
  brand?: string | null;
  category?: string | null;
  unitPrice: string;
  stockQuantity: number;
  barcode?: string | null;
  imageUrl?: string | null;
  taxRate?: string | null;
  colorOptions?: string[] | null;
  isPrescriptionRequired?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(lowercaseSearch) ||
          product.brand?.toLowerCase().includes(lowercaseSearch) ||
          product.barcode?.includes(searchTerm)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

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

  // Handle product selection from list
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    // Set default color if available
    if (product.colorOptions && product.colorOptions.length > 0) {
      setSelectedColor(product.colorOptions[0]);
    } else {
      setSelectedColor('');
    }
  };

  // Add product to cart
  const addToBasket = () => {
    if (!selectedProduct) return;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.id === selectedProduct.id && item.selectedColor === selectedColor
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === selectedProduct.id && item.selectedColor === selectedColor
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prevCart,
        {
          ...selectedProduct,
          quantity: 1,
          selectedColor: selectedColor || undefined,
        },
      ];
    });

    toast({
      title: 'Added to Basket',
      description: `${selectedProduct.name} added successfully`,
    });

    // Clear selection
    clearSelection();
  };

  // Clear product selection
  const clearSelection = () => {
    setSelectedProduct(null);
    setSelectedColor('');
  };

  // Update cart item quantity
  const updateQuantity = (productId: string, color: string | undefined, change: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId && item.selectedColor === color) {
            const newQuantity = Math.max(0, item.quantity + change);
            if (newQuantity === 0) return null;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string, color: string | undefined) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.id === productId && item.selectedColor === color))
    );
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
  const tax = cart.reduce((sum, item) => {
    const taxRate = parseFloat(item.taxRate || '0');
    return sum + (parseFloat(item.unitPrice) * item.quantity * taxRate) / 100;
  }, 0);
  const total = subtotal + tax;

  // Process payment
  const proceedToPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Error',
        description: 'Cart is empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const transactionData = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: '0',
        })),
        paymentMethod: 'card',
        discountAmount: '0',
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
        title: 'Sale Complete',
        description: `Transaction ${result.transaction.transactionNumber} completed successfully`,
      });

      // Clear cart
      setCart([]);
      clearSelection();
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

  return (
    <div className="min-h-screen" style={{ minHeight: '100vh', backgroundColor: '#3b4551' }}>
      {/* Main Container */}
      <div className="container mx-auto px-6 py-8" style={{ maxWidth: '1400px' }}>
        {/* Header - Hidden as per design */}
        <div className="mb-8 text-center" style={{ display: 'none' }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Point of Sale</h1>
          <p className="text-slate-400">Modern Retail Interface</p>
        </div>

        {/* Main Layout: 3-Column Grid */}
        <div className="grid grid-cols-12 gap-6 items-start" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '1.5rem' }}>
          {/* LEFT PANEL: Product Search & Selection */}
          <div className="col-span-3 space-y-4">
            <div className="rounded-3xl p-6 shadow-lg" style={{ backgroundColor: '#4a5568' }}>
              {/* Search Bar */}
              <div className="mb-4 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="6" stroke="#94a3b8" strokeWidth="2"/>
                    <path d="M13.5 13.5L17 17" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 border-0 text-white placeholder:text-slate-400"
                  style={{ backgroundColor: '#596879', borderRadius: '12px', padding: '12px 12px 12px 48px', color: '#ffffff', fontSize: '16px' }}
                />
              </div>

              {/* Product List */}
              <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="text-center py-8 text-slate-300">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-300">No products found</div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className="w-full text-left p-4 rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: selectedProduct?.id === product.id ? '#596879' : '#4a5568',
                          color: '#ffffff'
                        }}
                      >
                        <div className="font-medium text-base truncate" style={{ color: selectedProduct?.id === product.id ? '#ffffff' : '#e2e8f0' }}>
                          {product.name || 'Unnamed Product'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* CENTER: Floating Product Display Window */}
          <div className="col-span-6 flex items-center justify-center">
            {selectedProduct ? (
              <div className="rounded-3xl p-8 shadow-2xl w-full max-w-lg" style={{ backgroundColor: '#f5f5f0' }}>
                {/* Product Image */}
                <div className="relative mb-6">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name || 'Product'}
                      className="w-full h-80 object-contain rounded-2xl"
                      style={{ backgroundColor: '#ffffff' }}
                    />
                  ) : (
                    <div className="w-full h-80 flex items-center justify-center rounded-2xl" style={{ backgroundColor: '#ffffff' }}>
                      <Package className="h-24 w-24" style={{ color: '#cbd5e1' }} />
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <h3 className="text-3xl font-bold text-center mb-4" style={{ color: '#1e293b' }}>{selectedProduct.name || 'Product'}</h3>

                {/* Color Variants */}
                {selectedProduct.colorOptions && selectedProduct.colorOptions.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm mb-3 text-center" style={{ color: '#64748b' }}>Colors</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {selectedProduct.colorOptions.map((color) => {
                        const colorMap: Record<string, string> = {
                          'Black': '#2d3748',
                          'Red': '#ef4444',
                          'Blue': '#3b82f6',
                          'Green': '#22c55e',
                          'Yellow': '#eab308',
                          'Orange': '#f97316',
                          'Purple': '#a855f7',
                          'Pink': '#ec4899',
                          'Gray': '#6b7280',
                          'White': '#f3f4f6',
                        };
                        const bgColor = colorMap[color] || '#6b7280';
                        
                        return (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className="rounded-full transition-all duration-200"
                            style={{
                              width: '48px',
                              height: '48px',
                              backgroundColor: bgColor,
                              border: selectedColor === color ? '3px solid #1e293b' : '2px solid transparent',
                              boxShadow: selectedColor === color ? '0 0 0 2px #f5f5f0' : 'none'
                            }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl p-16 shadow-2xl text-center" style={{ backgroundColor: '#f5f5f0' }}>
                <Package className="h-32 w-32 mx-auto mb-6" style={{ color: '#cbd5e1' }} />
                <h3 className="text-2xl font-semibold mb-2" style={{ color: '#64748b' }}>
                  Select a Product
                </h3>
                <p style={{ color: '#94a3b8' }}>Choose from the list to see details</p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Action Buttons */}
          <div className="col-span-3 space-y-4">
            <div className="space-y-4">
              {/* Add to Basket Button */}
              <Button
                onClick={addToBasket}
                disabled={!selectedProduct}
                className="w-full py-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 border-0"
                style={{
                  backgroundColor: selectedProduct ? '#4a5568' : '#596879',
                  color: '#ffffff',
                  opacity: selectedProduct ? 1 : 0.5
                }}
              >
                Add to Basket
              </Button>

              {/* Cancel / Clear Selection Button */}
              <Button
                onClick={clearSelection}
                disabled={!selectedProduct}
                className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-200 border-0"
                style={{
                  backgroundColor: selectedProduct ? '#4a5568' : '#596879',
                  color: '#ffffff',
                  opacity: selectedProduct ? 1 : 0.5
                }}
              >
                Cancel
              </Button>

              {/* Proceed to Payment Button */}
              <Button
                onClick={proceedToPayment}
                disabled={cart.length === 0 || processing}
                className="w-full py-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 border-0"
                style={{
                  backgroundColor: cart.length > 0 && !processing ? '#4a5568' : '#596879',
                  color: '#ffffff',
                  opacity: cart.length > 0 && !processing ? 1 : 0.5
                }}
              >
                {processing ? 'Processing...' : 'Payment'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
