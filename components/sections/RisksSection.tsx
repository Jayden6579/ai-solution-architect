"use client";

import { AlertTriangle } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { Badge, SeverityBadge, LikelihoodBadge } from "@/components/ui/Badge";
import type { Risk } from "@/types";

export function RisksSection({
  risks,
  regenerating,
}: {
  risks: Risk[];
  regenerating?: boolean;
}) {
  return (
    <SectionCard
      icon={<AlertTriangle className="h-4 w-4" />}
      title="Risks"
      index={5}
      description="Implementation risks ranked by severity and likelihood"
      regenerating={regenerating}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2 pr-3 font-semibold">ID</th>
              <th className="py-2 pr-3 font-semibold">Category</th>
              <th className="py-2 pr-3 font-semibold">Description</th>
              <th className="py-2 pr-3 font-semibold">Severity</th>
              <th className="py-2 font-semibold">Likelihood</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {risks.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="py-2.5 pr-3">
                  <Badge variant="neutral">{r.id}</Badge>
                </td>
                <td className="py-2.5 pr-3">
                  <Badge variant="blue">{r.category}</Badge>
                </td>
                <td className="py-2.5 pr-3 text-[13px] text-slate-600 dark:text-slate-300">
                  {r.description}
                </td>
                <td className="py-2.5 pr-3">
                  <SeverityBadge value={r.severity} />
                </td>
                <td className="py-2.5">
                  <LikelihoodBadge value={r.likelihood} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
