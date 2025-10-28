import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-lg cursor-pointer relative transition-all duration-400",
      "bg-[#e0e5ec] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.9)]",
      "hover:shadow-[5px_5px_10px_rgba(163,177,198,0.7),-5px_-5px_10px_rgba(255,255,255,0.95)] hover:scale-105",
      "active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] active:scale-95",
      "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-[#caced6] data-[state=checked]:to-[#f0f5ff]",
      "data-[state=checked]:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3fa6c5] focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-current",
        "animate-in zoom-in-50 duration-300"
      )}
    >
      <svg 
        className="w-full h-full p-0.5" 
        viewBox="0 0 20 20"
        style={{
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      >
        <path
          d="M4 10 L8 14 L16 6"
          fill="none"
          stroke="#3fa6c5"
          strokeWidth="2.5"
          className="animate-in"
          style={{
            strokeDasharray: '20',
            strokeDashoffset: '0',
            animation: 'checkmark 0.4s cubic-bezier(0.5, -1, 0.5, 2) forwards'
          }}
        />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
