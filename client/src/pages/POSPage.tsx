import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ShoppingCart, 
  Scan, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Receipt, 
  Search,
  Package,
  DollarSign
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  unitPrice: string;
  stockQuantity: number;
  barcode?: string;
  imageUrl?: string;
  taxRate?: string;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
  lineTotal: number;
}

export default function POSTill() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const categories = ['all', 'frames', 'lenses', 'accessories', 'solutions', 'cases', 'cleaning'];

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      params.append('inStock', 'true');

      const response = await fetch(`/api/pos/products?${params}`);
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

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const response = await fetch(`/api/pos/products/barcode/${barcode}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Product not found');
      }
      
      const product = await response.json();
      addToCart(product);
      setBarcodeInput('');
      
      toast({
        title: 'Product Added',
        description: `${product.name} added to cart`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal: (item.quantity + 1) * parseFloat(item.unitPrice) - item.discount,
              }
            : item
        );
      }
      
      return [
        ...prevCart,
        {
          ...product,
          quantity: 1,
          discount: 0,
          lineTotal: parseFloat(product.unitPrice),
        },
      ];
    });
  };

  // Update cart item quantity
  const updateQuantity = (productId: string, change: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(0, item.quantity + change);
          if (newQuantity === 0) return null;
          
          return {
            ...item,
            quantity: newQuantity,
            lineTotal: newQuantity * parseFloat(item.unitPrice) - item.discount,
          };
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = cart.reduce((sum, item) => {
    const taxRate = parseFloat(item.taxRate || '0');
    return sum + (item.lineTotal * taxRate / 100);
  }, 0);
  const total = subtotal + tax;
  const change = paymentMethod === 'cash' && cashReceived ? parseFloat(cashReceived) - total : 0;

  // Process transaction
  const processTransaction = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Error',
        description: 'Cart is empty',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total)) {
      toast({
        title: 'Error',
        description: 'Insufficient cash amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const transactionData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discount.toFixed(2),
        })),
        paymentMethod,
        cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
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

      // Print receipt (optional)
      // printReceipt(result.transaction);

      // Clear cart
      setCart([]);
      setCashReceived('');
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <p className="text-muted-foreground">Over-the-counter sales till</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection - Left Side (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barcode Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Barcode Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Scan or enter barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && barcodeInput) {
                      handleBarcodeScan(barcodeInput);
                    }
                  }}
                  autoFocus
                />
                <Button
                  onClick={() => barcodeInput && handleBarcodeScan(barcodeInput)}
                  disabled={!barcodeInput}
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Search & Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Grid */}
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {products.map(product => (
                      <AnimatedCard
                        key={product.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-3 space-y-2">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-24 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                            {product.brand && (
                              <p className="text-xs text-muted-foreground">{product.brand}</p>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-primary">
                              ${parseFloat(product.unitPrice).toFixed(2)}
                            </span>
                            <Badge variant={product.stockQuantity > 10 ? 'default' : 'destructive'}>
                              {product.stockQuantity} in stock
                            </Badge>
                          </div>
                        </CardContent>
                      </AnimatedCard>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout - Right Side (1/3 width) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] mb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${parseFloat(item.unitPrice).toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.quantity >= item.stockQuantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Card
                      </div>
                    </SelectItem>
                    <SelectItem value="debit">Debit Card</SelectItem>
                    <SelectItem value="mobile_pay">Mobile Pay</SelectItem>
                  </SelectContent>
                </Select>

                {paymentMethod === 'cash' && (
                  <div className="space-y-2">
                    <Label>Cash Received</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                    {change > 0 && (
                      <div className="flex justify-between text-sm font-medium text-green-600">
                        <span>Change:</span>
                        <span>${change.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                className="w-full mt-4"
                size="lg"
                onClick={processTransaction}
                disabled={cart.length === 0 || processing}
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="h-5 w-5 mr-2" />
                    Complete Sale
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
