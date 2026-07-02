import type {
  ArchitectureComponents,
  ArchitectureSolution,
  DesignDecision,
  DeploymentRecommendation,
  ImprovementFocus,
  Mitigation,
  Risk,
  SectionKey,
} from "@/types";

/**
 * Built-in demo provider.
 *
 * Used automatically when LLM_API_KEY is not configured, so the application
 * can be showcased end-to-end without any external dependency. It performs
 * lightweight keyword detection on the requirements and produces a coherent,
 * realistic enterprise architecture (defaulting to an Oracle -> OceanBase
 * migration for an LMS in Malaysia when nothing more specific is detected).
 */

interface DetectedRequirements {
  db: string;
  dbTarget: string;
  country: string;
  users: number;
  ha: boolean;
  dr: boolean;
  budget: string;
  appType: string;
  domain: string;
}

function detect(text: string): DetectedRequirements {
  const t = text.toLowerCase();

  const isOracle = /oracle/.test(t);
  const isOceanBase = /oceanbase/.test(t);
  const isMySQL = /mysql/.test(t);
  const isPostgres = /postgres|postgresql/.test(t);
  const isSqlServer = /sql\s*server|mssql/.test(t);

  const dbTarget = isOceanBase
    ? "OceanBase"
    : isMySQL
      ? "MySQL / Aurora MySQL"
      : isPostgres
        ? "PostgreSQL / Aurora PostgreSQL"
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

  const countryMatch =
    t.match(/country:\s*([a-z\s,]+)/) ??
    t.match(/\b(malaysia|singapore|indonesia|thailand|vietnam|philippines|japan|india|uae|saudi|australia|united kingdom|uk|germany|usa|united states)\b/);
  const country = countryMatch?.[1]?.trim().replace(/,$/, "") ?? "Malaysia";

  const usersMatch = t.match(/users?:\s*([\d,]+)/) ?? t.match(/([\d,]+)\s*users/);
  const users = usersMatch ? Number(usersMatch[1].replace(/,/g, "")) : 5000;

  const ha = /high availability|\bha\b|always[- ]on|active[- ]active|zero downtime/.test(t) || users >= 1000;
  const dr = /disaster recovery|\bdr\b|failover|business continuity|cross[- ]region/.test(t);

  const budgetMatch = t.match(/budget[^a-z]*?(low|medium|high)/);
  const budget = budgetMatch?.[1] ?? "medium";

  let appType = "the application";
  if (/lms|learning management|moodle|canvas/.test(t)) appType = "an LMS (Learning Management System)";
  else if (/erp|enterprise resource/.test(t)) appType = "an ERP";
  else if (/crm|customer relationship/.test(t)) appType = "a CRM";
  else if (/ecommerce|e-commerce|shop|storefront/.test(t)) appType = "an e-commerce platform";
  else if (/banking|core banking|fintech/.test(t)) appType = "a core banking platform";
  else if (/healthcare|hospital|ehr|emr/.test(t)) appType = "a healthcare platform";
  else if (/lms/.test(t)) appType = "an LMS";

  let domain = "general enterprise";
  if (/banking|fintech|financial/.test(t)) domain = "financial services";
  else if (/healthcare|hospital/.test(t)) domain = "healthcare";
  else if (/ecommerce|retail/.test(t)) domain = "retail / e-commerce";
  else if (appType.includes("LMS")) domain = "education";

  return { db, dbTarget, country, users, ha, dr, budget, appType, domain };
}

