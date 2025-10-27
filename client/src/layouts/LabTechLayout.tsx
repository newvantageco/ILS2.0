import * as React from "react"
import { WorkflowCard } from "@/components/ui/workflow-card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface Task {
  id: string
  status: 'pending' | 'in-progress' | 'completed'
  type: 'surfacing' | 'coating' | 'qa'
  orderId: string
  priority: 'normal' | 'rush' | 'emergency'
}

/**
 * LabTechLayout - Production Line Interface
 * 
 * Following the "Workflow is the User" principle:
 * 1. Shows only the next required task
 * 2. Clear, real-time production queue
 * 3. Focused on execution, not management
 */
export function LabTechLayout({ children }: { children: React.ReactNode }) {
  const [currentTask, setCurrentTask] = React.useState<Task | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar: Production Queue */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Production Queue</h2>
          <p className="text-sm text-gray-500 mt-1">Prioritized by urgency and deadline</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {/* Queue items would be mapped here */}
          <div className="p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Order #12345</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Rush
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Surfacing - 2h remaining</p>
          </div>
        </div>
      </div>

      {/* Main Content: Current Task */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {currentTask ? (
            <WorkflowCard 
              role="lab-tech" 
              title={`Order #${currentTask.orderId} - ${currentTask.type.toUpperCase()}`}
              loading={isLoading}
            >
              {children}
            </WorkflowCard>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No Active Task</h3>
              <p className="mt-2 text-sm text-gray-500">Select a task from the queue to begin processing</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Technical Specs & QA Checklist */}
      <div className="w-72 border-l border-gray-200 bg-white">
        {currentTask && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900">Technical Requirements</h3>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="text-xs font-medium text-gray-900">Quality Checklist</h4>
                {/* QA checklist would be mapped here */}
                <label className="flex items-center mt-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="ml-2 text-sm text-gray-600">Surface quality verified</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}