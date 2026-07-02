import type { ImprovementFocus, SectionKey } from "@/types";

/**
 * Configuration for the bonus "improve" actions. Each focus maps to:
 *  - the sections that should be regenerated (the rest are kept as-is)
 *  - a human label, icon hint, and short description for the UI
 *
 * This is the single source of truth for "which button touches which section".
 */
export interface ImprovementConfig {
  key: ImprovementFocus;
  label: string;
  description: string;
  sections: SectionKey[];
}

export const IMPROVEMENT_CONFIG: ImprovementConfig[] = [
  {
    key: "design",
    label: "Improve Design",
    description: "Refine structure & separation of concerns",
    sections: ["components", "designDecisions"],
  },
  {
    key: "cost",
    label: "Reduce Cost",
    description: "Optimize TCO without sacrificing quality",
    sections: ["designDecisions", "deployment"],
  },
  {
    key: "performance",
    label: "Improve Performance",
    description: "Caching, scaling, replicas, async",
    sections: ["components", "designDecisions"],
  },
  {
    key: "security",
    label: "Improve Security",
    description: "Harden posture & re-assess risks",
    sections: ["risks", "mitigations"],
  },
  {
    key: "highAvailability",
    label: "Improve High Availability",
    description: "Multi-AZ failover & tighter DR",
    sections: ["deployment", "components"],
  },
];

export function getImprovementConfig(
  focus: ImprovementFocus,
): ImprovementConfig {
  const found = IMPROVEMENT_CONFIG.find((c) => c.key === focus);
  if (!found) {
    throw new Error(`Unknown improvement focus: ${focus}`);
  }
  return found;
}
