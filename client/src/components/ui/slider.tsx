import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, style, ...props }, ref) => {
  // Extract CSS variable values from style prop for use in child elements
  const cssVars = style as Record<string, string> | undefined;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      style={style}
      {...props}
    >
      <SliderPrimitive.Track
        className="relative w-full grow overflow-hidden"
        style={{
          height: cssVars?.['--slider-height'] || '8px',
          borderRadius: cssVars?.['--slider-border-radius'] || '9999px',
          backgroundColor: cssVars?.['--slider-track-bg'] || '#e5e7eb',
        }}
      >
        <SliderPrimitive.Range
          className="absolute h-full"
          style={{
            backgroundColor: cssVars?.['--slider-range-bg'] || 'hsl(var(--primary))',
          }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block border-2 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
        style={{
          width: cssVars?.['--slider-thumb-size'] || '20px',
          height: cssVars?.['--slider-thumb-size'] || '20px',
          borderRadius: cssVars?.['--slider-thumb-border-radius'] || '50%',
          backgroundColor: cssVars?.['--slider-thumb-bg'] || 'hsl(var(--background))',
          borderColor: cssVars?.['--slider-range-bg'] || 'hsl(var(--primary))',
        }}
      />
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }