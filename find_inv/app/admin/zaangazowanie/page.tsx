import type { Metadata } from "next";

import { AdminEngagementView } from "@/components/admin/engagement-view";

export const metadata: Metadata = { title: "Zaangażowanie" };

export default function Page() {
  return <AdminEngagementView />;
}
