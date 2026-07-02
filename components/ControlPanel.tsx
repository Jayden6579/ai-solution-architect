"use client";

import { Eraser, FileText, Sparkles, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { CLOUD_PROVIDERS } from "@/types";
import type { CloudProvider, ProviderInfo } from "@/types";

const MIN_LENGTH = 10;

const TIPS = [
  "Workload / application type",
  "Country & data residency",
  "Expected users / scale",
  "High Availability & DR needs",
  "Budget tier (low / medium / high)",
];

export function ControlPanel({
  value,
  onChange,
  onGenerate,
  onClear,
  onSample,
  isGenerating,
  providerInfo,
  cloudProvider,
  onCloudProviderChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  onClear: () => void;
  onSample: () => void;
  isGenerating: boolean;
  providerInfo: ProviderInfo;
  cloudProvider: CloudProvider;
  onCloudProviderChange: (p: CloudProvider) => void;
}) {
  const canGenerate = value.trim().length >= MIN_LENGTH;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canGenerate && !isGenerating) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Provider status */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              providerInfo.mode === "live"
                ? "bg-emerald-500"
                : "bg-amber-500",
            )}
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {providerInfo.mode === "live"
              ? `Live · ${providerInfo.providerName}`
              : "Demo Mode"}
          </span>
        </div>
        <Badge variant={providerInfo.mode === "live" ? "green" : "amber"}>
          {providerInfo.model}
        </Badge>
      </div>

      {/* Target cloud provider selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Target cloud
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            drives real service names
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {CLOUD_PROVIDERS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onCloudProviderChange(p.key)}
              disabled={isGenerating}
              className={cn(
                "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                cloudProvider === p.key
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Customer Requirements
          </h2>
        </div>

        <div className="p-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            spellCheck={false}
            placeholder={
              "e.g.\nCustomer wants to migrate Oracle database to OceanBase.\nCountry: Malaysia\nUsers: 5000\nNeed High Availability.\nNeed Disaster Recovery.\nBudget is medium.\nApplication is LMS."
            }
            className={cn(
              "h-72 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[13px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:ring-brand-950",
              "disabled:opacity-60",
            )}
          />

          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>{value.trim().length} characters</span>
            <span className="hidden sm:inline">
              Press <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">⌘/Ctrl + Enter</kbd> to generate
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSample}
              disabled={isGenerating}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Sample
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={isGenerating || value.length === 0}
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="mt-3 w-full"
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? (
              <>
                <Spinner className="h-4 w-4" />
                Generating…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Architecture
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tip: include these for the best proposal
          </h3>
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-600 dark:text-slate-400">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-brand-400" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
