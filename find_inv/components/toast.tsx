"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleCheck, X } from "lucide-react";

// Krótkie potwierdzenie akcji („Zgłoszenie wysłane”). Region aria-live jest w DOM od początku,
// żeby czytnik ekranu ogłosił każdą nową wiadomość. Znika po 6 s albo po kliknięciu „Zamknij”.

const HIDE_AFTER_MS = 6000;

export function useToast() {
  const [message, setMessage] = useState<{ text: string; key: number } | null>(null);
  const show = useCallback((text: string) => setMessage({ text, key: Date.now() }), []);
  const hide = useCallback(() => setMessage(null), []);
  return { message, show, hide };
}

type ToastProps = {
  message: { text: string; key: number } | null;
  onClose: () => void;
};

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, HIDE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-6 z-30 flex justify-center"
    >
      {message && (
        <div
          key={message.key}
          className="toast-in pointer-events-auto flex max-w-xl items-start gap-3 rounded-ui border-(length:--bw) border-success bg-surface py-3 pr-2 pl-4 text-base font-bold text-foreground shadow-raised"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-success" />
          <p className="flex-1 py-0.5">{message.text}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij powiadomienie"
            className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-ui hover:bg-secondary/60"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
