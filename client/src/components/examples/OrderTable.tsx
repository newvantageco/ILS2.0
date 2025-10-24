import { OrderTable } from '../OrderTable'

export default function OrderTableExample() {
  const orders = [
    {
      id: "ORD-2024-1001",
      patientName: "John Smith",
      ecp: "Vision Care Center",
      status: "in_production" as const,
      orderDate: "2024-10-20",
      lensType: "Progressive",
    },
    {
      id: "ORD-2024-1002",
      patientName: "Sarah Johnson",
      ecp: "Eye Health Associates",
      status: "quality_check" as const,
      orderDate: "2024-10-21",
      lensType: "Single Vision",
    },
    {
      id: "ORD-2024-1003",
      patientName: "Michael Chen",
      ecp: "Clarity Optical",
      status: "pending" as const,
      orderDate: "2024-10-22",
      lensType: "Bifocal",
    },
    {
      id: "ORD-2024-1004",
      patientName: "Emily Davis",
      ecp: "Perfect Vision Clinic",
      status: "shipped" as const,
      orderDate: "2024-10-19",
      lensType: "Progressive",
    },
  ];

  return (
    <OrderTable
      orders={orders}
      onViewDetails={(id) => console.log('View details for', id)}
      onUpdateStatus={(id, status) => console.log('Update status', id, status)}
    />
  )
}
