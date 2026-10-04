import type { Metadata } from "next";

import { AdminStatsView } from "@/components/admin/stats-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.adminStats };
}

export default function Page() {
  return <AdminStatsView />;
}
