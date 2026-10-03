"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Menu, X } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { SimpleModeToggle } from "@/components/simple-mode";
import { useAuth, ROLE_BADGE } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/biblioteka", label: "Biblioteka innowacji" },
  { href: "/forum", label: "Forum" },
  { href: "/kreator", label: "Kreator" },
  { href: "/testerzy", label: "Testerzy" },
  { href: "/#jak-to-dziala", label: "Jak to działa" },
];

const linkClass =
  "inline-flex min-h-12 items-center rounded-ui px-3 text-base font-bold text-deep underline-offset-4 hover:underline";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, openLogin, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const roleBadge = user ? ROLE_BADGE[user.role] : null;

  return (
    <header className="relative z-10 border-b-(length:--bw) border-deep bg-paper">
      <a
        href="#tresc"
        className="focus-on-deep sr-only rounded-ui bg-deep px-5 py-3 font-bold text-surface focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-20"
      >
        Przejdź do treści
      </a>

      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="HubMI, strona główna" className="inline-flex min-h-12 items-center rounded-ui py-1">
          <CutoutText text="HubMI" as="span" size="logo" labelled={false} />
        </Link>

        <nav aria-label="Główna" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
            {user?.role === "admin" && (
              <li>
                <Link href="/admin" className={`${linkClass} text-leaf`}>
                  Panel admina
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <SimpleModeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-ui border-2 border-deep px-3 py-1 text-sm font-bold ${roleBadge?.className}`}
              >
                {roleBadge?.label}
              </span>
              <button
                onClick={logout}
                aria-label="Wyloguj"
                className="inline-flex min-h-10 items-center gap-2 rounded-ui px-3 text-sm font-bold text-muted hover:bg-sage"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Wyloguj
              </button>
            </div>
          ) : (
            <Button variant="secondary" onClick={openLogin} className="gap-2">
              <LogIn className="size-4" aria-hidden="true" />
              Zaloguj się
            </Button>
          )}
        </div>

        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="menu-mobilne"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-ui border-(length:--bw) border-deep bg-surface px-4 font-bold text-deep hover:bg-sage lg:hidden"
        >
          {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          {open ? "Zamknij" : "Menu"}
        </button>
      </div>

      <div id="menu-mobilne" hidden={!open} className="border-t-(length:--bw) border-deep bg-surface lg:hidden">
        <nav aria-label="Główna, wersja mobilna" className="mx-auto max-w-content px-4 py-3 sm:px-6">
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`${linkClass} w-full`} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            {user?.role === "admin" && (
              <li>
                <Link href="/admin" className={`${linkClass} w-full text-leaf`} onClick={() => setOpen(false)}>
                  Panel admina
                </Link>
              </li>
            )}
          </ul>
          <div className="mt-2 border-t-2 border-sage pt-2 px-3 flex items-center gap-3">
            <SimpleModeToggle />
            {user ? (
              <button onClick={logout} className="text-sm font-bold text-muted underline">
                Wyloguj ({roleBadge?.label})
              </button>
            ) : (
              <button onClick={openLogin} className="text-sm font-bold text-deep underline">
                Zaloguj się
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
