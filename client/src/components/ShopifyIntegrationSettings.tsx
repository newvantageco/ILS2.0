import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, RefreshCw, Check, X, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShopifyStatus {
  enabled: boolean;
  lastSyncAt: Date | null;
  shopUrl: string | null;
  autoSync: boolean;
}

interface SyncResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export default function ShopifyIntegrationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [shopUrl, setShopUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "valid" | "invalid">("idle");

  const { data: status, isLoading } = useQuery<ShopifyStatus>({
    queryKey: ["/api/shopify/status"],
  });

  const verifyConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/shopify/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shopUrl: shopUrl.trim(),
          accessToken: accessToken.trim(),
          apiVersion: "2024-10",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify connection");
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setVerificationStatus("valid");
        toast({
          title: "Connection Verified",
          description: "Successfully connected to your Shopify store.",
        });
      } else {
        setVerificationStatus("invalid");
        toast({
          title: "Connection Failed",
          description: data.error || "Could not connect to Shopify store.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setVerificationStatus("invalid");
      toast({
        title: "Verification Error",
        description: "Failed to verify connection. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const syncCustomersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/shopify/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sync customers");
      }

      return response.json();
    },
    onSuccess: (data: SyncResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopify/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.success} customers. ${data.skipped} skipped, ${data.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerifyConnection = () => {
    if (!shopUrl.trim() || !accessToken.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both Shop URL and Access Token.",
        variant: "destructive",
      });
      return;
    }
    verifyConnectionMutation.mutate();
  };

  const handleSyncNow = () => {
    if (!status?.enabled) {
      toast({
        title: "Not Connected",
        description: "Please verify your Shopify connection first.",
        variant: "destructive",
      });
      return;
    }
    syncCustomersMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopify Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopify Integration
            </CardTitle>
            <CardDescription className="mt-1.5">
              Sync your Shopify customers as patients automatically
            </CardDescription>
          </div>
          {status?.enabled && (
            <Badge variant="default" className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {status?.enabled && status.shopUrl && (
          <Alert>
            <ShoppingCart className="h-4 w-4" />
            <AlertDescription>
              Connected to <strong>{status.shopUrl}</strong>
              {status.lastSyncAt && (
                <span className="text-muted-foreground ml-2">
                  • Last synced {new Date(status.lastSyncAt).toLocaleString()}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopUrl">Shop URL</Label>
            <Input
              id="shopUrl"
              placeholder="mystore.myshopify.com"
              value={shopUrl}
              onChange={(e) => {
                setShopUrl(e.target.value);
                setVerificationStatus("idle");
              }}
              disabled={verifyConnectionMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Your Shopify store URL (e.g., mystore.myshopify.com)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessToken">Admin API Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="shpat_••••••••••••••••"
              value={accessToken}
              onChange={(e) => {
                setAccessToken(e.target.value);
                setVerificationStatus("idle");
              }}
              disabled={verifyConnectionMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Generate from Shopify Admin → Apps → Develop apps → Create private app
            </p>
          </div>

          {/* Verification Status */}
          {verificationStatus === "valid" && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Connection verified successfully! You can now sync your customers.
              </AlertDescription>
            </Alert>
          )}

          {verificationStatus === "invalid" && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>
                Connection failed. Please check your credentials and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleVerifyConnection}
              disabled={verifyConnectionMutation.isPending}
              variant="outline"
            >
              {verifyConnectionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Verify Connection
                </>
              )}
            </Button>

            {verificationStatus === "valid" && (
              <Button
                onClick={handleSyncNow}
                disabled={syncCustomersMutation.isPending}
              >
                {syncCustomersMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Customers Now
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Shopify customers will be imported as patients with their contact information.
            Existing patients (matched by email) will be skipped to avoid duplicates.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
