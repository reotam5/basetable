import { cn } from "@/lib/utils"
import React from "react"
import { Switch } from "./ui/switch"

interface AsyncSwitchProps extends Omit<React.ComponentProps<typeof Switch>, "checked" | "defaultChecked" | "onCheckedChange"> {
  checked: boolean
  isLoading: boolean
  onCheckedChange?: (checked: boolean) => void
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        className
      )}
    />
  )
}

export function AsyncSwitch({ checked, isLoading, onCheckedChange, className, ...props }: AsyncSwitchProps) {
  const handleChange = (value: boolean) => {
    if (!isLoading) {
      onCheckedChange?.(value)
    }
  }

  return (
    <div className="relative inline-flex">
      {/* Simple loading overlay */}
      <div
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center rounded-full bg-background/90",
          "transition-all duration-300 ease-out",
          isLoading
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        )}
      >
        <LoadingSpinner className="h-3 w-3" />
      </div>

      {/* Main switch */}
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={isLoading || props.disabled}
        className={cn(
          "transition-all duration-300 ease-out",
          isLoading && "opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}
