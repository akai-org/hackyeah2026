import type { Metadata } from "next";

import { AdminForumView } from "@/components/admin/forum-view";

export const metadata: Metadata = { title: "Moderacja forum" };

export default function Page() {
  return <AdminForumView />;
}
