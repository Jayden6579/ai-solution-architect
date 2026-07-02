/**
 * Domain model for an AI-generated enterprise architecture solution.
 *
 * These types are the single source of truth shared between the LLM layer
 * (parsing/validation), the server actions, and the React UI.
 */

export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Likelihood = "Low" | "Medium" | "High";
export type DeploymentPattern = "Single AZ" | "Multi AZ" | "Cross Region DR";

/**
 * The proposed architecture broken down into the standard building blocks a
 * solution architect reasons about during pre-sales. Each value is a short
 * recommendation (technology + one-line rationale); markdown is allowed.
 */
export interface ArchitectureComponents {
  frontend: string;
  backend: string;
  apiLayer: string;
  loadBalancer: string;
  database: string;
  cache: string;
  messageQueue: string;
  objectStorage: string;
  monitoring: string;
  logging: string;
  security: string;
  disasterRecovery: string;
  network: string;
}

export interface DesignDecision {
  /** Component / technology being justified, e.g. "OceanBase". */
  component: string;
  rationale: string;
  advantages: string[];
  tradeOffs: string[];
}

export interface Risk {
  /** Stable identifier used to link mitigations, e.g. "R1". */
  id: string;
  category: string;
  description: string;
  severity: Severity;
  likelihood: Likelihood;
}

export interface Mitigation {
  /** Matches a Risk.id. */
  riskId: string;
  strategy: string;
  actions: string[];
}

export interface DeploymentRecommendation {
  pattern: DeploymentPattern;
  rationale: string;
  topology: string[];
  drObjective: {
    rto: string;
    rpo: string;
  };
}

export interface SolutionMeta {
  generatedAt: string;
  model: string;
  provider: string;
  /** "live" when a real LLM was used, "demo" when the mock provider answered. */
  mode: "live" | "demo";
  /** Focus applied during the most recent regeneration, if any. */
  focus?: ImprovementFocus;
}

export interface ArchitectureSolution {
  executiveSummary: string;
  components: ArchitectureComponents;
  mermaidDiagram: string;
  designDecisions: DesignDecision[];
  risks: Risk[];
  mitigations: Mitigation[];
  deployment: DeploymentRecommendation;
  meta: SolutionMeta;
}

/**
 * Sections that can be regenerated independently by the bonus "improve"
 * buttons. Mirrors the top-level keys of ArchitectureSolution (minus meta).
 */
export type SectionKey =
  | "executiveSummary"
  | "components"
  | "mermaidDiagram"
  | "designDecisions"
  | "risks"
  | "mitigations"
  | "deployment";

export type ImprovementFocus =
  | "design"
  | "cost"
  | "performance"
  | "security"
  | "highAvailability";

/** Result of a section regeneration: a partial patch to merge into the solution. */
export type SolutionPatch = Partial<
  Pick<
    ArchitectureSolution,
    | "executiveSummary"
    | "components"
    | "mermaidDiagram"
    | "designDecisions"
    | "risks"
    | "mitigations"
    | "deployment"
  >
>;

export interface ProviderInfo {
  mode: "live" | "demo";
  model: string;
  providerName: string;
}

/** Ordered list used to render the architecture component grid + ordering. */
export const COMPONENT_FIELDS: {
  key: keyof ArchitectureComponents;
  label: string;
}[] = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "apiLayer", label: "API Layer" },
  { key: "loadBalancer", label: "Load Balancer" },
  { key: "database", label: "Database" },
  { key: "cache", label: "Cache" },
  { key: "messageQueue", label: "Message Queue" },
  { key: "objectStorage", label: "Object Storage" },
  { key: "monitoring", label: "Monitoring" },
  { key: "logging", label: "Logging" },
  { key: "security", label: "Security" },
  { key: "disasterRecovery", label: "Disaster Recovery" },
  { key: "network", label: "Network" },
];
