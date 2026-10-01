import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-4",
      default: "size-5",
      lg: "size-6",
      xl: "size-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

export function Spinner({ className, size, label = "Loading...", ...props }: SpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <Loader2 className={cn(spinnerVariants({ size, className }))} {...props} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
