import type { CloudProvider } from "@/types";

/**
 * Cloud provider service catalog.
 *
 * Maps each logical architecture role to the *real managed service* name for
 * each supported cloud provider. Used by the mock generator (Demo Mode) and
 * referenced by the LLM prompt (live mode) so proposals name concrete products
 * instead of generic technologies.
 *
 * NOTE (verify with the user): Kingsoft Cloud (金山云) product names below are
 * best-effort placeholders. KS3 (object storage) is well-established; the
 * others (KCE, SLB, 关系型数据库, 消息队列, 云监控, 日志服务) should be
 * confirmed against Kingsoft Cloud's current product naming.
 */

export type ServiceRole =
  | "cdn"
  | "orchestrator"
  | "loadBalancer"
  | "database"
  | "cache"
  | "messageQueue"
  | "objectStorage"
  | "monitoring"
  | "logging"
  | "securityTool"
  | "network";

export interface CloudService {
  /** Real product name as marketed by the provider. */
  name: string;
  /** Short, optional clarifying note. */
  note?: string;
}

export type ServiceMap = Record<ServiceRole, CloudService>;

export const CLOUD_CATALOG: Record<CloudProvider, ServiceMap> = {
  aws: {
    cdn: { name: "CloudFront", note: "+ Amplify Hosting" },
    orchestrator: { name: "EKS", note: "Elastic Kubernetes Service" },
    loadBalancer: { name: "Application Load Balancer (ALB)" },
    database: { name: "Aurora / RDS" },
    cache: { name: "ElastiCache (Redis)" },
    messageQueue: { name: "MSK (Kafka)" },
    objectStorage: { name: "S3" },
    monitoring: { name: "CloudWatch Metrics + Dashboards" },
    logging: { name: "CloudWatch Logs" },
    securityTool: { name: "WAF + Shield, KMS, IAM" },
    network: { name: "VPC" },
  },
  azure: {
    cdn: { name: "Azure Front Door", note: "+ Static Web Apps" },
    orchestrator: { name: "AKS", note: "Azure Kubernetes Service" },
    loadBalancer: { name: "Application Gateway" },
    database: { name: "Azure SQL / Cosmos DB" },
    cache: { name: "Azure Cache for Redis" },
    messageQueue: { name: "Event Hubs" },
    objectStorage: { name: "Blob Storage" },
    monitoring: { name: "Azure Monitor" },
    logging: { name: "Log Analytics" },
    securityTool: { name: "WAF, Key Vault, Entra ID" },
    network: { name: "VNet" },
  },
  gcp: {
    cdn: { name: "Cloud CDN", note: "+ Firebase Hosting" },
    orchestrator: { name: "GKE", note: "Google Kubernetes Engine" },
    loadBalancer: { name: "Cloud Load Balancing" },
    database: { name: "Cloud SQL / Spanner" },
    cache: { name: "Memorystore (Redis)" },
    messageQueue: { name: "Pub/Sub" },
    objectStorage: { name: "Cloud Storage" },
    monitoring: { name: "Cloud Monitoring" },
    logging: { name: "Cloud Logging" },
    securityTool: { name: "Cloud Armor, KMS, IAM" },
    network: { name: "VPC" },
  },
  kingsoft: {
    cdn: { name: "金山云 CDN" },
    orchestrator: { name: "容器服务 KCE", note: "Kingsoft Cloud Container Engine" },
    loadBalancer: { name: "SLB", note: "Server Load Balancer" },
    database: { name: "关系型数据库 KRDS" },
    cache: { name: "金山云 Redis" },
    messageQueue: { name: "消息队列 KMQueue" },
    objectStorage: { name: "KS3" },
    monitoring: { name: "云监控" },
    logging: { name: "日志服务" },
    securityTool: { name: "WAF, KMS, IAM" },
    network: { name: "VPC" },
  },
};

/** Primary AI platform per cloud provider. */
export const AI_PLATFORM: Record<CloudProvider, string> = {
  aws: "Amazon Bedrock",
  azure: "Azure OpenAI",
  gcp: "Vertex AI",
  kingsoft: "金山云星流",
};

/** Display label per provider (mirrors CLOUD_PROVIDERS for convenience). */
export const CLOUD_LABEL: Record<CloudProvider, string> = {
  aws: "AWS",
  azure: "Azure",
  gcp: "Google Cloud",
  kingsoft: "金山云",
};

/** Convenience accessor for a service name. */
export function serviceFor(
  provider: CloudProvider,
  role: ServiceRole,
): CloudService {
  return CLOUD_CATALOG[provider][role];
}

/* -------------------------------------------------------------------------- */
/* Representative AI model pricing (per 1M tokens, USD)                       */
/* -------------------------------------------------------------------------- */

export interface ModelPricing {
  name: string;
  provider: string;
  /** Provider key this model is most associated with (for ordering). */
  cloud: CloudProvider | "multi";
  inputPricePer1M: number;
  outputPricePer1M: number;
}

/**
 * Representative prices for token-cost estimation. These are approximations
 * for planning only and MUST be replaced with current, accurate pricing
 * (especially Kingsoft 星流) before any commercial use.
 */
export const AI_MODEL_PRICING: ModelPricing[] = [
  { name: "星流 大模型", provider: "金山云星流", cloud: "kingsoft", inputPricePer1M: 0.7, outputPricePer1M: 2.1 },
  { name: "gpt-4o", provider: "OpenAI", cloud: "multi", inputPricePer1M: 2.5, outputPricePer1M: 10 },
  { name: "gpt-4o-mini", provider: "OpenAI", cloud: "multi", inputPricePer1M: 0.15, outputPricePer1M: 0.6 },
  { name: "Claude Sonnet", provider: "Anthropic", cloud: "multi", inputPricePer1M: 3, outputPricePer1M: 15 },
  { name: "DeepSeek-V3", provider: "DeepSeek", cloud: "multi", inputPricePer1M: 0.14, outputPricePer1M: 0.28 },
];

/** AI workload keywords that trigger the optional AI section. */
export const AI_KEYWORDS =
  /\bai\b|llm|大模型|chatbot|聊天机器人|copilot|助手|rag|agent|智能客服|推荐系统|recommendation|embedding|向量|语音|speech|tts|asr|视觉|vision|ocr|翻译|translation|语义|nlp|智能体|知识库|knowledge base/i;
