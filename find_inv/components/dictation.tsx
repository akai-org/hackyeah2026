"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CircleAlert, Info, Mic, Square } from "lucide-react";

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

export type DictationState = "idle" | "recording" | "done" | "error";

/**
 * Dyktowanie do pola tekstowego. Podyktowany tekst jest dopisywany przez `setText`,
 * a potem podmieniany na wersję poprawioną przez /api/voice-fix (przy błędzie zostaje surowy).
 */
export function useDictation(
  setText: (update: (previous: string) => string) => void,
  onHeard?: () => void,
) {
  const supported = useDictationSupported();
  const [state, setState] = useState<DictationState>("idle");
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  function abort() {
    recognitionRef.current?.abort();
  }

  function toggle() {
    if (state === "recording") {
      recognitionRef.current?.stop();
      return;
    }

    const RecognitionImpl = getRecognition();
    if (!RecognitionImpl) {
      setState("error");
      setMessage("Dyktowanie nie jest obsługiwane w tej przeglądarce. Wpisz tekst ręcznie.");
      return;
    }

    const recognition = new RecognitionImpl();
    recognition.lang = "pl-PL";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let heard = false;
    let failed = false;

    recognition.onresult = (event) => {
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
      if (failed) return;
      if (heard) {
        setState("done");
        setMessage("Gotowe, sprawdź tekst");
      } else {
        setState("error");
        setMessage(DICTATION_ERRORS["no-speech"]);
      }
    };

    recognitionRef.current = recognition;
    setState("recording");
    setMessage("Nagrywam…");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setState("error");
      setMessage(GENERIC_ERROR);
    }
  }

  return { supported, state, message, toggle, abort };
}

type Dictation = ReturnType<typeof useDictation>;

/** Przycisk „Podyktuj” / „Zatrzymaj”. Bez wsparcia przeglądarki kliknięcie pokazuje komunikat w DictationStatus. */
export function DictationButton({ dictation, className }: { dictation: Dictation; className?: string }) {
  return (
    <Button type="button" variant="secondary" onClick={dictation.toggle} className={className}>
      {dictation.state === "recording" ? (
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
