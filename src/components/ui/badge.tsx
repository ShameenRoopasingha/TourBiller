import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_0_var(--border-specular)] hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:bg-destructive/90",
        outline:
          "border-border/80 text-foreground shadow-[inset_0_1px_0_0_var(--border-specular)]",
        active:
          "bg-emerald-500/10 text-emerald-800 border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20 dark:shadow-[inset_0_1px_0_0_rgba(52,211,153,0.15)]",
        "on-tour":
          "bg-amber-500/10 text-amber-800 border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20 dark:shadow-[inset_0_1px_0_0_rgba(251,191,36,0.15)]",
        maintenance:
          "bg-rose-500/10 text-rose-800 border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/20 dark:shadow-[inset_0_1px_0_0_rgba(251,113,133,0.15)]",
        scheduled:
          "bg-indigo-500/10 text-indigo-800 border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400/20 dark:shadow-[inset_0_1px_0_0_rgba(129,140,248,0.15)]",
        radar:
          "bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.5)] dark:bg-emerald-400 dark:text-zinc-950 font-bold dark:shadow-[0_0_24px_rgba(52,211,153,0.7)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
