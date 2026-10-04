import type { Metadata } from "next";

import { AdminForumView } from "@/components/admin/forum-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.adminForum };
}

export default function Page() {
  return <AdminForumView />;
}
