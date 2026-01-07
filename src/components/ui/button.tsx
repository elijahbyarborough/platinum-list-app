import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",
          // Variants
          {
            // Default - Primary green button
            "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md": variant === "default",
            // Outline - Subtle border
            "border border-border bg-transparent hover:bg-secondary hover:border-border/80 text-foreground": variant === "outline",
            // Ghost - No background
            "hover:bg-secondary text-muted-foreground hover:text-foreground": variant === "ghost",
            // Destructive - Red
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
          },
          // Sizes
          {
            "h-10 px-4 py-2 text-sm": size === "default",
            "h-9 px-3 text-sm": size === "sm",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
