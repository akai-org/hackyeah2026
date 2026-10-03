import type { Metadata } from "next";
import { ClipboardCheck, MessageSquareText, Search, type LucideIcon } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Monstera } from "@/components/monstera";
import { TesterForm } from "@/components/tester-form";

export const metadata: Metadata = { title: "Zostań testerem innowacji" };

const STEPS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Search,
    title: "Wybierasz innowację",
    text: "Z Biblioteki wybierasz rozwiązanie, które pasuje do Twojej pracy albo okolicy.",
  },
  {
    icon: ClipboardCheck,
    title: "Sprawdzasz ją w praktyce",
    text: "Przez kilka tygodni próbujesz jej w swoim ośrodku, organizacji, szkole albo z sąsiadami.",
  },
  {
    icon: MessageSquareText,
    title: "Opisujesz, co działa",
    text: "Wypełniasz krótką ankietę: co się udało, co trzeba zmienić i ile to kosztowało.",
  },
];

const BENEFITS = [
  "Zaświadczenie o udziale w testowaniu od ROPS w Krakowie.",
  "Kontakt z autorami innowacji i ekspertami z całej Małopolski.",
  "Twoja opinia trafia do opisu innowacji i pomaga innym gminom.",
];

export default function TestersPage() {
  return (
    <div className="relative overflow-hidden">
      <Monstera
        size="small"
        color="mint"
        className="simple-hidden absolute -top-10 -right-12 hidden w-48 rotate-[210deg] lg:block"
      />

      <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text="Zostań testerem" />
        <p className="mt-4 max-w-[60ch] text-lg">
          Testerzy sprawdzają innowacje społeczne w prawdziwym życiu, zanim polecimy je innym gminom. Nie musisz być
          ekspertem. Wystarczy, że pracujesz z ludźmi albo chcesz pomóc w swojej okolicy.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          <div>
            <h2 className="text-xl font-bold text-deep">Na czym to polega</h2>
            <ol className="mt-4 grid gap-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="flex gap-4 border-(length:--bw) border-deep bg-surface p-5 shadow-paper"
                  >
                    <Icon aria-hidden="true" className="mt-1 size-8 shrink-0 text-leaf" strokeWidth={1.75} />
                    <div>
                      <p className="text-sm font-bold text-muted">Krok {index + 1}</p>
                      <h3 className="text-lg font-bold text-deep">{step.title}</h3>
                      <p className="mt-1">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <h2 className="mt-10 text-xl font-bold text-deep">Co zyskujesz</h2>
            <ul className="mt-4 grid gap-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="border-l-4 border-leaf pl-4">
                  {benefit}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[55ch] text-muted">
              Testowanie zajmuje zwykle 2–3 godziny w miesiącu. Zgłoszenie zatwierdza administrator ROPS.
            </p>
          </div>

          <TesterForm />
        </div>
      </div>
    </div>
  );
}
