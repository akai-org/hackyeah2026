"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { reportNeed } from "@/lib/matchmaking";

/** Przycisk „Zgłoś tę potrzebę do ROPS” dla pustego wyniku wyszukiwania. */
export function ReportNeed({ query }: { query: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    setState("sending");
    try {
      await reportNeed(query);
      setState("sent");
    } catch (error) {
      console.error(error);
      setState("error");
    }
  }

  return (
    <div className="mt-4">
      {state === "sent" ? (
        <p role="status" className="flex items-start gap-2 font-bold text-foreground">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Zgłoszenie wysłane. Dziękujemy.
        </p>
      ) : (
        <Button type="button" onClick={send} disabled={state === "sending"}>
          <Megaphone aria-hidden="true" />
          {state === "sending" ? "Wysyłam…" : "Zgłoś tę potrzebę do ROPS"}
        </Button>
      )}
      {state === "error" && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-ui border-2 border-destructive bg-surface px-4 py-3 font-bold text-destructive"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nie udało się wysłać zgłoszenia. Spróbuj jeszcze raz za chwilę.
        </p>
      )}
    </div>
  );
}
