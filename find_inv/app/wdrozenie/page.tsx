import type { Metadata } from "next";

import { Middleman } from "@/components/middleman";
import { PageBackdrop } from "@/components/page-backdrop";

export const metadata: Metadata = { title: "Plan wdrożenia" };

function first(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

// Wejście z karty wyników: /wdrozenie?innowacja={id}&problem={opis problemu}
export default async function ImplementationPage({ searchParams }: PageProps<"/wdrozenie">) {
  const { innowacja, problem } = await searchParams;
  const innovationId = first(innowacja);
  return (
    <PageBackdrop layout="gutters" leafColor="leaf">
      <Middleman key={innovationId ?? "wybor"} innovationId={innovationId} problem={first(problem) ?? ""} />
    </PageBackdrop>
  );
}
