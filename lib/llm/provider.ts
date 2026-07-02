import type { ProviderInfo } from "@/types";

/**
 * LLM provider configuration, read from environment variables.
 *
 * The app is provider-agnostic: any OpenAI-compatible Chat Completions
 * endpoint works (OpenAI, Azure OpenAI, Ollama, vLLM, etc.). When no API key
 * is configured the app falls back to a built-in demo provider so it can be
 * showcased without external dependencies.
 */

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  providerName: string;
  temperature: number;
  jsonMode: boolean;
  mode: "live" | "demo";
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  return value.trim().toLowerCase() === "true";
}

export function getLlmConfig(): LlmConfig {
  const apiKey = process.env.LLM_API_KEY?.trim() ?? "";
  const hasKey = apiKey.length > 0;
  return {
    apiKey,
    baseUrl: process.env.LLM_BASE_URL?.trim() || "https://api.openai.com/v1",
    model: process.env.LLM_MODEL?.trim() || "gpt-4o",
    providerName: process.env.LLM_PROVIDER_NAME?.trim() || "OpenAI",
    temperature: Number(process.env.LLM_TEMPERATURE ?? 0.4),
    jsonMode: bool(process.env.LLM_JSON_MODE, true),
    mode: hasKey ? "live" : "demo",
  };
}

/** Synchronous provider info for the UI status badge (called server-side). */
export function getProviderInfo(): ProviderInfo {
  const cfg = getLlmConfig();
  return {
    mode: cfg.mode,
    model: cfg.model,
    providerName: cfg.providerName,
  };
}
