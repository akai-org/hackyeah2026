"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, ClipboardCheck, Clock, FlaskConical, Loader2, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getMyTests, requestTest, type TestReport, type TestStatus } from "@/lib/tester-api";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

// Zgłoszenie testera do konkretnej innowacji. Admin ROPS decyduje, czy go przypisać.

type Innovation = { id: number; title: string };

const STATUS_STYLES: Record<TestStatus, { icon: typeof Clock; className: string }> = {
  requested: { icon: Clock, className: "border-border bg-secondary text-foreground" },
  assigned: { icon: FlaskConical, className: "border-primary bg-primary/10 text-primary" },
  submitted: { icon: ClipboardCheck, className: "border-success bg-success/10 text-success" },
  rejected: { icon: X, className: "bg-surface text-muted" },
};

export function TestStatusBadge({ status }: { status: TestStatus }) {
  const { icon: Icon, className } = STATUS_STYLES[status];
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-border px-2.5 py-0.5 text-sm font-bold",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {t.library.test.status[status]}
    </span>
  );
}

/** Przycisk „Zgłoś się do testu” + opcjonalne uzasadnienie. Wymaga zalogowanego testera. */
export function TestRequestForm({
  innovation,
  offline,
  onRequested,
}: {
  innovation: Innovation;
  offline: boolean;
  onRequested: (report: TestReport, offline: boolean) => void;
}) {
  const { user } = useAuth();
  const t = useT();
  const tt = t.library.test;
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  if (!user) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await requestTest(innovation, user!, motivation.trim(), offline);
      onRequested(result.data, result.offline);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? tt.already
          : tt.sendFailed,
      );
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} aria-label={tt.applyFor(innovation.title)}>
        <FlaskConical aria-hidden="true" />
        {tt.apply}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} aria-label={tt.formLabel(innovation.title)} className="appear grid gap-3">
      <div>
        <label htmlFor={`${ids}-dlaczego`} className="block font-bold text-foreground">
          {tt.why}
        </label>
        <p id={`${ids}-podpowiedz`} className="mt-1 text-muted">
          {tt.whyHint}
        </p>
        <textarea
          ref={textareaRef}
          id={`${ids}-dlaczego`}
          rows={3}
          value={motivation}
          onChange={(event) => setMotivation(event.target.value)}
          aria-describedby={`${ids}-podpowiedz`}
          className="mt-2 w-full rounded-ui border-(length:--bw) border-border bg-surface px-4 py-3 text-base text-foreground"
        />
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 font-bold text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={sending}>
          {sending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
          {tt.send}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}

/** Ramka na karcie innowacji: dla testera zgłoszenie albo status, dla reszty nic. */
export function TestRequestBox({ innovation }: { innovation: Innovation }) {
  const { user, offline: sessionOffline } = useAuth();
  const tt = useT().library.test;
  const isTester = user?.role === "tester";
  const [report, setReport] = useState<TestReport | null | undefined>(undefined);
  const [offline, setOffline] = useState(sessionOffline);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!isTester || !user) return;
    getMyTests(user.id, sessionOffline)
      .then((result) => {
        setReport(result.data.find((row) => row.innovation_id === innovation.id) ?? null);
        setOffline(result.offline);
      })
      .catch(() => setReport(null));
  }, [isTester, user, sessionOffline, innovation.id]);

  if (!isTester || report === undefined) return null;

  return (
    <section
      aria-labelledby="test-innowacji"
      className="mt-8 border-(length:--bw) border-border bg-surface p-6 shadow-raised print:hidden"
    >
      <h2 id="test-innowacji" className="flex items-center gap-2 text-xl font-bold text-foreground">
        <FlaskConical aria-hidden="true" className="size-6 text-primary" />
        {tt.testing}
      </h2>
      {report ? (
        <>
          <p ref={statusRef} tabIndex={-1} role="status" className="mt-3">
            <span className="font-bold">{tt.status[report.status]}.</span>{" "}
            {report.status === "requested" && tt.requestedInfo}
            {report.status === "assigned" && tt.assignedInfo}
          </p>
          <Link href="/testerzy/panel" className="mt-3 inline-block font-bold text-primary underline underline-offset-4 hover:text-primary-hover">
            {tt.goPanel}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 max-w-[60ch]">
            {tt.lead}
          </p>
          <div className="mt-4">
            <TestRequestForm
              innovation={innovation}
              offline={offline}
              onRequested={(created, wasOffline) => {
                setReport(created);
                setOffline(wasOffline);
                requestAnimationFrame(() => statusRef.current?.focus());
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}
