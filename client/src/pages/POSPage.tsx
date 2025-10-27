import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  ShoppingCart, 
  Plus,
  Trash2,
  CreditCard,
  Package,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  category: string;
  unitPrice: string;
  stockQuantity: number;
}

interface Patient {
  id: string;
  name: string;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
}

export default function POSPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/invoices", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setCart([]);
      setSelectedPatientId("");
      toast({
        title: "Sale Completed",
        description: "Invoice has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.unitPrice,
        },
      ]);
    }

    toast({
      title: "Added to cart",
      description: `${product.name} added to cart.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce(
      (total, item) => total + parseFloat(item.unitPrice) * item.quantity,
      0
    );
  };

  const handleCheckout = () => {
    if (!selectedPatientId) {
      toast({
        title: "Patient Required",
        description: "Please select a patient before checkout.",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    const lineItems = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
    }));

    createInvoiceMutation.mutate({
      patientId: selectedPatientId,
      totalAmount: calculateTotal().toFixed(2),
      lineItems,
    });
  };

  const total = calculateTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground mt-1">
            Process sales and create invoices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
            <CardDescription>Select products to add to cart</CardDescription>
          </CardHeader>
          <CardContent>
            {!products || products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products available</h3>
                <p className="text-muted-foreground">
                  Add products to inventory first
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {products.map((product) => (
                  <Card key={product.id} className="hover-elevate" data-testid={`card-product-${product.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Stock: {product.stockQuantity}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              £{parseFloat(product.unitPrice).toFixed(2)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(product)}
                            disabled={product.stockQuantity === 0}
                            data-testid={`button-add-to-cart-${product.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger data-testid="select-patient">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 border rounded-md">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cart is empty</h3>
                <p className="text-muted-foreground text-sm">
                  Add products from the left panel
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.productId} data-testid={`cart-item-${item.productId}`}>
                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.productId,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16"
                              data-testid={`input-quantity-${item.productId}`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            £{parseFloat(item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            £{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.productId)}
                              data-testid={`button-remove-${item.productId}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="font-bold text-right">
                          Total:
                        </TableCell>
                        <TableCell className="font-bold text-right text-lg" data-testid="text-cart-total">
                          £{total.toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={createInvoiceMutation.isPending || !selectedPatientId}
                  data-testid="button-checkout"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {createInvoiceMutation.isPending ? "Processing..." : "Complete Sale"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
