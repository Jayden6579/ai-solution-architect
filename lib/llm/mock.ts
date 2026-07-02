import type {
  AiModelOption,
  AiServiceSection,
  ArchitectureComponents,
  ArchitectureSolution,
  CloudProvider,
  DesignDecision,
  DeploymentRecommendation,
  ImprovementFocus,
  Mitigation,
  Risk,
  SectionKey,
} from "@/types";
import {
  AI_KEYWORDS,
  AI_MODEL_PRICING,
  AI_PLATFORM,
  CLOUD_CATALOG,
  CLOUD_LABEL,
} from "@/lib/cloud/catalog";

/**
 * Built-in demo provider.
 *
 * Used automatically when LLM_API_KEY is not configured, so the application
 * can be showcased end-to-end without any external dependency. Unlike a fixed
 * template, it performs structured requirement analysis — detecting domain,
 * scale, HA/DR, budget, region, compliance, AI relevance, AND the selected
 * cloud provider — and composes a *visibly different* architecture, diagram,
 * decision set, and risk profile for each combination.
 *
 * It is still rule-based (not a real LLM): the goal is that two different
 * customer briefs (or two different cloud providers) produce two clearly
 * different proposals, not that it is genuinely intelligent. For true
 * intelligence, configure an LLM provider.
 */

/** Convenience accessor for the selected provider's service catalog. Falls back
 * to Kingsoft if the provider is somehow undefined (e.g. a stale client bundle). */
