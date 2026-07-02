"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

/**
 * Wrapper for one output section. Provides a consistent header (numbered icon,
 * title, optional description and actions) and an optional "regenerating"
 * overlay used by the bonus improve buttons.
 */
export function SectionCard({
  icon,
  title,
  index,
  description,
  actions,
  regenerating,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  index?: number;
  description?: string;
  actions?: React.ReactNode;
  regenerating?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {typeof index === "number" ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {index}
            </div>
          ) : null}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            {description ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="relative px-5 py-4">
        <div
          className={cn(
            "transition-opacity",
            regenerating ? "opacity-40" : "opacity-100",
          )}
        >
          {children}
        </div>
        {regenerating ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur dark:bg-slate-800/90 dark:text-slate-200">
              <Spinner className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              Regenerating…
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
