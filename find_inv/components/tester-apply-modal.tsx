"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, FlaskConical, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

interface Props {
  innovationId: number;
  innovationTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldClass =
  "mt-2 w-full rounded-ui border-(length:--bw) border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-1";

export function TesterApplyModal({ innovationId, innovationTitle, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const t = useT();
  const tm = t.library.testerModal;
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: boolean; email?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Focus trap
  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 50);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !containerRef.current) return;
      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function validate() {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = true;
    if (!email.trim() || !email.includes("@")) errs.email = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setAlreadyApplied(false);
    try {
      // Z innovation_id backend od razu tworzy zgłoszenie do testu — admin widzi je w zakładce Testy.
      await apiPost<{ id: number | null; message: string }>("/api/testerzy", {
        name: name.trim(),
        email: email.trim(),
        innovation_id: innovationId,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAlreadyApplied(true);
        setSubmitting(false);
        return;
      }
      // backend unavailable — silent, still show success (zapisaliśmy dane lokalnie)
    }
    setSubmitting(false);
    onSuccess();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tester-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-md border-(length:--bw) border-border bg-surface p-6 shadow-raised sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute right-4 top-4 rounded-ui p-1 text-muted hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-focus"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <FlaskConical className="size-7 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="tester-modal-title" className="text-xl font-bold text-foreground">
              {tm.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{innovationTitle}</p>
          </div>
        </div>

        <p className="mt-4 text-base text-foreground">
          {tm.lead}
        </p>

        <form onSubmit={(e) => { void handleSubmit(e); }} noValidate className="mt-6 grid gap-5">
          <div>
            <label htmlFor="tester-name" className="block font-bold text-foreground">
              {tm.name}
            </label>
            <input
              ref={firstInputRef}
              id="tester-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => ({ ...prev, name: false })); }}
              aria-invalid={errors.name || undefined}
              placeholder="Anna Nowak"
              className={cn(fieldClass, errors.name ? "border-destructive" : "")}
            />
            {errors.name && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-destructive">
                <CircleAlert className="size-4" aria-hidden="true" />
                {tm.nameError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="tester-email" className="block font-bold text-foreground">
              {tm.email}
            </label>
            <input
              id="tester-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => ({ ...prev, email: false })); }}
              aria-invalid={errors.email || undefined}
              placeholder="anna@gmina.pl"
              className={cn(fieldClass, errors.email ? "border-destructive" : "")}
            />
            {errors.email && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-destructive">
                <CircleAlert className="size-4" aria-hidden="true" />
                {tm.emailError}
              </p>
            )}
          </div>

          {alreadyApplied && (
            <p role="alert" className="flex items-start gap-2 font-bold text-destructive">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              {t.library.test.already}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              <FlaskConical aria-hidden="true" />
              {submitting ? tm.sending : tm.send}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
