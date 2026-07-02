"use client";

import { GitBranch } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { Mermaid } from "@/components/Mermaid";

export function DiagramSection({
  diagram,
  regenerating,
}: {
  diagram: string;
  regenerating?: boolean;
}) {
  return (
    <SectionCard
      icon={<GitBranch className="h-4 w-4" />}
      title="Architecture Diagram"
      index={3}
      description="Generated Mermaid reference diagram"
      regenerating={regenerating}
    >
      <Mermaid code={diagram} />
    </SectionCard>
  );
}
