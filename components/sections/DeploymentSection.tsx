"use client";

import { Rocket, Clock, RefreshCw } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { Markdown } from "@/components/Markdown";
import { Badge } from "@/components/ui/Badge";
import type { DeploymentRecommendation } from "@/types";

const PATTERN_VARIANT: Record<
  DeploymentRecommendation["pattern"],
  "green" | "blue" | "amber"
> = {
  "Single AZ": "amber",
  "Multi AZ": "blue",
  "Cross Region DR": "green",
};

export function DeploymentSection({
  deployment,
  regenerating,
}: {
  deployment: DeploymentRecommendation;
  regenerating?: boolean;
}) {
  return (
    <SectionCard
      icon={<Rocket className="h-4 w-4" />}
      title="Deployment Recommendation"
      index={7}
      description="Topology and disaster-recovery objectives"
      regenerating={regenerating}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Pattern
        </span>
        <Badge variant={PATTERN_VARIANT[deployment.pattern]}>
          {deployment.pattern}
        </Badge>
      </div>

      <Markdown className="text-[13px]">{deployment.rationale}</Markdown>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Topology
        </div>
        <ol className="space-y-2">
          {deployment.topology.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {i + 1}
              </span>
              <span className="text-[13px] text-slate-600 dark:text-slate-300">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" /> RTO
          </div>
          <div className="mt-1 text-lg font-bold text-brand-700 dark:text-brand-300">
            {deployment.drObjective.rto}
          </div>
          <div className="text-[11px] text-slate-400">Recovery Time Objective</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <RefreshCw className="h-3.5 w-3.5" /> RPO
          </div>
          <div className="mt-1 text-lg font-bold text-brand-700 dark:text-brand-300">
            {deployment.drObjective.rpo}
          </div>
          <div className="text-[11px] text-slate-400">Recovery Point Objective</div>
        </div>
      </div>
    </SectionCard>
  );
}
