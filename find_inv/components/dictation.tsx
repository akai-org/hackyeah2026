"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Check, CircleAlert, Info, Loader2, Mic, Square, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fixTranscript } from "@/lib/matchmaking";
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

const DICTATION_ERRORS: Record<string, string> = {
  "not-allowed": "Brak dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki albo wpisz tekst.",
  "service-not-allowed": "Brak dostępu do mikrofonu. Zezwól na mikrofon w ustawieniach przeglądarki albo wpisz tekst.",
  "no-speech": "Nic nie usłyszałem. Kliknij „Podyktuj” i spróbuj jeszcze raz albo wpisz tekst.",
  "audio-capture": "Nie znaleziono mikrofonu. Podłącz mikrofon albo wpisz tekst.",
  network: "Dyktowanie wymaga połączenia z internetem. Sprawdź połączenie albo wpisz tekst.",
};

const GENERIC_ERROR = "Dyktowanie nie zadziałało. Spróbuj jeszcze raz albo wpisz tekst.";

export type DictationState = "idle" | "recording" | "checking" | "confirm" | "done" | "error";

export type DictationOptions = {
  /**
   * Tryb na żywo: tekst pojawia się w polu w trakcie mówienia, a po zakończeniu poprawka z /api/voice-fix
   * czeka na decyzję użytkownika („Czy to miałeś na myśli?”). Bez tej opcji poprawka wchodzi od razu.
   */
  live?: boolean;
};

export type Suggestion = { original: string; corrected: string };

// W trybie na żywo nagrywanie kończy się samo po tej przerwie w mówieniu albo przyciskiem „Zatrzymaj”.
const SILENCE_MS = 3000;

/**
 * Dyktowanie do pola tekstowego. Podyktowany tekst jest dopisywany przez `setText`,
 * a potem podmieniany na wersję poprawioną przez /api/voice-fix (przy błędzie zostaje surowy).
 */
export function useDictation(
  setText: (update: (previous: string) => string) => void,
  onHeard?: () => void,
  options: DictationOptions = {},
) {
  const supported = useDictationSupported();
  const [state, setState] = useState<DictationState>("idle");
  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
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
    setMessage("Poprawiono tekst");
  }

  function reject() {
    setSuggestion(null);
    setState("done");
    setMessage("Zostawiono Twój tekst");
  }

  function toggle() {
    if (state === "recording") {
      recognitionRef.current?.stop();
      return;
    }
    if (state === "checking" || state === "confirm") return;

    const RecognitionImpl = getRecognition();
    if (!RecognitionImpl) {
      setState("error");
      setMessage("Dyktowanie nie jest obsługiwane w tej przeglądarce. Wpisz tekst ręcznie.");
      return;
    }

    const live = Boolean(options.live);
    const recognition = new RecognitionImpl();
    recognition.lang = "pl-PL";
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
      setText((previous) => (previous.trim() ? `${previous.trimEnd()} ${transcript}` : transcript));
      onHeard?.();
      // Backend poprawia gramatykę i błędy rozpoznawania mowy. Podmieniamy tylko podyktowany fragment.
      void fixTranscript(transcript).then((corrected) => {
        if (corrected !== transcript) setText((current) => current.replace(transcript, corrected));
      });
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      failed = true;
      setState("error");
      setMessage(DICTATION_ERRORS[event.error] ?? GENERIC_ERROR);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (silenceRef.current) window.clearTimeout(silenceRef.current);
      if (failed) return;
      if (!heard) {
        setState("error");
        setMessage(DICTATION_ERRORS["no-speech"]);
        return;
      }
      if (!live) {
        setState("done");
        setMessage("Gotowe, sprawdź tekst");
        return;
      }
      // Koniec mówienia: poprawka z LLM (albo prosta poprawka bez klucza) i pytanie do użytkownika.
      const original = spoken;
      setState("checking");
      setMessage("Sprawdzam tekst…");
      void fixTranscript(original).then((corrected) => {
        if (corrected && corrected !== original) {
          setSuggestion({ original, corrected });
          setState("confirm");
          setMessage("");
        } else {
          setState("done");
          setMessage("Gotowe, sprawdź tekst");
        }
      });
    };

    recognitionRef.current = recognition;
    setSuggestion(null);
    setState("recording");
    setMessage(live ? "Słucham… Tekst pojawia się w polu na bieżąco." : "Nagrywam…");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setState("error");
      setMessage(GENERIC_ERROR);
    }
  }

  return { supported, state, message, suggestion, toggle, abort, accept, reject };
}

