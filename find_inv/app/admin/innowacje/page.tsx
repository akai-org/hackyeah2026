import type { Metadata } from "next";

import { AdminInnovationsView } from "@/components/admin/innovations-view";

export const metadata: Metadata = { title: "Innowacje" };

export default async function Page({ searchParams }: PageProps<"/admin/innowacje">) {
  const { status } = await searchParams;
  return <AdminInnovationsView initialStatus={typeof status === "string" ? status : ""} />;
}
