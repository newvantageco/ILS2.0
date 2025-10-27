import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Spinner - A minimal loading indicator that follows our "Precision, Not Preference" philosophy
 * 
 * Uses a simple animated SVG for maximum compatibility and precise control
 */
export function Spinner({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-spin", className)}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a9 9 0 1 0 9 9" />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  )
}