function buildComponents(d: DetectedRequirements): ArchitectureComponents {
  const users = d.users;
  const scaleNote =
    users >= 50000
      ? "with horizontal sharding and read replicas from day one"
      : users >= 5000
        ? "with read replicas to absorb read-heavy traffic"
        : "right-sized for current load with headroom";

  return {
    frontend:
      `**Next.js 14** (App Router, SSR/ISR) served from a global CDN edge for sub-100ms TTFB in ${d.country}. Static course catalog pages use ISR; authenticated dashboards stream via React Server Components. Tailwind for the design system.`,
    backend:
      `**Node.js (NestJS)** modular monolith exposing domain modules (Courses, Enrollments, Assessments, Billing). Chosen for ${d.appType} because of fast iteration, strong typing, and a mature ecosystem. Containerized and horizontally scalable.`,
    apiLayer:
      `**REST + GraphQL** hybrid. REST for transactional writes (enrollments, payments) with idempotency keys; GraphQL (Apollo Router) for flexible dashboard data aggregation. All routes behind an API gateway with rate limiting and JWT validation.`,
    loadBalancer:
      `**Cloud Application Load Balancer** (L7) with path-based routing, sticky sessions only where needed, and integrated WAF. Health checks target \`/healthz\` and \`/ready\`. SSL termination at the edge with TLS 1.3.`,
    database:
      d.dr || d.ha
        ? `**${d.dbTarget}** deployed in a multi-AZ primary/standby configuration ${scaleNote}. ${d.db} migrated via assessment, schema conversion, data migration, and validation cut-over. Distributed ACID transactions keep enrollments and assessments consistent.`
        : `**${d.dbTarget}** ${scaleNote}. Migrated from ${d.db} via assessment, schema/object conversion, data migration, and a validated cut-over.`,
    cache:
      `**Redis (managed, Multi-AZ)** for session store, hot course metadata, rate-limit counters, and idempotency keys. TTL-based invalidation with cache-aside; write-through only for enrollment state.`,
    messageQueue:
      `**Kafka (or managed MSK equivalent)** for async workloads: video transcoding, notification fan-out, analytics events, and audit logging. Decouples slow operations from the request path so the API stays responsive.`,
    objectStorage:
      `**S3-compatible object storage** for course videos, documents, learner uploads, and backups. Versioning + lifecycle policies to Glacier-tier for cold content; signed URLs for access control.`,
    monitoring:
      `**Prometheus + Grafana** for metrics (RED/USE method), with golden-signal dashboards (latency, traffic, errors, saturation). Synthetic checks for critical learner journeys (login, course open, assessment submit).`,
    logging:
      `**OpenTelemetry** collectors shipping structured logs and traces to a managed log store (e.g., Loki/ELK). Correlation IDs flow end-to-end so a failed enrollment can be traced across API, queue, and DB.`,
    security:
      `Defense in depth: WAF + DDoS protection at the edge, mTLS between services, secrets in a managed vault (rotated), least-privilege IAM, and encryption in transit and at rest (KMS-managed keys). Data residency kept within ${d.country} / region.`,
    disasterRecovery: d.dr
      ? `Cross-region standby with automated async replication (${d.dbTarget} binlog/redo shipping), 15-min snapshot frequency, and runbooks + quarterly DR drills. Failover is automated for the data tier with manual approval for full region switch.`
      : `Daily automated backups with PITR, weekly restore validation, and documented runbooks. Multi-AZ standby for the data tier handles zonal failure.`,
    network:
      `VPC with private subnets for data/queue tiers, public subnets only for the load balancer. VPC endpoints for managed services, NAT for egress, and Security Groups enforcing least-privilege east-west traffic.`,
  };
}