type Dictation = ReturnType<typeof useDictation>;

/** Przycisk „Podyktuj” / „Zatrzymaj”. Bez wsparcia przeglądarki kliknięcie pokazuje komunikat w DictationStatus. */
export function DictationButton({ dictation, className }: { dictation: Dictation; className?: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={dictation.toggle}
      // Najpierw odpowiedź na „Czy to miałeś na myśli?”, potem kolejne dyktowanie.
      disabled={dictation.state === "checking" || dictation.state === "confirm"}
      className={className}
    >
      {dictation.state === "checking" ? (
        <>
          <Loader2 aria-hidden="true" className="animate-spin" />
          Sprawdzam…
        </>
      ) : dictation.state === "recording" ? (
        <>
          <Square aria-hidden="true" className="fill-current" />
          Zatrzymaj
        </>
      ) : (
        <>
          <Mic aria-hidden="true" />
          Podyktuj
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
        dictation.state === "error" ? "text-alert" : "text-deep",
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
  if (!dictation.supported) return null;
  return (
    <p id={id} className="mt-3 flex max-w-[65ch] items-start gap-2 text-sm text-muted">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      Dyktowanie może przetwarzać dźwięk w zewnętrznej usłudze przeglądarki. Nie podawaj danych osobowych.
    </p>
  );
}

/** Słowa poprawionego tekstu oznaczone, jeśli różnią się od oryginału (najdłuższy wspólny podciąg słów). */
function markChanges(original: string, corrected: string): Array<{ word: string; changed: boolean }> {
  const a = original.split(/\s+/).filter(Boolean);
  const b = corrected.split(/\s+/).filter(Boolean);
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: Array<{ word: string; changed: boolean }> = [];
  let i = 0;
  let j = 0;
  while (j < b.length) {
    if (i < a.length && a[i] === b[j]) {
      out.push({ word: b[j], changed: false });
      i++;
      j++;
    } else if (i < a.length && lcs[i + 1][j] >= lcs[i][j + 1]) {
      i++;
    } else {
      out.push({ word: b[j], changed: true });
      j++;
    }
  }
  return out;
}

/** Pytanie po dyktowaniu w trybie na żywo: przyjąć poprawkę AI czy zostawić tekst użytkownika. */
export function DictationSuggestion({ dictation }: { dictation: Dictation }) {
  const ids = useId();
  const headingRef = useRef<HTMLParagraphElement>(null);
  const suggestion = dictation.suggestion;

  // Focus na pytaniu — klawiatura i czytnik ekranu trafiają od razu do decyzji.
  useEffect(() => {
    if (suggestion) headingRef.current?.focus();
  }, [suggestion]);

  if (!suggestion) return null;
  const words = markChanges(suggestion.original, suggestion.corrected);

  return (
    <section
      aria-labelledby={`${ids}-pytanie`}
      className="appear mt-3 max-w-[65ch] rounded-ui border-(length:--bw) border-deep bg-mint p-4"
    >
      <p id={`${ids}-pytanie`} ref={headingRef} tabIndex={-1} className="font-bold text-deep focus:outline-none">
        Czy to miałeś na myśli?
      </p>
      <p className="mt-2 rounded-ui bg-surface px-3 py-2 text-lg">
        {words.map(({ word, changed }, index) => (
          <span key={index}>
            {index > 0 && " "}
            {changed ? <strong className="underline decoration-2 underline-offset-4">{word}</strong> : word}
          </span>
        ))}
      </p>
      <p className="mt-1 text-sm text-muted">Poprawione słowa są pogrubione i podkreślone.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" onClick={dictation.accept}>
          <Check aria-hidden="true" />
          Tak, popraw
        </Button>
        <Button type="button" variant="secondary" onClick={dictation.reject}>
          <X aria-hidden="true" />
          Nie, zostaw mój tekst
        </Button>
      </div>
    </section>
  );
}
