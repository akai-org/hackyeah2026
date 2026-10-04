import type { Metadata } from "next";

import { AdminTrendsView } from "@/components/admin/trends-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.adminTrends };
}

export default function Page() {
  return <AdminTrendsView />;
}