const DEFAULT_DIAGRAM = `flowchart TD
  subgraph Client["Client Tier"]
    WEB[Web Browser]
    MOB[Mobile App]
  end
  subgraph Edge["Edge / Security"]
    CDN[CDN + WAF]
    LB[Application Load Balancer]
  end
  subgraph App["Application Tier - Multi AZ"]
    API[API Gateway]
    BE1[Backend Service A]
    BE2[Backend Service A - Replica]
  end
  subgraph Data["Data Tier"]
    DB[("OceanBase Primary")]
    DBR[("OceanBase Standby")]
    REDIS[("Redis Cache")]
    MQ[[Kafka]]
    S3[("Object Storage")]
  end
  subgraph Obs["Observability"]
    MON[Prometheus + Grafana]
    LOG[Loki / ELK]
  end
  subgraph DR["Cross-Region DR"]
    DRDB[("Standby Region")]
  end
  WEB --> CDN
  MOB --> CDN
  CDN --> LB --> API
  API --> BE1 & BE2
  BE1 --> DB & REDIS & MQ & S3
  BE2 --> DB & REDIS & MQ & S3
  DB -.->|async replication| DBR
  DB -.->|async replication| DRDB
  BE1 -.->|metrics| MON
  BE2 -.->|metrics| MON
  BE1 -.->|logs| LOG
  BE2 -.->|logs| LOG
  DB -.->|backups| S3`;

function buildDecisions(d: DetectedRequirements): DesignDecision[] {
  return [
    {
      component: d.dbTarget,
      rationale: `Selected as the migration target for ${d.db} because it offers MySQL/Oracle compatibility, distributed ACID transactions, and native multi-AZ + cross-region replication — satisfying the ${d.country} residency, scale (${d.users.toLocaleString()} users), and ${d.dr ? "DR" : "availability"} requirements without a re-architect.`,
      advantages: [
        "Distributed, strongly-consistent writes scale horizontally across nodes",
        "Oracle/MySQL compatibility lowers migration risk and PL/SQL conversion effort",
        "Built-in multi-AZ and cross-region replication serve HA and DR from one engine",
        "Compression and storage pooling reduce TCO versus legacy licensing",
      ],
      tradeOffs: [
        "Operational tooling maturity differs from the incumbent; DBAs need upskilling",
        "Distributed tuning (merge compaction, locality) has a learning curve",
        "Vendor-specific SQL extensions require conversion and regression testing",
      ],
    },
    {
      component: "Kubernetes (EKS/ACK)",
      rationale:
        "Container orchestration standardizes deployment of the NestJS services, jobs, and workers, and gives elastic scale for ${d.appType} traffic spikes (e.g., enrollment openings). Managed control plane reduces operational burden.",
      advantages: [
        "Horizontal Pod Autoscaling on CPU/custom metrics handles traffic spikes",
        "Rolling + canary deploys with instant rollback",
        "Consistent dev/staging/prod environments via OCI images",
      ],
      tradeOffs: [
        "Platform complexity requires an SRE skill set",
        "Cost floor is higher than serverless for low traffic",
        "Day-2 operations (networking, ingress, secrets) need investment",
      ],
    },
    {
      component: "Redis (managed)",
      rationale:
        "Provides sub-millisecond reads for session, catalog, and rate-limit data, protecting the database from read amplification during peak learner activity.",
      advantages: [
        "Removes hot-read load from the primary database",
        "Atomic primitives power rate limiting and idempotency",
        "Multi-AZ managed offering meets the availability target",
      ],
      tradeOffs: [
        "Another data store to operate and keep consistent",
        "Cache stampede risk if not protected (singleflight / jitter)",
        "Memory cost scales with cache size",
      ],
    },
    {
      component: "Kafka",
      rationale:
        "Decouples long-running work (video transcoding, notifications, analytics) from the synchronous request path, keeping learner-facing latency low and enabling replayable event streams.",
      advantages: [
        "Buffers load spikes from batch and async workloads",
        "Durable, replayable event log for analytics and audit",
        "Decouples producers from consumers for independent scaling",
      ],
      tradeOffs: [
        "Adds distributed-systems complexity to operations",
        "Requires schema governance (e.g., Schema Registry)",
        "At-least-once delivery needs consumers to be idempotent",
      ],
    },
    {
      component: "OpenTelemetry + Prometheus",
      rationale:
        "Vendor-neutral observability avoids lock-in and correlates logs, metrics, and traces across the API, queue, and data tiers — critical for debugging distributed transactions post-migration.",
      advantages: [
        "Single correlation ID spans the entire request lifecycle",
        "Golden-signal dashboards catch regressions during cut-over",
        "Portable across cloud providers",
      ],
      tradeOffs: [
        "Requires instrumentation discipline across services",
        "Storage cost grows with retention and cardinality",
        "Needs SLO/alert tuning to avoid alert fatigue",
      ],
    },
  ];
}

