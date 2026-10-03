"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, BookOpen, TrendingUp, LayoutDashboard, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Badges {
  pomysly: number;
  uzytkownicy: number;
}

const NAV = [
  { href: "/admin/statystyki", label: "Statystyki", icon: LayoutDashboard, badgeKey: null },
  { href: "/admin/innowacje", label: "Innowacje", icon: BookOpen, badgeKey: null },
  { href: "/admin/uzytkownicy", label: "Użytkownicy", icon: Users, badgeKey: "uzytkownicy" as const },
  { href: "/admin/trendy", label: "Trendy", icon: TrendingUp, badgeKey: null },
  { href: "/admin/pomysly", label: "Pomysły", icon: Lightbulb, badgeKey: "pomysly" as const },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, openLogin } = useAuth();
  const pathname = usePathname();
  const [badges, setBadges] = useState<Badges>({ pomysly: 0, uzytkownicy: 0 });

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    apiFetch<{ innovations: number; users: number; testers: number; pending_testers: number; searches: number; ideas: number }>(
      "/api/admin/stats",
      { headers: { "X-Dev-Admin": "true" } },
    )
      .then((d) => {
        if (d) setBadges({ pomysly: d.ideas ?? 0, uzytkownicy: d.pending_testers ?? 0 });
      })
      .catch(() => {});
  }, [user]);

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
            {NAV.map(({ href, label, icon: Icon, badgeKey }) => {
              const count = badgeKey ? badges[badgeKey] : 0;
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-ui px-3 py-2 text-base font-bold",
                      active ? "bg-leaf text-surface" : "text-deep hover:bg-sage",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {count > 0 && (
                      <span
                        aria-label={`${count} oczekujących`}
                        className={cn(
                          "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold",
                          active ? "bg-surface text-deep" : "bg-alert text-surface",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
