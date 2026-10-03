"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";

import { AccessibilitySettings } from "@/components/simple-mode";
import { CutoutText } from "@/components/cutout-text";
import { Dialog } from "@/components/ui/dialog";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/biblioteka", label: "Biblioteka" },
  { href: "/kreator", label: "Kreator pomysłów" },
  { href: "/forum", label: "Forum" },
];

const SEARCH_TAGS = ["Aplikacja", "Małe firmy", "Niewidomi", "Seniorzy", "Transport", "Zdrowie"];

const linkClass =
  "inline-flex min-h-12 items-center whitespace-nowrap rounded-ui px-2.5 text-base font-bold text-deep underline-offset-4 hover:underline";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Szukaj");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
    <header className="sticky top-0 z-40 border-b-(length:--bw) border-deep bg-paper">
      <a
        href="#main"
        className="focus-on-deep sr-only rounded-ui bg-deep px-5 py-3 font-bold text-surface focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50"
      >
        Przejdź do treści
      </a>

      <div className="relative mx-auto flex max-w-content items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="HubMI, strona główna" className="inline-flex min-h-12 shrink-0 items-center rounded-ui py-1">
          <CutoutText text="HubMI" as="span" size="logo" labelled={false} />
        </Link>

        <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-4">
          <button
            type="button"
            onClick={openSearch}
            aria-haspopup="dialog"
            aria-keyshortcuts="Control+K"
            className="hidden min-h-12 w-full max-w-md cursor-pointer items-center rounded-ui border-(length:--bw) border-deep bg-surface text-left hover:bg-paper sm:flex"
          >
            <Search aria-hidden="true" className="ml-3 size-5 text-leaf" />
            <span className="min-w-0 flex-1 px-3 text-base text-muted">Szukaj</span>
            <kbd className="mr-3 rounded border border-sage px-2 py-1 text-sm font-semibold text-muted">Ctrl+K</kbd>
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
            className="inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-ui border-(length:--bw) border-deep bg-surface px-4 font-bold text-deep hover:bg-sage nav-mobile xl:hidden"
          >
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            {open ? "Zamknij" : "Menu"}
          </button>
        </div>
      </div>

      <div
        id="menu-mobilne"
        hidden={!open}
        className="nav-mobile max-h-[calc(100dvh-5rem)] overflow-y-auto border-t-(length:--bw) border-deep bg-surface xl:hidden"
      >
        <nav aria-label="Główna, wersja mobilna" className="mx-auto max-w-content px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={openSearch}
            aria-haspopup="dialog"
            className="mb-3 flex min-h-12 w-full cursor-pointer items-center rounded-ui border-(length:--bw) border-deep bg-paper text-left sm:hidden"
          >
            <Search aria-hidden="true" className="ml-3 size-5 text-leaf" />
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
          <UserMenu className="mt-2 border-t-2 border-sage px-3 pt-3 sm:hidden" />
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
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Popularne kategorie wyszukiwania">
          {[
            ["Problemy", "Szukaj problemu"],
            ["Innowacje", "Szukaj innowacji"],
            ["Artykuły", "Szukaj artykułu"],
          ].map(([label, placeholder]) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchPlaceholder(placeholder);
                searchInputRef.current?.focus();
              }}
              className="min-h-12 rounded-ui border-(length:--bw) border-deep bg-paper px-4 font-semibold text-deep hover:bg-sage"
            >
              {label}
            </button>
          ))}
        </div>
        <form action="/wyniki" method="get" role="search" className="mt-6 flex gap-3">
          <label htmlFor="quick-search" className="sr-only">Szukaj</label>
          <input type="hidden" name="tags" value={selectedTags.join(",")} />
          <div className="flex min-h-12 min-w-0 flex-1 flex-wrap items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-paper px-3 py-2">
            {selectedTags.map((tag) => (
              <span key={tag} className="rounded-full bg-mint px-2 py-1 text-sm font-semibold text-deep">#{tag}</span>
            ))}
            <input
              ref={searchInputRef}
              id="quick-search"
              name="q"
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-[8rem] flex-1 bg-transparent px-1 text-base text-ink outline-none placeholder:text-muted"
            />
          </div>
          <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-deep px-5 font-bold text-surface hover:bg-leaf">
            <Search aria-hidden="true" className="size-5" />
            Szukaj
          </button>
        </form>
        <details className="mt-4 rounded-ui border-(length:--bw) border-sage bg-paper">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 px-4 font-semibold text-deep">
            Wybierz tagi
            <span className="text-sm text-muted">{selectedTags.length ? `Wybrano: ${selectedTags.length}` : "wielokrotny wybór"}</span>
          </summary>
          <div className="grid gap-1 border-t-(length:--bw) border-sage p-3 sm:grid-cols-2" aria-label="Lista tagów wyszukiwania">
            {SEARCH_TAGS.map((tag) => (
              <label key={tag} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-ui px-3 hover:bg-sage">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))}
                  className="size-5 accent-deep"
                />
                <span className="text-base text-deep">#{tag}</span>
              </label>
            ))}
          </div>
        </details>
        <p className="mt-4 text-sm text-muted">Naciśnij Escape, aby zamknąć.</p>
      </Dialog>
      <AccessibilitySettings />
    </header>
  );
}
