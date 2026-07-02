import * as React from "react";
import { cn } from "@/lib/utils";

/** A shimmering placeholder block. Uses the `.skeleton` shimmer CSS. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}
