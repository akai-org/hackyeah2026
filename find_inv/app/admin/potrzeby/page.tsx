import type { Metadata } from "next";

import { AdminNeedsView } from "@/components/admin/needs-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.adminNeeds };
}

export default function Page() {
  return <AdminNeedsView />;
}
