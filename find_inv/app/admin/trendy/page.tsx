import type { Metadata } from "next";

import { AdminTrendsView } from "@/components/admin/trends-view";

export const metadata: Metadata = { title: "Trendy" };

export default function Page() {
  return <AdminTrendsView />;
}
