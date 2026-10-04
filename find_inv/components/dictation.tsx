"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Check, CircleAlert, Info, Loader2, Mic, Square, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LOCALE_TAGS } from "@/lib/i18n/config";
import { useI18n, useT } from "@/lib/i18n/client";
import { correctTranscript } from "@/lib/matchmaking";
import { cn } from "@/lib/utils";

// Dyktowanie (Web Speech API) wspólne dla wyszukiwarki i Kreatora pomysłów.
// Web Speech API nie ma typów w lib.dom, więc opisujemy tylko to, czego używamy.
type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | null {
  const speechWindow = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};

/** Na serwerze zawsze false, w przeglądarce sprawdza wsparcie. Bez ostrzeżeń hydracji. */
function useDictationSupported() {
  return useSyncExternalStore(
    noopSubscribe,
    () => getRecognition() !== null,
    () => false,
  );
}

type DictationMessages = ReturnType<typeof useT>["dictation"];

function errorMessage(code: string, t: DictationMessages): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return t.noMic;
    case "no-speech":
      return t.noSpeech;
    case "audio-capture":
      return t.noDevice;
    case "network":
      return t.network;
    default:
      return t.generic;
  }
}

export type DictationState = "idle" | "recording" | "checking" | "confirm" | "done" | "error";

export type DictationOptions = {
  /**
   * Tryb na żywo: tekst pojawia się w polu w trakcie mówienia (i nowe nagranie czyści pole). Bez tej opcji
   * dopisujemy tylko gotowe zdania. W obu trybach poprawka z /api/voice-fix czeka na decyzję użytkownika
   * („Czy chodziło Ci o…?”, <DictationSuggestion>).
   */
  live?: boolean;
  /** Razem z `live`: wypowiedź „naokoło” backend skraca do sedna (kto, co, gdzie). */
  condense?: boolean;
};

export type Suggestion = { original: string; corrected: string; condensed: boolean };

// W trybie na żywo nagrywanie kończy się samo po tej przerwie w mówieniu albo przyciskiem „Zatrzymaj”.
const SILENCE_MS = 3000;

/**
 * Dyktowanie do pola tekstowego. Podyktowany tekst jest dopisywany przez `setText`. Gdy /api/voice-fix
 * zwróci inną wersję, użytkownik decyduje: `accept` podmienia fragment, `reject` zostawia oryginał.
 */
