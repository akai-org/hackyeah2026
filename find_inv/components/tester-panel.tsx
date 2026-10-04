"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CircleAlert, FlaskConical, Loader2, Search, Send, Star } from "lucide-react";

import { TestRequestForm, TestStatusBadge } from "@/components/test-request";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import type { InnovationCard } from "@/data/innovations";
import { useAuth } from "@/lib/auth";
import { listInnovations } from "@/lib/knowledge";
import { getMyTests, sendFeedback, type Feedback, type TestReport, type TestStatus } from "@/lib/tester-api";
import { cn } from "@/lib/utils";

// Panel testera. Rolę testera nadaje admin ROPS; tester zgłasza się do konkretnych innowacji,
// admin go do nich przypisuje, a przypisane innowacje tester ocenia (1–5, feedback, propozycje usprawnień).

const RATING_LABELS = ["", "Nie działa", "Słabo", "Średnio", "Dobrze", "Bardzo dobrze"];

const inputClass =
  "mt-2 w-full rounded-ui border-(length:--bw) bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted";

const GROUPS: Array<{ status: TestStatus; title: string; empty?: string }> = [
  { status: "assigned", title: "Przypisane do mnie", empty: "ROPS nie przypisał Ci jeszcze żadnej innowacji." },
  { status: "requested", title: "Czekają na decyzję ROPS" },
  { status: "submitted", title: "Ocenione" },
  { status: "rejected", title: "Odrzucone zgłoszenia" },
];

export function TesterPanel() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3" role="status">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-primary" />
        Sprawdzam uprawnienia…
      </div>
    );
  }

  if (user?.role !== "tester" && user?.role !== "admin") {
    return (
      <div className="max-w-xl border-(length:--bw) border-border bg-surface p-6 shadow-raised sm:p-8">
        <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
          <FlaskConical aria-hidden="true" className="size-7 shrink-0 text-primary" />
          Ta część jest dla testerów
        </h2>
        <p className="mt-3">
          Rolę testera nadaje administrator ROPS. Wybierz innowację w{" "}
          <Link href="/biblioteka" className="font-bold text-primary underline underline-offset-4 hover:text-primary-hover">
            Bibliotece
          </Link>{" "}
          i na jej karcie kliknij „Zgłoś się jako tester”. Po zatwierdzeniu zobaczysz tu innowacje przypisane do Ciebie.
        </p>
      </div>
    );
  }

  return <Dashboard userId={user.id} />;
}

