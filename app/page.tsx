import { AppShell } from "@/components/AppShell";
import { getProviderInfo } from "@/lib/llm/provider";

export default function HomePage() {
  // Reads provider config server-side so the API key never reaches the client.
  const providerInfo = getProviderInfo();

  return (
    <>
      <AppShell providerInfo={providerInfo} />
      <footer className="border-t border-slate-200 py-6 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-400 sm:flex-row sm:px-6">
          <span>
            AI Solution Architect Generator — enterprise pre-sales architecture
            workbench
          </span>
          <span>
            Built with Next.js · TypeScript · Tailwind CSS ·{" "}
            {providerInfo.mode === "live" ? providerInfo.providerName : "Demo Mode"}
          </span>
        </div>
      </footer>
    </>
  );
}
