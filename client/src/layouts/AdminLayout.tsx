import * as React from "react"
import { WorkflowCard } from "@/components/ui/workflow-card"

/**
 * AdminLayout - Strategic Command Center
 * 
 * Following the "Workflow is the User" principle:
 * 1. High-level analytics for strategic decisions
 * 2. Clear system status indicators
 * 3. Separated from production workflow
 */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar: System Navigation */}
      <div className="w-64 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Control</h2>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { name: 'Dashboard', icon: '📊' },
            { name: 'User Management', icon: '👥' },
            { name: 'Lab Settings', icon: '⚙️' },
            { name: 'Audit Logs', icon: '📋' },
            { name: 'System Health', icon: '🔄' },
          ].map((item) => (
            <button
              key={item.name}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50"
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content: Analytics & Controls */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Status Card */}
            <WorkflowCard role="admin" title="System Status">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Active Orders</span>
                  <span className="font-mono text-sm">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Lab Utilization</span>
                  <span className="font-mono text-sm">84%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Average Processing Time</span>
                  <span className="font-mono text-sm">1.4 days</span>
                </div>
              </div>
            </WorkflowCard>

            {/* Main Content Area */}
            <WorkflowCard role="admin" title="Management Console">
              {children}
            </WorkflowCard>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Alerts & Notifications */}
      <div className="w-72 border-l border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">System Alerts</h3>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {/* Alert items would be mapped here */}
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">⚠️</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Lab 2 Utilization High</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Approaching 95% capacity
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}