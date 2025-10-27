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
  const { messages } = useFeedback()

  return (
    <ToastProvider>
      {children}
      <ToastViewport className="gap-2">
        {messages.map((message, index) => (
          <Toast key={index} variant={message.variant}>
            <div className="grid gap-1">
              <ToastTitle>{message.title}</ToastTitle>
              {message.description && (
                <ToastDescription>{message.description}</ToastDescription>
              )}
            </div>
            {message.action}
            <ToastClose />
          </Toast>
        ))}
      </ToastViewport>
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