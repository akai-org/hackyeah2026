"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

// Wspólne okno modalne. Natywny <dialog> + showModal(): reszta strony jest nieaktywna (inert),
// okno leży w top layer. Do tego jawnie:
// - Esc i klik w rozmyte tło wołają onClose (stan trzyma rodzic),
// - focus trap: Tab / Shift+Tab krążą po elementach okna, łącznie z przyciskiem „Zamknij”,
// - po zamknięciu focus wraca na element, który okno otworzył.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Tytuł okna — trafia do <h2> i aria-labelledby. */
  title: ReactNode;
  /** Krótki opis pod tytułem (aria-describedby). */
  description?: ReactNode;
  /** Element, który dostaje focus po otwarciu. Domyślnie pierwszy element w treści, potem „Zamknij”. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Etykieta przycisku zamknięcia dla czytników ekranu. */
  closeLabel?: string;
  size?: keyof typeof SIZES;
  /** Ikona/obrazek obok tytułu. */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  initialFocusRef,
  closeLabel = "Zamknij",
  size = "md",
  icon,
  className,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const pressedOnBackdrop = useRef(false);
  const onCloseRef = useRef(onClose);
  const ids = useId();
  const titleId = `${ids}-tytul`;
  const descriptionId = `${ids}-opis`;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const target =
        initialFocusRef?.current ?? bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? closeRef.current;
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocusRef]);

  // Odmontowanie otwartego okna (np. zmiana strony) też oddaje focus.
  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (!dialog?.open) return;
      dialog.close();
      const opener = openerRef.current;
      if (opener?.isConnected) requestAnimationFrame(() => opener.focus());
    };
  }, []);

  function restoreFocus() {
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && opener.isConnected) requestAnimationFrame(() => opener.focus());
  }

  function trapFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    // checkVisibility() pomija też elementy w zwiniętym <details> (offsetParent ich nie wyklucza).
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (element) =>
        element === document.activeElement ||
        (typeof element.checkVisibility === "function"
          ? element.checkVisibility({ visibilityProperty: true })
          : element.offsetParent !== null),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Esc: nie pozwalamy przeglądarce zamknąć okna samodzielnie — o stanie decyduje rodzic.
        event.preventDefault();
        onCloseRef.current();
      }}
      onClose={() => {
        restoreFocus();
        if (open) onCloseRef.current();
      }}
      onKeyDown={trapFocus}
      // Klik w tło: target to sam <dialog> (treść leży w wewnętrznym <div>). Liczymy tylko klik,
      // który zaczął się i skończył na tle — zaznaczanie tekstu z wyjechaniem poza okno nie zamyka.
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressedOnBackdrop.current && event.target === event.currentTarget) onCloseRef.current();
        pressedOnBackdrop.current = false;
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain rounded-ui border-(length:--bw) border-deep bg-surface p-0 text-ink shadow-paper",
        "backdrop:bg-ink/55 backdrop:backdrop-blur-sm",
        "open:animate-[dialog-in_180ms_cubic-bezier(0.2,0.8,0.2,1)]",
        SIZES[size],
        className,
      )}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon}
            <div className="min-w-0">
              <h2 id={titleId} className="text-2xl font-bold text-deep">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-base text-muted">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label={closeLabel}
            title={closeLabel}
            className="-mt-2 -mr-2 inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-ui text-deep hover:bg-sage"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>
        <div ref={bodyRef}>{children}</div>
      </div>
    </dialog>
  );
}
