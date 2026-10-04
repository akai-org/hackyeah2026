"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, CircleAlert, CircleCheck, Clock, CloudOff, type LucideIcon } from "lucide-react";

import type { InnovationStatus } from "@/data/admin.mock";
import type { Result } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE_TAGS } from "@/lib/i18n/config";
import type { AdminMessages } from "@/lib/i18n/ns/admin";

// ---------- Ładowanie danych z panelu ----------

type State<T> = { data: T | null; offline: boolean; error: string | null; loading: boolean };

export function errorMessage(error: unknown, a: AdminMessages): string {
  if (error instanceof ApiError && error.status === 403) return a.errors.forbidden;
  if (error instanceof ApiError) return a.errors.rejected(error.message);
  return a.errors.generic;
}

/** Słownik panelu i formatowanie w języku interfejsu — jedno wywołanie na komponent. */
export function useAdminI18n() {
  const { t, locale } = useI18n();
  const a = t.admin;
  return {
    t,
    a,
    locale,
    errorMessage: (error: unknown) => errorMessage(error, a),
    tagLabel: (tag: string) => t.tags[tag] ?? tag.replaceAll("_", " "),
    formatDate: (iso: string) =>
      new Date(iso).toLocaleDateString(LOCALE_TAGS[locale], { day: "numeric", month: "short", year: "numeric" }),
    shortDate: (iso: string) => new Date(iso).toLocaleDateString(LOCALE_TAGS[locale], { day: "numeric", month: "short" }),
    number: (value: number) => value.toLocaleString(LOCALE_TAGS[locale]),
  };
}

/**
 * Wczytuje dane i pozwala je lokalnie poprawić po akcji (bez ponownego pobierania całości).
 * Zmiana `key` (np. filtrów) pobiera dane od nowa.
 */
export function useAdminData<T>(load: () => Promise<Result<T>>, key = "") {
  const [state, setState] = useState<State<T>>({ data: null, offline: false, error: null, loading: true });
  const loadRef = useRef(load);
  loadRef.current = load;
  const messages = useI18n().t.admin;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));
    try {
      const result = await loadRef.current();
      setState({ data: result.data, offline: result.offline, error: null, loading: false });
    } catch (error) {
      setState((current) => ({ ...current, error: errorMessage(error, messagesRef.current), loading: false }));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload, key]);

  const update = useCallback((fn: (data: T) => T) => {
    setState((current) => (current.data === null ? current : { ...current, data: fn(current.data) }));
  }, []);

  return { ...state, reload, update };
}

// ---------- Komunikaty ----------

export function OfflineNote({ offline }: { offline: boolean }) {
  const text = useI18n().t.admin.offline;
  if (!offline) return null;
  return (
    <p className="mb-6 flex items-start gap-3 rounded-ui border-2 border-warning bg-warning/10 px-4 py-3">
      <CloudOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      {text}
    </p>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-6 flex items-start gap-3 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      {message}
    </p>
  );
}

export function LoadingRows({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-14 animate-pulse rounded-ui bg-secondary" />
      ))}
    </div>
  );
}

// ---------- Status innowacji: ikona + słowo ----------

// Etykiety statusów są w słowniku (admin.status).
export const STATUS_META: Record<InnovationStatus, { icon: LucideIcon; className: string }> = {
  pending: { icon: Clock, className: "border-warning bg-warning/10 text-warning" },
  active: { icon: CircleCheck, className: "border-success bg-success/10 text-success" },
  unmaintained: { icon: CircleAlert, className: "border-border bg-background text-muted" },
  archived: { icon: Archive, className: "border-border bg-secondary text-foreground" },
};

export function StatusBadge({ status, className }: { status: InnovationStatus; className?: string }) {
  const meta = STATUS_META[status];
  const label = useI18n().t.admin.status[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.25} />
      {label}
    </span>
  );
}

