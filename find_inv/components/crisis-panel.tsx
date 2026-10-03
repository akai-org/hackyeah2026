import { Phone } from "lucide-react";

// Ekran kryzysowy (DESIGN.md, sekcja 8 „Komunikaty”): spokojny panel z numerami pomocowymi,
// bez kolażu i ozdób. Pokazujemy go zamiast wyników, gdy opis wskazuje na zagrożenie życia lub przemoc.

const CRISIS_PATTERNS = [
  /samobój/,
  /zabi(ć|c|ję|je) się/,
  /odebra(ć|c) sobie życie/,
  /nie chc(ę|e) (już )?żyć/,
  /skończy(ć|c) ze sobą/,
  /okalecz/,
  /przemoc/,
  /bije (mnie|nas|mamę|mame|dzieci|dziecko|żonę|zone)/,
  /znęca/,
];

export function isCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PATTERNS.some((pattern) => pattern.test(lower));
}

const HELPLINES = [
  { number: "112", tel: "112", name: "Numer alarmowy", note: "Gdy ktoś jest w bezpośrednim niebezpieczeństwie." },
  {
    number: "800 70 2222",
    tel: "800702222",
    name: "Centrum Wsparcia dla osób w kryzysie psychicznym",
    note: "Bezpłatnie, całą dobę.",
  },
  {
    number: "116 123",
    tel: "116123",
    name: "Kryzysowy Telefon Zaufania",
    note: "Dla dorosłych w kryzysie emocjonalnym.",
  },
  { number: "116 111", tel: "116111", name: "Telefon Zaufania dla Dzieci i Młodzieży", note: "Bezpłatnie, całą dobę." },
  {
    number: "800 120 002",
    tel: "800120002",
    name: "Niebieska Linia",
    note: "Dla osób doznających przemocy domowej.",
  },
];

export function CrisisPanel({ children }: { children?: React.ReactNode }) {
  return (
    <section
      aria-labelledby="pomoc-kryzysowa"
      className="max-w-3xl rounded-ui border-(length:--bw) border-line bg-surface p-6 sm:p-8"
    >
      <h2 id="pomoc-kryzysowa" className="text-2xl font-bold text-deep">
        Pomoc jest blisko
      </h2>
      <p className="mt-3 max-w-[60ch] text-lg">
        Z opisu wynika, że ktoś może być w niebezpieczeństwie. Porozmawiaj z kimś teraz. Te numery są bezpłatne.
      </p>
      <ul className="mt-6 grid gap-3">
        {HELPLINES.map((line) => (
          <li key={line.tel}>
            <a
              href={`tel:${line.tel}`}
              className="flex min-h-12 items-center gap-4 rounded-ui border-(length:--bw) border-line bg-paper px-4 py-3 hover:bg-sage"
            >
              <Phone aria-hidden="true" className="size-6 shrink-0 text-deep" />
              <span>
                <span className="block text-xl font-bold text-deep">{line.number}</span>
                <span className="block font-bold">{line.name}</span>
                <span className="block text-muted">{line.note}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}
