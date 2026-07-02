"use client";

import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { Badge } from "@/components/ui/Badge";
import type { Mitigation } from "@/types";

export function MitigationsSection({
  mitigations,
  regenerating,
}: {
  mitigations: Mitigation[];
  regenerating?: boolean;
}) {
  return (
    <SectionCard
      icon={<ShieldCheck className="h-4 w-4" />}
      title="Mitigations"
      index={6}
      description="Concrete strategies to reduce each risk"
      regenerating={regenerating}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mitigations.map((m, i) => (
          <div
            key={`${m.riskId}-${i}`}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40"
          >
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="neutral">{m.riskId}</Badge>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {m.strategy}
              </span>
            </div>
            <ul className="space-y-1.5">
              {m.actions.map((a, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-[13px] text-slate-600 dark:text-slate-300"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
