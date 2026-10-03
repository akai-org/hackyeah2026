"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Send } from "lucide-react";

import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { TESTER_SPECIALIZATIONS } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Zgłoszenie testera (mock): dane zostają w stanie komponentu, nic nie idzie do backendu.

type Field = "name" | "email" | "organization" | "expertise";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const EMPTY: Values = { name: "", email: "", organization: "", expertise: "" };
const FIELD_ORDER: Field[] = ["name", "email", "organization", "expertise"];

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Wpisz imię i nazwisko.";
  if (!values.email.trim()) errors.email = "Wpisz adres e-mail, żebyśmy mogli odpowiedzieć.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Adres e-mail wygląda na niepełny. Sprawdź, czy ma znak @ i domenę, np. jan@gmina.pl.";
  if (!values.expertise) errors.expertise = "Wybierz specjalizację. Jeśli żadna nie pasuje, wybierz „Inna”.";
  return errors;
}

const inputClass =
  "mt-2 min-h-12 w-full rounded-ui border-(length:--bw) border-field bg-surface px-4 text-base text-ink placeholder:text-muted";

export function TesterForm() {
  const { user } = useAuth();
  const ids = useId();
  const id = (field: Field) => `${ids}-${field}`;

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sentAs, setSentAs] = useState<string | null>(null);
  const [nameEdited, setNameEdited] = useState(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const refs = useRef<Partial<Record<Field, HTMLInputElement | HTMLSelectElement | null>>>({});
  const toast = useToast();

  // Imię z logowania podpowiadamy, dopóki ktoś nie zmieni pola (i tylko gdy nie jest to „Gość”).
  const suggestedName = user && user.name !== "Gość" ? user.name : "";
  const nameValue = nameEdited ? values.name : suggestedName;

  // Po wysłaniu focus przechodzi na potwierdzenie, bo formularz znika.
  useEffect(() => {
    if (sentAs) successRef.current?.focus();
  }, [sentAs]);

  function update(field: Field, value: string) {
    if (field === "name") setNameEdited(true);
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitted = { ...values, name: nameValue };
    const found = validate(submitted);
    setErrors(found);

    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      refs.current[firstInvalid]?.focus();
      return;
    }

    setSentAs(submitted.name.trim());
    setValues(EMPTY);
    setNameEdited(false);
    toast.show("Zgłoszenie wysłane. Admin ROPS je rozpatrzy.");
  }

  const describedBy = (field: Field, hint?: string) =>
    [hint, errors[field] ? `${id(field)}-blad` : null].filter(Boolean).join(" ") || undefined;

  const errorText = (field: Field) =>
    errors[field] && (
      <p id={`${id(field)}-blad`} className="mt-2 flex items-start gap-2 font-bold text-alert">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {errors[field]}
      </p>
    );

  const content = sentAs ? (
    <div className="appear border-(length:--bw) border-line bg-surface p-6 rounded-ui shadow-paper sm:p-8">
      <h2 ref={successRef} tabIndex={-1} className="flex items-center gap-3 text-xl font-bold text-deep">
        <CircleCheck aria-hidden="true" className="size-7 shrink-0 text-leaf" />
        Dziękujemy, {sentAs}
      </h2>
      <p className="mt-3 max-w-[55ch]">
        Zgłoszenie czeka na zatwierdzenie przez administratora ROPS. Gdy je zatwierdzi, w Twoim profilu pojawi się rola
        „Tester” i lista innowacji do sprawdzenia.
      </p>
      <Button type="button" variant="secondary" onClick={() => setSentAs(null)} className="mt-6">
        Wyślij kolejne zgłoszenie
      </Button>
    </div>
  ) : (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby={`${ids}-tytul`}
      className="border-(length:--bw) border-line bg-surface p-6 rounded-ui shadow-paper sm:p-8"
    >
      <h2 id={`${ids}-tytul`} className="text-xl font-bold text-deep">
        Formularz zgłoszeniowy
      </h2>
      <p className="mt-2 text-muted">Pola oznaczone jako „wymagane” trzeba wypełnić.</p>

      <div className="mt-6">
        <label htmlFor={id("name")} className="block font-bold text-deep">
          Imię i nazwisko <span className="font-normal text-muted">(wymagane)</span>
        </label>
        <input
          ref={(element) => {
            refs.current.name = element;
          }}
          id={id("name")}
          type="text"
          autoComplete="name"
          value={nameValue}
          onChange={(event) => update("name", event.target.value)}
          aria-invalid={!!errors.name || undefined}
          aria-describedby={describedBy("name")}
          className={cn(inputClass, errors.name ? "border-alert" : "border-field")}
        />
        {errorText("name")}
      </div>

      <div className="mt-6">
        <label htmlFor={id("email")} className="block font-bold text-deep">
          E-mail <span className="font-normal text-muted">(wymagane)</span>
        </label>
        <input
          ref={(element) => {
            refs.current.email = element;
          }}
          id={id("email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={describedBy("email")}
          className={cn(inputClass, errors.email ? "border-alert" : "border-field")}
        />
        {errorText("email")}
      </div>

      <div className="mt-6">
        <label htmlFor={id("organization")} className="block font-bold text-deep">
          Organizacja lub instytucja <span className="font-normal text-muted">(nieobowiązkowe)</span>
        </label>
        <p id={`${id("organization")}-podpowiedz`} className="mt-1 text-muted">
          Na przykład ośrodek pomocy społecznej, fundacja, szkoła.
        </p>
        <input
          ref={(element) => {
            refs.current.organization = element;
          }}
          id={id("organization")}
          type="text"
          autoComplete="organization"
          value={values.organization}
          onChange={(event) => update("organization", event.target.value)}
          aria-describedby={describedBy("organization", `${id("organization")}-podpowiedz`)}
          className={cn(inputClass, "border-field")}
        />
      </div>

      <div className="mt-6">
        <label htmlFor={id("expertise")} className="block font-bold text-deep">
          Specjalizacja <span className="font-normal text-muted">(wymagane)</span>
        </label>
        <select
          ref={(element) => {
            refs.current.expertise = element;
          }}
          id={id("expertise")}
          value={values.expertise}
          onChange={(event) => update("expertise", event.target.value)}
          aria-invalid={!!errors.expertise || undefined}
          aria-describedby={describedBy("expertise")}
          className={cn(inputClass, "cursor-pointer", errors.expertise ? "border-alert" : "border-field")}
        >
          <option value="">Wybierz z listy</option>
          {TESTER_SPECIALIZATIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {errorText("expertise")}
      </div>

      <Button type="submit" className="mt-8">
        <Send aria-hidden="true" />
        Wyślij zgłoszenie
      </Button>
    </form>
  );

  return (
    <>
      {content}
      <Toast message={toast.message} onClose={toast.hide} />
    </>
  );
}
