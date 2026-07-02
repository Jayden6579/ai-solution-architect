"use client";

import * as React from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { EmptyState } from "@/components/EmptyState";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SolutionView } from "@/components/SolutionView";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import {
  generateArchitectureAction,
  regenerateArchitectureAction,
} from "@/app/actions";
import { DEFAULT_SAMPLE } from "@/lib/samples";
import type { ArchitectureSolution, ImprovementFocus, ProviderInfo } from "@/types";

const STAGES = [
  "Parsing requirements",
  "Analyzing constraints & scale",
  "Selecting architecture components",
  "Drafting design decisions",
  "Assessing risks & mitigations",
  "Designing deployment topology",
  "Rendering architecture diagram",
];

/**
 * The interactive application shell. Holds all client state and orchestrates
 * the generate / regenerate server actions. Rendered by the server page,
 * which passes in the provider info read from the environment.
 */
export function AppShell({ providerInfo }: { providerInfo: ProviderInfo }) {
  const [requirements, setRequirements] = React.useState("");
  const [solution, setSolution] = React.useState<ArchitectureSolution | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [activeFocus, setActiveFocus] = React.useState<ImprovementFocus | null>(
    null,
  );
  const [error, setError] = React.useState<{
    message: string;
    hint?: string;
  } | null>(null);
  const [regenError, setRegenError] = React.useState<{
    message: string;
    hint?: string;
  } | null>(null);
  const [stageIndex, setStageIndex] = React.useState(0);

  const resultsRef = React.useRef<HTMLDivElement>(null);
  const prevHadSolution = React.useRef(false);

  // Cycle the loading-stage label while generating.
  React.useEffect(() => {
    if (!isGenerating) return;
    setStageIndex(0);
    const id = window.setInterval(
      () => setStageIndex((i) => (i + 1) % STAGES.length),
      1500,
    );
    return () => window.clearInterval(id);
  }, [isGenerating]);

  // On first solution, scroll it into view on small screens.
  React.useEffect(() => {
    if (solution && !prevHadSolution.current) {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevHadSolution.current = Boolean(solution);
  }, [solution]);

  const handleGenerate = React.useCallback(async () => {
    if (requirements.trim().length < 10 || isGenerating) return;
    setError(null);
    setRegenError(null);
    setSolution(null);
    setIsGenerating(true);
    const res = await generateArchitectureAction(requirements);
    setIsGenerating(false);
    if (res.ok) {
      setSolution(res.data);
    } else {
      setError({ message: res.error, hint: res.hint });
    }
  }, [requirements, isGenerating]);

  const handleImprove = React.useCallback(
    async (focus: ImprovementFocus) => {
      if (!solution || isRegenerating) return;
      setRegenError(null);
      setIsRegenerating(true);
      setActiveFocus(focus);
      const res = await regenerateArchitectureAction(solution, focus);
      setIsRegenerating(false);
      setActiveFocus(null);
      if (res.ok) {
        setSolution(res.data);
      } else {
        setRegenError({ message: res.error, hint: res.hint });
      }
    },
    [solution, isRegenerating],
  );

  const handleClear = React.useCallback(() => {
    setRequirements("");
    setSolution(null);
    setError(null);
    setRegenError(null);
  }, []);

  const handleSample = React.useCallback(() => {
    setRequirements(DEFAULT_SAMPLE);
    setError(null);
  }, []);

  const showGenerating = isGenerating;
  const showSolution = !isGenerating && Boolean(solution);
  const showEmpty = !isGenerating && !solution && !error;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: compose panel */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <ControlPanel
              value={requirements}
              onChange={setRequirements}
              onGenerate={handleGenerate}
              onClear={handleClear}
              onSample={handleSample}
              isGenerating={isGenerating || isRegenerating}
              providerInfo={providerInfo}
            />
          </div>
        </aside>

        {/* Right: results */}
        <section className="lg:col-span-8" ref={resultsRef}>
          {error && !isGenerating ? (
            <div className="mb-4">
              <ErrorCard
                message={error.message}
                hint={error.hint}
                onRetry={handleGenerate}
              />
            </div>
          ) : null}

          {showGenerating ? (
            <div>
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 dark:border-brand-900 dark:bg-brand-950/30">
                <Spinner className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
                    {STAGES[stageIndex]}…
                  </p>
                  <p className="text-xs text-brand-600/80 dark:text-brand-400/70">
                    Crafting your enterprise architecture
                  </p>
                </div>
              </div>
              <LoadingSkeleton />
            </div>
          ) : showSolution && solution ? (
            <div>
              {regenError ? (
                <div className="mb-4">
                  <ErrorCard
                    message={regenError.message}
                    hint={regenError.hint}
                    onRetry={() => handleImprove(activeFocus ?? "design")}
                  />
                </div>
              ) : null}
              <SolutionView
                solution={solution}
                onImprove={handleImprove}
                activeFocus={activeFocus}
                isRegenerating={isRegenerating}
              />
            </div>
          ) : showEmpty ? (
            <EmptyState />
          ) : null}

          {/* When there's an error with no solution, still show the empty state */}
          {error && !isGenerating && !solution ? (
            <div className="mt-4">
              <EmptyState />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
