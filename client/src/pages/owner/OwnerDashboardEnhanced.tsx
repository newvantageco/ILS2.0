import * as React from "react"
import { useRole } from "@/hooks/useRole"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { NumberCounter, StaggeredList, StaggeredItem } from "@/components/ui/AnimatedComponents"
import { pageVariants } from "@/lib/animations"
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
 * OwnerDashboardEnhanced Component
 *
 * A comprehensive view of all company operations following:
 * 1. "Precision, Not Preference" - Clear, data-driven insights
 * 2. "Trust Through Transparency" - Real-time metrics
 * 3. Role-based access to all system aspects
 *
 * Enhanced with smooth animations and counters for better UX
 */
export function OwnerDashboardEnhanced() {
  const { currentRole, switchRole } = useRole()

  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Company Performance Overview */}
      <section>
        <StaggeredList className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StaggeredItem>
            <Card className="hover:shadow-lg transition-all duration-300 border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Monthly Revenue</span>
                    <span className="text-lg font-semibold text-green-600">
                      $<NumberCounter to={342955} duration={1.5} decimals={0} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">YoY Growth</span>
                    <span className="text-lg font-semibold text-green-600">
                      +<NumberCounter to={24} duration={1.5} />%
                    </span>
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
          </StaggeredItem>

          <StaggeredItem>
            <Card className="hover:shadow-lg transition-all duration-300 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Operational Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Order Success Rate</span>
                    <span className="text-lg font-semibold text-blue-600">
                      <NumberCounter to={98.7} duration={1.5} decimals={1} />%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Avg Processing Time</span>
                    <span className="text-lg font-semibold text-blue-600">
                      <NumberCounter to={1.2} duration={1.5} decimals={1} /> days
                    </span>
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
          </StaggeredItem>

          <StaggeredItem>
            <Card className="hover:shadow-lg transition-all duration-300 border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Lab Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Current Utilization</span>
                    <span className="text-lg font-semibold text-purple-600">
                      <NumberCounter to={94} duration={1.5} />%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Equipment Uptime</span>
                    <span className="text-lg font-semibold text-purple-600">
                      <NumberCounter to={99.3} duration={1.5} decimals={1} />%
                    </span>
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
          </StaggeredItem>
        </StaggeredList>
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
            <StaggeredList className="space-y-2">
              <StaggeredItem>
                <div className="flex items-center text-red-800">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  Lab 2 Maintenance Required - Schedule service within 48 hours
                </div>
              </StaggeredItem>
              <StaggeredItem>
                <div className="flex items-center text-red-800">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  <NumberCounter to={3} duration={0.5} /> Orders Past SLA - Immediate attention needed
                </div>
              </StaggeredItem>
              <StaggeredItem>
                <div className="flex items-center text-red-800">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  Inventory Alert: Anti-reflective coating running low
                </div>
              </StaggeredItem>
            </StaggeredList>
          </CardContent>
        </Card>
      </section>
    </motion.div>
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
