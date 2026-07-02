"use client";

import { Check, Minus, Scale } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { Markdown } from "@/components/Markdown";
import { Badge } from "@/components/ui/Badge";
import type { DesignDecision } from "@/types";

export function DesignDecisionsSection({
  decisions,
  regenerating,
}: {
  decisions: DesignDecision[];
  regenerating?: boolean;
}) {
  return (
    <SectionCard
      icon={<Scale className="h-4 w-4" />}
      title="Design Decisions"
      index={4}
      description="Why each component was selected — advantages and trade-offs"
      regenerating={regenerating}
    >
      <div className="space-y-3">
        {decisions.map((d, i) => (
          <div
            key={`${d.component}-${i}`}
            className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge variant="brand">{d.component}</Badge>
            </div>
            <Markdown className="text-[13px]">{d.rationale}</Markdown>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Advantages
                </div>
                <ul className="space-y-1">
                  {d.advantages.map((a, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-[13px] text-slate-600 dark:text-slate-300"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  <Minus className="h-3.5 w-3.5" />
                  Trade-offs
                </div>
                <ul className="space-y-1">
                  {d.tradeOffs.map((t, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-[13px] text-slate-600 dark:text-slate-300"
                    >
                      <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
