import type { Metadata } from "next";

import { AdminTestRequestsView } from "@/components/admin/test-requests-view";

export const metadata: Metadata = { title: "Testy innowacji" };

export default function Page() {
  return <AdminTestRequestsView />;
}
