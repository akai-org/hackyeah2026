"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CircleAlert, Loader2, Save, Trash2, X } from "lucide-react";

import { STATUS_META, errorMessage, tagLabel } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import type { InnovationStatus } from "@/data/admin.mock";
import { TAXONOMY_TAGS } from "@/data/mock";
import type { AdminInnovationFull, InnovationInput } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export const fieldClass =
  "mt-2 min-h-12 w-full rounded-ui border-(length:--bw) border-deep bg-surface px-4 text-base text-ink placeholder:text-muted";

// ---------- Okno modalne (natywny <dialog>: pułapka fokusu i Escape z przeglądarki) ----------

function AdminDialog({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const ids = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${ids}-tytul`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto border-(length:--bw) border-deep bg-surface p-6 text-ink shadow-paper backdrop:bg-ink/50 sm:p-8",
        wide ? "max-w-3xl" : "max-w-md",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={`${ids}-tytul`} className="text-xl font-bold text-deep">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-ui p-1 text-muted hover:text-deep focus-visible:outline-2 focus-visible:outline-deep"
        >
          <X aria-hidden="true" className="size-5" />
          <span className="sr-only">Zamknij</span>
        </button>
      </div>
      {description && <div className="mt-3">{description}</div>}
      {children}
    </dialog>
  );
}

// ---------- Potwierdzenie usunięcia ----------

export function ConfirmDeleteDialog({
  title,
  what,
  consequences,
  onConfirm,
  onClose,
}: {
  title: string;
  /** Nazwa usuwanego elementu, pokazana pogrubiona. */
  what: string;
  consequences: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AdminDialog
      title={title}
      onClose={onClose}
      description={
        <>
          <p className="font-bold text-deep">{what}</p>
          <p className="mt-2">{consequences} Tej operacji nie da się cofnąć.</p>
        </>
      }
    >
      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 font-bold text-alert">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={busy} autoFocus>
          Anuluj
        </Button>
        <Button type="button" onClick={confirm} disabled={busy} className="border-alert bg-alert text-surface hover:border-deep hover:bg-deep">
          {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Trash2 aria-hidden="true" />}
          Usuń na stałe
        </Button>
      </div>
    </AdminDialog>
  );
}

// ---------- Formularz karty innowacji (dodawanie i edycja) ----------

const COST_LABELS = { low: "Niski", medium: "Średni", high: "Wysoki" } as const;

const EMPTY: InnovationInput = {
  title: "",
  short_desc: "",
  full_desc: null,
  category: null,
  area: null,
  target_group: null,
  location: null,
  status: "active",
  cost_level: null,
  implementation_time_months: null,
  where_implemented: null,
  source_url: null,
  tags: [],
};

function toInput(item: AdminInnovationFull | null): InnovationInput {
  if (!item) return EMPTY;
  return Object.fromEntries(
    (Object.keys(EMPTY) as Array<keyof InnovationInput>).map((key) => [key, item[key] ?? EMPTY[key]]),
  ) as InnovationInput;
}

type TextField = Exclude<keyof InnovationInput, "status" | "cost_level" | "implementation_time_months" | "tags">;

const TEXT_FIELDS: Array<{ key: TextField; label: string; hint?: string; multiline?: boolean; required?: boolean }> = [
  { key: "title", label: "Nazwa", required: true },
  { key: "short_desc", label: "Krótki opis", hint: "1–2 zdania na kartę w wynikach (min. 10 znaków).", multiline: true, required: true },
  { key: "full_desc", label: "Pełny opis", hint: "Trafia do czatu o innowacji i wyszukiwania semantycznego.", multiline: true },
  { key: "category", label: "Kategoria" },
  { key: "area", label: "Obszar" },
  { key: "target_group", label: "Grupa docelowa" },
  { key: "location", label: "Lokalizacja" },
  { key: "where_implemented", label: "Gdzie wdrożono" },
  { key: "source_url", label: "Źródło (adres strony)" },
];

export function InnovationFormDialog({
  item,
  onSave,
  onClose,
}: {
  /** null = nowa innowacja. */
  item: AdminInnovationFull | null;
  onSave: (input: InnovationInput) => Promise<void>;
  onClose: () => void;
}) {
  const ids = useId();
  const [form, setForm] = useState<InnovationInput>(() => toInput(item));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof InnovationInput>(key: K, value: InnovationInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function validate(): string | null {
    if (form.title.trim().length < 3) return "Nazwa musi mieć co najmniej 3 znaki.";
    if (form.short_desc.trim().length < 10) return "Krótki opis musi mieć co najmniej 10 znaków.";
    if (form.source_url && !/^https?:\/\//.test(form.source_url.trim())) return "Źródło musi zaczynać się od http:// lub https://.";
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AdminDialog
      wide
      title={item ? "Edytuj innowację" : "Dodaj innowację"}
      onClose={onClose}
      description={<p className="text-muted">Pola z gwiazdką są wymagane. Po zapisaniu karta od razu trafia do Biblioteki i wyszukiwania.</p>}
    >
      <form onSubmit={submit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
        {TEXT_FIELDS.map(({ key, label, hint, multiline, required }) => {
          const id = `${ids}-${key}`;
          const props = {
            id,
            value: form[key] ?? "",
            required,
            "aria-describedby": hint ? `${id}-podpowiedz` : undefined,
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              set(key, key === "title" || key === "short_desc" ? event.target.value : event.target.value || null),
          };
          return (
            <div key={key} className={cn(multiline && "sm:col-span-2")}>
              <label htmlFor={id} className="block font-bold text-deep">
                {label}
                {required && <span aria-hidden="true"> *</span>}
              </label>
              {hint && (
                <p id={`${id}-podpowiedz`} className="mt-1 text-sm text-muted">
                  {hint}
                </p>
              )}
              {multiline ? (
                <textarea {...props} rows={key === "full_desc" ? 6 : 3} className={cn(fieldClass, "py-3")} />
              ) : (
                <input {...props} type={key === "source_url" ? "url" : "text"} className={fieldClass} />
              )}
            </div>
          );
        })}

        <div>
          <label htmlFor={`${ids}-status`} className="block font-bold text-deep">
            Status
          </label>
          <select
            id={`${ids}-status`}
            value={form.status}
            onChange={(event) => set("status", event.target.value as InnovationStatus)}
            className={cn(fieldClass, "cursor-pointer")}
          >
            {(Object.keys(STATUS_META) as InnovationStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${ids}-koszt`} className="block font-bold text-deep">
            Koszt wdrożenia
          </label>
          <select
            id={`${ids}-koszt`}
            value={form.cost_level ?? ""}
            onChange={(event) => set("cost_level", (event.target.value || null) as InnovationInput["cost_level"])}
            className={cn(fieldClass, "cursor-pointer")}
          >
            <option value="">Brak danych</option>
            {(Object.keys(COST_LABELS) as Array<keyof typeof COST_LABELS>).map((level) => (
              <option key={level} value={level}>
                {COST_LABELS[level]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${ids}-czas`} className="block font-bold text-deep">
            Czas wdrożenia (miesiące)
          </label>
          <input
            id={`${ids}-czas`}
            type="number"
            min={0}
            max={120}
            inputMode="numeric"
            value={form.implementation_time_months ?? ""}
            onChange={(event) =>
              set("implementation_time_months", event.target.value === "" ? null : Math.max(0, Math.min(120, Number(event.target.value))))
            }
            className={fieldClass}
          />
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="font-bold text-deep">Tagi</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TAXONOMY_TAGS.map((tag) => {
              const checked = form.tags.includes(tag);
              return (
                <label
                  key={tag}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-deep px-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-deep",
                    checked ? "bg-mint font-bold" : "bg-surface",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => set("tags", checked ? form.tags.filter((t) => t !== tag) : [...form.tags, tag])}
                  />
                  {tagLabel(tag)}
                </label>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="flex items-start gap-2 font-bold text-alert sm:col-span-2">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Save aria-hidden="true" />}
            {item ? "Zapisz zmiany" : "Dodaj innowację"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Anuluj
          </Button>
        </div>
      </form>
    </AdminDialog>
  );
}
