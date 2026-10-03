"use client";

import { createContext, use, useCallback, useId, useMemo, useSyncExternalStore } from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Tryb prosty (DESIGN.md, sekcja 10). Stan żyje w atrybucie <html data-simple="true">,
// dzięki temu CSS wyłącza kolaż, liście i animacje bez czekania na React.
// Atrybut ustawia przed hydracją skrypt SIMPLE_MODE_SCRIPT, a provider tylko go czyta i zmienia.

export const SIMPLE_MODE_STORAGE_KEY = "hubmi-prosty-widok";

/** Skrypt w <head>: ustawia tryb przed pierwszym malowaniem, żeby strona nie mrugała. */
export const SIMPLE_MODE_SCRIPT = `try{if(localStorage.getItem("${SIMPLE_MODE_STORAGE_KEY}")==="1")document.documentElement.dataset.simple="true"}catch(e){}`;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readSimpleMode() {
  return document.documentElement.dataset.simple === "true";
}

// Serwer zawsze renderuje widok domyślny. React podmienia wartość po hydracji bez ostrzeżeń.
function readServerSimpleMode() {
  return false;
}

type SimpleModeContextValue = {
  simple: boolean;
  setSimple: (value: boolean) => void;
};

const SimpleModeContext = createContext<SimpleModeContextValue | null>(null);

export function SimpleModeProvider({ children }: { children: React.ReactNode }) {
  const simple = useSyncExternalStore(subscribe, readSimpleMode, readServerSimpleMode);

  const setSimple = useCallback((value: boolean) => {
    if (value) {
      document.documentElement.dataset.simple = "true";
    } else {
      delete document.documentElement.dataset.simple;
    }
    try {
      localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, value ? "1" : "0");
    } catch {
      // Brak dostępu do pamięci przeglądarki: tryb działa do odświeżenia strony.
    }
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo(() => ({ simple, setSimple }), [simple, setSimple]);

  return <SimpleModeContext value={value}>{children}</SimpleModeContext>;
}

export function useSimpleMode() {
  const context = use(SimpleModeContext);
  if (!context) throw new Error("useSimpleMode musi być użyty wewnątrz SimpleModeProvider");
  return context;
}

export function SimpleModeToggle({ className }: { className?: string }) {
  const { simple, setSimple } = useSimpleMode();
  const id = useId();

  return (
    <div className={cn("flex min-h-12 items-center gap-3", className)}>
      <Switch id={id} checked={simple} onCheckedChange={setSimple} />
      <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center text-base font-bold text-deep">
        Prosty widok
      </label>
    </div>
  );
}
