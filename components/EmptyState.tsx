import { FileText, GitBranch, ShieldCheck, Boxes, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Boxes, label: "Proposed architecture" },
  { icon: GitBranch, label: "Mermaid diagram" },
  { icon: FileText, label: "Design decisions & rationale" },
  { icon: ShieldCheck, label: "Risks & mitigations" },
];

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/20">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Generate an enterprise architecture from requirements
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Describe the customer&apos;s workload, scale, and constraints on the
        left, then click <span className="font-medium text-slate-700 dark:text-slate-200">Generate Architecture</span>. You&apos;ll get a complete,
        defensible proposal you can present in a workshop.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-4 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
