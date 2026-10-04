"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, BarChart3, FlaskConical, Gauge, Inbox, Library, Lightbulb, Loader2, LogIn, MessagesSquare, ShieldCheck, Users } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

export const ADMIN_LINKS = [
  { href: "/admin/statystyki", key: "stats", icon: Gauge },
  { href: "/admin/innowacje", key: "innovations", icon: Library },
  { href: "/admin/uzytkownicy", key: "users", icon: Users },
  { href: "/admin/testy", key: "tests", icon: FlaskConical },
  { href: "/admin/forum", key: "forum", icon: MessagesSquare },
  { href: "/admin/potrzeby", key: "needs", icon: Inbox },
  { href: "/admin/trendy", key: "trends", icon: BarChart3 },
  { href: "/admin/zaangazowanie", key: "engagement", icon: Activity },
  { href: "/admin/pomysly", key: "ideas", icon: Lightbulb },
] as const;

// Panel ROPS: wpuszcza tylko rolę admin. Jury loguje się jednym kliknięciem z tego ekranu.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, status, login } = useAuth();
  const pathname = usePathname();
  const a = useI18n().t.admin;
  const [loggingIn, setLoggingIn] = useState(false);

  if (status === "loading") {
    return (
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-16 sm:px-6" role="status">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-primary" />
        {a.shell.checking}
      </div>
    );
  }

  if (user?.role !== "admin") {
    async function loginAsAdmin() {
      setLoggingIn(true);
      try {
        await login("admin", a.shell.adminName);
      } finally {
        setLoggingIn(false);
      }
    }

    return (
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text={a.shell.title} />
        <div className="mt-8 max-w-xl border-(length:--bw) border-border bg-surface p-6 shadow-raised sm:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
            <ShieldCheck aria-hidden="true" className="size-7 shrink-0 text-primary" />
            {a.shell.staffOnly}
          </h2>
          <p className="mt-3">
            {user
              ? a.shell.noPermission
              : a.shell.loginPrompt}
          </p>
          <Button type="button" onClick={loginAsAdmin} disabled={loggingIn} className="mt-6">
            {loggingIn ? <Loader2 aria-hidden="true" className="animate-spin" /> : <LogIn aria-hidden="true" />}
            {a.shell.loginAsAdmin}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-muted">{a.shell.title}</p>
          <p className="text-sm text-muted">{a.shell.loggedIn(user.name)}</p>
        </div>
      </div>

      <nav aria-label={a.shell.navLabel} className="mt-4 border-b-(length:--bw) border-border">
        <ul className="-mb-(--bw) flex flex-wrap gap-1">
          {ADMIN_LINKS.map(({ href, key, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-12 items-center gap-2 rounded-t-ui border-(length:--bw) px-4 font-bold",
                    active
                      ? "border-border border-b-surface bg-surface text-foreground"
                      : "border-transparent text-primary underline-offset-4 hover:underline",
                  )}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  {a.nav[key]}
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
