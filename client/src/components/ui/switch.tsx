import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  "data-testid"?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className, id, ...props }, ref) => {
    const inputId = id || `switch-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn("ios-switch", className)}>
        <input
          ref={ref}
          className="ios-switch-input"
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          {...props}
        />
        <label className="ios-switch-label" htmlFor={inputId} />
      </div>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
