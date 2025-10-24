import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge, type OrderStatus } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  orderId: string;
  patientName: string;
  ecp: string;
  status: OrderStatus;
  orderDate: string;
  lensType?: string;
  coating?: string;
  onViewDetails?: () => void;
  className?: string;
}

export function OrderCard({
  orderId,
  patientName,
  ecp,
  status,
  orderDate,
  lensType,
  coating,
  onViewDetails,
  className,
}: OrderCardProps) {
  return (
    <Card className={cn("hover-elevate", className)} data-testid={`card-order-${orderId}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg" data-testid={`text-order-id-${orderId}`}>
            Order #{orderId}
          </h3>
          <p className="text-sm text-muted-foreground truncate" data-testid={`text-patient-${orderId}`}>
            {patientName}
          </p>
        </div>
        <StatusBadge status={status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">ECP</p>
            <p className="font-medium" data-testid={`text-ecp-${orderId}`}>{ecp}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Order Date</p>
            <p className="font-medium">{orderDate}</p>
          </div>
          {lensType && (
            <div>
              <p className="text-muted-foreground">Lens Type</p>
              <p className="font-medium">{lensType}</p>
            </div>
          )}
          {coating && (
            <div>
              <p className="text-muted-foreground">Coating</p>
              <p className="font-medium">{coating}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewDetails}
            data-testid={`button-view-order-${orderId}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-download-${orderId}`}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
