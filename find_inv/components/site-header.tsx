"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";

import { AccessibilitySettings } from "@/components/simple-mode";
import { CutoutText } from "@/components/cutout-text";
import { Dialog } from "@/components/ui/dialog";
import { QuickSearch } from "@/components/quick-search";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/biblioteka", label: "Biblioteka" },
  { href: "/kreator", label: "Kreator pomysłów" },
  { href: "/wnioski", label: "Wnioski" },
  { href: "/edukacja", label: "Edukacja" },
];

const linkClass =
  "inline-flex min-h-12 items-center whitespace-nowrap rounded-ui px-2.5 text-base font-bold text-foreground underline-offset-4 hover:text-primary hover:underline";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  // Panel ROPS widać w menu tylko po zalogowaniu jako admin, panel testera — jako tester.
  const links =
    user?.role === "admin"
      ? [...NAV_LINKS, { href: "/admin", label: "Panel ROPS" }]
      : user?.role === "tester"
        ? [...NAV_LINKS, { href: "/testerzy/panel", label: "Panel testera" }]
        : NAV_LINKS;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
        return;
      }
      // Esc w oknie wyszukiwania obsługuje <Dialog>; tu tylko menu mobilne.
      if (event.key === "Escape" && open && !searchOpen) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, searchOpen, openSearch]);

  return (
    <header className="sticky top-0 z-40 border-b-(length:--bw) border-border bg-background">
      <a
        href="#main"
        className="focus-on-primary sr-only rounded-ui bg-primary px-5 py-3 font-bold text-primary-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50"
      >
        Przejdź do treści
      </a>

      <div className="relative mx-auto flex items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="HubMI, strona główna" className="inline-flex min-h-12 shrink-0 items-center rounded-ui py-1">
          <CutoutText text="HubMI" as="span" size="logo" labelled={false} />
        </Link>

        <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-4">
          <button
            type="button"
            onClick={openSearch}
            aria-haspopup="dialog"
            aria-keyshortcuts="Control+K"
            className="hidden min-h-12 w-full max-w-md cursor-pointer items-center rounded-ui border-(length:--bw) border-border bg-surface text-left hover:bg-background sm:flex"
          >
            <Search aria-hidden="true" className="ml-3 size-5 text-primary" />
            <span className="min-w-0 flex-1 px-3 text-base text-muted">Szukaj</span>
            <kbd className="mr-3 rounded border border-border/40 px-2 py-1 text-sm font-semibold text-muted">Ctrl+K</kbd>
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <nav aria-label="Główna" className="nav-desktop hidden xl:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          </nav>

          <UserMenu compact className="hidden sm:flex" />

          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls="menu-mobilne"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-ui border-(length:--bw) border-border bg-surface px-4 font-bold text-primary hover:bg-primary/10 nav-mobile xl:hidden"
          >
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            {open ? "Zamknij" : "Menu"}
          </button>
        </div>
      </div>

      <div
        id="menu-mobilne"
        hidden={!open}
        className="nav-mobile max-h-[calc(100dvh-5rem)] overflow-y-auto border-t-(length:--bw) border-border bg-surface xl:hidden"
      >
        <nav aria-label="Główna, wersja mobilna" className="mx-auto max-w-content px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={openSearch}
            aria-haspopup="dialog"
            className="mb-3 flex min-h-12 w-full cursor-pointer items-center rounded-ui border-(length:--bw) border-border bg-background text-left sm:hidden"
          >
            <Search aria-hidden="true" className="ml-3 size-5 text-primary" />
            <span className="min-w-0 flex-1 px-3 text-base text-muted">Szukaj</span>
          </button>
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`${linkClass} w-full`} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <UserMenu className="mt-2 border-t-2 border-border/40 px-3 pt-3 sm:hidden" />
        </nav>
      </div>
      <Dialog
        open={searchOpen}
        onClose={closeSearch}
        title="Czego szukasz?"
        closeLabel="Zamknij wyszukiwanie"
        initialFocusRef={searchInputRef}
        size="lg"
      >
        <QuickSearch inputRef={searchInputRef} onNavigate={closeSearch} />
        <p className="mt-4 text-sm text-muted">Naciśnij Escape, aby zamknąć.</p>
      </Dialog>
      <AccessibilitySettings />
    </header>
  );
}
