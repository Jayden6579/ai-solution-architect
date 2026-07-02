"use client";

import * as React from "react";
import { Check, Copy, FileDown, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  downloadMarkdown,
  downloadPdf,
  solutionToMarkdown,
  copyToClipboard,
} from "@/lib/download";
import type { ArchitectureSolution } from "@/types";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function ExportControls({
  solution,
}: {
  solution: ArchitectureSolution;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(solutionToMarkdown(solution));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="sticky top-20 z-30 -mx-1 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/85 px-3 py-2.5 shadow-card backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
        <span className="truncate">
          Proposal · {formatTime(solution.meta.generatedAt)}
        </span>
        {solution.meta.focus ? (
          <Badge variant="brand">{solution.meta.focus} focus</Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadMarkdown(solution)}
          className="gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          Markdown
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => downloadPdf(solution)}
          className="gap-1.5"
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </Button>
      </div>
    </div>
  );
}
