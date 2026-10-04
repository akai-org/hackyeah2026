import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InnovationDetail } from "@/components/innovation-detail";
import { PageBackdrop } from "@/components/page-backdrop";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.innovation };
}

export default async function InnovationPage({ params }: PageProps<"/innowacje/[id]">) {
  const { id } = await params;
  const innovationId = Number(id);
  if (!Number.isInteger(innovationId) || innovationId <= 0) notFound();

  return (
    <PageBackdrop layout="gutters">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <InnovationDetail id={innovationId} />
      </div>
    </PageBackdrop>
  );
}