export function useDictation(
  setText: (update: (previous: string) => string) => void,
  onHeard?: () => void,
  options: DictationOptions = {},
) {
  const supported = useDictationSupported();
  const { locale, t: messages } = useI18n();
  const t = messages.dictation;
  const [state, setState] = useState<DictationState>("idle");
  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  // Numer nagrania: poprawka, która spóźni się po rozpoczęciu nowego nagrania, nie nadpisze nowego tekstu.
  const sessionRef = useRef(0);
  const silenceRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (silenceRef.current) window.clearTimeout(silenceRef.current);
    },
    [],
  );

  function abort() {
    recognitionRef.current?.abort();
  }

  function accept() {
    if (!suggestion) return;
    const { original, corrected } = suggestion;
    setText((current) => current.replace(original, corrected));
    setSuggestion(null);
    setState("done");
    setMessage(t.corrected);
  }

  function reject() {
    setSuggestion(null);
    setState("done");
    setMessage(t.kept);
  }

  function toggle() {
    if (state === "recording") {
      recognitionRef.current?.stop();
      return;
    }
    // Nowe nagranie zamyka niepotwierdzoną poprawkę (zostaje tekst użytkownika). W trybie na żywo
    // zaczynamy od czystej karty — znika też tekst w polu.
    setSuggestion(null);
    if (options.live) setText(() => "");

    const RecognitionImpl = getRecognition();
    if (!RecognitionImpl) {
      setState("error");
      setMessage(t.unsupported);
      return;
    }

    const live = Boolean(options.live);
    const recognition = new RecognitionImpl();
    recognition.lang = LOCALE_TAGS[locale];
    recognition.interimResults = live;
    recognition.continuous = live;
    recognition.maxAlternatives = 1;

    let heard = false;
    let failed = false;
    // Tryb na żywo: pole = tekst sprzed dyktowania + to, co rozpoznano do tej pory (także wstępnie).
    let base: string | null = null;
    let spoken = "";

    const restartSilenceTimer = () => {
      if (silenceRef.current) window.clearTimeout(silenceRef.current);
      silenceRef.current = window.setTimeout(() => recognition.stop(), SILENCE_MS);
    };

    recognition.onresult = (event) => {
      if (live) {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
        transcript = transcript.replace(/\s+/g, " ").trim();
        if (!transcript) return;
        heard = true;
        spoken = transcript;
        setText((previous) => {
          if (base === null) base = previous.trimEnd();
          return base ? `${base} ${transcript}` : transcript;
        });
        onHeard?.();
        restartSilenceTimer();
        return;
      }

      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      transcript = transcript.trim();
      if (!transcript) return;
      heard = true;
      spoken = spoken ? `${spoken} ${transcript}` : transcript;
      setText((previous) => (previous.trim() ? `${previous.trimEnd()} ${transcript}` : transcript));
      onHeard?.();
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      failed = true;
      setState("error");
      setMessage(errorMessage(event.error, t));
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (silenceRef.current) window.clearTimeout(silenceRef.current);
      if (failed) return;
      if (!heard) {
        setState("error");
        setMessage(t.noSpeech);
        return;
      }
      // Koniec mówienia: poprawka z LLM (albo prosta poprawka bez klucza) i pytanie do użytkownika.
      // Podmieniamy potem tylko podyktowany fragment, nie cały tekst pola.
      const original = spoken;
      const session = sessionRef.current;
      setState("checking");
      setMessage(t.checkingText);
      void correctTranscript(original, live && Boolean(options.condense)).then(({ corrected, condensed }) => {
        if (session !== sessionRef.current) return; // w międzyczasie zaczęło się nowe nagranie
        if (corrected && corrected !== original) {
          setSuggestion({ original, corrected, condensed });
          setState("confirm");
          setMessage("");
        } else {
          setState("done");
          setMessage(t.ready);
        }
      });
    };

    recognitionRef.current = recognition;
    sessionRef.current += 1;
    setSuggestion(null);
    setState("recording");
    setMessage(live ? t.listeningLive : t.recording);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setState("error");
      setMessage(t.generic);
    }
  }

  return { supported, state, message, suggestion, toggle, abort, accept, reject };
}

type Dictation = ReturnType<typeof useDictation>;

/** Przycisk „Podyktuj” / „Zatrzymaj”. Bez wsparcia przeglądarki kliknięcie pokazuje komunikat w DictationStatus. */
export function DictationButton({ dictation, className }: { dictation: Dictation; className?: string }) {
  const t = useT().dictation;
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={dictation.toggle}
      className={className}
    >
      {dictation.state === "checking" ? (
        <>
          <Loader2 aria-hidden="true" className="animate-spin" />
          {t.checking}
          <span className="sr-only">{t.clickToRerecord}</span>
        </>
      ) : dictation.state === "confirm" ? (
        <>
          <Mic aria-hidden="true" />
          {t.rerecord}
        </>
      ) : dictation.state === "recording" ? (
        <>
          <Square aria-hidden="true" className="fill-current" />
          {t.stop}
        </>
      ) : (
        <>
          <Mic aria-hidden="true" />
          {t.dictate}
        </>
      )}
    </Button>
  );
}

/** Stan dyktowania. Region aria-live jest w DOM od początku, żeby czytnik ogłaszał każdą zmianę. */
export function DictationStatus({ dictation }: { dictation: Dictation }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 font-semibold",
        dictation.message && "mt-3",
        dictation.state === "error" ? "text-destructive" : "text-foreground",
      )}
    >
      {dictation.state === "recording" && <Mic aria-hidden="true" className="mt-0.5 size-5 shrink-0" />}
      {dictation.state === "error" && <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />}
      {dictation.message}
    </p>
  );
}

/** Informacja o przetwarzaniu mowy (DESIGN.md, sekcja 8). */
export function DictationNotice({ dictation, id }: { dictation: Dictation; id?: string }) {
  const t = useT().dictation;
  if (!dictation.supported) return null;
  return (
    <p id={id} className="mt-3 flex max-w-[65ch] items-start gap-2 text-sm text-muted">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {t.privacy}
    </p>
  );
}