function cat(d: DetectedRequirements) {
  return CLOUD_CATALOG[d.cloudProvider] ?? CLOUD_CATALOG.kingsoft;
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Domain = "financial" | "healthcare" | "retail" | "education" | "general";
type Scale = "small" | "medium" | "large" | "xlarge";
type Budget = "low" | "medium" | "high";

interface DetectedRequirements {
  domain: Domain;
  db: string; // source database (migration) or "" (greenfield)
  dbTarget: string; // target database (engine for migrations, managed DB name for greenfield)
  isMigration: boolean;
  country: string;
  region: string; // cloud region
  users: number;
  scale: Scale;
  ha: boolean;
  dr: boolean;
  budget: Budget;
  appType: string;
  compliance: string[];
  cloudProvider: CloudProvider;
  aiRelevant: boolean;
  /** Recommended AI approach narrative (only meaningful when aiRelevant). */
  aiApproach: string;
}

/** Per-domain content profile driving the generated proposal. */
interface DomainProfile {
  label: string;
  /** Backend domain modules, used in the backend component text + diagram. */
  modules: string[];
  /** What object storage is primarily used for. */
  storageUse: string;
  /** What the message queue is primarily used for. */
  queueUse: string;
  /** Domain-specific API-layer note. */
  apiNote: string;
  /** Domain-specific security emphasis. */
  securityFocus: string;
  /** Compliance regimes to call out. */
  compliance: string[];
  /** A domain-specific design decision. */
  decision: Omit<DesignDecision, never>;
  /** Extra diagram nodes (id, label, tier, connectsFrom, connectsTo). */
  diagramNodes: DiagramNode[];
}

interface DiagramNode {
  id: string;
  label: string;
  tier: "App" | "Data";
  connectFrom: string;
  connectTo?: string;
}

/* -------------------------------------------------------------------------- */
/* Domain profiles                                                            */
/* -------------------------------------------------------------------------- */

const DOMAIN_PROFILES: Record<Domain, DomainProfile> = {
  financial: {
    label: "financial services / core banking",
    modules: ["Accounts", "Payments", "Ledger", "KYC/AML", "Fraud Detection"],
    storageUse: "signed statements, KYC documents, and tamper-evident audit archives",
    queueUse: "an event stream for the transaction ledger (event sourcing), notifications, and async sanctions/fraud checks",
    apiNote: "Open Banking/PSD2-style APIs alongside internal ones, with strong idempotency and signed requests",
    securityFocus:
      "PCI-DSS scope reduction, HSM-backed key management, mutual TLS between services, immutable audit trails, and AML/KYC workflow controls",
    compliance: ["PCI-DSS", "AML/KYC"],
    decision: {
      component: "Event-Sourced Ledger (Kafka + CQRS)",
      rationale:
        "Financial transactions demand an append-only, replayable source of truth. An event-sourced ledger on Kafka gives immutable history, exact-once semantics, and lets read models (balances, statements) be rebuilt without touching the transactional core.",
      advantages: [
        "Immutable, auditable history of every transaction",
        "Read models can be rebuilt/replayed without risking the core",
        "Natural fit for fraud detection and analytics consumers",
      ],
      tradeOffs: [
        "Eventual consistency on read models needs careful UX handling",
        "Schema evolution discipline is required (versioned events)",
        "Higher operational complexity than a CRUD ledger",
      ],
    },
    diagramNodes: [
      { id: "FRAUD", label: "Fraud Engine", tier: "App", connectFrom: "API" },
      { id: "LEDGER", label: "Ledger (event store)", tier: "Data", connectFrom: "MQ", connectTo: "DB" },
    ],
  },
  healthcare: {
    label: "healthcare / clinical",
    modules: ["Patients", "Appointments", "EHR Integration", "Prescriptions", "Clinical Billing"],
    storageUse: "medical documents and imaging (DICOM), with immutable retention",
    queueUse: "asynchronous HL7/FHIR message processing, lab result ingestion, and patient notifications",
    apiNote: "FHIR R4 APIs as the interoperability layer, with consent-gated access to clinical records",
    securityFocus:
      "HIPAA/PDPA-aligned controls: field-level encryption for PHI, consent management, break-glass audit logging, and least-privilege access per clinician role",
    compliance: ["HIPAA", "PDPA"],
    decision: {
      component: "FHIR Interoperability Layer",
      rationale:
        "A FHIR R4 API layer decouples the clinical data model from internal storage and is the de-facto standard for EHR/health-system integration. It enables consent-gated, standards-compliant data exchange with hospitals, labs, and payer systems.",
      advantages: [
        "Standards-based exchange with EHRs, labs, and payers",
        "Consent-gated access to PHI is enforceable at the API",
        "Decouples internal storage schema from the interoperability contract",
      ],
      tradeOffs: [
        "FHIR modeling has a learning curve for the team",
        "Mapping internal entities to FHIR resources needs governance",
        "Some legacy systems still speak HL7 v2 (needs an adapter)",
      ],
    },
    diagramNodes: [
      { id: "FHIR", label: "FHIR API Gateway", tier: "App", connectFrom: "API" },
      { id: "EHR", label: "EHR Sync", tier: "App", connectFrom: "FHIR" },
    ],
  },
  retail: {
    label: "retail / e-commerce",
    modules: ["Catalog", "Cart", "Orders", "Inventory", "Payments", "Recommendations"],
    storageUse: "product images and media assets, served via CDN with on-the-fly resizing",
    queueUse: "the order pipeline (place → reserve → fulfill), inventory sync, and real-time analytics",
    apiNote: "a Backend-for-Frontend per channel (web, mobile) plus public webhooks for partners and marketplaces",
    securityFocus:
      "PCI-DSS for payments (tokenization + scope reduction), bot/abuse protection on hot endpoints, and rate limiting during flash sales",
    compliance: ["PCI-DSS", "PDPA"],
    decision: {
      component: "Edge Personalization + CDN",
      rationale:
        "E-commerce conversion is dominated by perceived speed and relevance. Serving catalog and media from the CDN edge, with edge-side personalization for recommendations and A/B tests, keeps time-to-first-byte low and absorbs flash-sale traffic before it reaches the origin.",
      advantages: [
        "Sub-100ms TTFB for catalog and media globally",
        "Edge absorbs flash-sale spikes before they hit the origin",
        "Personalization and experimentation at the edge",
      ],
      tradeOffs: [
        "Cache invalidation for price/inventory changes needs care",
        "Edge logic adds a deployment surface to manage",
        "Eventually-consistent inventory must be reconciled async",
      ],
    },
    diagramNodes: [
      { id: "SEARCH", label: "Search & Recs", tier: "App", connectFrom: "API" },
      { id: "INV", label: "Inventory", tier: "Data", connectFrom: "BE1", connectTo: "DB" },
    ],
  },
  education: {
    label: "education / LMS",
    modules: ["Courses", "Enrollments", "Assessments", "Progress", "Billing"],
    storageUse: "course videos, documents, and learner uploads, tiered to archive for cold content",
    queueUse: "video transcoding, notification fan-out, and learning-analytics events",
    apiNote: "REST for transactional writes (enrollments, payments) with idempotency keys, GraphQL for dashboard aggregation",
    securityFocus:
      "data privacy for minors/learners (FERPA/PDPA), role-based access (learner/instructor/admin), and protection of assessment integrity",
    compliance: ["FERPA", "PDPA"],
    decision: {
      component: "ISR + Async Video Pipeline",
      rationale:
        "Course catalogs are mostly static but personalized per learner. Incremental Static Regeneration (ISR) renders catalog pages at the edge and revalidates on change, while a transcoder pipeline (queue → workers → object storage) handles uploaded video off the request path.",
      advantages: [
        "Near-instant catalog loads at the edge",
        "Heavy transcoding never blocks the learner's request",
        "Cheap scaling of read-heavy catalog traffic",
      ],
      tradeOffs: [
        "ISR revalidation windows can briefly show stale data",
        "Transcoding pipeline needs idempotent workers and retries",
        "CDN caching complicates per-learner personalization",
      ],
    },
    diagramNodes: [
      { id: "VIDEO", label: "Transcoder", tier: "App", connectFrom: "MQ", connectTo: "S3" },
    ],
  },
  general: {
    label: "general enterprise",
    modules: ["Core Domain", "Users & Access", "Billing", "Notifications"],
    storageUse: "documents, uploads, and backups",
    queueUse: "background jobs, notifications, and analytics events",
    apiNote: "REST for writes with idempotency keys, GraphQL for flexible reads",
    securityFocus:
      "defense in depth: WAF + DDoS protection at the edge, mTLS between services, secrets in a managed vault, least-privilege IAM, and encryption in transit and at rest",
    compliance: ["PDPA"],
    decision: {
      component: "Modular Monolith (BFF)",
      rationale:
        "At a general enterprise scale, a modular monolith with a Backend-for-Frontend balances delivery speed and clean boundaries, and can be split into services later without re-architecture when domains grow.",
      advantages: [
        "Faster iteration than microservices at this scale",
        "Clear module boundaries ease a future split",
        "Single deployable simplifies operations",
      ],
      tradeOffs: [
        "Module boundaries need enforced discipline",
        "Shared database risks coupling if not partitioned",
        "Scaling is per-deployment until split",
      ],
    },
    diagramNodes: [],
  },
};

/* -------------------------------------------------------------------------- */
/* Country → cloud region                                                     */
/* -------------------------------------------------------------------------- */

const COUNTRY_REGION: Record<string, string> = {
  malaysia: "ap-southeast-3",
  singapore: "ap-southeast-1",
  indonesia: "ap-southeast-3",
  thailand: "ap-southeast-7",
  vietnam: "ap-southeast-1",
  philippines: "ap-southeast-3",
  japan: "ap-northeast-1",
  india: "ap-south-1",
  uae: "me-central-1",
  "saudi arabia": "me-central-1",
  "saudi": "me-central-1",
  australia: "ap-southeast-2",
  "united kingdom": "eu-west-2",
  uk: "eu-west-2",
  germany: "eu-central-1",
  usa: "us-east-1",
  "united states": "us-east-1",
};

/* -------------------------------------------------------------------------- */
/* Detection                                                                  */
/* -------------------------------------------------------------------------- */

function detectDomain(t: string): Domain {
  if (/\bbank|banking|core banking|fintech|financial|payments?|ledger|trading|insurance/.test(t))
    return "financial";
  if (/healthcare|hospital|patient|ehr|emr|clinical|medical|prescription|pharma/.test(t))
    return "healthcare";
  if (/ecommerce|e-commerce|retail|shop|storefront|marketplace|cart|catalog/.test(t))
    return "retail";
  if (/lms|learning management|moodle|canvas|education|course|enrollment|student|assessment/.test(t))
    return "education";
  return "general";
}

function detectAppType(t: string, domain: Domain): string {
  if (domain === "financial") return "a core banking / fintech platform";
  if (domain === "healthcare") return "a patient portal & EHR integration platform";
  if (domain === "retail") return "an e-commerce storefront & order platform";
  if (domain === "education") return "an LMS (Learning Management System)";
  return "an enterprise application";
}

function detectDb(
  t: string,
  cloudProvider: CloudProvider,
): { db: string; dbTarget: string; isMigration: boolean } {
  const isMigration = /migrat|move (from|off)|replace|moderniz|cut[- ]?over|cutover/.test(t);
  const isOracle = /oracle/.test(t);
  const isSqlServer = /sql\s*server|mssql/.test(t);
  const isMySQL = /mysql/.test(t);
  const isPostgres = /postgres|postgresql/.test(t);
  const wantsOceanBase = /oceanbase/.test(t);

  if (!isMigration && !isOracle && !isSqlServer && !isMySQL && !isPostgres && !wantsOceanBase) {
    // Greenfield — use the selected cloud's managed database product.
    return { db: "", dbTarget: CLOUD_CATALOG[cloudProvider].database.name, isMigration: false };
  }

  const dbTarget = wantsOceanBase
    ? "OceanBase"
    : isPostgres
      ? "PostgreSQL / Aurora PostgreSQL"
      : isMySQL
        ? "MySQL / Aurora MySQL"
        : isSqlServer
          ? "PostgreSQL (refactored from SQL Server)"
          : "OceanBase";

  const db = isOracle
    ? "Oracle Database"
    : isSqlServer
      ? "Microsoft SQL Server"
      : isMySQL
        ? "MySQL"
        : isPostgres
          ? "PostgreSQL"
          : "a legacy relational database";

  return { db, dbTarget, isMigration: true };
}

function scaleOf(users: number): Scale {
  if (users >= 50000) return "xlarge";
  if (users >= 10000) return "large";
  if (users >= 1000) return "medium";
  return "small";
}

function detect(
  text: string,
  cloudProvider: CloudProvider = "kingsoft",
): DetectedRequirements {
  const t = text.toLowerCase();

  const countryMatch =
    t.match(/country:\s*([a-z][a-z ,]*)/) ??
    t.match(
      /\b(malaysia|singapore|indonesia|thailand|vietnam|philippines|japan|india|uae|saudi arabia|saudi|australia|united kingdom|uk|germany|usa|united states)\b/,
    );
  const countryRaw = countryMatch?.[1]?.trim().replace(/,$/, "") ?? "malaysia";
  // Capitalize each word for display ("saudi arabia" -> "Saudi Arabia").
  const country = countryRaw.replace(/\b\w/g, (c) => c.toUpperCase());
  const region = COUNTRY_REGION[country.toLowerCase()] ?? "ap-southeast-1";

  const usersMatch = t.match(/users?:\s*([\d,]+)/) ?? t.match(/([\d,]+)\s*users/);
  const users = usersMatch ? Number(usersMatch[1].replace(/,/g, "")) : 5000;
  const scale = scaleOf(users);

  const ha = /high availability|\bha\b|always[- ]on|active[- ]active|zero downtime|no downtime/.test(t) || users >= 1000;
  const dr = /disaster recovery|\bdr\b|failover|business continuity|cross[- ]region|cross-region/.test(t);

  const budgetMatch = t.match(/budget[^a-z]*?(low|medium|high)/);
  const budget = (budgetMatch?.[1] as Budget) ?? "medium";

  const domain = detectDomain(t);
  const { db, dbTarget, isMigration } = detectDb(t, cloudProvider);
  const appType = detectAppType(t, domain);
  const aiRelevant = AI_KEYWORDS.test(t);
  const aiApproach = /rag|知识库|knowledge base|检索增强/.test(t)
    ? "Retrieval-Augmented Generation (RAG) over a knowledge base, with the LLM accessed via the cloud AI platform's managed inference endpoint."
    : /agent|智能体|tool[- ]?use/.test(t)
      ? "An agent / tool-use pattern: the LLM orchestrates tools and APIs via the cloud AI platform."
      : /fine-?tune|微调/.test(t)
        ? "Fine-tuning a foundation model on domain data, hosted on the cloud AI platform, with a fallback to base-model API calls."
        : "API-based calls to a managed large model via the cloud AI platform (chat / assistant / summarization).";

  // Region-specific compliance additions.
  const compliance = [...DOMAIN_PROFILES[domain].compliance];
  if (/singapore/.test(t) && domain === "financial") compliance.push("MAS TRM");
  if (/(malaysia|thailand|indonesia|philippines|vietnam|singapore)/.test(t) && !compliance.includes("PDPA"))
    compliance.push("PDPA");
  if (/(germany|eu|europe)/.test(t) && !compliance.includes("GDPR")) compliance.push("GDPR");

  return {
    domain,
    db,
    dbTarget,
    isMigration,
    country,
    region,
    users,
    scale,
    ha,
    dr,
    budget,
    appType,
    compliance: Array.from(new Set(compliance)),
    cloudProvider,
    aiRelevant,
    aiApproach,
  };
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function buildComponents(d: DetectedRequirements): ArchitectureComponents {
  const p = DOMAIN_PROFILES[d.domain];
  const c = cat(d);
  const users = d.users;

  const scaleClause =
    d.scale === "xlarge"
      ? "with horizontal sharding, read replicas, and connection pooling from day one"
      : d.scale === "large"
        ? "with read replicas and connection pooling to absorb read-heavy traffic"
        : d.scale === "medium"
          ? "with read replicas to absorb read-heavy traffic"
          : "right-sized for current load with headroom";

  const orchestratorNote =
    d.scale === "xlarge" || d.scale === "large"
      ? `${c.orchestrator.name} (managed Kubernetes)`
      : `${c.orchestrator.name} (managed Kubernetes), starting as a modular monolith`;

  const dbDesc = d.isMigration
    ? d.dr || d.ha
      ? `**${d.dbTarget}** in a multi-AZ primary/standby configuration ${scaleClause}. Migrated from ${d.db} via assessment, schema/object conversion, data migration, and a validated cut-over. Distributed ACID transactions keep ${p.modules[0]?.toLowerCase() ?? "records"} consistent.`
      : `**${d.dbTarget}** ${scaleClause}. Migrated from ${d.db} via assessment, schema/object conversion, data migration, and a validated cut-over.`
    : `**${c.database.name}** ${scaleClause}, with point-in-time recovery and automated backups.`;

  const cacheDesc =
    d.scale === "xlarge" || d.scale === "large"
      ? `**${c.cache.name}** (Multi-AZ) as a multi-tier cache — session store, hot ${p.label.includes("retail") ? "catalog" : "data"} reads, rate-limit counters, and idempotency keys — with cache-aside plus singleflight to prevent stampedes.`
      : `**${c.cache.name}**${d.ha ? " (Multi-AZ)" : ""} for sessions, hot reads, rate-limit counters, and idempotency keys (cache-aside).`;

  return {
    frontend: `**Next.js 14** (App Router, SSR/ISR) served from **${c.cdn.name}** for low TTFB in ${d.country} (${d.region}). ${d.domain === "retail" ? "Catalog and media served from the edge; personalized dashboards stream via React Server Components." : d.domain === "education" ? "Static catalog pages use ISR; authenticated dashboards stream via React Server Components." : "Authenticated dashboards stream via React Server Components."} Tailwind for the design system.`,
    backend: `**Node.js (NestJS)** modular services exposing domain modules (${p.modules.join(", ")}). Chosen for ${d.appType} for fast iteration, strong typing, and a mature ecosystem. Containerized and horizontally scalable on ${orchestratorNote}.`,
    apiLayer: `${p.apiNote}. All routes behind an API gateway with rate limiting, JWT validation, and idempotency keys for writes.`,
    loadBalancer: `${d.dr ? "Global anycast " : ""}**${c.loadBalancer.name}** (L7) with path-based routing, integrated WAF, and health checks. SSL/TLS termination at the edge (TLS 1.3)${d.ha ? " across multiple AZs" : ""}.`,
    database: dbDesc,
    cache: cacheDesc,
    messageQueue: `**${c.messageQueue.name}** for ${p.queueUse}. Decouples slow operations from the request path so the API stays responsive.`,
    objectStorage: `**${c.objectStorage.name}** for ${p.storageUse}. Versioning + lifecycle policies tier cold content to archive; signed URLs gate access.`,
    monitoring: `**${c.monitoring.name}** for metrics (RED/USE method) with golden-signal dashboards (latency, traffic, errors, saturation). Synthetic checks for the critical ${p.modules[0]?.toLowerCase() ?? "user"} journey.`,
    logging: `**OpenTelemetry** collectors shipping structured logs and traces to **${c.logging.name}**, with correlation IDs spanning API, queue, and DB${(d.compliance.includes("PCI-DSS") || d.domain === "healthcare") ? " and tamper-evident retention for audit" : ""}.`,
    security: `${p.securityFocus}. Data residency kept within ${d.country} (${d.region}) on ${CLOUD_LABEL[d.cloudProvider]}${d.compliance.length ? `; controls mapped to ${d.compliance.join(", ")}` : ""}.`,
    disasterRecovery: d.dr
      ? `Cross-region standby with automated async replication (${d.isMigration ? d.dbTarget : c.database.name} binlog/redo shipping), frequent snapshots, and runbooks + quarterly DR drills. Failover is automated for the data tier; full-region switch is runbook-driven.`
      : `Daily automated backups with PITR, weekly restore validation, and documented runbooks${d.ha ? ". Multi-AZ standby for the data tier handles zonal failure." : "."}`,
    network: `**${c.network.name}** with private subnets for data/queue tiers and public subnets only for the load balancer. Service endpoints for managed services, NAT for egress, and Security Groups enforcing least-privilege east-west traffic${d.dr ? " plus cross-region peering/Transit Gateway for DR replication" : ""}.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Dynamic Mermaid diagram                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Build a valid Mermaid flowchart that reflects the detected topology: DR
 * subgraph only when DR is required, HA multi-AZ annotation, domain-specific
 * service nodes, and conditional standby/replica nodes.
 *
 * Node IDs are kept alphanumeric; labels with spaces use the `["..."]` form.
 */
function buildDiagram(d: DetectedRequirements): string {
  const p = DOMAIN_PROFILES[d.domain];
  const c = cat(d);
  const primary = p.modules[0] ?? "Core";
  const lines: string[] = ["flowchart TD"];

  const az = d.ha || d.dr ? " - Multi AZ" : "";

  // Client tier
  lines.push('  subgraph Client["Client Tier"]');
  lines.push("    WEB[Web Browser]");
  lines.push("    MOB[Mobile App]");
  lines.push("  end");

  // Edge / security
  lines.push('  subgraph Edge["Edge / Security"]');
  lines.push(`    CDN["${c.cdn.name} + WAF"]`);
  lines.push(`    LB["${c.loadBalancer.name}"]`);
  lines.push("  end");

  // Application tier
  lines.push(`  subgraph App["Application Tier${az}"]`);
  lines.push("    API[API Gateway]");
  lines.push(`    BE1["${primary} Service"]`);
  if (d.ha || d.dr) lines.push(`    BE2["${primary} - Replica"]`);
  lines.push("  end");

  // Domain-specific extra nodes (attached under App tier).
  for (const node of p.diagramNodes) {
    if (node.tier === "App") {
      lines.push(`    ${node.id}["${node.label}"]`);
    }
  }

  // Data tier — node labels branded with the provider's real products.
  lines.push('  subgraph Data["Data Tier"]');
  lines.push(`    DB[("${d.dbTarget} Primary")]`);
  if (d.ha || d.dr) lines.push(`    DBR[("${d.dbTarget} Standby")]`);
  lines.push(`    REDIS[("${c.cache.name}")]`);
  lines.push(`    MQ[["${c.messageQueue.name}"]]`);
  lines.push(`    S3[("${c.objectStorage.name}")]`);
  for (const node of p.diagramNodes) {
    if (node.tier === "Data") {
      lines.push(`    ${node.id}["${node.label}"]`);
    }
  }
  lines.push("  end");

  // Observability
  lines.push('  subgraph Obs["Observability"]');
  lines.push(`    MON["${c.monitoring.name}"]`);
  lines.push(`    LOG["${c.logging.name}"]`);
  lines.push("  end");

  // DR tier (only when DR required)
  if (d.dr) {
    lines.push('  subgraph DR["Cross-Region DR"]');
    lines.push(`    DRDB[("${d.dbTarget} Standby Region")]`);
    lines.push("  end");
  }

  // Edges: request flow
  lines.push("  WEB --> CDN");
  lines.push("  MOB --> CDN");
  lines.push("  CDN --> LB --> API");

  const backends = d.ha || d.dr ? "BE1 & BE2" : "BE1";
  lines.push(`  API --> ${backends}`);

  // Domain extra-node wiring.
  for (const node of p.diagramNodes) {
    lines.push(`  ${node.connectFrom} --> ${node.id}`);
    if (node.connectTo) lines.push(`  ${node.id} --> ${node.connectTo}`);
  }

  // Backends → data tier
  lines.push(`  ${backends} --> DB & REDIS & MQ & S3`);

  // Replication / DR edges (dashed)
  if (d.ha || d.dr) {
    lines.push("  DB -.->|sync/async replication| DBR");
  }
  if (d.dr) {
    lines.push("  DB -.->|async replication| DRDB");
    lines.push("  S3 -.->|cross-region replication| DRDB");
  }

  // Observability edges (dashed)
  const obsSources = ["BE1", ...(d.ha || d.dr ? ["BE2"] : [])];
  lines.push(`  ${obsSources.join(" & ")} -.->|metrics| MON`);
  lines.push(`  ${obsSources.join(" & ")} -.->|logs| LOG`);

  // Backups
  lines.push("  DB -.->|backups| S3");

  return lines.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Design decisions                                                           */
/* -------------------------------------------------------------------------- */

function buildDecisions(d: DetectedRequirements): DesignDecision[] {
  const p = DOMAIN_PROFILES[d.domain];
  const c = cat(d);
  const decisions: DesignDecision[] = [];

  // 1. Database (migration or greenfield).
  if (d.isMigration) {
    decisions.push({
      component: d.dbTarget,
      rationale: `Selected as the migration target for ${d.db} because it offers strong consistency${d.dr ? ", native multi-AZ and cross-region replication" : ""}, and addresses the ${d.country} residency, ${d.scale}-scale (${d.users.toLocaleString()} users), and ${d.dr ? "DR" : d.ha ? "availability" : "operational"} requirements without a full re-architect.`,
      advantages: [
        "Strongly-consistent, scalable writes avoid the migration's worst pitfalls",
        "Compatibility with the source dialect lowers conversion risk",
        d.dr ? "Built-in replication serves HA and DR from one engine" : "Right-sized for the current workload with headroom",
      ],
      tradeOffs: [
        "Operational tooling differs from the incumbent; DBAs need upskilling",
        "Vendor-specific SQL extensions require conversion + regression testing",
        "Performance characteristics must be re-benchmarked under load",
      ],
    });
  } else {
    decisions.push({
      component: d.dbTarget,
      rationale: `A managed ${d.dbTarget} is the default transactional store for ${d.appType}: it is operationally simple, well-supported, and scales ${d.scale === "xlarge" ? "horizontally via read replicas and (later) sharding" : "via read replicas"} as ${d.users.toLocaleString()} users grow.`,
      advantages: [
        "Managed backups, patching, and PITR reduce operational burden",
        "Read replicas decouple reporting/dashboard reads from writes",
        "Broad ecosystem and tooling familiarity",
      ],
      tradeOffs: [
        "Single-region by default; cross-region DR is an add-on",
        "Connection management needs pooling at scale",
        "Sharding later requires application-level coordination",
      ],
    });
  }

  // 2. Orchestration (varies by scale/budget).
  decisions.push({
    component: c.orchestrator.name,
    rationale:
      d.scale === "xlarge" || d.scale === "large"
        ? `At ${d.users.toLocaleString()} users the workload needs elastic horizontal scale and advanced deployment strategies. ${c.orchestrator.name} gives HPA, canary/rolling deploys with rollback, and consistent environments — worth the platform investment at this scale.`
        : `At ${d.users.toLocaleString()} users a modular monolith on ${c.orchestrator.name} balances delivery speed and clean boundaries, and can be split into services later without re-architecture as ${d.appType} grows.`,
    advantages:
      d.scale === "xlarge" || d.scale === "large"
        ? [
            "Horizontal Pod Autoscaling on custom metrics handles spikes",
            "Canary + rolling deploys with instant rollback",
            "Consistent dev/staging/prod via OCI images",
          ]
        : [
            "Faster iteration than microservices at this scale",
            "Clear module boundaries ease a future split",
            "Single deployable simplifies operations",
          ],
    tradeOffs:
      d.scale === "xlarge" || d.scale === "large"
        ? [
            "Platform complexity requires an SRE skill set",
            "Cost floor is higher than serverless for low traffic",
            "Day-2 operations need investment",
          ]
        : [
            "Module boundaries need enforced discipline",
            "Shared database risks coupling if not partitioned",
            "Scaling is per-deployment until split",
          ],
  });

  // 3. Caching (varies by scale).
  decisions.push({
    component: c.cache.name,
    rationale:
      d.scale === "xlarge" || d.scale === "large"
        ? `At ${d.users.toLocaleString()} users the database cannot absorb the read load directly. A multi-tier ${c.cache.name} cache (sessions, hot reads, rate limits) protects the primary and keeps p95 latency low, with singleflight + jittered TTLs to prevent stampedes.`
        : `${c.cache.name} provides sub-millisecond reads for sessions, hot ${p.label.includes("retail") ? "catalog" : "data"}, and rate-limit counters, protecting the database from read amplification at ${d.users.toLocaleString()} users.`,
    advantages: [
      "Removes hot-read load from the primary database",
      "Atomic primitives power rate limiting and idempotency",
      d.ha ? "Multi-AZ managed offering meets the availability target" : "Right-sized for current traffic",
    ],
    tradeOffs: [
      "Another data store to operate and keep consistent",
      "Cache stampede risk if not protected (singleflight / jitter)",
      "Memory cost scales with cache size",
    ],
  });

  // 4. Messaging (varies by domain).
  decisions.push({
    component: c.messageQueue.name,
    rationale: `${c.messageQueue.name} ${p.queueUse}. It buffers load spikes, provides a durable replayable event log, and decouples producers from consumers so the learner/customer-facing request path stays fast.`,
    advantages: [
      "Buffers load spikes from batch and async workloads",
      "Durable, replayable event log for analytics and audit",
      "Decouples producers from consumers for independent scaling",
    ],
    tradeOffs: [
      "Adds distributed-systems complexity to operations",
      "Requires schema governance",
      "At-least-once delivery needs idempotent consumers",
    ],
  });

  // 5. Domain-specific decision.
  decisions.push(p.decision);

  // 6. Observability.
  decisions.push({
    component: "OpenTelemetry + Prometheus",
    rationale: `Vendor-neutral observability avoids lock-in and correlates logs, metrics, and traces across the API, queue, and data tiers — critical for debugging distributed transactions${d.isMigration ? " during and after migration" : ""}.`,
    advantages: [
      "Single correlation ID spans the request lifecycle",
      "Golden-signal dashboards catch regressions early",
      "Portable across cloud providers",
    ],
    tradeOffs: [
      "Requires instrumentation discipline across services",
      "Storage cost grows with retention and cardinality",
      "Needs SLO/alert tuning to avoid alert fatigue",
    ],
  });

  return decisions;
}

/* -------------------------------------------------------------------------- */
/* Risks                                                                      */
/* -------------------------------------------------------------------------- */

function buildRisks(d: DetectedRequirements): Risk[] {
  const p = DOMAIN_PROFILES[d.domain];
  const risks: Risk[] = [];
  let n = 0;
  const id = () => `R${++n}`;

  if (d.isMigration) {
    risks.push({
      id: id(),
      category: "Technical",
      description: `${d.db} → ${d.dbTarget} migration surfaces incompatible SQL, stored procedures, sequences, or implicit type coercion that break application queries.`,
      severity: "High",
      likelihood: "Medium",
    });
    risks.push({
      id: id(),
      category: "Operational",
      description: "Cut-over causes unplanned downtime or data inconsistency during the switchover window, impacting end users.",
      severity: d.ha ? "Critical" : "High",
      likelihood: "Medium",
    });
  }

  // Compliance risk — always relevant given residency.
  risks.push({
    id: id(),
    category: "Compliance",
    description: `Personal data of ${d.users.toLocaleString()} ${d.country} users (and ${p.label.includes("health") ? "PHI" : "PII"}) may leave the permitted residency region if services are not pinned${d.compliance.length ? ` — breaching ${d.compliance.join(", ")}` : ""}.`,
    severity: "High",
    likelihood: "Medium",
  });

  // Performance risk.
  risks.push({
    id: id(),
    category: "Performance",
    description:
      d.scale === "xlarge" || d.scale === "large"
        ? `At ${d.users.toLocaleString()} users, unindexed queries or missing read replicas degrade under production load, especially during peak periods.`
        : "Query plans or missing indexes degrade response times as data grows.",
    severity: d.scale === "xlarge" ? "High" : "Medium",
    likelihood: "High",
  });

  // Domain-specific risk.
  if (d.domain === "financial") {
    risks.push({
      id: id(),
      category: "Security",
      description: "Transaction fraud or a double-spend race could cause financial loss and regulatory exposure.",
      severity: "Critical",
      likelihood: "Medium",
    });
  } else if (d.domain === "healthcare") {
    risks.push({
      id: id(),
      category: "Compliance",
      description: "Unauthorized access to or leakage of PHI during integration with external EHR/lab systems.",
      severity: "Critical",
      likelihood: "Medium",
    });
  } else if (d.domain === "retail") {
    risks.push({
      id: id(),
      category: "Operational",
      description: "Flash-sale traffic spikes (10x baseline) overwhelm the origin and cause checkout failure or overselling.",
      severity: "High",
      likelihood: "High",
    });
  } else if (d.domain === "education") {
    risks.push({
      id: id(),
      category: "Operational",
      description: "Video transcoding backlog during enrollment peaks delays course availability for learners.",
      severity: "Medium",
      likelihood: "Medium",
    });
  }

  // Delivery / skills risk.
  risks.push({
    id: id(),
    category: "Delivery",
    description: "Team lacks operational experience with the new platform and Kubernetes, slowing incident response.",
    severity: "Medium",
    likelihood: "High",
  });

  if (d.dr) {
    risks.push({
      id: id(),
      category: "Operational",
      description: "Cross-region DR failover has never been exercised; RTO/RPO targets are unproven under real failure.",
      severity: "High",
      likelihood: "Medium",
    });
  }

  if (d.budget === "low") {
    risks.push({
      id: id(),
      category: "Financial",
      description: "Tight budget may force single-AZ or reduced redundancy, undercutting the availability/DR goals.",
      severity: "Medium",
      likelihood: "Medium",
    });
  }

  return risks;
}

/* -------------------------------------------------------------------------- */
/* Mitigations                                                                */
/* -------------------------------------------------------------------------- */

function buildMitigations(d: DetectedRequirements, risks: Risk[]): Mitigation[] {
  const p = DOMAIN_PROFILES[d.domain];
  const c = cat(d);
  const byCat = (cat: string) => risks.find((r) => r.category === cat);
  const mitigations: Mitigation[] = [];

  const migration = risks.find((r) => r.description.includes("migration surfaces"));
  if (migration) {
    mitigations.push({
      riskId: migration.id,
      strategy: "De-risk schema and SQL conversion before cut-over.",
      actions: [
        "Run an automated assessment to flag incompatible objects and stored procedures",
        "Convert and unit-test procedures in a staging mirror",
        "Maintain a regression suite of representative production queries",
      ],
    });
  }

  const cutover = risks.find((r) => r.description.includes("Cut-over"));
  if (cutover) {
    mitigations.push({
      riskId: cutover.id,
      strategy: "Plan a zero-downtime, reversible cut-over.",
      actions: [
        "Use dual-write + shadow reads during the transition window",
        "Cut over during a low-traffic maintenance window with rollback ready",
        "Verify row counts and checksums before and after switchover",
      ],
    });
  }

  const compliance = byCat("Compliance");
  if (compliance) {
    mitigations.push({
      riskId: compliance.id,
      strategy: "Enforce data residency and access control by architecture, not policy.",
      actions: [
        `Pin data, cache, and backups to the ${d.country} region (${d.region}) on ${CLOUD_LABEL[d.cloudProvider]}`,
        `Block cross-region egress via ${c.network.name} and routing controls`,
        "Encrypt all data at rest with KMS-managed keys and audit access",
        ...(d.domain === "healthcare"
          ? ["Apply consent-gated, role-based access to PHI with break-glass audit logging"]
          : []),
      ],
    });
  }

  const perf = byCat("Performance");
  if (perf) {
    mitigations.push({
      riskId: perf.id,
      strategy: "Validate performance under production-shaped load.",
      actions: [
        "Capture and replay peak traffic against staging",
        "Index and tune the top queries by cost before launch",
        "Add query-timeout and connection-pool guardrails",
        ...(d.scale === "xlarge" || d.scale === "large"
          ? ["Provision read replicas and cap DB connections via a pooler"]
          : []),
      ],
    });
  }

  const domainRisk =
    byCat("Security") ??
    risks.find((r) => r.description.includes("PHI")) ??
    risks.find((r) => r.description.includes("Flash-sale")) ??
    risks.find((r) => r.description.includes("transcoding"));
  if (domainRisk) {
    const actions =
      d.domain === "financial"
        ? [
            "Idempotency keys + optimistic locking prevent double-spend",
            "Real-time fraud scoring on the event stream with manual review queue",
            "Reconcile ledger balances daily against the event log",
          ]
        : d.domain === "healthcare"
          ? [
              "FHIR consent enforcement at the API gateway",
              "Field-level encryption and tokenization of PHI",
              "Break-glass access with mandatory audit review",
            ]
          : d.domain === "retail"
            ? [
                "Edge CDN + queue-based checkout absorbs flash-sale spikes",
                "Reserve-then-confirm inventory pattern prevents overselling",
                "Auto-scale + circuit breakers protect the origin",
              ]
            : [
                "Autoscaled transcoding workers with idempotent retries",
                "Pre-transcode popular content; backfill asynchronously",
                "Queue depth alerts to catch backlog early",
              ];
    mitigations.push({
      riskId: domainRisk.id,
      strategy: `${d.domain === "retail" ? "Absorb spikes and protect inventory" : "Domain-specific controls"}.`,
      actions,
    });
  }

  const delivery = byCat("Delivery");
  if (delivery) {
    mitigations.push({
      riskId: delivery.id,
      strategy: "Build operational readiness before go-live.",
      actions: [
        "Run enablement sessions and create runbooks for the top failure modes",
        "Pair with the platform vendor for cut-over support",
        "On-call rotation with clear escalation paths from day one",
      ],
    });
  }

  const drRisk = risks.find((r) => r.description.includes("DR failover"));
  if (drRisk) {
    mitigations.push({
      riskId: drRisk.id,
      strategy: "Prove DR with regular, automated drills.",
      actions: [
        "Run a quarterly cross-region failover drill",
        "Automate DR runbooks and measure actual RTO/RPO each drill",
        "Set synthetic monitors that fail the drill if SLOs are breached",
      ],
    });
  }

  const budgetRisk = byCat("Financial");
  if (budgetRisk) {
    mitigations.push({
      riskId: budgetRisk.id,
      strategy: "Contain cost without sacrificing core SLOs.",
      actions: [
        "Reserve baseline capacity; autoscale on-demand for peaks only",
        "Run async/batch on spot/preemptible nodes with checkpointing",
        "Tier object storage to archive classes for cold content",
      ],
    });
  }

  return mitigations;
}

/* -------------------------------------------------------------------------- */
/* Deployment                                                                 */
/* -------------------------------------------------------------------------- */

function buildDeployment(d: DetectedRequirements): DeploymentRecommendation {
  const p = DOMAIN_PROFILES[d.domain];
  let pattern: DeploymentRecommendation["pattern"];
  if (d.dr) pattern = "Cross Region DR";
  else if (d.ha) pattern = "Multi AZ";
  else pattern = "Single AZ";

  // High budget allows active-active; medium/low = active/warm standby.
  const activeActive = d.dr && d.budget === "high";

  const standbyNote =
    d.budget === "low"
      ? "A warm (not active-active) standby keeps cost proportionate to the low budget."
      : "A cost-proportionate warm standby is used given the medium budget.";

  const rationale = d.dr
    ? `Because DR is a stated requirement and ${d.users.toLocaleString()} users depend on ${d.appType}, a Cross-Region DR pattern protects against full regional failure. ${
        activeActive
          ? "An active-active deployment across two regions maximizes availability and absorbs regional loss with no manual failover."
          : `An active region serves traffic while ${standbyNote} keeps RTO/RPO bounded.`
      } Compliance (${d.compliance.join(", ") || "regional residency"}) is honored by pinning primary data to ${d.country}.`
    : d.ha
      ? `Multi-AZ within ${d.country} meets the high-availability requirement for ${d.users.toLocaleString()} users while keeping cost proportionate to a ${d.budget} budget. A second AZ absorbs zonal failure with no manual intervention; cross-region DR can be added later.`
      : `A Single-AZ deployment in ${d.country} is sufficient for the current scale and ${d.budget} budget, with a clearly defined, low-effort upgrade path to Multi-AZ as ${d.appType} grows.`;

  const topology: string[] = d.dr
    ? [
        `Primary region: ${d.country} (${d.region}) — active Application + Data tiers across multiple AZs`,
        `Standby region: paired region with ${activeActive ? "active application tier" : "warm application tier"} and async-replicated data`,
        "Global traffic manager routes users to the healthy region with health-based failover",
        `${d.dbTarget}: multi-AZ primary in-region, async cross-region replication`,
        `Redis: ${d.ha ? "multi-AZ in-region" : "in-region"}, rebuilt from DB on regional failover`,
        "Object storage: cross-region replication for content and backups",
        "Backups: continuous PITR + daily snapshots with quarterly restore validation",
        `Runbooks + quarterly DR drills validate RTO/RPO${d.compliance.length ? `; residency mapped to ${d.compliance.join(", ")}` : ""}`,
      ]
    : d.ha
      ? [
          `Single region (${d.country}, ${d.region}) across at least two AZs for the Application and Data tiers`,
          "Stateless services spread across AZs behind a zonal-aware load balancer",
          `${d.dbTarget} primary/standby across AZs with automatic failover`,
          "Redis multi-AZ for cache resilience",
          "Backups + PITR to a separate fault domain",
          "Health checks and autoscaling absorb zonal loss",
        ]
      : [
          `Single AZ deployment in ${d.country} (${d.region}) for the MVP`,
          "Stateless services behind a load balancer, ready to add a second AZ",
          `${d.dbTarget} with automated backups and PITR`,
          "Redis for cache and sessions",
          "Defined upgrade path to Multi-AZ as traffic grows",
        ];

  const rto = d.dr ? (activeActive ? "< 15 minutes" : "< 1 hour") : d.ha ? "< 4 hours" : "< 24 hours";
  const rpo = d.dr ? (activeActive ? "< 1 minute" : "< 15 minutes") : d.ha ? "< 1 hour" : "< 24 hours";

  return {
    pattern,
    rationale,
    topology,
    drObjective: { rto, rpo },
  };
}

/* -------------------------------------------------------------------------- */
/* Executive summary                                                          */
/* -------------------------------------------------------------------------- */

function buildSummary(d: DetectedRequirements): string {
  const p = DOMAIN_PROFILES[d.domain];
  const c = cat(d);
  const migrationClause = d.isMigration
    ? ` migrate ${d.db} to ${d.dbTarget} to power `
    : ` stand up a new platform for `;
  const goal = `The customer, based in ${d.country} (${d.region}), is seeking to${migrationClause}${d.appType} serving approximately ${d.users.toLocaleString()} users, on ${CLOUD_LABEL[d.cloudProvider]}.`;

  const priorities = `The stated priorities are${d.ha ? " high availability" : " reliable operation"}${d.dr ? " and disaster recovery" : ""}, at a ${d.budget} budget${d.compliance.length ? `, under ${d.compliance.join(", ")} compliance` : ""}.`;

  const arch = `This proposal recommends a cloud-native, containerized architecture on ${CLOUD_LABEL[d.cloudProvider]} with ${d.isMigration ? d.dbTarget : c.database.name} as the ${d.isMigration ? "distributed, " : ""}strongly-consistent data tier, ${c.cache.name} for caching, ${c.messageQueue.name} for asynchronous processing, and ${c.objectStorage.name} for ${p.storageUse}. Observability is built in from day one via OpenTelemetry, ${c.monitoring.name}, and ${c.logging.name}${d.isMigration ? " to de-risk the migration" : ""}.`;

  const drClause = d.dr
    ? ` A ${d.budget === "high" ? "active-active cross-region" : "cross-region warm-standby"} disaster recovery design bounds RTO and RPO, meeting the business-continuity requirement.`
    : "";

  const scaleClause = ` The architecture starts right-sized for the current ${d.users.toLocaleString()}-user base and scales ${d.scale === "xlarge" ? "horizontally via sharding and replicas" : "horizontally"} without re-architecture as the ${p.label} workload grows.`;

  return `${goal}\n\n${priorities}\n\n${arch}${drClause}${scaleClause}`;
}

/* -------------------------------------------------------------------------- */
/* AI services & token estimation (optional section)                          */
/* -------------------------------------------------------------------------- */

function priceOf(name: string) {
  return AI_MODEL_PRICING.find((m) => m.name === name)!;
}

/**
 * Builds the optional AI section when the workload is AI-relevant. Uses the
 * selected cloud's AI platform as the primary model and lists 金山云星流 as a
 * cross-cloud alternative (or as the primary when the cloud is Kingsoft).
 */
function buildAiSection(
  d: DetectedRequirements,
): AiServiceSection | undefined {
  if (!d.aiRelevant) return undefined;

  const platform = AI_PLATFORM[d.cloudProvider];
  const models: AiModelOption[] = [];
  const primaryUse = "Primary model for the AI workload (chat / assistant / retrieval).";

  if (d.cloudProvider === "kingsoft") {
    const x = priceOf("星流 大模型");
    models.push({
      name: x.name,
      provider: x.provider,
      use: primaryUse,
      inputPricePer1M: x.inputPricePer1M,
      outputPricePer1M: x.outputPricePer1M,
    });
    const mini = priceOf("gpt-4o-mini");
    models.push({
      name: mini.name,
      provider: mini.provider,
      use: "Lightweight tasks — classification, routing, summaries",
      inputPricePer1M: mini.inputPricePer1M,
      outputPricePer1M: mini.outputPricePer1M,
    });
  } else {
    const gpt = priceOf("gpt-4o");
    models.push({
      name: gpt.name,
      provider: platform,
      use: primaryUse,
      inputPricePer1M: gpt.inputPricePer1M,
      outputPricePer1M: gpt.outputPricePer1M,
    });
    const x = priceOf("星流 大模型");
    models.push({
      name: x.name,
      provider: x.provider,
      use: "Cross-cloud alternative (金山云星流)",
      inputPricePer1M: x.inputPricePer1M,
      outputPricePer1M: x.outputPricePer1M,
    });
  }
  const ds = priceOf("DeepSeek-V3");
  models.push({
    name: ds.name,
    provider: ds.provider,
    use: "Cost-effective alternative for high-volume inference",
    inputPricePer1M: ds.inputPricePer1M,
    outputPricePer1M: ds.outputPricePer1M,
  });

  // Representative token estimation from the user base.
  const dailySessions = Math.max(50, Math.round(d.users * 0.4));
  const inputPerSession = 1500;
  const outputPerSession = 400;
  const monthlyInputTokens = dailySessions * inputPerSession * 30;
  const monthlyOutputTokens = dailySessions * outputPerSession * 30;
  const primary = models[0];
  const estMonthlyCostUsd =
    (monthlyInputTokens / 1_000_000) * (primary.inputPricePer1M ?? 0) +
    (monthlyOutputTokens / 1_000_000) * (primary.outputPricePer1M ?? 0);

  const note =
    d.cloudProvider === "kingsoft"
      ? "金山云星流 (Xingliu) is 金山云's AI platform for managed large-model inference, RAG, and agents — recommended here as the in-cloud AI tier."
      : `${platform} is the in-cloud AI platform; 金山云星流 (Kingsoft Cloud Xingliu) is listed as a cross-cloud alternative for cost or sovereignty reasons.`;

  return {
    approach: d.aiApproach,
    models,
    tokenEstimate: {
      dailySessions,
      tokensPerSession: inputPerSession + outputPerSession,
      monthlyInputTokens,
      monthlyOutputTokens,
      estMonthlyCostUsd: Math.round(estMonthlyCostUsd * 100) / 100,
      disclaimer:
        "Token volumes and costs are representative estimates for planning only. Replace model pricing with current, accurate rates (especially 星流) before any commercial use.",
    },
    note,
  };
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

export function generateMockSolution(
  requirements: string,
  cloudProvider: CloudProvider = "kingsoft",
): ArchitectureSolution {
  const d = detect(requirements, cloudProvider);
  const risks = buildRisks(d);
  return {
    executiveSummary: buildSummary(d),
    components: buildComponents(d),
    mermaidDiagram: buildDiagram(d),
    designDecisions: buildDecisions(d),
    risks,
    mitigations: buildMitigations(d, risks),
    deployment: buildDeployment(d),
    aiSection: buildAiSection(d),
    meta: {
      generatedAt: new Date().toISOString(),
      model: "demo-architect-v1",
      provider: "Demo Mode (built-in)",
      mode: "demo",
      cloudProvider,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Mock regeneration (bonus improve buttons)                                  */
/* -------------------------------------------------------------------------- */

export function regenerateMockSections(
  solution: ArchitectureSolution,
  focus: ImprovementFocus,
  sections: SectionKey[],
): ArchitectureSolution {
  const next: ArchitectureSolution = {
    ...solution,
    meta: {
      ...solution.meta,
      generatedAt: new Date().toISOString(),
      focus,
    },
  };

  for (const section of sections) {
    applyMockPatch(next, focus, section);
  }

  return next;
}

function applyMockPatch(
  solution: ArchitectureSolution,
  focus: ImprovementFocus,
  section: SectionKey,
): void {
  switch (focus) {
    case "design":
      if (section === "components") {
        solution.components = {
          ...solution.components,
          backend:
            solution.components.backend + " Refactored into bounded-context modules with a dedicated Backend-for-Frontend per channel; clear interface contracts gate every deploy.",
          apiLayer:
            solution.components.apiLayer + " Standardized contract tests now gate deploys, and a GraphQL federation gateway composes domain subgraphs.",
        };
      } else if (section === "designDecisions") {
        solution.designDecisions = withDecision(
          solution.designDecisions,
          "Modular Monolith + BFF",
          "Splitting into bounded-context modules with a BFF separates concerns and improves team autonomy without the operational tax of premature microservices.",
          ["Clear module boundaries ease a future move to microservices", "BFF tailors payloads to each client", "Single deployable simplifies ops"],
          ["Module boundaries need enforced discipline", "Shared database risks coupling if not partitioned"],
        );
      }
      break;

    case "cost":
      if (section === "designDecisions") {
        solution.designDecisions = withDecision(
          solution.designDecisions,
          "Cost Optimization",
          "Re-tuned the stack for total cost of ownership: reserved capacity for baseline load, spot/preemptible for batch, right-sized instances, and tiered storage.",
          ["Reserved instances cut baseline compute 30-40%", "Spot nodes for batch cut cost ~70%", "Object-storage lifecycle moves cold data to archive"],
          ["Spot interruptions require graceful checkpointing", "Reserved capacity reduces flexibility for sudden growth"],
        );
      } else if (section === "deployment") {
        solution.deployment = {
          ...solution.deployment,
          rationale:
            solution.deployment.rationale +
            " Cost is contained by reserving baseline capacity, running async/batch workloads on spot/preemptible nodes with graceful eviction, and tiering object storage to archive classes for cold content.",
          topology: [
            ...solution.deployment.topology,
            "Baseline traffic on reserved instances; spikes on autoscaled on-demand",
            "Transcoding/ETL workers on spot nodes with checkpointing",
            "Object storage lifecycle: hot → infrequent access → archive",
          ],
        };
      }
      break;

    case "performance":
      if (section === "components") {
        solution.components = {
          ...solution.components,
          cache:
            "Multi-tier cache: CDN edge + Redis read-through with singleflight to prevent stampedes, plus application-level caching with jittered TTLs.",
          database:
            solution.components.database + " Added read replicas for dashboard/reporting reads and connection pooling to cap DB connections.",
          loadBalancer:
            "Global anycast load balancer with latency-based routing, HTTP/3, and connection reuse; in-region L7 LB with path routing and TLS 1.3.",
        };
      } else if (section === "designDecisions") {
        solution.designDecisions = withDecision(
          solution.designDecisions,
          "Read Replicas + Connection Pooling",
          "Routes read-heavy dashboard and reporting traffic to replicas and caps database connections via a pooler, protecting the primary and lowering p95 latency.",
          ["Reads scale independently of writes", "Pooler prevents connection storms", "Lowers p95 on hot dashboards"],
          ["Replica lag must be acceptable for the use case", "Read-after-write needs primary routing for fresh data"],
        );
      }
      break;

    case "security":
      if (section === "risks") {
        solution.risks = [
          ...solution.risks,
          {
            id: `R${solution.risks.length + 1}`,
            category: "Security",
            description: "Insider or compromised-credential access could exfiltrate sensitive data.",
            severity: "Critical",
            likelihood: "Medium",
          },
          {
            id: `R${solution.risks.length + 2}`,
            category: "Security",
            description: "API abuse (credential stuffing, scraping) targets high-value endpoints.",
            severity: "High",
            likelihood: "High",
          },
        ];
      } else if (section === "mitigations") {
        solution.mitigations = [
          ...solution.mitigations,
          {
            riskId: `R${solution.risks.length - 1}`,
            strategy: "Zero-trust and least-privilege across identity, network, and data.",
            actions: [
              "Enforce mTLS between services and short-lived workload identities",
              "Secrets in a managed vault with automatic rotation and audit logging",
              "Column-level access scoped per service identity; field-level encryption for PII",
            ],
          },
          {
            riskId: `R${solution.risks.length}`,
            strategy: "Protect public endpoints from abuse.",
            actions: [
              "WAF rules + bot management at the edge",
              "Adaptive rate limiting and account-lockout on auth endpoints",
              "Require MFA for admin roles and step-up auth for sensitive actions",
            ],
          },
        ];
      }
      break;

    case "highAvailability":
      if (section === "deployment") {
        solution.deployment = {
          pattern: "Cross Region DR",
          rationale:
            "Raised to a Cross-Region DR pattern to meet the high-availability goal: an active region plus a warm standby with automated failover, bounding RTO/RPO and surviving full regional failure.",
          topology: [
            "Active region across multiple AZs for the Application and Data tiers",
            "Warm standby region with pre-provisioned capacity and async-replicated data",
            "Global traffic manager with health-based, automated regional failover",
            "Data tier: multi-AZ primary + cross-region async replication",
            "Redis rebuilt from DB on regional failover; object storage cross-region replicated",
            "Automated DR runbooks + quarterly drills validate RTO/RPO",
          ],
          drObjective: { rto: "< 30 minutes", rpo: "< 5 minutes" },
        };
      } else if (section === "components") {
        solution.components = {
          ...solution.components,
          disasterRecovery:
            "Cross-region active/warm-standby with automated failover: data replicated asynchronously to a standby region, frequent snapshots, and health-checked DNS failover. Quarterly drills validate RTO/RPO.",
          database:
            solution.components.database + " Deployed multi-AZ in-region with cross-region async replication and automated failover for the data tier.",
          loadBalancer:
            "Global anycast load balancer with automated, health-based regional failover and connection draining.",
        };
      }
      break;
  }
}

function withDecision(
  decisions: DesignDecision[],
  component: string,
  rationale: string,
  advantages: string[],
  tradeOffs: string[],
): DesignDecision[] {
  const filtered = decisions.filter((d) => d.component !== component);
  return [...filtered, { component, rationale, advantages, tradeOffs }];
}
