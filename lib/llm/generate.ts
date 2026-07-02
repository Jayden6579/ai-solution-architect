import OpenAI from "openai";
import { getLlmConfig } from "./provider";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  buildRegeneratePrompt,
} from "./prompts";
import { llmSolutionSchema, type LlmSolution } from "./schema";
import {
  generateMockSolution,
  regenerateMockSections,
} from "./mock";
import type {
  ArchitectureSolution,
  CloudProvider,
  ImprovementFocus,
  SectionKey,
  SolutionMeta,
  SolutionPatch,
} from "@/types";

/**
 * High-level orchestration of solution generation and regeneration.
 *
 * Decides between the live LLM provider and the built-in demo provider based
 * on configuration, and validates all model output through the Zod schema.
 */

/** Error thrown when the LLM call or parsing fails; surfaced to the UI. */
export class GenerationError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

function clientFor(cfg: ReturnType<typeof getLlmConfig>) {
  return new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl });
}

function contentOf(res: OpenAI.Chat.Completions.ChatCompletion): string {
  return res.choices[0]?.message?.content?.trim() ?? "";
}

/** Whether a failed request is worth retrying without JSON response_format. */
function shouldRetryWithoutJsonMode(err: unknown): boolean {
  const status =
    (err as { status?: number })?.status ??
    (err as { response?: { status?: number } })?.response?.status;
  // Auth and rate-limit problems won't be fixed by dropping json mode.
  if (status === 401 || status === 403 || status === 429) return false;
  return true;
}

function enrichError(err: unknown): GenerationError {
  const status =
    (err as { status?: number })?.status ??
    (err as { response?: { status?: number } })?.response?.status;
  const message: string =
    (err as { message?: string })?.message ?? String(err);

  if (status === 401 || status === 403) {
    return new GenerationError(
      "LLM authentication failed.",
      "Check that LLM_API_KEY is valid for the configured provider.",
    );
  }
  if (status === 429) {
    return new GenerationError(
      "LLM rate limit reached.",
      "Wait a moment and try again, or reduce request frequency.",
    );
  }
  if (status === 404) {
    return new GenerationError(
      "LLM model or endpoint not found.",
      `Verify LLM_MODEL and LLM_BASE_URL are correct for your provider. (${message})`,
    );
  }
  // Network / timeout / connection errors carry no status, or status 5xx.
  return new GenerationError(
    "The LLM provider request failed.",
    `${message}`,
  );
}

async function completeJson(
  client: OpenAI,
  cfg: ReturnType<typeof getLlmConfig>,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): Promise<string> {
  const base = {
    model: cfg.model,
    messages,
    temperature: cfg.temperature,
  } as const;

  const run = (withJson: boolean) =>
    client.chat.completions.create(
      withJson
        ? { ...base, response_format: { type: "json_object" as const } }
        : { ...base },
    );

  try {
    return contentOf(
      await run(cfg.jsonMode),
    );
  } catch (err) {
    if (cfg.jsonMode && shouldRetryWithoutJsonMode(err)) {
      // Retry once without response_format — some compatible providers do not
      // support JSON-object mode even though they can still return JSON.
      try {
        return contentOf(await run(false));
      } catch (retryErr) {
        throw enrichError(retryErr);
      }
    }
    throw enrichError(err);
  }
}

/** Parse a possibly-fenced / noisy JSON string into an object. */
function extractJsonObject(raw: string): unknown {
  const text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // Fall back to slicing between the first '{' and the matching last '}'.
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first !== -1 && last > first) {
      return JSON.parse(candidate.slice(first, last + 1));
    }
    throw new GenerationError(
      "The model did not return valid JSON.",
      "Try regenerating, or set LLM_JSON_MODE=false if your provider lacks JSON mode.",
    );
  }
}

function buildMeta(
  cfg: ReturnType<typeof getLlmConfig>,
  cloudProvider: CloudProvider,
  focus?: ImprovementFocus,
): SolutionMeta {
  return {
    generatedAt: new Date().toISOString(),
    model: cfg.model,
    provider: cfg.providerName,
    mode: cfg.mode,
    cloudProvider,
    ...(focus ? { focus } : {}),
  };
}

/** Generate a full architecture solution from natural-language requirements. */
export async function generateArchitecture(
  requirements: string,
  cloudProvider: CloudProvider,
): Promise<ArchitectureSolution> {
  const cfg = getLlmConfig();

  if (cfg.mode === "demo") {
    return generateMockSolution(requirements, cloudProvider);
  }

  const client = clientFor(cfg);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(requirements, cloudProvider) },
  ];

  const raw = await completeJson(client, cfg, messages);
  const parsed = llmSolutionSchema.safeParse(extractJsonObject(raw));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new GenerationError(
      "The model returned an invalid architecture.",
      `Schema validation failed: ${issue?.path.join(".") ?? ""} ${issue?.message ?? ""}. Please try again.`,
    );
  }

  return assembleSolution(parsed.data, cfg, cloudProvider);
}

export function assembleSolution(
  data: LlmSolution,
  cfg: ReturnType<typeof getLlmConfig>,
  cloudProvider: CloudProvider,
  focus?: ImprovementFocus,
): ArchitectureSolution {
  return { ...data, meta: buildMeta(cfg, cloudProvider, focus) };
}

/**
 * Regenerate a subset of sections of an existing solution, applying a focus
 * (cost, security, etc.). Returns a new solution with only the targeted
 * sections replaced.
 */
export async function regenerateArchitecture(
  solution: ArchitectureSolution,
  focus: ImprovementFocus,
  sections: SectionKey[],
): Promise<ArchitectureSolution> {
  const cfg = getLlmConfig();

  if (cfg.mode === "demo") {
    return regenerateMockSections(solution, focus, sections);
  }

  const client = clientFor(cfg);
  const { system, user } = buildRegeneratePrompt(solution, focus, sections);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const raw = await completeJson(client, cfg, messages);
  const patch = parsePatch(raw, sections);

  if (Object.keys(patch).length === 0) {
    throw new GenerationError(
      "The model did not return any valid sections.",
      "No sections could be regenerated from the response. Please try again.",
    );
  }

  return {
    ...solution,
    ...patch,
    meta: buildMeta(cfg, solution.meta.cloudProvider, focus),
  };
}

/** Validate a regeneration response and keep only the requested sections. */
function parsePatch(raw: string, sections: SectionKey[]): SolutionPatch {
  const obj = extractJsonObject(raw) as Record<string, unknown>;
  const patch: SolutionPatch = {};
  const shape = llmSolutionSchema.shape;

  for (const section of sections) {
    if (!(section in obj)) continue;
    const result = shape[section].safeParse(obj[section]);
    if (result.success) {
      (patch as Record<string, unknown>)[section] = result.data;
    }
  }

  return patch;
}
