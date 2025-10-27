import * as React from "react"
import {
  Toast,
  ToastProps,
  ToastActionElement,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/toast"

const TOAST_TIMEOUT = 5000 // 5 seconds

interface ToastMessage {
  id: string
  title: string
  description?: string
  variant?: ToastProps["variant"]
  action?: ToastActionElement
}

type ToastPayload = Omit<ToastMessage, "id">;

/**
 * Feedback System Hook
 * 
 * Following the "Trust Through Transparency" principle:
 * 1. Clear, immediate feedback for all actions
 * 2. Consistent message formatting
 * 3. Role-appropriate technical detail
 */
export function useFeedback() {
  const [messages, setMessages] = React.useState<ToastMessage[]>([])

  const enqueueToast = React.useCallback((payload: ToastPayload) => {
    const id = Math.random().toString(36).slice(2)
    const message: ToastMessage = { id, ...payload }

    setMessages((prev) => [...prev, message])

    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id))
    }, TOAST_TIMEOUT)
  }, [])

  const showToast = React.useCallback(
    ({ title, description, variant = "default", action }: ToastPayload) => {
      enqueueToast({ title, description, variant, action })
    },
    [enqueueToast]
  )

  // Success feedback with technical detail
  const success = React.useCallback(
    (title: string, technicalDetail?: string) => {
      showToast({
        title,
        description: technicalDetail,
        variant: "default",
      })
    },
    [showToast]
  )

  // Error feedback with debugging info
  const error = React.useCallback(
    (title: string, error?: Error | string) => {
      showToast({
        title,
        description: typeof error === "string" ? error : error?.message,
        variant: "destructive",
      })
    },
    [showToast]
  )

  // Information with context
  const info = React.useCallback(
    (title: string, context?: string) => {
      showToast({
        title,
        description: context,
        variant: "default",
      })
    },
    [showToast]
  )

  // Warning with action
  const warn = React.useCallback(
    (title: string, description?: string, action?: ToastActionElement) => {
      showToast({
        title,
        description,
        variant: "default",
        action,
      })
    },
    [showToast]
  )

  return {
    messages,
    success,
    error,
    info,
    warn,
  }
}