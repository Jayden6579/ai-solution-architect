"use client";

import {
  Activity,
  Database,
  Globe,
  LifeBuoy,
  MonitorSmartphone,
  Network,
  Package,
  ScrollText,
  Server,
  ShieldCheck,
  Workflow,
  Zap,
  Boxes,
} from "lucide-react";
import { SectionCard } from "./SectionCard";
import { Markdown } from "@/components/Markdown";
import { COMPONENT_FIELDS, type ArchitectureComponents } from "@/types";

const ICONS: Record<keyof ArchitectureComponents, React.ElementType> = {
  frontend: MonitorSmartphone,
  backend: Server,
  apiLayer: Network,
  loadBalancer: Network,
  database: Database,
  cache: Zap,
  messageQueue: Workflow,
  objectStorage: Package,
  monitoring: Activity,
  logging: ScrollText,
  security: ShieldCheck,
  disasterRecovery: LifeBuoy,
  network: Globe,
};

export function ArchitectureSection({
  components,
  regenerating,
}: {
  components: ArchitectureComponents;
  regenerating?: boolean;
}) {
  return (
    <SectionCard
      icon={<Boxes className="h-4 w-4" />}
      title="Proposed Architecture"
      index={2}
      description="Recommended components across the full stack"
      regenerating={regenerating}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COMPONENT_FIELDS.map(({ key, label }) => {
          const Icon = ICONS[key];
          return (
            <div
              key={key}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {label}
                </span>
              </div>
              <Markdown className="text-[13px]">{components[key]}</Markdown>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
