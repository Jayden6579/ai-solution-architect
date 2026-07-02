"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Renders a Mermaid diagram from source.
 *
 * - Lazily imports `mermaid` inside the effect so it is never evaluated during
 *   SSR and is kept out of the initial client bundle.
 * - Stores the rendered SVG string in state and injects it via
 *   `dangerouslySetInnerHTML`. We deliberately do NOT mutate a ref'd node's
 *   innerHTML directly: doing so while React manages children in the same
 *   container desyncs the virtual DOM from the real DOM and throws
 *   "removeChild: node is not a child" on the next reconciliation. Letting
 *   React own the innerHTML via state avoids that entirely.
 * - Re-renders when the source or theme changes.
 * - Exposes the rendered <svg> via [data-mermaid-container] so the PDF export
 *   can embed the actual diagram.
 */

// Module-level counter for unique mermaid render ids (Date/random are not used
// to keep this deterministic and SSR-safe).
let renderSeq = 0;

function cleanCode(raw: string): string {
  const m = raw.trim().match(/```(?:mermaid)?\s*([\s\S]*?)```/i);
  return (m?.[1] ?? raw).trim();
}

export function Mermaid({ code }: { code: string }) {
  const { theme } = useTheme();
  const [svg, setSvg] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const id = `mmd-${renderSeq++}`;
    const cleaned = cleanCode(code);

    const run = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
          securityLevel: "loose",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        });
        const result = await mermaid.render(id, cleaned);
        if (!cancelled) {
          setSvg(result.svg);
          setError(null);
          setLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setSvg("");
          setError(err instanceof Error ? err.message : String(err));
          setLoaded(true);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      // Mermaid may leave a temporary element with the render id in the DOM.
      document.getElementById(id)?.remove();
    };
  }, [code, theme]);

  return (
    <div className="flex min-h-[120px] items-center justify-center overflow-x-auto">
      {!loaded ? (
        <div className="h-40 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
      ) : null}

      {loaded && !error ? (
        <div
          data-mermaid-container
          className="mermaid-wrap"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}

      {error ? (
        <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Could not render diagram
          </div>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-amber-800 dark:text-amber-300">
            {cleanCode(code)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