function buildRisks(d: DetectedRequirements): Risk[] {
  const risks: Risk[] = [
    {
      id: "R1",
      category: "Technical",
      description: `${d.db} → ${d.dbTarget} migration surfaces incompatible PL/SQL, sequences, or implicit data type coercion that break application queries.`,
      severity: "High",
      likelihood: "Medium",
    },
    {
      id: "R2",
      category: "Operational",
      description: "Cut-over causes unplanned downtime or data inconsistency during the switchover window, impacting learners.",
      severity: d.ha ? "Critical" : "High",
      likelihood: "Medium",
    },
    {
      id: "R3",
      category: "Compliance",
      description: `Personal data of ${d.users.toLocaleString()} ${d.country} users may leave the permitted residency region if services are not pinned.`,
      severity: "High",
      likelihood: "Medium",
    },
    {
      id: "R4",
      category: "Performance",
      description: "Query plans change on the new engine; unindexed or legacy queries degrade under production load.",
      severity: "Medium",
      likelihood: "High",
    },
    {
      id: "R5",
      category: "Delivery",
      description: "Team lacks operational experience with the new data platform and Kubernetes, slowing incident response.",
      severity: "Medium",
      likelihood: "High",
    },
  ];

  if (d.dr) {
    risks.push({
      id: "R6",
      category: "Operational",
      description: "Cross-region DR failover has never been exercised; RTO/RPO targets are unproven under real failure.",
      severity: "High",
      likelihood: "Medium",
    });
  }
  return risks;
}

function buildMitigations(d: DetectedRequirements): Mitigation[] {
  const mitigations: Mitigation[] = [
    {
      riskId: "R1",
      strategy: "De-risk schema and SQL conversion before cut-over.",
      actions: [
        "Run an automated assessment tool to flag incompatible objects and PL/SQL",
        "Convert and unit-test stored procedures in a staging mirror",
        "Maintain a regression suite of representative production queries",
      ],
    },
    {
      riskId: "R2",
      strategy: "Plan a zero-downtime, reversible cut-over.",
      actions: [
        "Use dual-write + shadow reads during the transition window",
        "Cut over during a low-traffic maintenance window with rollback runbook ready",
        "Verify row counts and checksums before and after switchover",
      ],
    },
    {
      riskId: "R3",
      strategy: "Enforce data residency by architecture, not policy.",
      actions: [
        `Pin data, cache, and backups to the ${d.country} region`,
        "Block cross-region egress via VPC and routing controls",
        "Encrypt all data at rest with KMS-managed keys and audit access",
      ],
    },
    {
      riskId: "R4",
      strategy: "Validate performance under production-shaped load.",
      actions: [
        "Capture and replay peak traffic against staging",
        "Index and tune the top queries by cost before launch",
        "Add query-timeout and connection-pool guardrails",
      ],
    },
    {
      riskId: "R5",
      strategy: "Build operational readiness before go-live.",
      actions: [
        "Run enablement sessions and create runbooks for the top failure modes",
        "Pair with the platform vendor for cut-over support",
        "On-call rotation with clear escalation paths from day one",
      ],
    },
  ];

  if (d.dr) {
    mitigations.push({
      riskId: "R6",
      strategy: "Prove DR with regular, automated drills.",
      actions: [
        "Run a quarterly cross-region failover drill",
        "Automate DR runbooks and measure actual RTO/RPO each drill",
        "Set synthetic monitors that fail the drill if SLOs are breached",
      ],
    });
  }
  return mitigations;
}

