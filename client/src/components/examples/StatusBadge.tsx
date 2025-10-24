import { StatusBadge } from '../StatusBadge'

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="pending" />
      <StatusBadge status="in_production" />
      <StatusBadge status="quality_check" />
      <StatusBadge status="shipped" />
      <StatusBadge status="completed" />
      <StatusBadge status="on_hold" />
      <StatusBadge status="cancelled" />
    </div>
  )
}
