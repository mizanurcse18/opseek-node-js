import React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline'
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: "bg-primary-600 text-white hover:bg-primary-700 border-transparent",
    secondary: "bg-content-bg text-text-main hover:bg-card-bg border-border-theme",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
    danger: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
    outline: "text-primary-600 border border-primary-600 hover:bg-primary-600/5",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

Badge.displayName = "Badge"
