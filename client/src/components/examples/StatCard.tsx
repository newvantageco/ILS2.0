import { StatCard } from '../StatCard'
import { Package, Clock, CheckCircle, TrendingUp } from 'lucide-react'

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Orders"
        value="1,234"
        icon={Package}
        trend={{ value: "+12.5% from last month", isPositive: true }}
      />
      <StatCard
        title="In Production"
        value="45"
        icon={Clock}
      />
      <StatCard
        title="Completed Today"
        value="23"
        icon={CheckCircle}
        trend={{ value: "+5.2% from yesterday", isPositive: true }}
      />
      <StatCard
        title="Efficiency Rate"
        value="94%"
        icon={TrendingUp}
        trend={{ value: "+2.1% from last week", isPositive: true }}
      />
    </div>
  )
}
