import * as React from "react"
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast"
import { useFeedback } from "@/hooks/useFeedback"

/**
 * FeedbackProvider Component
 * 
 * Implements the "Trust Through Transparency" principle by providing:
 * 1. Consistent message positioning
 * 2. Clear visual hierarchy
 * 3. Role-appropriate technical detail
 */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastViewport />
    </ToastProvider>
  )
}

// Example usage in a component:
/*
import { useFeedback } from "@/hooks/useFeedback"

export function OrderSubmissionForm() {
  const { success, error } = useFeedback()

  const handleSubmit = async (data) => {
    try {
      await submitOrder(data)
      success(
        "Order Submitted Successfully",
        `Order #${data.orderId} has been sent to the lab`
      )
    } catch (err) {
      error(
        "Order Submission Failed",
        "Please check the prescription values and try again"
      )
    }
  }
}
*/