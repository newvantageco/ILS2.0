import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FileText, Truck, Archive } from "lucide-react";

export default function SupplierDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-supplier-dashboard-title">Supplier Portal</h1>
        <p className="text-muted-foreground mt-1">
          Purchase order management and material specifications.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Phase 2 Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The Supplier Portal will be available in Phase 2 with the following capabilities:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-md border border-border bg-card">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Purchase Orders</h4>
                  <p className="text-sm text-muted-foreground">
                    View and manage lab purchase orders for lens blanks, coatings, and materials
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-md border border-border bg-card">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Delivery Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Update shipment status and provide delivery confirmations
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-md border border-border bg-card">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Technical Documentation</h4>
                  <p className="text-sm text-muted-foreground">
                    Access material specifications, compliance certificates, and safety data sheets
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-md border border-border bg-card">
              <div className="flex items-start gap-3">
                <Archive className="w-5 h-5 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Inventory Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor stock levels and receive low-inventory alerts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Focus: Phase 1 MVP</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Phase 1 focuses on establishing the core digital backbone for lab operations:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-sm text-muted-foreground">
            <li>ECP order entry and tracking system</li>
            <li>Lab production queue management</li>
            <li>Order status workflow automation</li>
            <li>Role-based access control and authentication</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Phase 2 will introduce supplier integration, purchase order management, and advanced inventory tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
