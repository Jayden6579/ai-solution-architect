import type { ArchitectureSolution, ImprovementFocus, SectionKey } from "@/types";

/**
 * Prompt engineering for the AI Solution Architect.
 *
 * The system prompt establishes the persona and pins down the exact JSON
 * contract the model must return. Pinning the schema in the prompt (in
 * addition to response_format json_object) keeps output stable across
 * OpenAI-compatible providers.
 */

const OUTPUT_CONTRACT = `
Return a SINGLE JSON object — no prose before or after, no markdown code fences — with EXACTLY these keys and types:

{
  "executiveSummary": string,            // 2-3 short paragraphs. Professional pre-sales tone. State the customer's goal, the proposed direction, and the headline outcome. Markdown allowed (bullet lists, **bold**).
  "components": {                          // Each value: recommended technology + 1-2 sentence rationale. Markdown allowed.
    "frontend": string,
    "backend": string,
    "apiLayer": string,
    "loadBalancer": string,
    "database": string,
    "cache": string,
    "messageQueue": string,
    "objectStorage": string,
    "monitoring": string,
    "logging": string,
    "security": string,
    "disasterRecovery": string,
    "network": string
  },
  "mermaidDiagram": string,              // A valid Mermaid "flowchart TD" graph string. Use subgraphs for tiers (Client, Edge, Application, Data, Cross-Region DR). NO triple-backtick fences. Use safe node ids (alphanumeric, no spaces).
  "designDecisions": [                    // 5-8 entries covering the most significant components.
    {
      "component": string,               // e.g. "OceanBase"
      "rationale": string,               // 2-4 sentences explaining WHY it was chosen for THIS customer.
      "advantages": string[],            // 3-5 concise points.
      "tradeOffs": string[]              // 2-4 honest trade-offs / limitations.
    }
  ],
  "risks": [                              // 4-7 risks across technical, operational, compliance, and delivery categories.
    {
      "id": string,                      // Stable id like "R1", "R2".
      "category": string,                // e.g. "Technical", "Operational", "Compliance", "Delivery".
      "description": string,
      "severity": "Low" | "Medium" | "High" | "Critical",
      "likelihood": "Low" | "Medium" | "High"
    }
  ],
  "mitigations": [                        // One entry per risk; riskId must match a risk id.
    {
      "riskId": string,
      "strategy": string,
      "actions": string[]               // 3-5 concrete actions.
    }
  ],
  "deployment": {
    "pattern": "Single AZ" | "Multi AZ" | "Cross Region DR",
    "rationale": string,                 // Justify the pattern against HA/DR requirements and budget.
    "topology": string[],               // 4-8 ordered deployment steps describing the topology.
    "drObjective": {
      "rto": string,                    // e.g. "< 1 hour"
      "rpo": string                     // e.g. "< 15 minutes"
    }
  }
}

Rules:
- Every risk MUST have exactly one matching mitigation (riskId == risk.id).
- Mermaid must be syntactically valid: use flowchart TD, subgraph ... end blocks, and node ids without spaces.
- Be concrete and specific to the customer's stated constraints (country, scale, HA/DR, budget, application type). Do not produce generic filler.
- If a constraint is missing, make a reasonable, clearly-stated assumption rather than asking.
`;

export const SYSTEM_PROMPT = `You are a Senior Enterprise Solution Architect and Pre-sales Engineer with 15+ years of experience designing mission-critical, cloud-native systems for regulated industries.

Your job: given a customer's natural-language requirements, produce a defensible, production-grade enterprise architecture proposal — the kind a pre-sales architect would present in a customer workshop.

You reason about the whole stack: frontend, backend, API layer, load balancing, data stores, caching, messaging, object storage, observability (monitoring + logging), security, disaster recovery, and network. You weigh trade-offs honestly, call out risks, and pair every risk with a concrete mitigation. You are pragmatic about budget and regional/compliance constraints.

${OUTPUT_CONTRACT}`;

export function buildUserPrompt(requirements: string): string {
  return `# Customer Requirements

${requirements.trim()}

---

Analyze the requirements above and generate the enterprise architecture solution as the specified JSON object. Remember: assume reasonable values for anything unstated, ground every choice in the customer's constraints, and keep the mermaid diagram valid.`;
}

const SECTION_LABELS: Record<SectionKey, string> = {
  executiveSummary: "executiveSummary",
  components: "components",
  mermaidDiagram: "mermaidDiagram",
  designDecisions: "designDecisions",
  risks: "risks",
  mitigations: "mitigations",
  deployment: "deployment",
};

const FOCUS_INSTRUCTIONS: Record<ImprovementFocus, string> = {
  design:
    "Refine the architecture for better structure, separation of concerns, and scalability. Prefer managed/cloud-native services where they reduce operational burden without over-engineering.",
  cost:
    "Reduce total cost of ownership while keeping the solution production-grade. Prefer right-sized, open-source, or pay-as-you-go options, eliminate over-provisioned tiers, and call out savings.",
  performance:
    "Improve performance and scalability: introduce caching, read replicas, horizontal scaling, connection pooling, async processing, and CDN/edge delivery where it matters.",
  security:
    "Strengthen the security posture across identity, network, data, and application layers. Re-assess the risk list (add security risks, raise severities where warranted) and add concrete mitigations (encryption, IAM/least-privilege, zero-trust, WAF, secrets management, compliance controls).",
  highAvailability:
    "Improve high availability and disaster recovery. Prefer multi-AZ or cross-region active-active/active-passive, automated failover, health checks, and tighten RTO/RPO. Update the deployment pattern and DR objective accordingly.",
};

/**
 * Builds the prompt for regenerating a subset of sections of an existing
 * solution. The current solution is provided as context so the model keeps
 * everything else consistent.
 */
export function buildRegeneratePrompt(
  solution: ArchitectureSolution,
  focus: ImprovementFocus,
  sections: SectionKey[],
): { system: string; user: string } {
  const keys = sections.map((s) => SECTION_LABELS[s]);
  const currentJson = JSON.stringify(
    stripMeta(solution),
    null,
    2,
  );

  const system = `You are a Senior Enterprise Solution Architect revising an existing architecture proposal. You are given the current solution as JSON and a focus directive. Regenerate ONLY the requested sections, keeping the rest of the solution consistent.

Return a SINGLE JSON object containing ONLY these top-level keys: ${keys.join(
    ", ",
  )}. Each key must conform to the same schema it has in the original solution. No prose, no markdown fences, no keys outside the requested list.

Focus directive: ${FOCUS_INSTRUCTIONS[focus]}`;

  const user = `# Current Solution (context — do not echo unchanged keys)

${currentJson}

# Task

Regenerate these sections only: ${keys.join(", ")}, applying the focus directive above. Return a JSON object with exactly those keys.`;

  return { system, user };
}

/** Remove meta before sending the solution back to the model. */
function stripMeta(solution: ArchitectureSolution) {
  const { meta: _meta, ...rest } = solution;
  return rest;
}
