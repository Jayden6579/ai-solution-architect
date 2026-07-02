import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral:
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        brand:
          "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        green:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
        amber:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
        orange:
          "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
        red:
          "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400",
        blue:
          "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

import type { Severity, Likelihood } from "@/types";

export function SeverityBadge({ value }: { value: Severity }) {
  const variant =
    value === "Critical"
      ? "red"
      : value === "High"
        ? "orange"
        : value === "Medium"
          ? "amber"
          : "green";
  return <Badge variant={variant as BadgeProps["variant"]}>{value}</Badge>;
}

export function LikelihoodBadge({ value }: { value: Likelihood }) {
  const variant =
    value === "High" ? "orange" : value === "Medium" ? "amber" : "green";
  return <Badge variant={variant as BadgeProps["variant"]}>{value}</Badge>;
}