/**
 * Różnica słowo po słowie (najdłuższy wspólny podciąg): słowa poprawionego tekstu z oznaczeniem zmian
 * oraz słowa, które z oryginału wypadły (np. wtrącenia „ten no jakby”).
 */
function diffWords(original: string, corrected: string) {
  const a = original.split(/\s+/).filter(Boolean);
  const b = corrected.split(/\s+/).filter(Boolean);
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const words: Array<{ word: string; changed: boolean }> = [];
  const removed: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      words.push({ word: b[j], changed: false });
      i++;
      j++;
    } else if (j >= b.length || (i < a.length && lcs[i + 1][j] >= lcs[i][j + 1])) {
      removed.push(a[i]);
      i++;
    } else {
      words.push({ word: b[j], changed: true });
      j++;
    }
  }
  // Słowo tylko poprawione (np. „niema” → „nie ma”) to zmiana, nie usunięcie — pokazujemy wyłącznie te,
  // których w poprawionym tekście nie ma wcale.
  const kept = new Set(b.map((word) => word.toLowerCase().replace(/[.,!?;:]/g, "")));
  const dropped = removed
    .map((word) => word.replace(/[.,!?;:]/g, ""))
    .filter((word) => word && !kept.has(word.toLowerCase()));
  return { words, removed: [...new Set(dropped.map((word) => word.toLowerCase()))] };
}

/** Pytanie po dyktowaniu: przyjąć poprawkę AI (/api/voice-fix) czy zostawić tekst użytkownika. */
export function DictationSuggestion({ dictation }: { dictation: Dictation }) {
  const ids = useId();
  const t = useT().dictation;
  const headingRef = useRef<HTMLParagraphElement>(null);
  const suggestion = dictation.suggestion;

  // Focus na pytaniu — klawiatura i czytnik ekranu trafiają od razu do decyzji.
  useEffect(() => {
    if (suggestion) headingRef.current?.focus();
  }, [suggestion]);

  if (!suggestion) return null;
  const { words, removed } = diffWords(suggestion.original, suggestion.corrected);
  const count = (text: string) => text.split(/\s+/).filter(Boolean).length;

  return (
    <section
      aria-labelledby={`${ids}-pytanie`}
      className="appear mt-3 max-w-[65ch] rounded-ui border-(length:--bw) border-primary bg-primary/10 p-4"
    >
      <p id={`${ids}-pytanie`} ref={headingRef} tabIndex={-1} className="font-bold text-foreground focus:outline-none">
        {t.didYouMean}
      </p>
      {suggestion.condensed ? (
        <>
          {/* Przy streszczeniu prawie każde słowo jest „zmienione”, więc zamiast podświetleń — skrót i pełna wypowiedź. */}
          <p className="mt-2 rounded-ui bg-surface px-3 py-2 text-lg">{suggestion.corrected}</p>
          <p className="mt-1 text-sm text-muted">
            {t.condensed(count(suggestion.original), count(suggestion.corrected))}
          </p>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-bold text-foreground">{t.showFull}</summary>
            <p className="mt-1 rounded-ui bg-surface px-3 py-2 text-muted">{suggestion.original}</p>
          </details>
        </>
      ) : (
        <>
          <p className="mt-2 rounded-ui bg-surface px-3 py-2 text-lg">
            {words.map(({ word, changed }, index) => (
              <span key={index}>
                {index > 0 && " "}
                {changed ? <strong className="underline decoration-2 underline-offset-4">{word}</strong> : word}
              </span>
            ))}
          </p>
          {words.some((word) => word.changed) && (
            <p className="mt-1 text-sm text-muted">{t.changedHint}</p>
          )}
          {removed.length > 0 && (
            <p className="mt-1 text-sm text-muted">
              {t.removed} {removed.map((word) => `„${word}”`).join(", ")}.
            </p>
          )}
        </>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" onClick={dictation.accept}>
          <Check aria-hidden="true" />
          {t.accept}
        </Button>
        <Button type="button" variant="secondary" onClick={dictation.reject}>
          <X aria-hidden="true" />
          {t.reject}
        </Button>
      </div>
    </section>
  );
}
