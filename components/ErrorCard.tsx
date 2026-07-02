import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ErrorCard({
  message,
  hint,
  onRetry,
}: {
  message: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            {message}
          </h3>
          {hint ? (
            <p className="mt-1 text-sm text-red-700/80 dark:text-red-400/80">
              {hint}
            </p>
          ) : null}
          {onRetry ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-red-200 text-red-700 hover:bg-red-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
              onClick={onRetry}
            >
              <RotateCw className="h-3.5 w-3.5" />
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
