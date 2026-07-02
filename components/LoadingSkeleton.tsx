import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const SECTIONS = [
  "Executive Summary",
  "Proposed Architecture",
  "Architecture Diagram",
  "Design Decisions",
  "Risks & Mitigations",
  "Deployment Recommendation",
];

export function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {SECTIONS.map((title, i) => (
        <Card key={title} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
            {title === "Proposed Architecture" || title === "Design Decisions" ? (
              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : null}
            {title === "Architecture Diagram" ? (
              <Skeleton className="h-48 w-full" />
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