function buildDeployment(d: DetectedRequirements): DeploymentRecommendation {
  const pattern = d.dr
    ? "Cross Region DR"
    : d.ha
      ? "Multi AZ"
      : "Single AZ";

  const topology = d.dr
    ? [
        `Primary region: ${d.country} — active Application + Data tiers across multiple AZs`,
        "Standby region: paired region with warm application tier and async-replicated data",
        "Global traffic manager routes users to the healthy region with health-based failover",
        "Data tier: ${d.dbTarget} multi-AZ primary in-region, async cross-region replication",
        "Redis: multi-AZ in-region, rebuilt from DB on regional failover",
        "Object storage: cross-region replication for content and backups",
        "Backups: continuous PITR + daily snapshots with quarterly restore validation",
        "Runbooks + quarterly DR drills validate RTO/RPO",
      ]
    : d.ha
      ? [
          `Single region (${d.country}) across at least two AZs for the Application and Data tiers`,
          "Stateless services spread across AZs behind a zonal-aware load balancer",
          `${d.dbTarget} primary/standby across AZs with automatic failover`,
          "Redis multi-AZ for cache resilience",
          "Backups + PITR to a separate fault domain",
          "Health checks and autoscaling absorb zonal loss",
        ]
      : [
          `Single AZ deployment in ${d.country} for the MVP`,
          "Stateless services behind a load balancer, ready to add a second AZ",
          `${d.dbTarget} with automated backups and PITR`,
          "Redis for cache and sessions",
          "Defined upgrade path to Multi-AZ as traffic grows",
        ];

  return {
    pattern,
    rationale: d.dr
      ? `Because DR is a stated requirement and ${d.users.toLocaleString()} users depend on ${d.appType}, a Cross-Region DR pattern protects against full regional failure. The active region serves traffic while a warm standby keeps RTO/RPO bounded — justified given the business continuity requirement${d.budget === "low" ? " (cost-optimized by using a warm, not active-active, standby)" : ""}.`
      : d.ha
        ? `Multi-AZ within ${d.country} meets the high-availability requirement for ${d.users.toLocaleString()} users while keeping cost proportionate. A second AZ absorbs zonal failure with no manual intervention; cross-region DR can be added later.`
        : `A Single-AZ deployment is sufficient for the current scale and budget, with a clearly defined, low-effort upgrade path to Multi-AZ as the ${d.appType} grows.`,
    topology,
    drObjective: {
      rto: d.dr ? "< 1 hour" : d.ha ? "< 4 hours" : "< 24 hours",
      rpo: d.dr ? "< 15 minutes" : d.ha ? "< 1 hour" : "< 24 hours",
    },
  };
}

