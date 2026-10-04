import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EducationDetail } from "@/components/education-material";
import { PageBackdrop } from "@/components/page-backdrop";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.educationMaterial };
}

// Strona jednego materiału edukacyjnego — jak /innowacje/[id] dla innowacji.
export default async function EducationMaterialPage({ params }: PageProps<"/edukacja/[id]">) {
  const { id } = await params;
  const materialId = Number(id);
  if (!Number.isInteger(materialId) || materialId <= 0) notFound();

  return (
    <PageBackdrop layout="gutters">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <EducationDetail id={materialId} />
      </div>
    </PageBackdrop>
  );
}
