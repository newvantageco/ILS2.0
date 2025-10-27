import * as React from "react"
import { useRole } from "@/hooks/useRole"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

/**
 * OwnerDashboard Component
 * 
 * A comprehensive view of all company operations following:
 * 1. "Precision, Not Preference" - Clear, data-driven insights
 * 2. "Trust Through Transparency" - Real-time metrics
 * 3. Role-based access to all system aspects
 */
export function OwnerDashboard() {
  const { currentRole, switchRole } = useRole()
  
  return (
    <div className="space-y-6">
      {/* Company Performance Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Monthly Revenue</span>
                <span className="text-lg font-semibold">$342,955</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">YoY Growth</span>
                <span className="text-lg font-semibold text-green-600">+24%</span>
              </div>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#16a34a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Operational Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Order Success Rate</span>
                <span className="text-lg font-semibold">98.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Avg Processing Time</span>
                <span className="text-lg font-semibold">1.2 days</span>
              </div>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderData}>
                    <Bar dataKey="orders" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lab Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Current Utilization</span>
                <span className="text-lg font-semibold">94%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Equipment Uptime</span>
                <span className="text-lg font-semibold">99.3%</span>
              </div>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={efficiencyData}>
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#7c3aed"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Role-Specific Actions */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="operations" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>
              <TabsContent value="operations" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Button variant="outline" onClick={() => switchRole('lab-tech')}>
                    View Production Queue
                  </Button>
                  <Button variant="outline" onClick={() => switchRole('ecp')}>
                    Create New Order
                  </Button>
                  <Button variant="outline" onClick={() => switchRole('admin')}>
                    System Settings
                  </Button>
                  <Button variant="outline">
                    Generate Reports
                  </Button>
                </div>
              </TabsContent>
              {/* Add content for other tabs */}
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Critical Alerts */}
      <section>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900">Critical Attention Required</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center text-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                Lab 2 Maintenance Required - Schedule service within 48 hours
              </li>
              <li className="flex items-center text-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                3 Orders Past SLA - Immediate attention needed
              </li>
              <li className="flex items-center text-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                Inventory Alert: Anti-reflective coating running low
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

// Sample data for charts
const revenueData = [
  { month: 'Jan', revenue: 250000 },
  { month: 'Feb', revenue: 285000 },
  { month: 'Mar', revenue: 320000 },
  { month: 'Apr', revenue: 342955 },
]

const orderData = [
  { week: 'W1', orders: 145 },
  { week: 'W2', orders: 132 },
  { week: 'W3', orders: 164 },
  { week: 'W4', orders: 156 },
]

const efficiencyData = [
  { day: 'Mon', efficiency: 92 },
  { day: 'Tue', efficiency: 95 },
  { day: 'Wed', efficiency: 94 },
  { day: 'Thu', efficiency: 96 },
  { day: 'Fri', efficiency: 94 },
]