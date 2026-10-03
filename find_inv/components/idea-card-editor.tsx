"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  FilePen,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Save,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { TAG_LABELS } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { storeIdea } from "@/lib/grants";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  STAGES,
  fileProblem,
  formatSize,
  saveIdea,
  uploadAttachment,
  type IdeaDraft,
} from "@/lib/ideas";
import { cn } from "@/lib/utils";

function Missing() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <CircleHelp aria-hidden="true" className="size-5 shrink-0" />
      do uzupełnienia
    </span>
  );
}

const FIELD_CLASS =
  "w-full rounded-ui border-(length:--bw) border-deep px-4 text-base text-ink placeholder:text-muted read-only:bg-paper";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  readOnly: boolean;
  multiline?: number;
  invalid?: boolean;
  onChange: (value: string) => void;
};

/** Wiersz fiszki z polem do poprawienia. Puste pole ma tekst „do uzupełnienia” (DESIGN.md 8: brak tekstem i ikoną). */
function Field({ id, label, value, placeholder, readOnly, multiline, invalid, onChange }: FieldProps) {
  const missingId = `${id}-brak`;
  const common = {
    id,
    value,
    placeholder,
    readOnly,
    "aria-invalid": invalid || undefined,
    "aria-describedby": value.trim() ? undefined : missingId,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  };
  return (
    <>
      <dt className="font-bold text-deep">
        <label htmlFor={id}>{label}</label>
      </dt>
      <dd>
        {multiline ? (
          <textarea {...common} rows={multiline} className={cn(FIELD_CLASS, "resize-y bg-surface py-3")} />
        ) : (
          <input {...common} type="text" className={cn(FIELD_CLASS, "min-h-12 bg-surface")} />
        )}
        {!value.trim() && (
          <p id={missingId} className="mt-1 text-sm">
            <Missing />
          </p>
        )}
      </dd>
    </>
  );
}

type UploadState = { name: string; status: "sending" | "sent" | "error"; message?: string };

type IdeaCardEditorProps = {
  initial: IdeaDraft;
  /** Tekst do „Sprawdź, co już działa” (opis problemu albo pomysłu). */
  searchText: string;
  onEdit: () => void;
};