export function generateMockSolution(requirements: string): ArchitectureSolution {
  const d = detect(requirements);
  return {
    executiveSummary: `The customer, based in ${d.country}, is seeking to migrate ${d.db} to ${d.dbTarget} to power ${d.appType} serving approximately ${d.users.toLocaleString()} users. The stated priorities are${d.ha ? " high availability" : " reliable operation"}${d.dr ? " and disaster recovery" : ""}, at a ${d.budget} budget.

This proposal recommends a cloud-native, containerized architecture with ${d.dbTarget} as the distributed, strongly-consistent data tier, a managed Redis cache, Kafka for asynchronous processing, and S3-compatible object storage for media and backups. Observability is built in from day one via OpenTelemetry, Prometheus, and centralized logging to de-risk the migration and ongoing operations.

${d.dr ? `A cross-region disaster recovery design bounds RTO to under an hour and RPO to under 15 minutes, meeting the business-continuity requirement. ` : ""}The architecture is designed to be incrementally adoptable: it starts right-sized for the current ${d.users.toLocaleString()}-user base and scales horizontally without re-architecture as the ${d.domain} workload grows.`,
    components: buildComponents(d),
    mermaidDiagram: DEFAULT_DIAGRAM,
    designDecisions: buildDecisions(d),
    risks: buildRisks(d),
    mitigations: buildMitigations(d),
    deployment: buildDeployment(d),
    meta: {
      generatedAt: new Date().toISOString(),
      model: "demo-architect-v1",
      provider: "Demo Mode (built-in)",
      mode: "demo",
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Mock regeneration                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Returns a patched solution reflecting the chosen focus. In demo mode we
 * produce believable, opinionated updates for the exact (focus, section)
 * combinations the UI can request, keeping the rest of the solution intact.
 */
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
            "**Node.js (NestJS)** split into bounded-context modules with clear interface contracts; introduces a modular monolith that can be split into services later without re-architecture. Added a dedicated BFF (Backend-for-Frontend) for the learner portal.",
          apiLayer:
            "Standardized on **GraphQL federation** with a gateway composing domain subgraphs, plus a thin REST layer for webhooks and payments. Contract tests gate every deploy.",
        };
      } else if (section === "designDecisions") {
        solution.designDecisions = withDecision(
          solution.designDecisions,
          "Modular Monolith + BFF",
          "A modular monolith with a BFF separates the learner experience from admin/payment flows, improving cohesion and team autonomy without the operational tax of premature microservices.",
          [
            "Clear module boundaries ease a future move to microservices",
            "BFF tailors payloads to each client, reducing over-fetching",
            "Single deployable simplifies ops at current scale",
          ],
          ["Module boundaries need enforced discipline", "Shared database risks coupling if not partitioned"],
        );
      }
      break;

    case "cost":
      if (section === "designDecisions") {
        solution.designDecisions = withDecision(
          solution.designDecisions,
          "Cost Optimization",
          "Re-tuned the stack for total cost of ownership: reserved capacity for baseline load, spot/preemptible for batch (transcoding, analytics), right-sized instances, and tiered storage.",
          [
            "Reserved instances cut baseline compute 30-40%",
            "Spot nodes for transcoding/ETL cut batch cost ~70%",
            "Object-storage lifecycle moves cold media to archive tier",
          ],
          ["Spot interruptions require graceful checkpointing", "Reserved capacity reduces flexibility for sudden growth"],
        );
      } else if (section === "deployment") {
        solution.deployment = {
          ...solution.deployment,
          rationale:
            (solution.deployment.rationale + " ") +
            "Cost is contained by reserving baseline capacity, running async/batch workloads on spot/preemptible nodes with graceful eviction, and tiering object storage to archive classes for cold content.",
          topology: [
            ...solution.deployment.topology,
            "Baseline traffic on reserved instances; spikes on autoscaled on-demand",
            "Transcoding/ETL workers on spot nodes with checkpointing",
            "Object storage lifecycle: hot -> infrequent access -> archive",
          ],
        };
      }
      break;

    case "performance":
      if (section === "components") {
        solution.components = {
          ...solution.components,
          cache:
            "Multi-tier cache: **CDN edge caching** for static assets + **Redis** for dynamic reads, with read-through and singleflight to prevent stampedes. Hot query results cached at the application layer with jittered TTLs.",
          database:
            solution.components.database + " Added **read replicas** for dashboard/reporting reads and **connection pooling** (PgBather/ProxySQL equivalent) to cap DB connections.",
          loadBalancer:
            "Global anycast **load balancer** with latency-based routing, HTTP/3, and connection reuse; in-region L7 LB with path routing and TLS 1.3.",
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
            description:
              "Insider or compromised-credential access could exfiltrate learner PII or payment data.",
            severity: "Critical",
            likelihood: "Medium",
          },
          {
            id: `R${solution.risks.length + 2}`,
            category: "Security",
            description:
              "API abuse (credential stuffing, scraping) targets enrollment and login endpoints.",
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
              "Database/column-level access scoped per service identity; field-level encryption for PII",
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
            "Cross-region active/warm-standby with automated failover: data replicated asynchronously to a standby region, 5-minute snapshot frequency, and health-checked DNS failover. Quarterly drills validate RTO/RPO.",
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
