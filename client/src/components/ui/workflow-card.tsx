import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface WorkflowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  role: 'owner' | 'ecp' | 'lab-tech' | 'admin'
  title: string
  loading?: boolean
  children: React.ReactNode
}

/**
 * WorkflowCard - A role-specific container component that enforces the "Precision, Not Preference" philosophy
 * 
 * Key features:
 * 1. Role-based styling and behavior
 * 2. Consistent loading states
 * 3. Clear visual hierarchy
 * 4. Technical, clean aesthetic
 */
export function WorkflowCard({
  role,
  title,
  loading = false,
  className,
  children,
  ...props
}: WorkflowCardProps) {
  // Role-specific styling
  const roleStyles = {
    owner: 'border-l-4 border-l-primary',
    'ecp': 'border-l-4 border-l-info-base',
    'lab-tech': 'border-l-4 border-l-success-base',
    'admin': 'border-l-4 border-l-warning-base',
  } as const

  return (
    <Card 
      className={cn(
        "overflow-hidden",
        roleStyles[role],
        className
      )}
      {...props}
    >
      <CardHeader className="bg-gray-50 border-b border-gray-200 py-3">
        <CardTitle className="text-lg font-semibold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Spinner className="text-primary h-6 w-6" />
          </div>
        ) : children}
      </CardContent>
    </Card>
  )
}