"use client";

import { Sparkles, Cpu, Coins, Activity } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { Markdown } from "@/components/Markdown";
import { Badge } from "@/components/ui/Badge";
import type { AiServiceSection } from "@/types";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function AiServicesSection({
  aiSection,
  regenerating,
}: {
  aiSection: AiServiceSection;
  regenerating?: boolean;
}) {
  const { approach, models, tokenEstimate, note } = aiSection;
  const primary = models[0];

  return (
    <SectionCard
      icon={<Sparkles className="h-4 w-4" />}
      title="AI Services & Token Estimation"
      index={8}
      description="Recommended AI approach, models, and representative token cost"
      regenerating={regenerating}
    >
      <Markdown>{approach}</Markdown>

      {/* Model options */}
      <div className="mt-3 space-y-2">
        {models.map((m, i) => (
          <div
            key={`${m.name}-${i}`}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={i === 0 ? "brand" : "neutral"}>{m.name}</Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {m.provider}
              </span>
              {i === 0 ? (
                <span className="text-[10px] font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                  primary
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
              {m.use}
            </p>
            {m.inputPricePer1M !== undefined && m.outputPricePer1M !== undefined ? (
              <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                ~${m.inputPricePer1M}/1M in · ~${m.outputPricePer1M}/1M out
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {/* Token estimate */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Activity className="h-3.5 w-3.5" /> Sessions/day
          </div>
          <div className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
            {tokenEstimate.dailySessions.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Cpu className="h-3.5 w-3.5" /> In tokens/mo
          </div>
          <div className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
            {formatTokens(tokenEstimate.monthlyInputTokens)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Cpu className="h-3.5 w-3.5" /> Out tokens/mo
          </div>
          <div className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
            {formatTokens(tokenEstimate.monthlyOutputTokens)}
          </div>
        </div>
        <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-900 dark:bg-brand-950/40">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
            <Coins className="h-3.5 w-3.5" /> Est. cost/mo
          </div>
          <div className="mt-1 text-base font-bold text-brand-700 dark:text-brand-300">
            ${tokenEstimate.estMonthlyCostUsd.toLocaleString()}
            <span className="ml-1 text-[10px] font-normal text-brand-500/70 dark:text-brand-400/70">
              via {primary?.name}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
        {tokenEstimate.disclaimer}
      </p>

      {note ? (
        <p className="mt-2 rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2 text-[12px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
          {note}
        </p>
      ) : null}
    </SectionCard>
  );
}
