import type { Metadata } from "next";

import { AdminUsersView } from "@/components/admin/users-view";

export const metadata: Metadata = { title: "Użytkownicy" };

export default function Page() {
  return <AdminUsersView />;
}
