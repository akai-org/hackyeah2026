import type { Metadata } from "next";

import { Middleman } from "@/components/middleman";
import { PageBackdrop } from "@/components/page-backdrop";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.implementation };
}

function first(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

// Wejście z karty wyników: /wdrozenie?innowacja={id}&problem={opis problemu}
export default async function ImplementationPage({ searchParams }: PageProps<"/wdrozenie">) {
  const { innowacja, problem } = await searchParams;
  const innovationId = first(innowacja);
  return (
    <PageBackdrop layout="gutters">
      <Middleman key={innovationId ?? "wybor"} innovationId={innovationId} problem={first(problem) ?? ""} />
    </PageBackdrop>
  );
}
