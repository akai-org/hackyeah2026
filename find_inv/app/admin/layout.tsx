"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, BookOpen, TrendingUp, LayoutDashboard, Lightbulb } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/statystyki", label: "Statystyki", icon: LayoutDashboard },
  { href: "/admin/innowacje", label: "Innowacje", icon: BookOpen },
  { href: "/admin/uzytkownicy", label: "Użytkownicy", icon: Users },
  { href: "/admin/trendy", label: "Trendy", icon: TrendingUp },
  { href: "/admin/pomysly", label: "Pomysły", icon: Lightbulb },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, openLogin } = useAuth();
  const pathname = usePathname();

  if (!loading && user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 text-center">
        <p className="text-xl font-bold text-deep">Dostęp tylko dla administratorów.</p>
        <button onClick={openLogin} className="mt-4 underline text-leaf font-bold">
          Zaloguj się jako admin
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
      <aside>
        <p className="text-sm font-bold text-muted uppercase tracking-wide">Panel admina</p>
        <nav aria-label="Admin" className="mt-3">
          <ul className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-ui px-3 py-2 text-base font-bold",
                    pathname.startsWith(href)
                      ? "bg-leaf text-surface"
                      : "text-deep hover:bg-sage",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
