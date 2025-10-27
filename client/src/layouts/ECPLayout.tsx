import * as React from "react"
import { WorkflowCard } from "@/components/ui/workflow-card"

/**
 * ECP Layout - Digital Non-Adapt Workflow
 * 
 * Following the "Workflow is the User" principle:
 * 1. Order submission as a guided, step-by-step process
 * 2. Real-time validation with contextual guidance
 * 3. Clear order status and tracking
 */
export function ECPLayout({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = React.useState(1)
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar: Order Progress */}
      <div className="w-64 border-r border-gray-200 bg-white p-4">
        <nav className="space-y-1">
          {['Patient Info', 'Prescription', 'Measurements', 'Frame Data', 'Review'].map((step, index) => (
            <button
              key={step}
              onClick={() => setCurrentStep(index + 1)}
              className={`w-full text-left px-4 py-2 rounded-md text-sm ${
                currentStep === index + 1
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {index + 1}. {step}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <WorkflowCard role="ecp" title="Order Submission">
            {children}
          </WorkflowCard>
        </div>
      </div>

      {/* Right Sidebar: Context & Help */}
      <div className="w-72 border-l border-gray-200 bg-white p-4">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Contextual Guidance</h3>
          <div className="text-sm text-gray-600">
            {/* Dynamic help content based on current step */}
            {currentStep === 1 && (
              <p>Enter accurate patient information. This will be used for order tracking and documentation.</p>
            )}
            {/* Add more contextual help for other steps */}
          </div>
        </div>
      </div>
    </div>
  )
}