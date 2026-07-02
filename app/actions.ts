"use server";

import {
  generateArchitecture,
  regenerateArchitecture,
  GenerationError,
} from "@/lib/llm/generate";
import { getImprovementConfig } from "@/lib/llm/improvements";
import type {
  ArchitectureSolution,
  CloudProvider,
  ImprovementFocus,
} from "@/types";

/**
 * Server actions exposed to the client.
 *
 * The client passes natural-language requirements (and, for regeneration, the
 * current solution + a focus). These actions run on the server, so the LLM
 * API key never leaves the server and the provider SDK is never shipped to the
 * browser.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; hint?: string };

function handleError(err: unknown): {
  ok: false;
  error: string;
  hint?: string;
} {
  if (err instanceof GenerationError) {
    return { ok: false, error: err.message, hint: err.hint };
  }
  const message = err instanceof Error ? err.message : "Unexpected error.";
  return { ok: false, error: message };
}

/** Generate a full architecture solution from natural-language requirements. */
export async function generateArchitectureAction(
  requirements: string,
  cloudProvider: CloudProvider = "kingsoft",
): Promise<ActionResult<ArchitectureSolution>> {
  const trimmed = requirements.trim();
  if (trimmed.length < 10) {
    return {
      ok: false,
      error: "Please provide more detail about the customer's requirements.",
      hint: "Aim for at least a couple of sentences covering the workload, scale, and constraints.",
    };
  }

  try {
    const solution = await generateArchitecture(trimmed, cloudProvider);
    return { ok: true, data: solution };
  } catch (err) {
    return handleError(err);
  }
}

/** Regenerate a targeted subset of sections applying an improvement focus. */
export async function regenerateArchitectureAction(
  solution: ArchitectureSolution,
  focus: ImprovementFocus,
): Promise<ActionResult<ArchitectureSolution>> {
  try {
    const config = getImprovementConfig(focus);
    const next = await regenerateArchitecture(
      solution,
      focus,
      config.sections,
    );
    return { ok: true, data: next };
  } catch (err) {
    return handleError(err);
  }
}
