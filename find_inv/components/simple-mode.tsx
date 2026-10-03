"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Accessibility } from "lucide-react";

// Ustawienia dostępności. Stan żyje w atrybutach <html data-*>, dzięki temu CSS działa bez czekania na React.
// Atrybuty ustawia przed hydracją skrypt SIMPLE_MODE_SCRIPT, a provider tylko je czyta i zmienia.

const SPACING_STORAGE_KEY = "hubmi-duze-odstepy";
const CONTRAST_STORAGE_KEY = "hubmi-wysoki-kontrast";
const FONT_SIZE_STORAGE_KEY = "hubmi-rozmiar-czcionki";

/** Skrypt w <head>: ustawia tryb przed pierwszym malowaniem, żeby strona nie mrugała. */
export const SIMPLE_MODE_SCRIPT = `try{const r=document.documentElement;const f=localStorage.getItem("${FONT_SIZE_STORAGE_KEY}");if(localStorage.getItem("${SPACING_STORAGE_KEY}")==="1")r.dataset.spacing="large";if(localStorage.getItem("${CONTRAST_STORAGE_KEY}")==="1")r.dataset.contrast="high";if(f==="small"||f==="large")r.dataset.fontSize=f}catch(e){}`;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Serwer zawsze renderuje widok domyślny. React podmienia wartość po hydracji bez ostrzeżeń.
function readServerSimpleMode() {
  return false;
}

function readSpacing() {
  return document.documentElement.dataset.spacing === "large";
}

function readContrast() {
  return document.documentElement.dataset.contrast === "high";
}

type FontSize = "small" | "default" | "large";

function readFontSize(): FontSize {
  const value = document.documentElement.dataset.fontSize;
  return value === "small" || value === "large" ? value : "default";
}

function readServerFontSize(): FontSize {
  return "default";
}

type SimpleModeContextValue = {
  spacing: boolean;
  setSpacing: (value: boolean) => void;
  contrast: boolean;
  setContrast: (value: boolean) => void;
  fontSize: FontSize;
  setFontSize: (value: FontSize) => void;
};

const SimpleModeContext = createContext<SimpleModeContextValue | null>(null);

export function SimpleModeProvider({ children }: { children: React.ReactNode }) {
  const spacing = useSyncExternalStore(subscribe, readSpacing, readServerSimpleMode);
  const contrast = useSyncExternalStore(subscribe, readContrast, readServerSimpleMode);
  const fontSize = useSyncExternalStore(subscribe, readFontSize, readServerFontSize);

  const setSpacing = useCallback((value: boolean) => {
    if (value) {
      document.documentElement.dataset.spacing = "large";
    } else {
      delete document.documentElement.dataset.spacing;
    }
    try {
      localStorage.setItem(SPACING_STORAGE_KEY, value ? "1" : "0");
    } catch {
      // Brak dostępu do pamięci przeglądarki: ustawienie działa do odświeżenia strony.
    }
    listeners.forEach((listener) => listener());
  }, []);

  const setContrast = useCallback((value: boolean) => {
    if (value) {
      document.documentElement.dataset.contrast = "high";
    } else {
      delete document.documentElement.dataset.contrast;
    }
    try {
      localStorage.setItem(CONTRAST_STORAGE_KEY, value ? "1" : "0");
    } catch {
      // Brak dostępu do pamięci przeglądarki: ustawienie działa do odświeżenia strony.
    }
    listeners.forEach((listener) => listener());
  }, []);

  const setFontSize = useCallback((value: FontSize) => {
    if (value === "default") {
      delete document.documentElement.dataset.fontSize;
    } else {
      document.documentElement.dataset.fontSize = value;
    }
    try {
      if (value === "default") {
        localStorage.removeItem(FONT_SIZE_STORAGE_KEY);
      } else {
        localStorage.setItem(FONT_SIZE_STORAGE_KEY, value);
      }
    } catch {
      // Brak dostępu do pamięci przeglądarki: ustawienie działa do odświeżenia strony.
    }
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo(
    () => ({ spacing, setSpacing, contrast, setContrast, fontSize, setFontSize }),
    [spacing, setSpacing, contrast, setContrast, fontSize, setFontSize],
  );

  return <SimpleModeContext value={value}>{children}</SimpleModeContext>;
}

export function useSimpleMode() {
  const context = use(SimpleModeContext);
  if (!context) throw new Error("useSimpleMode musi być użyty wewnątrz SimpleModeProvider");
  return context;
}

export function AccessibilitySettings({ className }: { className?: string }) {
  const { spacing, setSpacing, contrast, setContrast, fontSize, setFontSize } = useSimpleMode();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("fixed right-4 bottom-4 z-50", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        title="Ustawienia dostępności"
        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border-(length:--bw) border-deep bg-deep text-surface shadow-paper hover:bg-leaf"
      >
        <Accessibility aria-hidden="true" className="size-7" />
        <span className="sr-only">Dostępność</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Ustawienia dostępności"
          className="fixed right-4 bottom-20 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-ui border-(length:--bw) border-deep bg-surface p-4 shadow-paper"
        >
          <p className="text-lg font-semibold text-deep">Ustawienia dostępności</p>
          <div className="mt-3 grid gap-2">
            <AccessibilityOption id={`${panelId}-spacing`} checked={spacing} onCheckedChange={setSpacing}>
              Duże odstępy
            </AccessibilityOption>
            <AccessibilityOption id={`${panelId}-contrast`} checked={contrast} onCheckedChange={setContrast}>
              Wysoki kontrast
            </AccessibilityOption>
            <fieldset className="mt-2 border-t-2 border-sage pt-3">
              <legend className="text-base font-semibold text-deep">Rozmiar czcionki</legend>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  aria-label="Zmniejsz czcionkę"
                  aria-pressed={fontSize === "small"}
                  onClick={() => setFontSize("small")}
                  className="min-h-12 min-w-12 rounded-ui border-(length:--bw) border-deep bg-surface px-3 text-base font-semibold text-deep hover:bg-sage aria-pressed:bg-deep aria-pressed:text-surface"
                >
                  A-
                </button>
                <button
                  type="button"
                  aria-label="Zwiększ czcionkę"
                  aria-pressed={fontSize === "large"}
                  onClick={() => setFontSize("large")}
                  className="min-h-12 min-w-12 rounded-ui border-(length:--bw) border-deep bg-surface px-3 text-xl font-semibold text-deep hover:bg-sage aria-pressed:bg-deep aria-pressed:text-surface"
                >
                  A+
                </button>
                {fontSize !== "default" && (
                  <button
                    type="button"
                    onClick={() => setFontSize("default")}
                    className="min-h-12 rounded-ui px-3 text-base font-semibold text-leaf underline underline-offset-4 hover:text-deep"
                  >
                    Domyślna
                  </button>
                )}
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}

function AccessibilityOption({
  id,
  checked,
  onCheckedChange,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer text-base font-semibold text-deep">
        {children}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={String(children)} />
    </div>
  );
}
