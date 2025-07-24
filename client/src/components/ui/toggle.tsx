import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-green-400 data-[state=on]:text-white data-[state=on]:shadow-sm [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0 gap-1.5",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border-2 border-gray-200 bg-transparent hover:border-gray-300 data-[state=on]:border-green-400",
      },
      size: {
        default: "h-8 px-3 min-w-8",
        sm: "h-7 px-2.5 min-w-7",
        lg: "h-9 px-4 min-w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
