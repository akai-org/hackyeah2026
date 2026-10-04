"use client";

import { useSyncExternalStore } from "react";

// „Używałem tej inicjatywy” — potwierdzenie z dyskusji pod kartą (forum-thread), od którego zależy
// m.in. widoczność oceny gwiazdkami. Trzymane w localStorage per innowacja; zdarzenie odświeża
// wszystkie komponenty na stronie od razu po kliknięciu.

const EVENT = "hubmi-uzywalem";
const key = (innovationId: number) => `hubmi-uzywalem-${innovationId}`;
// Zapas, gdy localStorage jest zablokowany (np. tryb prywatny): potwierdzenie trwa do końca wizyty.
const memory = new Set<number>();

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(innovationId: number) {
  if (memory.has(innovationId)) return true;
  try {
    return localStorage.getItem(key(innovationId)) === "1";
  } catch {
    return false;
  }
}

/** Czy użytkownik potwierdził, że używał tej innowacji. Na serwerze zawsze false. */
export function useUsedInnovation(innovationId: number) {
  return useSyncExternalStore(subscribe, () => read(innovationId), () => false);
}

export function markInnovationUsed(innovationId: number) {
  memory.add(innovationId);
  try {
    localStorage.setItem(key(innovationId), "1");
  } catch {
    // Zablokowany storage — zostaje zapis w pamięci.
  }
  window.dispatchEvent(new Event(EVENT));
}
