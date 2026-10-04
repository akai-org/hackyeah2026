import type { Metadata } from "next";

import { AdminInnovationsView } from "@/components/admin/innovations-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.adminInnovations };
}

export default async function Page({ searchParams }: PageProps<"/admin/innowacje">) {
  const { status } = await searchParams;
  return <AdminInnovationsView initialStatus={typeof status === "string" ? status : ""} />;
}
