import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  Loader2,
  Zap,
  RefreshCw,
  Settings,
  Code,
} from "lucide-react";
import { PageHeader } from "@/components/healthcare/PageHeader";

interface ShopifyConnection {
  id: string;
  storeDomain: string;
  storeId: string;
  isActive: boolean;
  webhooksRegistered: boolean;
  lastSyncedAt: string | null;
  productCount: number;
  orderCount: number;
}

export default function ShopifyIntegrationPage() {
  const [connections, setConnections] = useState<ShopifyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [storeDomain, setStoreDomain] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/shopify/connections");
      if (!response.ok) throw new Error("Failed to fetch connections");
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast({
        title: "Error",
        description: "Failed to load Shopify connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectStore = async () => {
    if (!storeDomain) {
      toast({
        title: "Validation Error",
        description: "Please enter your Shopify store domain",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch("/api/shopify/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeDomain }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate connection");
      }

      // Redirect to Shopify OAuth
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: unknown) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Shopify",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const syncStore = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/shopify/sync/${connectionId}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Sync failed");

      toast({
        title: "Sync Started",
        description: "Shopify store sync initiated successfully",
      });

      // Refresh connections
      setTimeout(fetchConnections, 2000);
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync Shopify store",
        variant: "destructive",
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const widgetInstallCode = `<!-- ILS 2.0 Shopify Widgets -->
<link rel="stylesheet" href="${window.location.origin}/shopify-widgets/shopify-widget-styles.css">
<script src="${window.location.origin}/shopify-widgets/prescription-upload-widget.js"></script>
<script src="${window.location.origin}/shopify-widgets/lens-recommendation-widget.js"></script>

<!-- Prescription Upload Widget -->
<div id="ils-prescription-upload"
     data-ils-api="${window.location.origin}"
     data-store-id="YOUR_STORE_ID">
</div>

<!-- AI Lens Recommendation Widget -->
<div id="ils-lens-recommender"
     data-ils-api="${window.location.origin}"
     data-store-id="YOUR_STORE_ID">
</div>`;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <PageHeader
        title="Shopify Integration"
        description="Connect your Shopify store to enable online prescription eyewear sales"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="widgets">Widget Setup</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">
              Sell Prescription Eyewear Online
            </h2>
            <p className="text-muted-foreground mb-6">
              ILS 2.0 integrates seamlessly with Shopify to enable your optical
              practice to sell prescription eyewear online with AI-powered
              prescription verification and lens recommendations.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">AI Prescription OCR</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically extract prescription data from customer
                      uploads with 85%+ accuracy using GPT-4 Vision
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Real-time Sync</h3>
                    <p className="text-sm text-muted-foreground">
                      Bidirectional order and inventory synchronization via
                      webhooks
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Settings className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Automated Workflow</h3>
                    <p className="text-sm text-muted-foreground">
                      Patient record creation, prescription verification, and
                      order fulfillment
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Requirements</AlertTitle>
              <AlertDescription>
                You'll need a Shopify store (any plan with API access) and an
                OpenAI API key for prescription OCR functionality.
              </AlertDescription>
            </Alert>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Connect Shopify Store</h2>
            <p className="text-muted-foreground mb-6">
              Connect your Shopify store to start syncing products and orders
              with ILS 2.0.
            </p>

            <div className="flex gap-4 mb-8">
              <div className="flex-1">
                <Label htmlFor="storeDomain">Shopify Store Domain</Label>
                <Input
                  id="storeDomain"
                  placeholder="your-store.myshopify.com"
                  value={storeDomain}
                  onChange={(e) => setStoreDomain(e.target.value)}
                  disabled={connecting}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={connectStore}
                  disabled={connecting || !storeDomain}
                >
                  {connecting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Connect Store
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Connected Stores</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : connections.length === 0 ? (
                <Card className="p-8 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No Shopify stores connected yet
                  </p>
                </Card>
              ) : (
                connections.map((conn) => (
                  <Card key={conn.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{conn.storeDomain}</h4>
                          {conn.isActive ? (
                            <Badge variant="default">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{conn.productCount} products</span>
                          <span>{conn.orderCount} orders</span>
                          {conn.lastSyncedAt && (
                            <span>
                              Last synced:{" "}
                              {new Date(conn.lastSyncedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncStore(conn.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Sync
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="widgets" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Widget Installation</h2>
            <p className="text-muted-foreground mb-6">
              Add ILS widgets to your Shopify store to enable prescription
              upload and AI-powered lens recommendations.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Installation Steps
                </h3>
                <ol className="space-y-3 list-decimal list-inside">
                  <li>
                    Go to your Shopify Admin → Online Store → Themes
                  </li>
                  <li>Click "Actions" → "Edit code"</li>
                  <li>
                    Open the product template (usually{" "}
                    <code className="text-sm bg-muted px-1 py-0.5 rounded">
                      sections/product-template.liquid
                    </code>
                    )
                  </li>
                  <li>Paste the code below where you want the widgets to appear</li>
                  <li>
                    Replace <code className="text-sm bg-muted px-1 py-0.5 rounded">
                      YOUR_STORE_ID
                    </code> with your Store ID from the Connections tab
                  </li>
                  <li>Save and test on your storefront</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Widget Code</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyCode(widgetInstallCode)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Code
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{widgetInstallCode}</code>
                </pre>
              </div>

              <Alert>
                <Code className="h-4 w-4" />
                <AlertTitle>Need Help?</AlertTitle>
                <AlertDescription>
                  Check the Documentation tab for detailed integration guides,
                  API reference, and troubleshooting tips.
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">
              Integration Documentation
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Complete Integration Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive guide covering setup, API reference, webhooks,
                  and workflows
                </p>
                <Button variant="outline" asChild>
                  <a
                    href="/docs/SHOPIFY_INTEGRATION_GUIDE.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Documentation
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Widget Documentation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed widget installation and customization guide
                </p>
                <Button variant="outline" asChild>
                  <a
                    href="/client/shopify-widgets/README.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Widget Docs
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">API Reference</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete API documentation for Shopify integration endpoints
                </p>
                <Button variant="outline" asChild>
                  <a href="/api/docs" target="_blank" rel="noopener noreferrer">
                    View API Docs
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get help with integration, troubleshooting, and best practices
                </p>
                <Button variant="outline" asChild>
                  <a href="/support" target="_blank" rel="noopener noreferrer">
                    Contact Support
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </Card>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Quick Links</h3>
              <div className="space-y-2">
                <a
                  href="https://shopify.dev/docs/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Shopify API Documentation
                </a>
                <a
                  href="https://help.shopify.com/en/manual/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Shopify App Store Guidelines
                </a>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
