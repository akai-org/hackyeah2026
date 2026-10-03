import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Deklaracja dostępności" };

export default function AccessibilityStatementPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-deep">Deklaracja dostępności HubMI.pl</h1>

      <p className="mt-4 max-w-[65ch] text-lg">
        Regionalny Ośrodek Polityki Społecznej w Krakowie zobowiązuje się zapewnić dostępność
        serwisu HubMI.pl zgodnie z ustawą z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron
        internetowych i aplikacji mobilnych podmiotów publicznych.
      </p>

      <section className="mt-8 space-y-4 max-w-[65ch]">
        <h2 className="text-xl font-bold text-deep">Status zgodności</h2>
        <p>
          Serwis jest <strong>częściowo zgodny</strong> z WCAG 2.1 na poziomie AA.
          Dążymy do pełnej zgodności do czasu oficjalnego uruchomienia platformy.
        </p>
      </section>

      <section className="mt-8 space-y-4 max-w-[65ch]">
        <h2 className="text-xl font-bold text-deep">Dostępne funkcje</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Nawigacja klawiaturą przez całą stronę</li>
          <li>Widoczne obrysy focusa (min. 3 px)</li>
          <li>Odpowiedni kontrast kolorów (min. 4,5:1)</li>
          <li>Etykiety ARIA na wszystkich interaktywnych elementach</li>
          <li>Wsparcie dla dyktowania (Web Speech API w Chrome/Edge)</li>
          <li>Pominięcie do głównej treści (link „Przejdź do treści")</li>
          <li>Semantyczny HTML z nagłówkami h1-h3 w prawidłowej kolejności</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4 max-w-[65ch]">
        <h2 className="text-xl font-bold text-deep">Kontakt w sprawie dostępności</h2>
        <p>
          Jeśli napotkasz problem z dostępnością serwisu, skontaktuj się z ROPS Kraków:
        </p>
        <address className="not-italic">
          <p>Regionalny Ośrodek Polityki Społecznej w Krakowie</p>
          <p>ul. Piastowska 32, 30-070 Kraków</p>
          <p>
            <a href="https://rops.krakow.pl" className="font-bold text-leaf underline underline-offset-4">
              rops.krakow.pl
            </a>
          </p>
        </address>
        <p className="text-sm text-muted">
          Na odpowiedź czekaj maksymalnie 7 dni roboczych. Jeśli odpowiedź jest niezadowalająca,
          możesz skontaktować się z Rzecznikiem Praw Obywatelskich.
        </p>
      </section>

      <p className="mt-8 text-sm text-muted">
        Deklaracja sporządzona: 3 października 2026. Serwis w fazie prototypu (HackYeah 2026).
      </p>

      <Link href="/" className="mt-6 inline-flex min-h-12 items-center font-bold text-leaf underline underline-offset-4">
        Wróć na stronę główną
      </Link>
    </div>
  );
}
