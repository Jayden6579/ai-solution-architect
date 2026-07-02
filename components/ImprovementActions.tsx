"use client";

import * as React from "react";
import {
  DollarSign,
  Gauge,
  LayoutDashboard,
  ServerCog,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { IMPROVEMENT_CONFIG } from "@/lib/llm/improvements";
import { cn } from "@/lib/utils";
import type { ImprovementFocus } from "@/types";

const ICONS: Record<ImprovementFocus, LucideIcon> = {
  design: LayoutDashboard,
  cost: DollarSign,
  performance: Gauge,
  security: ShieldCheck,
  highAvailability: ServerCog,
};

export function ImprovementActions({
  onImprove,
  activeFocus,
  disabled,
}: {
  onImprove: (focus: ImprovementFocus) => void;
  activeFocus: ImprovementFocus | null;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Refine the proposal
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {IMPROVEMENT_CONFIG.map(({ key, label, description }) => {
          const Icon = ICONS[key];
          const isActive = activeFocus === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onImprove(key)}
              disabled={disabled}
              title={description}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 text-left transition-all hover:border-brand-300 hover:bg-brand-50/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-brand-700 dark:hover:bg-brand-950/40",
                isActive && "border-brand-400 bg-brand-50 dark:border-brand-700 dark:bg-brand-950/60",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 text-slate-500 transition-colors group-hover:text-brand-600 dark:text-slate-400 dark:group-hover:text-brand-400",
                  isActive && "text-brand-600 dark:text-brand-400",
                )}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {label}
              </span>
              <span className="text-[10px] leading-tight text-slate-400 dark:text-slate-500">
                {description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
