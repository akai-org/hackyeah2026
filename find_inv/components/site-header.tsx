"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { SimpleModeToggle } from "@/components/simple-mode";

const NAV_LINKS = [
  { href: "/biblioteka", label: "Biblioteka innowacji" },
  { href: "/#jak-to-dziala", label: "Jak to działa" },
  { href: "/#dla-kogo", label: "Dla kogo" },
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
          </ul>
        </nav>

        <SimpleModeToggle className="hidden lg:flex" />

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
          </ul>
          <SimpleModeToggle className="mt-2 border-t-2 border-sage px-3 pt-2" />
        </nav>
      </div>
    </header>
  );
}
