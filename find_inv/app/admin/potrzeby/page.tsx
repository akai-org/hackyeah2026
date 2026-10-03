import type { Metadata } from "next";

import { AdminNeedsView } from "@/components/admin/needs-view";

export const metadata: Metadata = { title: "Zgłoszone potrzeby" };

export default function Page() {
  return <AdminNeedsView />;
}
