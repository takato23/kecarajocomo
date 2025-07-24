"use client"

import * as React from "react"

export interface TooltipProps {
  children: React.ReactNode
}

export interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export interface TooltipContentProps {
  children: React.ReactNode
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const Tooltip = ({ children }: TooltipProps) => {
  return <>{children}</>
}

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  TooltipTriggerProps
>(({ children, asChild }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, { ref })
  }
  return <div ref={ref}>{children}</div>
})
TooltipTrigger.displayName = "TooltipTrigger"

export const TooltipContent = ({ 
  children, 
  className = "",
  side = "top",
  align = "center"
}: TooltipContentProps) => {
  const [show, setShow] = React.useState(false)
  
  return (
    <div 
      className={`absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-md ${className}`}
      style={{ display: show ? 'block' : 'none' }}
    >
      {children}
    </div>
  )
}