import { OrderCard } from '../OrderCard'

export default function OrderCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
      <OrderCard
        orderId="ORD-2024-1001"
        patientName="John Smith"
        ecp="Vision Care Center"
        status="in_production"
        orderDate="2024-10-20"
        lensType="Progressive"
        coating="Anti-Reflective"
        onViewDetails={() => console.log('View details clicked')}
      />
      <OrderCard
        orderId="ORD-2024-1002"
        patientName="Sarah Johnson"
        ecp="Eye Health Associates"
        status="quality_check"
        orderDate="2024-10-21"
        lensType="Single Vision"
        coating="Blue Light Filter"
        onViewDetails={() => console.log('View details clicked')}
      />
      <OrderCard
        orderId="ORD-2024-1003"
        patientName="Michael Chen"
        ecp="Clarity Optical"
        status="shipped"
        orderDate="2024-10-19"
        lensType="Bifocal"
        coating="Scratch Resistant"
        onViewDetails={() => console.log('View details clicked')}
      />
    </div>
  )
}