export function IdeaCardEditor({ initial, searchText, onEdit }: IdeaCardEditorProps) {
  const ids = useId();
  const { user } = useAuth();
  const [draft, setDraft] = useState<IdeaDraft>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [invalid, setInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Po zapisie fiszka zostaje na ekranie z potwierdzeniem; ponowny zapis utworzyłby duplikat.
  const [saved, setSaved] = useState<{ id: number | null } | null>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Po analizie focus idzie na nagłówek fiszki, żeby czytnik i klawiatura trafiły do wyniku.
  useEffect(() => headingRef.current?.focus(), []);

  const locked = Boolean(saved) || saving;
  const set = <K extends keyof IdeaDraft>(key: K) => (value: IdeaDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function addFiles(list: FileList | null) {
    if (!list) return;
    const errors: string[] = [];
    const next = [...files];
    for (const file of Array.from(list)) {
      const problem = fileProblem(file);
      if (problem) errors.push(`${file.name}: ${problem}`);
      else if (next.length >= MAX_FILES) errors.push(`${file.name}: można dodać najwyżej ${MAX_FILES} plików`);
      else if (!next.some((f) => f.name === file.name && f.size === file.size)) next.push(file);
    }
    setFiles(next);
    setFileErrors(errors);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function save() {
    if (saved || saving) return;
    if (!draft.title.trim() || !draft.essence.trim()) {
      setInvalid(true);
      titleRef.current?.focus();
      return;
    }
    setInvalid(false);
    setSaving(true);
    setSaveError(false);
    let result: Awaited<ReturnType<typeof saveIdea>>;
    try {
      result = await saveIdea(draft, user?.name ?? null);
    } catch (error) {
      console.error(error);
      setSaveError(true);
      setSaving(false);
      return;
    }
    setSaved({ id: result?.id ?? null });

    // Pliki wysyłamy po zapisie — dopiero wtedy jest numer fiszki i klucz do wgrania.
    if (files.length && result?.id && result.upload_token) {
      const states: UploadState[] = files.map((file) => ({ name: file.name, status: "sending" }));
      setUploads([...states]);
      for (const [index, file] of files.entries()) {
        try {
          await uploadAttachment(result.id, result.upload_token, file);
          states[index] = { name: file.name, status: "sent" };
        } catch (error) {
          states[index] = { name: file.name, status: "error", message: (error as Error).message };
        }
        setUploads([...states]);
      }
    }
    setSaving(false);
  }

  const sentCount = uploads.filter((upload) => upload.status === "sent").length;
  const failed = uploads.filter((upload) => upload.status === "error");
  const sending = uploads.some((upload) => upload.status === "sending");

  return (
    <section aria-labelledby={`${ids}-fiszka`} className="appear mt-12 max-w-3xl">
      <article className="relative border-(length:--bw) border-deep bg-surface p-6 shadow-paper sm:p-8">
        {/* Kawałek taśmy przyklejający fiszkę do tablicy (DESIGN.md 8, karta innowacji). */}
        <span aria-hidden="true" className="simple-hidden absolute -top-3 right-10 h-6 w-24 rotate-[4deg] bg-butter/90" />

        <p className="font-bold text-muted">Fiszka pomysłu</p>
        <h2 id={`${ids}-fiszka`} ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-bold text-deep">
          {draft.title.trim() || "Bez tytułu"}
        </h2>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
          <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          AI rozpisało Twój opis na pola. Sprawdź je i popraw przed zapisaniem.
        </p>

        <dl className="mt-6 grid gap-5 sm:grid-cols-[12rem_1fr]">
          <dt className="font-bold text-deep">
            <label htmlFor={`${ids}-tytul`}>Tytuł</label>
          </dt>
          <dd>
            <input
              ref={titleRef}
              id={`${ids}-tytul`}
              type="text"
              value={draft.title}
              readOnly={locked}
              aria-invalid={(invalid && !draft.title.trim()) || undefined}
              onChange={(event) => set("title")(event.target.value)}
              className={cn(FIELD_CLASS, "min-h-12 bg-surface font-bold", invalid && !draft.title.trim() && "border-alert")}
            />
          </dd>

          <Field
            id={`${ids}-krotki-opis`}
            label="Krótki opis"
            value={draft.shortDesc}
            placeholder="Jedno zdanie, które zachęci do przeczytania fiszki"
            multiline={2}
            readOnly={locked}
            onChange={set("shortDesc")}
          />
          <Field
            id={`${ids}-istota`}
            label="Istota pomysłu"
            value={draft.essence}
            placeholder="Na czym polega pomysł i jak będzie działał"
            multiline={5}
            readOnly={locked}
            invalid={invalid && !draft.essence.trim()}
            onChange={set("essence")}
          />
          {initial.problem && (
            <Field
              id={`${ids}-problem`}
              label="Jaki problem rozwiązuje"
              value={draft.problem}
              placeholder="np. seniorzy w gminie nie umieją umówić się do lekarza przez internet"
              multiline={2}
              readOnly={locked}
              onChange={set("problem")}
            />
          )}
          <Field
            id={`${ids}-dla-kogo`}
            label="Dla kogo"
            value={draft.forWhom}
            placeholder="np. seniorzy mieszkający samotnie"
            readOnly={locked}
            onChange={set("forWhom")}
          />
          <Field
            id={`${ids}-gdzie`}
            label="Gdzie"
            value={draft.place}
            placeholder="np. świetlica wiejska, gmina Racławice"
            readOnly={locked}
            onChange={set("place")}
          />

          <dt className="font-bold text-deep">
            <label htmlFor={`${ids}-etap`}>Etap realizacji</label>
          </dt>
          <dd>
            <select
              id={`${ids}-etap`}
              value={draft.stage}
              disabled={locked}
              onChange={(event) => set("stage")(event.target.value)}
              className="min-h-12 w-full rounded-ui border-(length:--bw) border-deep bg-surface px-3 text-base text-ink disabled:bg-paper"
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </dd>

          <Field
            id={`${ids}-budzet`}
            label="Budżet"
            value={draft.budget}
            placeholder="np. ok. 5 tys. zł rocznie"
            readOnly={locked}
            onChange={set("budget")}
          />
          <Field
            id={`${ids}-partnerzy`}
            label="Partnerzy"
            value={draft.partners}
            placeholder="np. GOPS, szkoła, koło gospodyń wiejskich"
            readOnly={locked}
            onChange={set("partners")}
          />

          <dt className="font-bold text-deep">Tagi</dt>
          <dd>
            {draft.tags.length ? (
              <ul className="flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <li
                    key={tag}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-ui border-2 border-deep bg-mint px-3 text-base"
                  >
                    {draft.suggestedTags.includes(tag) && <Sparkles aria-hidden="true" className="size-4 text-deep" />}
                    {TAG_LABELS[tag]}
                    {draft.suggestedTags.includes(tag) && <span className="sr-only">(propozycja AI)</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <Missing />
            )}
            {draft.suggestedTags.length > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <Sparkles aria-hidden="true" className="size-4" />
                oznacza tag zaproponowany przez AI
              </p>
            )}
          </dd>

          <dt className="font-bold text-deep">
            <label htmlFor={`${ids}-pliki`}>Załączniki</label>
          </dt>
          <dd>
            <p id={`${ids}-pliki-opis`} className="text-sm text-muted">
              Nieobowiązkowe. Np. kosztorys, zdjęcia, list poparcia. Do {MAX_FILES} plików, każdy do 10 MB: PDF, Word,
              Excel, PowerPoint, OpenDocument, TXT, JPG, PNG.
            </p>
            {!saved && (
              <input
                ref={fileInputRef}
                id={`${ids}-pliki`}
                type="file"
                multiple
                accept={ALLOWED_EXTENSIONS.join(",")}
                disabled={locked || files.length >= MAX_FILES}
                aria-describedby={`${ids}-pliki-opis`}
                onChange={(event) => addFiles(event.target.files)}
                className="mt-2 block w-full text-base text-ink file:mr-4 file:min-h-12 file:cursor-pointer file:rounded-ui file:border-(length:--bw) file:border-deep file:bg-surface file:px-4 file:font-bold file:text-deep hover:file:bg-sage disabled:opacity-60"
              />
            )}
            {fileErrors.length > 0 && (
              <div role="alert" className="mt-2 rounded-ui border-2 border-alert bg-surface px-4 py-2 text-alert">
                <p className="flex items-center gap-2 font-bold">
                  <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
                  Nie dodano części plików
                </p>
                <ul className="mt-1 list-disc pl-6">
                  {fileErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
            {files.length > 0 && (
              <ul aria-label="Wybrane pliki" className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.size}`} className="flex items-center gap-2 rounded-ui bg-paper py-1 pr-1 pl-3">
                    <FileText aria-hidden="true" className="size-5 shrink-0 text-leaf" />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="text-sm text-muted tabular-nums">{formatSize(file.size)}</span>
                    {!saved && (
                      <button
                        type="button"
                        onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                        disabled={locked}
                        aria-label={`Usuń plik ${file.name}`}
                        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-ui hover:bg-sage"
                      >
                        <X aria-hidden="true" className="size-5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </dl>

        {invalid && (
          <p
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            Uzupełnij tytuł i istotę pomysłu, żeby zapisać fiszkę.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {saved && !saving ? (
            <Button type="button" disabled>
              <CircleCheck aria-hidden="true" />
              Zapisano
            </Button>
          ) : (
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Save aria-hidden="true" />}
              {saving ? (sending ? "Wysyłam pliki…" : "Zapisuję…") : "Zapisz fiszkę"}
            </Button>
          )}
          <Link href={`/wyniki?q=${encodeURIComponent(searchText)}`} className={buttonVariants({ variant: "secondary" })}>
            <Search aria-hidden="true" />
            Sprawdź, co już działa
          </Link>
          <Link href="/wnioski" onClick={() => storeIdea(draft)} className={buttonVariants({ variant: "secondary" })}>
            <FilePen aria-hidden="true" />
            Napisz wniosek o grant
          </Link>
          <Button type="button" variant="secondary" onClick={onEdit}>
            <Pencil aria-hidden="true" />
            Popraw opis
          </Button>
        </div>

        {/* Potwierdzenie na fiszce, przy przycisku — komunikat na dole ekranu łatwo przeoczyć. */}
        <div role="status" aria-live="polite">
          {saved && !saving && (
            <div className="mt-4 rounded-ui border-2 border-leaf bg-mint px-4 py-3 text-ink">
              <p className="flex items-start gap-2 font-bold">
                <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-deep" />
                {saved.id ? `Fiszka zapisana (nr ${saved.id}).` : "Fiszka zapisana."} Ekspert ROPS przejrzy ją w ciągu
                kilku dni.
              </p>
              {uploads.length > 0 && (
                <p className="mt-1 flex items-start gap-2 pl-7">
                  <Paperclip aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Załączniki: wysłano {sentCount} z {uploads.length}.
                </p>
              )}
            </div>
          )}
        </div>
        {failed.length > 0 && !saving && (
          <div role="alert" className="mt-3 rounded-ui border-2 border-alert bg-surface px-4 py-3 text-alert">
            <p className="flex items-center gap-2 font-bold">
              <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
              Nie udało się wysłać części plików
            </p>
            <ul className="mt-1 list-disc pl-6">
              {failed.map((upload) => (
                <li key={upload.name}>
                  {upload.name}: {upload.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        {saveError && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            Nie udało się zapisać fiszki. Sprawdź połączenie i spróbuj jeszcze raz.
          </p>
        )}
      </article>
    </section>
  );
}
