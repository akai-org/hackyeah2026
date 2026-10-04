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

export const ADMIN_LINK_GROUPS = [
  {
    key: "overview",
    links: [
      { href: "/admin/statystyki", key: "stats", icon: Gauge },
      { href: "/admin/trendy", key: "trends", icon: BarChart3 },
      { href: "/admin/zaangazowanie", key: "engagement", icon: Activity },
    ],
  },
  {
    key: "content",
    links: [
      { href: "/admin/innowacje", key: "innovations", icon: Library },
      { href: "/admin/pomysly", key: "ideas", icon: Lightbulb },
      { href: "/admin/potrzeby", key: "needs", icon: Inbox },
      { href: "/admin/forum", key: "forum", icon: MessagesSquare },
    ],
  },
  {
    key: "people",
    links: [
      { href: "/admin/uzytkownicy", key: "users", icon: Users },
      { href: "/admin/testy", key: "tests", icon: FlaskConical },
    ],
  },
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
      <div>
        <p className="font-bold text-muted">{a.shell.title}</p>
        <p className="text-sm text-muted">{a.shell.loggedIn(user.name)}</p>
      </div>

      <div className="mt-4 lg:mt-8 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        {/* Mobile/tablet: jeden rząd przewijany w poziomie zamiast zawijania. Desktop: pionowy sidebar z grupami. */}
        <nav aria-label={a.shell.navLabel} className="-mx-4 border-b-(length:--bw) border-border sm:-mx-6 lg:mx-0 lg:border-b-0">
          <div className="relative flex snap-x gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:px-6 lg:sticky lg:top-24 lg:flex-col lg:gap-6 lg:overflow-visible lg:p-0">
            {ADMIN_LINK_GROUPS.map((group) => (
              <div key={group.key} className="flex shrink-0 gap-1 lg:flex-col">
                <p className="hidden px-3 pb-1 text-xs font-bold tracking-wide text-muted uppercase lg:block">
                  {a.navGroups[group.key]}
                </p>
                <ul className="flex gap-1 lg:flex-col">
                  {group.links.map(({ href, key, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                      <li key={href} className="snap-start">
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 items-center gap-2 rounded-ui border-(length:--bw) px-3 font-bold whitespace-nowrap",
                            active
                              ? "border-border bg-surface text-foreground"
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
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 pt-8 lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
