"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";

import { AccessibilitySettings } from "@/components/simple-mode";

const NAV_LINKS = [
  { href: "/#kontakt", label: "Kontakt" },
];

const linkClass =
  "inline-flex min-h-12 items-center rounded-ui px-3 text-base font-bold text-deep underline-offset-4 hover:underline";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Escape zamyka menu i oddaje focus przyciskowi. Menu nie więzi focusa.
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

  return (
    <header className="relative z-10 border-b-(length:--bw) border-deep bg-paper">
      <a
        href="#tresc"
        className="focus-on-deep sr-only rounded-ui bg-deep px-5 py-3 font-bold text-surface focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-20"
      >
        Przejdź do treści
      </a>

      <div className="relative mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="HubMI, strona główna" className="inline-flex min-h-12 items-center rounded-ui py-1">
          <span className="text-xl font-bold text-deep">HubMI</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <form action="/wyniki" method="get" role="search" className="absolute left-1/2 hidden -translate-x-1/2 sm:flex">
            <label htmlFor="header-search" className="sr-only">
              Szukaj rozwiązania
            </label>
            <div className="flex min-h-12 items-center rounded-ui border-(length:--bw) border-deep bg-surface">
              <Search aria-hidden="true" className="ml-3 size-5 text-leaf" />
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder="Szukaj rozwiązania"
                className="min-w-0 bg-transparent px-3 text-base text-ink outline-none placeholder:text-muted sm:w-44 lg:w-56"
              />
            </div>
          </form>

          <nav aria-label="Główna" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          </nav>

          <AccessibilitySettings className="hidden lg:block" />
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
          <form action="/wyniki" method="get" role="search" className="mb-3 flex sm:hidden">
            <label htmlFor="mobile-header-search" className="sr-only">
              Szukaj rozwiązania
            </label>
            <div className="flex min-h-12 w-full items-center rounded-ui border-(length:--bw) border-deep bg-paper">
              <Search aria-hidden="true" className="ml-3 size-5 text-leaf" />
              <input
                id="mobile-header-search"
                name="q"
                type="search"
                placeholder="Szukaj rozwiązania"
                className="min-w-0 flex-1 bg-transparent px-3 text-base text-ink outline-none placeholder:text-muted"
              />
            </div>
          </form>
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`${linkClass} w-full`} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <AccessibilitySettings className="mt-2 border-t-2 border-sage px-3 pt-2" />
        </nav>
      </div>
    </header>
  );
}
