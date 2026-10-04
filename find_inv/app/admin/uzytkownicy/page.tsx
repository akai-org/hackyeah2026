import type { Metadata } from "next";

import { AdminUsersView } from "@/components/admin/users-view";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.adminUsers };
}

export default function Page() {
  return <AdminUsersView />;
}
