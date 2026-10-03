"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Gauge, Library, Lightbulb, Loader2, LogIn, ShieldCheck, Users } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const ADMIN_LINKS = [
  { href: "/admin/statystyki", label: "Statystyki", icon: Gauge },
  { href: "/admin/innowacje", label: "Innowacje", icon: Library },
  { href: "/admin/uzytkownicy", label: "Użytkownicy", icon: Users },
  { href: "/admin/trendy", label: "Trendy", icon: BarChart3 },
  { href: "/admin/pomysly", label: "Pomysły", icon: Lightbulb },
];

// Panel ROPS: wpuszcza tylko rolę admin. Jury loguje się jednym kliknięciem z tego ekranu.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, status, login } = useAuth();
  const pathname = usePathname();
  const [loggingIn, setLoggingIn] = useState(false);

  if (status === "loading") {
    return (
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-16 sm:px-6" role="status">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-leaf" />
        Sprawdzam uprawnienia…
      </div>
    );
  }

  if (user?.role !== "admin") {
    async function loginAsAdmin() {
      setLoggingIn(true);
      try {
        await login("admin", "Pracownik ROPS");
      } finally {
        setLoggingIn(false);
      }
    }

    return (
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text="Panel ROPS" />
        <div className="mt-8 max-w-xl border-(length:--bw) border-deep bg-surface p-6 shadow-paper sm:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold text-deep">
            <ShieldCheck aria-hidden="true" className="size-7 shrink-0 text-leaf" />
            Ta część jest dla pracowników ROPS
          </h2>
          <p className="mt-3">
            {user
              ? "Jesteś zalogowany bez uprawnień administratora. Zaloguj się jako admin, żeby zarządzać Biblioteką."
              : "Zaloguj się jako admin, żeby zatwierdzać innowacje, nadawać role i oglądać trendy."}
          </p>
          <Button type="button" onClick={loginAsAdmin} disabled={loggingIn} className="mt-6">
            {loggingIn ? <Loader2 aria-hidden="true" className="animate-spin" /> : <LogIn aria-hidden="true" />}
            Zaloguj jako admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-muted">Panel ROPS</p>
          <p className="text-sm text-muted">Zalogowano: {user.name}</p>
        </div>
      </div>

      <nav aria-label="Panel admina" className="mt-4 border-b-(length:--bw) border-deep">
        <ul className="-mb-(--bw) flex flex-wrap gap-1">
          {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-12 items-center gap-2 rounded-t-ui border-(length:--bw) px-4 font-bold",
                    active
                      ? "border-deep border-b-surface bg-surface text-deep"
                      : "border-transparent text-leaf underline-offset-4 hover:underline",
                  )}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pt-8">{children}</div>
    </div>
  );
}
