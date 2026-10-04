"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";

import { AccessibilitySettings } from "@/components/simple-mode";
import { CutoutText } from "@/components/cutout-text";
import { Dialog } from "@/components/ui/dialog";
import { QuickSearch } from "@/components/quick-search";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/client";


const linkClass =
  "inline-flex min-h-12 items-center whitespace-nowrap rounded-ui px-2.5 text-base font-bold text-foreground underline-offset-4 hover:text-primary hover:underline";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const t = useT();
  const NAV_LINKS = [
    { href: "/biblioteka", label: t.header.nav.library },
    { href: "/kreator", label: t.header.nav.creator },
    { href: "/wnioski", label: t.header.nav.applications },
    { href: "/edukacja", label: t.header.nav.education },
  ];
  // Panel ROPS widać w menu tylko po zalogowaniu jako admin, panel testera — jako tester.
  const links =
    user?.role === "admin"
      ? [...NAV_LINKS, { href: "/admin", label: t.header.nav.adminPanel }]
      : user?.role === "tester"
        ? [...NAV_LINKS, { href: "/testerzy/panel", label: t.header.nav.testerPanel }]
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
        {t.header.skipToContent}
      </a>

      <div className="relative mx-auto flex items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" aria-label={t.header.homeLabel} className="inline-flex min-h-12 shrink-0 items-center rounded-ui py-1">
          <CutoutText text="HubMI" as="span" size="logo" labelled={false} />
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center px-4 sm:flex">
          <button
            type="button"
            onClick={openSearch}
            aria-haspopup="dialog"
            aria-keyshortcuts="Control+K"
            className="hidden min-h-12 w-full max-w-md cursor-pointer items-center rounded-ui border-(length:--bw) border-border bg-surface text-left hover:bg-background sm:flex"
          >
            <Search aria-hidden="true" className="ml-3 size-5 text-primary" />
            <span className="min-w-0 flex-1 px-3 text-base text-muted">{t.common.search}</span>
            <kbd className="mr-3 rounded border border-border/40 px-2 py-1 text-sm font-semibold text-muted">Ctrl+K</kbd>
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <nav aria-label={t.header.mainNav} className="nav-desktop hidden xl:block">
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

          <LanguageSwitcher />

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
            {open ? t.common.close : t.header.menu}
          </button>
        </div>
      </div>

      <div
        id="menu-mobilne"
        hidden={!open}
        className="nav-mobile max-h-[calc(100dvh-5rem)] overflow-y-auto border-t-(length:--bw) border-border bg-surface xl:hidden"
      >
        <nav aria-label={t.header.mobileNav} className="mx-auto max-w-content px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={openSearch}
            aria-haspopup="dialog"
            className="mb-3 flex min-h-12 w-full cursor-pointer items-center rounded-ui border-(length:--bw) border-border bg-background text-left sm:hidden"
          >
            <Search aria-hidden="true" className="ml-3 size-5 text-primary" />
            <span className="min-w-0 flex-1 px-3 text-base text-muted">{t.common.search}</span>
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
        title={t.header.searchDialogTitle}
        closeLabel={t.header.closeSearch}
        initialFocusRef={searchInputRef}
        size="lg"
      >
        <QuickSearch inputRef={searchInputRef} onNavigate={closeSearch} />
        <p className="mt-4 text-sm text-muted">{t.header.escHint}</p>
      </Dialog>
      <AccessibilitySettings />
    </header>
  );
}