function Dashboard({ userId }: { userId: number | string }) {
  const { offline: sessionOffline } = useAuth();
  const [tests, setTests] = useState<TestReport[] | null>(null);
  const [offline, setOffline] = useState(sessionOffline);
  const [loadError, setLoadError] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    getMyTests(userId, sessionOffline)
      .then((result) => {
        setTests(result.data);
        setOffline(result.offline);
      })
      .catch(() => setLoadError(true));
  }, [userId, sessionOffline]);

  const addRequest = useCallback(
    (report: TestReport, wasOffline: boolean) => {
      setTests((current) => [report, ...(current ?? [])]);
      setOffline(wasOffline);
      toast.show(`Zgłoszenie wysłane: ${report.innovation_title}. ROPS da znać, czy Cię przypisze.`);
    },
    [toast],
  );

  const saveFeedback = useCallback(
    async (id: number, feedback: Feedback) => {
      const result = await sendFeedback(id, feedback, offline);
      setTests((current) => (current ?? []).map((report) => (report.id === id ? result.data : report)));
      setOpenId(null);
      toast.show("Ocena wysłana. Dziękujemy — trafi do opisu innowacji.");
    },
    [offline, toast],
  );

  const count = (status: TestStatus) => tests?.filter((report) => report.status === status).length ?? 0;
  const requestedIds = new Set(tests?.map((report) => report.innovation_id));

  return (
    <>
      {offline && (
        <p className="mb-6 border-l-4 border-destructive pl-4 text-muted" role="status">
          Brak połączenia z serwerem. Testy zapisują się tylko w tej karcie przeglądarki.
        </p>
      )}

      <dl className="grid max-w-2xl grid-cols-3 gap-4">
        {(["assigned", "requested", "submitted"] as const).map((status) => (
          <div key={status} className="border-(length:--bw) border-border bg-surface p-4 shadow-raised">
            <dt className="font-bold text-muted">{GROUPS.find((group) => group.status === status)!.title}</dt>
            <dd className="text-3xl font-bold text-foreground">{tests ? count(status) : "–"}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div>
          {loadError ? (
            <p className="flex items-start gap-2 font-bold text-destructive" role="alert">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              Nie udało się wczytać testów. Odśwież stronę.
            </p>
          ) : !tests ? (
            <p className="flex items-center gap-3" role="status">
              <Loader2 aria-hidden="true" className="size-5 animate-spin text-primary" />
              Wczytuję testy…
            </p>
          ) : (
            GROUPS.map(({ status, title, empty }) => {
              const items = tests.filter((report) => report.status === status);
              if (!items.length && !empty) return null;
              return (
                <section key={status} aria-labelledby={`grupa-${status}`} className="mb-10">
                  <h2 id={`grupa-${status}`} className="text-xl font-bold text-foreground">
                    {title}
                  </h2>
                  {items.length ? (
                    <ul className="mt-4 grid gap-4">
                      {items.map((report) => (
                        <TestItem
                          key={report.id}
                          report={report}
                          open={openId === report.id}
                          onToggle={() => setOpenId(openId === report.id ? null : report.id)}
                          onSubmit={(feedback) => saveFeedback(report.id, feedback)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 max-w-[55ch] text-muted">
                      {empty} Zgłoś się do testu innowacji z listy obok albo z jej karty w Bibliotece.
                    </p>
                  )}
                </section>
              );
            })
          )}
        </div>

        <InnovationPicker requestedIds={requestedIds} offline={offline} onRequested={addRequest} />
      </div>

      <Toast message={toast.message} onClose={toast.hide} />
    </>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Ocena ${rating} z 5: ${RATING_LABELS[rating]}`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          className={cn("size-5", value <= rating ? "fill-primary text-primary" : "text-muted")}
        />
      ))}
    </span>
  );
}

function TestItem({
  report,
  open,
  onToggle,
  onSubmit,
}: {
  report: TestReport;
  open: boolean;
  onToggle: () => void;
  onSubmit: (feedback: Feedback) => Promise<void>;
}) {
  const formId = useId();
  const title = report.innovation_title ?? `Innowacja #${report.innovation_id}`;
  const submitted = report.status === "submitted";
  const assigned = report.status === "assigned";

  return (
    <li className="border-(length:--bw) border-border bg-surface p-5 shadow-raised">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            <Link href={`/innowacje/${report.innovation_id}`} className="underline-offset-4 hover:underline">
              {title}
            </Link>
          </h3>
          <p className="mt-1">
            <TestStatusBadge status={report.status} />
          </p>
        </div>
        {assigned && (
          <Button type="button" variant={open ? "secondary" : "primary"} onClick={onToggle} aria-expanded={open} aria-controls={formId}>
            {open ? "Zwiń" : "Oceń test"}
          </Button>
        )}
      </div>

      {submitted && report.rating && (
        <div className="mt-4 grid gap-2">
          <Stars rating={report.rating} />
          {report.what_worked && (
            <p>
              <span className="font-bold">Co zadziałało:</span> {report.what_worked}
            </p>
          )}
          {report.improvements && (
            <p>
              <span className="font-bold">Propozycje usprawnień:</span> {report.improvements}
            </p>
          )}
          {report.cost_note && (
            <p>
              <span className="font-bold">Koszty:</span> {report.cost_note}
            </p>
          )}
        </div>
      )}

      {report.status === "requested" && report.motivation && (
        <p className="mt-3 text-muted">
          <span className="font-bold">Twoje uzasadnienie:</span> {report.motivation}
        </p>
      )}

      {assigned && open && <FeedbackForm id={formId} title={title} onSubmit={onSubmit} />}
    </li>
  );
}

type Errors = { rating?: string; what_worked?: string; submit?: string };

function FeedbackForm({ id, title, onSubmit }: { id: string; title: string; onSubmit: (feedback: Feedback) => Promise<void> }) {
  const ids = useId();
  const [rating, setRating] = useState(0);
  const [whatWorked, setWhatWorked] = useState("");
  const [improvements, setImprovements] = useState("");
  const [costNote, setCostNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const firstRatingRef = useRef<HTMLInputElement>(null);
  const workedRef = useRef<HTMLTextAreaElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    if (!rating) found.rating = "Wybierz ocenę od 1 do 5.";
    if (!whatWorked.trim()) found.what_worked = "Napisz choć jedno zdanie o tym, jak poszedł test.";
    setErrors(found);
    if (found.rating) return firstRatingRef.current?.focus();
    if (found.what_worked) return workedRef.current?.focus();

    setSending(true);
    try {
      await onSubmit({ rating, what_worked: whatWorked.trim(), improvements: improvements.trim(), cost_note: costNote.trim() });
    } catch {
      setErrors({ submit: "Nie udało się wysłać oceny. Spróbuj ponownie." });
    } finally {
      setSending(false);
    }
  }

  const errorText = (key: keyof Errors) =>
    errors[key] && (
      <p id={`${ids}-${key}-blad`} className="mt-2 flex items-start gap-2 font-bold text-destructive">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {errors[key]}
      </p>
    );

  return (
    <form id={id} onSubmit={submit} noValidate aria-label={`Ocena testu: ${title}`} className="appear mt-6 border-t-2 border-border pt-6">
      <fieldset aria-describedby={errors.rating ? `${ids}-rating-blad` : undefined}>
        <legend className="font-bold text-primary">
          Jak oceniasz innowację? <span className="font-normal text-muted">(wymagane)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className={cn(
                "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-ui border-(length:--bw) border-border px-4 py-2 has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-focus",
                rating === value ? "bg-primary font-bold text-primary-foreground" : "bg-surface text-foreground hover:bg-primary/10",
              )}
            >
              <input
                ref={value === 1 ? firstRatingRef : undefined}
                type="radio"
                name={`${ids}-ocena`}
                value={value}
                checked={rating === value}
                onChange={() => {
                  setRating(value);
                  setErrors((current) => ({ ...current, rating: undefined }));
                }}
                className="sr-only"
              />
              {value} – {RATING_LABELS[value]}
            </label>
          ))}
        </div>
        {errorText("rating")}
      </fieldset>

      <div className="mt-6">
        <label htmlFor={`${ids}-dzialalo`} className="block font-bold text-foreground">
          Co zadziałało? <span className="font-normal text-muted">(wymagane)</span>
        </label>
        <textarea
          ref={workedRef}
          id={`${ids}-dzialalo`}
          rows={3}
          value={whatWorked}
          onChange={(event) => {
            setWhatWorked(event.target.value);
            if (errors.what_worked && event.target.value.trim()) setErrors((current) => ({ ...current, what_worked: undefined }));
          }}
          aria-invalid={!!errors.what_worked || undefined}
          aria-describedby={errors.what_worked ? `${ids}-what_worked-blad` : undefined}
          className={cn(inputClass, errors.what_worked ? "border-destructive" : "border-border")}
        />
        {errorText("what_worked")}
      </div>

      <div className="mt-6">
        <label htmlFor={`${ids}-usprawnienia`} className="block font-bold text-foreground">
          Co trzeba zmienić lub usprawnić?
        </label>
        <p id={`${ids}-usprawnienia-podpowiedz`} className="mt-1 text-muted">
          Twoje propozycje trafią do autorów innowacji.
        </p>
        <textarea
          id={`${ids}-usprawnienia`}
          rows={3}
          value={improvements}
          onChange={(event) => setImprovements(event.target.value)}
          aria-describedby={`${ids}-usprawnienia-podpowiedz`}
          className={cn(inputClass, "border-border")}
        />
      </div>

      <div className="mt-6">
        <label htmlFor={`${ids}-koszt`} className="block font-bold text-foreground">
          Ile to kosztowało?
        </label>
        <input
          id={`${ids}-koszt`}
          type="text"
          value={costNote}
          onChange={(event) => setCostNote(event.target.value)}
          placeholder="np. 500 zł na materiały, 4 godziny pracy wolontariusza"
          className={cn(inputClass, "min-h-12 border-border")}
        />
      </div>

      {errorText("submit")}
      <Button type="submit" disabled={sending} className="mt-6">
        {sending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
        Wyślij ocenę
      </Button>
    </form>
  );
}

function InnovationPicker({
  requestedIds,
  offline,
  onRequested,
}: {
  requestedIds: Set<number>;
  offline: boolean;
  onRequested: (report: TestReport, offline: boolean) => void;
}) {
  const ids = useId();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<InnovationCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listInnovations({ search, limit: 6 }).then((list) => {
      if (!cancelled) setResults(list.innovations);
    });
    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <section aria-labelledby={`${ids}-tytul`} className="self-start border-(length:--bw) border-border bg-surface p-6 shadow-raised">
      <h2 id={`${ids}-tytul`} className="text-xl font-bold text-foreground">
        Zgłoś się do testu
      </h2>
      <p className="mt-2 text-muted">Wybierz innowację. Administrator ROPS zdecyduje, czy Ci ją przypisać.</p>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(query.trim());
        }}
        className="mt-4 flex gap-2"
      >
        <label htmlFor={`${ids}-szukaj`} className="sr-only">
          Szukaj innowacji
        </label>
        <input
          id={`${ids}-szukaj`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="np. seniorzy, samotność"
          className={cn(inputClass, "mt-0 min-h-12 border-border")}
        />
        <Button type="submit" aria-label="Szukaj">
          <Search aria-hidden="true" />
        </Button>
      </form>

      {!results ? (
        <p className="mt-4 flex items-center gap-3" role="status">
          <Loader2 aria-hidden="true" className="size-5 animate-spin text-primary" />
          Wczytuję innowacje…
        </p>
      ) : results.length === 0 ? (
        <p className="mt-4 text-muted" role="status">
          Nic nie znaleziono. Spróbuj innego słowa.
        </p>
      ) : (
        <ul className="mt-4 grid gap-5">
          {results.map((innovation) => (
            <li key={innovation.id} className="border-l-4 border-primary pl-4">
              <Link href={`/innowacje/${innovation.id}`} className="font-bold text-foreground underline-offset-4 hover:underline">
                {innovation.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-muted">{innovation.short_desc}</p>
              <div className="mt-2">
                {requestedIds.has(innovation.id) ? (
                  <p className="font-bold text-muted">Już zgłoszona — sprawdź status obok.</p>
                ) : (
                  <TestRequestForm innovation={innovation} offline={offline} onRequested={onRequested} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
