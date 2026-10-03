"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { CircleAlert, Info, Mic, Search, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Samotny senior na wsi",
  "Brak transportu do lekarza",
  "Seniorzy nie radzą sobie z internetem",
  "Młodzież w kryzysie psychicznym",
];

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

type DictationState = "idle" | "recording" | "done" | "error";

export function SearchForm() {
  const router = useRouter();
  const ids = useId();
  const fieldId = `${ids}-pole`;
  const hintId = `${ids}-podpowiedz`;
  const errorId = `${ids}-blad`;
  const examplesId = `${ids}-przyklady`;

  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  const [errorKey, setErrorKey] = useState(0);
  const [dictation, setDictation] = useState<DictationState>("idle");
  const [dictationMessage, setDictationMessage] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const supported = useDictationSupported();

  useEffect(() => () => recognitionRef.current?.abort(), []);

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
    recognitionRef.current?.abort();
    router.push(`/wyniki?q=${encodeURIComponent(query)}`);
  }

  function applyExample(example: string) {
    updateText(example);
    textareaRef.current?.focus();
  }

  function toggleDictation() {
    if (dictation === "recording") {
      recognitionRef.current?.stop();
      return;
    }

    const RecognitionImpl = getRecognition();
    if (!RecognitionImpl) return;

    const recognition = new RecognitionImpl();
    recognition.lang = "pl-PL";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let heard = false;
    let failed = false;
    let heardTranscript = "";

    recognition.onresult = (event) => {
      let segment = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) segment += event.results[i][0].transcript;
      }
      segment = segment.trim();
      if (!segment) return;
      heard = true;
      heardTranscript = segment;
      setText((previous) => (previous.trim() ? `${previous.trimEnd()} ${segment}` : segment));
      setError(false);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      failed = true;
      setDictation("error");
      setDictationMessage(DICTATION_ERRORS[event.error] ?? "Dyktowanie nie zadziałało. Spróbuj jeszcze raz albo wpisz tekst.");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (failed) return;
      if (heard) {
        setDictation("done");
        setDictationMessage("Gotowe, sprawdź tekst");
        // Silently apply voice-fix to improve transcript quality (no API key = no-op)
        apiPost<{ corrected: string }>("/api/voice-fix", { transcript: heardTranscript })
          .then((r) => {
            if (r?.corrected && r.corrected.trim()) {
              setText((prev) =>
                prev.endsWith(heardTranscript)
                  ? prev.slice(0, -heardTranscript.length) + r.corrected
                  : prev,
              );
            }
          })
          .catch(() => {});
      } else {
        setDictation("error");
        setDictationMessage(DICTATION_ERRORS["no-speech"]);
      }
    };

    recognitionRef.current = recognition;
    setDictation("recording");
    setDictationMessage("Nagrywam…");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setDictation("error");
      setDictationMessage("Dyktowanie nie zadziałało. Spróbuj jeszcze raz albo wpisz tekst.");
    }
  }

  const describedBy = [supported ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <form action="/wyniki" method="get" role="search" noValidate onSubmit={handleSubmit} className="mt-8">
      <label htmlFor={fieldId} className="block text-lg font-bold text-deep">
        Opisz swój problem
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
          placeholder="Na przykład: mama mieszka sama na wsi i nie ma jak dojechać do lekarza"
          className={cn(
            "min-h-[120px] w-full resize-y rounded-ui border-(length:--bw) bg-surface p-4 text-base text-ink placeholder:text-muted md:flex-1",
            error ? "border-alert" : "border-deep",
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row md:w-44 md:flex-col">
          <Button type="submit" className="sm:flex-1 md:flex-none">
            <Search aria-hidden="true" />
            Szukaj
          </Button>
          {supported && (
            <Button type="button" variant="secondary" onClick={toggleDictation} className="sm:flex-1 md:flex-none">
              {dictation === "recording" ? (
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
          )}
        </div>
      </div>

      {error && (
        <p
          key={errorKey}
          id={errorId}
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Wpisz kilka słów o problemie, żeby zacząć szukać.
        </p>
      )}

      {/* Region aria-live jest w DOM od początku, żeby czytnik ogłaszał każdą zmianę stanu dyktowania. */}
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-start gap-2 font-bold",
          dictationMessage && "mt-3",
          dictation === "error" ? "text-alert" : "text-deep",
        )}
      >
        {dictation === "recording" && <Mic aria-hidden="true" className="mt-0.5 size-5 shrink-0" />}
        {dictation === "error" && <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />}
        {dictationMessage}
      </p>

      {supported && (
        <p id={hintId} className="mt-3 flex max-w-[65ch] items-start gap-2 text-sm text-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Dyktowanie może przetwarzać dźwięk w zewnętrznej usłudze przeglądarki. Nie podawaj danych osobowych.
        </p>
      )}

      <div role="group" aria-labelledby={examplesId} className="mt-6">
        <p id={examplesId} className="font-bold text-deep">
          Przykłady
        </p>
        <ul className="mt-2 flex flex-wrap gap-3">
          {EXAMPLES.map((example, index) => (
            <li key={example} className={index >= 3 ? "simple-hidden" : undefined}>
              <button
                type="button"
                onClick={() => applyExample(example)}
                className="min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-2 text-left text-base text-ink hover:bg-mint"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
