"use client";

import { FileText } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { Markdown } from "@/components/Markdown";

export function ExecutiveSummarySection({
  summary,
  regenerating,
}: {
  summary: string;
  regenerating?: boolean;
}) {
  return (
    <SectionCard
      icon={<FileText className="h-4 w-4" />}
      title="Executive Summary"
      index={1}
      description="Customer goal, proposed direction, and headline outcome"
      regenerating={regenerating}
    >
      <Markdown>{summary}</Markdown>
    </SectionCard>
  );
}
