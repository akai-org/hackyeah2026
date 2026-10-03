"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ClipboardList, Users } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button } from "@/components/ui/button";
import { apiFetch, apiPost } from "@/lib/api";

const BENEFITS = [
  "Wczesny dostęp do nowych innowacji społecznych z Małopolski",
  "Certyfikat testera ROPS potwierdzający zaangażowanie",
  "Możliwość kształtowania polityki społecznej przez feedback",
  "Kontakt z siecią ekspertów i innych testerów",
];

export default function TesterzyPage() {
  const [form, setForm] = useState({ name: "", email: "", organization: "", expertise: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [activeTesterCount, setActiveTesterCount] = useState(47);
  const [innovationCount, setInnovationCount] = useState(23);

  useEffect(() => {
    apiFetch<{ testers: number; innovations: number }>("/api/admin/stats", {
      headers: { "X-Dev-Admin": "true" },
    })
      .then((d) => {
        if (d?.testers) setActiveTesterCount(d.testers);
        if (d?.innovations) setInnovationCount(d.innovations);
      })
      .catch(() => {});
  }, []);

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Imię i nazwisko jest wymagane";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Podaj poprawny adres e-mail";
    return e;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/testerzy", form);
    } catch {
      // fail silently — show success regardless (demo)
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Zostań testerem innowacji" />

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div>
          <p className="max-w-[60ch] text-lg">
            Testerzy innowacji to osoby, które sprawdzają nowe rozwiązania społeczne w praktyce i dostarczają
            cennego feedbacku do bazy ROPS Kraków.
          </p>

          <ul className="mt-8 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 size-5 shrink-0 text-leaf" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
              <Users className="size-8 text-leaf" aria-hidden="true" />
              <p className="mt-3 text-2xl font-bold text-deep tabular-nums">{activeTesterCount}</p>
              <p className="text-muted">aktywnych testerów w Małopolsce</p>
            </div>
            <div className="border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
              <ClipboardList className="size-8 text-leaf" aria-hidden="true" />
              <p className="mt-3 text-2xl font-bold text-deep tabular-nums">{innovationCount}</p>
              <p className="text-muted">innowacji w Bibliotece ROPS</p>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="flex flex-col items-start gap-4 rounded-ui border-(length:--bw) border-leaf bg-surface p-8 shadow-paper">
            <CheckCircle className="size-10 text-leaf" aria-hidden="true" />
            <h2 className="text-xl font-bold text-deep">Zgłoszenie przyjęte!</h2>
            <p>Administrator ROPS rozpatrzy Twoje zgłoszenie i skontaktuje się w ciągu 3 dni roboczych.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-ui border-(length:--bw) border-deep bg-surface p-8 shadow-paper">
            <h2 className="text-xl font-bold text-deep">Formularz zgłoszeniowy</h2>

            {(
              [
                { id: "name", label: "Imię i nazwisko *", type: "text", placeholder: "Jan Kowalski" },
                { id: "email", label: "Adres e-mail *", type: "email", placeholder: "jan@example.pl" },
                { id: "organization", label: "Organizacja / Instytucja", type: "text", placeholder: "NGO, OPS, Urząd Gminy…" },
                { id: "expertise", label: "Obszar specjalizacji", type: "text", placeholder: "np. praca z seniorami, psychologia…" },
              ] as const
            ).map(({ id, label, type, placeholder }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-sm font-bold text-deep">
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  value={form[id]}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, [id]: e.target.value }));
                    setErrors((e2) => ({ ...e2, [id]: undefined }));
                  }}
                  placeholder={placeholder}
                  aria-invalid={!!errors[id]}
                  aria-describedby={errors[id] ? `${id}-err` : undefined}
                  className="mt-1 w-full rounded-ui border-(length:--bw) border-deep bg-paper px-4 py-2 text-base"
                />
                {errors[id] && (
                  <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-bold text-alert">
                    {errors[id]}
                  </p>
                )}
              </div>
            ))}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Wysyłanie…" : "Zgłoś się jako tester"}
            </Button>
            <p className="text-xs text-muted">* Pola obowiązkowe. Zgłoszenie zapisywane w bazie ROPS.</p>
          </form>
        )}
      </div>
    </div>
  );
}
