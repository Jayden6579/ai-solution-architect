import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin", className)}
      aria-hidden="true"
    />
  );
}

/** A centered loading block with a status label. */
export function LoadingBlock({
  label,
  sublabel,
  className,
}: {
  label: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className,
      )}
    >
      <Spinner className="h-7 w-7 text-brand-600 dark:text-brand-400" />
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </p>
        {sublabel ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {sublabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
