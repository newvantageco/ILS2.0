import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Package,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Link2,
  TrendingUp,
  DollarSign,
  Zap,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ShopifyConfig {
  shop_url?: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  connected: boolean;
  last_sync?: string;
}

interface ShopifySyncStatus {
  products_synced: number;
  orders_synced: number;
  last_sync: string;
  sync_status: 'success' | 'error' | 'syncing';
  errors?: string[];
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  variants: number;
  inventory_quantity: number;
  price: string;
  synced_at: string;
  sync_status: 'synced' | 'pending' | 'error';
}

interface ShopifyOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_price: string;
  created_at: string;
  sync_status: 'synced' | 'pending' | 'error';
}

export default function ShopifyIntegrationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [config, setConfig] = useState<Partial<ShopifyConfig>>({});

  // Fetch Shopify configuration
  const { data: shopifyConfig } = useQuery<ShopifyConfig>({
    queryKey: ['/api/shopify/config'],
  });

  // Fetch sync status
  const { data: syncStatus } = useQuery<ShopifySyncStatus>({
    queryKey: ['/api/shopify/sync-status'],
    refetchInterval: shopifyConfig?.connected ? 30000 : false,
  });

  // Fetch synced products
  const { data: products } = useQuery<ShopifyProduct[]>({
    queryKey: ['/api/shopify/products'],
    enabled: shopifyConfig?.connected,
  });

  // Fetch synced orders
  const { data: orders } = useQuery<ShopifyOrder[]>({
    queryKey: ['/api/shopify/orders'],
    enabled: shopifyConfig?.connected,
  });

  // Configure Shopify mutation
  const configureShopify = useMutation({
    mutationFn: async (configData: Partial<ShopifyConfig>) => {
      const response = await fetch('/api/shopify/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(configData),
      });
      if (!response.ok) throw new Error('Failed to configure Shopify');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopify/config'] });
      setIsConfigDialogOpen(false);
      toast({
        title: "Configuration Saved",
        description: "Shopify integration configured successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Configuration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync now mutation
  const syncNow = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/shopify/sync', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to start sync');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopify/sync-status'] });
      toast({
        title: "Sync Started",
        description: "Shopify data synchronization initiated",
      });
    },
  });

  // Disconnect Shopify mutation
  const disconnectShopify = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/shopify/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to disconnect');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopify/config'] });
      toast({
        title: "Disconnected",
        description: "Shopify integration disconnected",
      });
    },
  });

  const handleSaveConfig = () => {
    configureShopify.mutate(config);
  };

  // Sample chart data
  const syncHistoryData = [
    { date: '2025-11-01', products: 45, orders: 12 },
    { date: '2025-11-02', products: 47, orders: 15 },
    { date: '2025-11-03', products: 50, orders: 18 },
    { date: '2025-11-04', products: 52, orders: 14 },
    { date: '2025-11-05', products: 54, orders: 16 },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Shopify Integration
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect and sync your Shopify store with the optical platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={shopifyConfig?.connected ? 'default' : 'secondary'}
            className="gap-1"
          >
            {shopifyConfig?.connected ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Not Connected
              </>
            )}
          </Badge>
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Shopify Configuration</DialogTitle>
                <DialogDescription>
                  Enter your Shopify store credentials to connect
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-url">Shop URL</Label>
                  <Input
                    id="shop-url"
                    placeholder="mystore.myshopify.com"
                    value={config.shop_url || ''}
                    onChange={(e) => setConfig({ ...config, shop_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={config.api_key || ''}
                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-secret">API Secret</Label>
                  <Input
                    id="api-secret"
                    type="password"
                    value={config.api_secret || ''}
                    onChange={(e) => setConfig({ ...config, api_secret: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input
                    id="access-token"
                    type="password"
                    value={config.access_token || ''}
                    onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig} disabled={configureShopify.isPending}>
                  Save Configuration
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {shopifyConfig?.connected && (
            <>
              <Button
                size="sm"
                onClick={() => syncNow.mutate()}
                disabled={syncNow.isPending || syncStatus?.sync_status === 'syncing'}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncNow.isPending ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => disconnectShopify.mutate()}
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {!shopifyConfig?.connected && (
        <Alert>
          <Link2 className="h-4 w-4" />
          <AlertDescription>
            Connect your Shopify store to sync products, orders, and inventory automatically.
            Click "Configure" to get started.
          </AlertDescription>
        </Alert>
      )}

      {syncStatus?.errors && syncStatus.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sync errors detected: {syncStatus.errors.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Synced</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStatus?.products_synced || 0}</div>
            <p className="text-xs text-muted-foreground">
              From Shopify store
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Synced</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStatus?.orders_synced || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total orders imported
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus?.last_sync 
                ? new Date(syncStatus.last_sync).toLocaleTimeString()
                : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.sync_status === 'syncing' ? 'Syncing now...' : 'Last successful sync'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus?.sync_status === 'success' ? '✓' : 
               syncStatus?.sync_status === 'error' ? '✗' : '⟳'}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.sync_status || 'Not started'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synced Products</CardTitle>
              <CardDescription>
                Products imported from your Shopify store
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products && products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Title</TableHead>
                      <TableHead>SKU/Handle</TableHead>
                      <TableHead>Variants</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sync Status</TableHead>
                      <TableHead>Last Synced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>{product.handle}</TableCell>
                        <TableCell>{product.variants}</TableCell>
                        <TableCell>{product.inventory_quantity}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.sync_status === 'synced'
                                ? 'default'
                                : product.sync_status === 'error'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {product.sync_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(product.synced_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    No products synced yet. Connect your Shopify store and run a sync to import products.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synced Orders</CardTitle>
              <CardDescription>
                Orders imported from your Shopify store
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>${order.total_price}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.sync_status === 'synced'
                                ? 'default'
                                : order.sync_status === 'error'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {order.sync_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <ShoppingCart className="h-4 w-4" />
                  <AlertDescription>
                    No orders synced yet. Connect your Shopify store and run a sync to import orders.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>
                Historical data synchronization activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={syncHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="products" fill="#8884d8" name="Products" />
                  <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Shopify webhooks for real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Webhooks are automatically configured when you connect your Shopify store.
                  Real-time updates for products, orders, and inventory are enabled.
                </AlertDescription>
              </Alert>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Product Updates</p>
                    <p className="text-sm text-muted-foreground">Receive real-time product changes</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Order Creation</p>
                    <p className="text-sm text-muted-foreground">Notified when new orders are placed</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Inventory Updates</p>
                    <p className="text-sm text-muted-foreground">Sync inventory levels automatically</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
