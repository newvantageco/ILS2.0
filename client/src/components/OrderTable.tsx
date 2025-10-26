import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, type OrderStatus } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Order {
  id: string;
  patientName: string;
  ecp: string;
  status: OrderStatus;
  orderDate: string;
  lensType: string;
}

interface OrderTableProps {
  orders: Order[];
  onViewDetails?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  onShipOrder?: (orderId: string) => void;
}

export function OrderTable({ orders, onViewDetails, onUpdateStatus, onShipOrder }: OrderTableProps) {
  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Order ID</TableHead>
            <TableHead className="font-semibold">Patient</TableHead>
            <TableHead className="font-semibold">ECP</TableHead>
            <TableHead className="font-semibold">Lens Type</TableHead>
            <TableHead className="font-semibold">Order Date</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="hover-elevate"
              data-testid={`row-order-${order.id}`}
            >
              <TableCell className="font-mono text-sm font-medium">
                {order.id}
              </TableCell>
              <TableCell>{order.patientName}</TableCell>
              <TableCell className="text-muted-foreground">{order.ecp}</TableCell>
              <TableCell>{order.lensType}</TableCell>
              <TableCell className="text-muted-foreground">{order.orderDate}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails?.(order.id)}
                    data-testid={`button-view-${order.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-menu-${order.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUpdateStatus?.(order.id, "in_production")}>
                        Start Production
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus?.(order.id, "quality_check")}>
                        Move to QC
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onShipOrder?.(order.id)}>
                        Mark as Shipped
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus?.(order.id, "on_hold")}>
                        Put on Hold
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
