import type { Metadata } from "next";

import { AdminStatsView } from "@/components/admin/stats-view";

export const metadata: Metadata = { title: "Statystyki" };

export default function Page() {
  return <AdminStatsView />;
}
