import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onWheel, ...props }, ref) => {
    // Prevent scroll wheel from changing number input values
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (type === 'number') {
        e.currentTarget.blur();
      }
      onWheel?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-11 w-full rounded-lg px-4 py-2 text-sm font-mono",
          // Colors - dark theme with stronger specificity
          "!bg-[hsl(var(--secondary))] border border-border !text-foreground",
          "placeholder:text-muted-foreground/60",
          // Date input specific styling
          type === 'date' && "[color-scheme:dark]",
          // Focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50",
          "transition-all duration-200",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        onWheel={handleWheel}
        {...props}
        style={{
          backgroundColor: 'hsl(var(--secondary))',
          color: 'hsl(var(--foreground))',
          ...(type === 'date' && { colorScheme: 'dark' }),
        }}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
