import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CutoutText } from "@/components/cutout-text";
import { Middleman } from "@/components/middleman";

export const metadata: Metadata = { title: "Plan wdrożenia" };

export default async function DeploymentPage({ params, searchParams }: PageProps<"/wdrozenie/[id]">) {
  const { id } = await params;
  const { q } = await searchParams;
  const innovationId = Number(id);
  if (!Number.isInteger(innovationId) || innovationId <= 0) notFound();
  const problem = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Dostosuj do siebie" className="print-hidden" />
      <Middleman innovationId={innovationId} initialProblem={problem} />
    </div>
  );
}
