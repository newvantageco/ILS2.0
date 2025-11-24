import * as React from "react"
import { WorkflowCard } from "@/components/ui/workflow-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ViewRole = 'owner' | 'ecp' | 'lab-tech' | 'admin'

interface OwnerLayoutProps {
  children: React.ReactNode
  defaultRole?: ViewRole
  onRoleChange?: (role: ViewRole) => void
}

/**
 * OwnerLayout - Comprehensive Control Center
 * 
 * Provides complete access to all system aspects while maintaining:
 * 1. Clear role separation
 * 2. Consistent workflow visualization
 * 3. Immediate access to critical data
 */
export function OwnerLayout({ 
  children,
  defaultRole = 'owner',
  onRoleChange
}: OwnerLayoutProps) {
  const [currentRole, setCurrentRole] = React.useState<ViewRole>(defaultRole)

  const handleRoleChange = (role: ViewRole) => {
    setCurrentRole(role)
    onRoleChange?.(role)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar: Company Overview */}
      <div className="w-64 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Company Control</h2>
          <p className="mt-1 text-sm text-gray-500">Full System Access</p>
        </div>

        {/* Role Switcher */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">View As Role</h3>
          <Tabs value={currentRole} onValueChange={(v) => handleRoleChange(v as ViewRole)}>
            <TabsList className="grid w-full grid-cols-2 gap-2">
              <TabsTrigger value="owner">Owner</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="ecp">ECP</TabsTrigger>
              <TabsTrigger value="lab-tech">Lab Tech</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Overview</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-xs font-medium text-gray-500">Active Orders</div>
              <div className="text-lg font-semibold text-gray-900">247</div>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-xs font-medium text-gray-500">Today&apos;s Revenue</div>
              <div className="text-lg font-semibold text-gray-900">$12,847</div>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-xs font-medium text-gray-500">Lab Efficiency</div>
              <div className="text-lg font-semibold text-gray-900">94%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Company Insights */}
            <WorkflowCard role="owner" title="Company Performance">
              <div className="space-y-6">
                {/* Financial Overview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Monthly Revenue</div>
                        <div className="text-lg font-semibold">$342,955</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">YoY Growth</div>
                        <div className="text-lg font-semibold text-green-600">+24%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Operational Health */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Operations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Order Success Rate</div>
                        <div className="text-lg font-semibold">98.7%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Avg. Processing Time</div>
                        <div className="text-lg font-semibold">1.2 days</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </WorkflowCard>

            {/* Role-Specific View */}
            <WorkflowCard 
              role={currentRole} 
              title={`${currentRole.toUpperCase()} View`}
            >
              {children}
            </WorkflowCard>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Critical Alerts & Actions */}
      <div className="w-80 border-l border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Critical Items</h3>
        </div>
        <div className="p-4">
          {/* High Priority Actions */}
          <div className="space-y-4">
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-900">
                  Requires Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    Lab 2 Maintenance Required
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    3 Orders Past SLA
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  View Financial Reports
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Manage Staff Access
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Equipment Inventory
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}