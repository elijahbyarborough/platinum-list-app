import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          // Base styles
          "flex h-11 w-full rounded-lg px-4 py-2 text-sm",
          // Colors - dark theme with stronger specificity
          "!bg-[hsl(var(--secondary))] border border-border !text-foreground",
          // Focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50",
          "transition-all duration-200",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Custom arrow - lighter gray for dark theme
          "appearance-none cursor-pointer",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%23a1a1aa%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]",
          "bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat pr-10",
          className
        )}
        ref={ref}
        {...props}
        style={{
          backgroundColor: 'hsl(var(--secondary))',
          color: 'hsl(var(--foreground))',
        }}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }
