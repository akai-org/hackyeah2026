import type { Metadata } from "next";

import { AdminEngagementView } from "@/components/admin/engagement-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.adminEngagement };
}

export default function Page() {
  return <AdminEngagementView />;
}
