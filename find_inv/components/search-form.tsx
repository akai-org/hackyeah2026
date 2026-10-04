"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { CircleAlert, Search } from "lucide-react";

import {
  DictationButton,
  DictationNotice,
  DictationStatus,
  DictationSuggestion,
  useDictation,
} from "@/components/dictation";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type SearchFormProps = {
  /** Tekst startowy pola, np. poprzedni opis na stronie wyników. */
  initialText?: string;
  showExamples?: boolean;
  className?: string;
};

export function SearchForm({ initialText = "", showExamples = true, className }: SearchFormProps) {
  const router = useRouter();
  const t = useT();
  const ids = useId();
  const fieldId = `${ids}-pole`;
  const hintId = `${ids}-podpowiedz`;
  const errorId = `${ids}-blad`;
  const examplesId = `${ids}-przyklady`;

  const [text, setText] = useState(initialText);
  const [error, setError] = useState(false);
  const [errorKey, setErrorKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Na żywo: tekst pojawia się w polu w trakcie mówienia, potem AI proponuje poprawkę do akceptacji —
  // a długą wypowiedź „naokoło” skraca do sedna, bo krótki opis daje lepsze wyniki wyszukiwania.
  const dictation = useDictation(setText, () => setError(false), { live: true, condense: true });
  const supported = dictation.supported;

  function updateText(value: string) {
    setText(value);
    if (value.trim()) setError(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = text.trim();
    if (!query) {
      setError(true);
      setErrorKey((key) => key + 1);
      textareaRef.current?.focus();
      return;
    }
    dictation.abort();
    router.push(`/wyniki?q=${encodeURIComponent(query)}`);
  }

  function applyExample(example: string) {
    updateText(example);
    textareaRef.current?.focus();
  }

  const describedBy = [supported ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <form
      action="/wyniki"
      method="get"
      role="search"
      noValidate
      onSubmit={handleSubmit}
      className={cn("mt-8", className)}
    >
      <label htmlFor={fieldId} className="block text-lg font-semibold text-foreground">
        {t.searchForm.label}
      </label>

      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start">
        <textarea
          ref={textareaRef}
          id={fieldId}
          name="q"
          rows={3}
          value={text}
          onChange={(event) => updateText(event.target.value)}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          placeholder={t.searchForm.placeholder}
          className={cn(
            "min-h-[120px] w-full resize-y rounded-ui border-(length:--bw) bg-surface p-4 text-base text-foreground placeholder:text-muted md:flex-1",
            error ? "border-destructive" : "border-border",
          )}
        />

        <div className="flex flex-col gap-3 md:w-44">
          <Button type="submit" className="w-full">
            <Search aria-hidden="true" />
            {t.common.search}
          </Button>
          <DictationButton dictation={dictation} className="w-full" />
        </div>
      </div>

      {error && (
        <p
          key={errorKey}
          id={errorId}
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-semibold text-destructive"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {t.searchForm.empty}
        </p>
      )}

      <DictationStatus dictation={dictation} />
      <DictationSuggestion dictation={dictation} />
      <DictationNotice dictation={dictation} id={hintId} />

      {showExamples && (
        <div role="group" aria-labelledby={examplesId} className="mt-6">
          <p id={examplesId} className="font-semibold text-foreground">
            {t.searchForm.examples}
          </p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {t.searchForm.exampleList.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => applyExample(example)}
                  className="min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-border bg-surface px-4 py-2 text-left text-base text-foreground hover:bg-primary/10"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
