import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const panel = t.pages.titles.adminPanel;
  return { title: { default: panel, template: `%s – ${panel} – FindInv` }, robots: { index: false } };
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
