import type { Metadata } from "next";

import { AdminTestRequestsView } from "@/components/admin/test-requests-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.adminTests };
}

export default function Page() {
  return <AdminTestRequestsView />;
}
