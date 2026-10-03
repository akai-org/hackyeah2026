// Fikcyjne innowacje do prototypu. Nie opisują prawdziwych osób ani realizacji.

export type EvidenceLevel = "Sprawdzone" | "Wstępne" | "Brak danych";

export type Innovation = {
  id: string;
  title: string;
  summary: string;
  targetGroup: string;
  evidence: EvidenceLevel;
};

export const innovations: Innovation[] = [
  {
    id: "sasiedzki-telefon",
    title: "Sąsiedzki telefon",
    summary:
      "Wolontariusze z parafii i koła gospodyń dzwonią codziennie o stałej porze do samotnych seniorów. Gdy ktoś nie odbiera, sąsiad sprawdza, czy wszystko w porządku.",
    targetGroup: "Seniorzy mieszkający samotnie na wsi",
    evidence: "Sprawdzone",
  },
  {
    id: "bus-na-telefon",
    title: "Gminny bus na telefon",
    summary:
      "Mieszkańcy zamawiają przejazd do lekarza dzień wcześniej. Kierowca łączy kilka kursów w jedną trasę, więc gmina płaci mniej niż za stałą linię.",
    targetGroup: "Seniorzy i osoby z niepełnosprawnościami bez własnego transportu",
    evidence: "Sprawdzone",
  },
  {
    id: "cyfrowy-pomocnik",
    title: "Cyfrowy pomocnik w bibliotece",
    summary:
      "Uczniowie szkoły średniej raz w tygodniu pomagają seniorom w bibliotece: konfigurują telefon, umawiają wizytę u lekarza przez internet, pokazują, jak rozpoznać oszustwo.",
    targetGroup: "Seniorzy, którzy nie radzą sobie z internetem",
    evidence: "Wstępne",
  },
  {
    id: "punkt-po-lekcjach",
    title: "Punkt wsparcia po lekcjach",
    summary:
      "Dwa razy w tygodniu w szkole dyżuruje psycholog z poradni i przeszkolony pedagog. Uczeń może przyjść bez zapisów i bez zgody rodzica na pierwszą rozmowę.",
    targetGroup: "Młodzież w wieku 13–18 lat w kryzysie psychicznym",
    evidence: "Wstępne",
  },
  {
    id: "wspolna-kuchnia",
    title: "Wspólna kuchnia w świetlicy",
    summary:
      "Raz w tygodniu mieszkańcy gotują razem obiad w świetlicy wiejskiej. Osoby, które nie mogą przyjść, dostają posiłek do domu od sąsiadów.",
    targetGroup: "Mieszkańcy małych wsi, zwłaszcza osoby starsze",
    evidence: "Brak danych",
  },
  {
    id: "opiekun-wytchnieniowy",
    title: "Opiekun wytchnieniowy z sąsiedztwa",
    summary:
      "Przeszkolona osoba z okolicy zastępuje opiekuna rodzinnego na kilka godzin w tygodniu. Opiekun może załatwić sprawy albo po prostu odpocząć.",
    targetGroup: "Rodziny opiekujące się osobą zależną",
    evidence: "Wstępne",
  },
];
