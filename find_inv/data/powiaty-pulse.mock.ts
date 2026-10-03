import type { Tag } from "@/data/mock";

// Puls powiatów na mapie Małopolski (dane demonstracyjne w skali wskaźników GUS/ROPS).
// gap_score: 0–6, im wyżej, tym więcej problemów i mniej sprawdzonych rozwiązań.

export type PowiatChallenge = { title: string; value: string; unit: string };

export type PowiatPulse = {
  gap_score: number;
  population: string;
  innovations_count: number;
  challenges: PowiatChallenge[];
  /** Tagi problemów — po nich dobieramy innowacje z Biblioteki. */
  tags: Tag[];
};

export const POWIAT_PULSE: Record<string, PowiatPulse> = {
  krakow: {
    gap_score: 1.1,
    population: "804 tys.",
    innovations_count: 14,
    challenges: [
      { title: "Samotność seniorów w blokach", value: "31,4", unit: "% seniorów mieszka samotnie" },
      { title: "Kryzysy psychiczne młodzieży", value: "2 150", unit: "porad PPP rocznie" },
      { title: "Integracja migrantów", value: "9,2", unit: "% mieszkańców z zagranicy" },
    ],
    tags: ["samotność", "zdrowie_psychiczne", "migranci", "gmina_miejska"],
  },
  krakowski: {
    gap_score: 1.6,
    population: "289 tys.",
    innovations_count: 8,
    challenges: [
      { title: "Starzenie się społeczeństwa", value: "22,4", unit: "% osób 65+" },
      { title: "Słaby transport do Krakowa", value: "38", unit: "sołectw bez kursu w weekend" },
      { title: "Opieka nad osobami zależnymi", value: "1 240", unit: "osób czeka na usługi opiekuńcze" },
    ],
    tags: ["seniorzy", "transport", "gmina_wiejska"],
  },
  wielicki: {
    gap_score: 1.9,
    population: "135 tys.",
    innovations_count: 5,
    challenges: [
      { title: "Szybki napływ młodych rodzin", value: "+11", unit: "% mieszkańców w 10 lat" },
      { title: "Brak miejsc w żłobkach", value: "640", unit: "dzieci na listach" },
      { title: "Samotne matki", value: "1 080", unit: "rodzin w OPS" },
    ],
    tags: ["rodzina", "dzieci", "samotność"],
  },
  myslenicki: {
    gap_score: 2.4,
    population: "128 tys.",
    innovations_count: 4,
    challenges: [
      { title: "Zdrowie psychiczne młodzieży", value: "18", unit: "% uczniów z objawami depresji" },
      { title: "Daleko do psychiatry", value: "64", unit: "km do najbliższego oddziału" },
      { title: "Seniorzy bez opieki", value: "21,1", unit: "% osób 65+" },
    ],
    tags: ["młodzież", "zdrowie_psychiczne", "seniorzy"],
  },
  bochenski: {
    gap_score: 2.9,
    population: "106 tys.",
    innovations_count: 3,
    challenges: [
      { title: "Samotność osób starszych", value: "27,8", unit: "% seniorów mieszka samotnie" },
      { title: "Bezrobocie długotrwałe", value: "4,9", unit: "% stopa bezrobocia" },
      { title: "Uzależnienia", value: "312", unit: "osób w terapii" },
    ],
    tags: ["samotność", "seniorzy", "rynek_pracy"],
  },
  brzeski: {
    gap_score: 3.3,
    population: "93 tys.",
    innovations_count: 3,
    challenges: [
      { title: "Wykluczenie transportowe", value: "41", unit: "% wsi bez autobusu" },
      { title: "Starzenie się wsi", value: "20,6", unit: "% osób 65+" },
      { title: "Niski dostęp do internetu", value: "17", unit: "% gospodarstw offline" },
    ],
    tags: ["transport", "gmina_wiejska", "wykluczenie_cyfrowe"],
  },
  tarnow: {
    gap_score: 2.2,
    population: "105 tys.",
    innovations_count: 6,
    challenges: [
      { title: "Odpływ młodych", value: "−8,4", unit: "% mieszkańców w 10 lat" },
      { title: "Seniorzy w kamienicach bez windy", value: "4 900", unit: "osób 75+" },
      { title: "Ubóstwo energetyczne", value: "11", unit: "% gospodarstw" },
    ],
    tags: ["seniorzy", "ubóstwo", "dostępność"],
  },
  tarnowski: {
    gap_score: 3.6,
    population: "202 tys.",
    innovations_count: 3,
    challenges: [
      { title: "Samotność osób starszych", value: "29,3", unit: "% seniorów mieszka samotnie" },
      { title: "Dostęp do lekarza", value: "1,4", unit: "lekarza na 1000 mieszkańców" },
      { title: "Wykluczenie cyfrowe", value: "34", unit: "% seniorów nigdy w sieci" },
    ],
    tags: ["samotność", "seniorzy", "wykluczenie_cyfrowe", "gmina_wiejska"],
  },
  dabrowski: {
    gap_score: 5.2,
    population: "57 tys.",
    innovations_count: 1,
    challenges: [
      { title: "Ubóstwo", value: "412", unit: "osób w OPS na 10 tys." },
      { title: "Wykluczenie transportowe", value: "52", unit: "% wsi bez autobusu" },
      { title: "Bezrobocie", value: "7,8", unit: "% stopa bezrobocia" },
    ],
    tags: ["ubóstwo", "transport", "rynek_pracy", "gmina_wiejska"],
  },
  proszowicki: {
    gap_score: 4.6,
    population: "43 tys.",
    innovations_count: 1,
    challenges: [
      { title: "Najstarszy powiat regionu", value: "23,9", unit: "% osób 65+" },
      { title: "Brak usług opiekuńczych", value: "6", unit: "z 6 gmin bez DDP" },
      { title: "Wykluczenie cyfrowe", value: "38", unit: "% seniorów nigdy w sieci" },
    ],
    tags: ["seniorzy", "wykluczenie_cyfrowe", "gmina_wiejska"],
  },
  miechowski: {
    gap_score: 4.9,
    population: "48 tys.",
    innovations_count: 1,
    challenges: [
      { title: "Wyludnianie się wsi", value: "−9,1", unit: "% mieszkańców w 10 lat" },
      { title: "Samotność seniorów", value: "33,0", unit: "% seniorów mieszka samotnie" },
      { title: "Daleko do usług", value: "27", unit: "km średnio do szpitala" },
    ],
    tags: ["samotność", "seniorzy", "transport", "gmina_wiejska"],
  },
  olkuski: {
    gap_score: 3.0,
    population: "110 tys.",
    innovations_count: 3,
    challenges: [
      { title: "Bezrobocie po zamknięciu kopalni", value: "6,1", unit: "% stopa bezrobocia" },
      { title: "Uzależnienia", value: "498", unit: "osób w terapii" },
      { title: "Osoby z niepełnosprawnością", value: "9 300", unit: "orzeczeń" },
    ],
    tags: ["rynek_pracy", "uzależnienia", "niepełnosprawność"],
  },
  chrzanowski: {
    gap_score: 2.7,
    population: "121 tys.",
    innovations_count: 4,
    challenges: [
      { title: "Przemiana przemysłowa", value: "5,4", unit: "% stopa bezrobocia" },
      { title: "Starzenie się miast", value: "21,8", unit: "% osób 65+" },
      { title: "Bariery architektoniczne", value: "62", unit: "% budynków bez windy" },
    ],
    tags: ["rynek_pracy", "seniorzy", "dostępność"],
  },
  oswiecimski: {
    gap_score: 2.5,
    population: "152 tys.",
    innovations_count: 4,
    challenges: [
      { title: "Osoby z niepełnosprawnością", value: "11 800", unit: "orzeczeń" },
      { title: "Rodziny w kryzysie", value: "860", unit: "rodzin z asystentem" },
      { title: "Samotność seniorów", value: "26,1", unit: "% seniorów mieszka samotnie" },
    ],
    tags: ["niepełnosprawność", "rodzina", "samotność"],
  },
  wadowicki: {
    gap_score: 2.8,
    population: "160 tys.",
    innovations_count: 4,
    challenges: [
      { title: "Dojazdy do pracy", value: "47", unit: "% pracujących dojeżdża" },
      { title: "Opieka nad dziećmi po lekcjach", value: "2 300", unit: "dzieci bez świetlicy" },
      { title: "Starzenie się wsi", value: "19,7", unit: "% osób 65+" },
    ],
    tags: ["dzieci", "rodzina", "transport"],
  },
  suski: {
    gap_score: 4.1,
    population: "83 tys.",
    innovations_count: 2,
    challenges: [
      { title: "Górskie przysiółki bez dojazdu", value: "58", unit: "przysiółków" },
      { title: "Emigracja zarobkowa", value: "12", unit: "% rodzin z rodzicem za granicą" },
      { title: "Zdrowie psychiczne dzieci", value: "1", unit: "psycholog na 4 gminy" },
    ],
    tags: ["transport", "dzieci", "zdrowie_psychiczne", "gmina_wiejska"],
  },
  limanowski: {
    gap_score: 5.9,
    population: "131 tys.",
    innovations_count: 1,
    challenges: [
      { title: "Dostęp do usług społecznych", value: "73", unit: "% wsi bez placówki" },
      { title: "Ubóstwo rodzin wielodzietnych", value: "388", unit: "osób w OPS na 10 tys." },
      { title: "Wykluczenie cyfrowe", value: "41", unit: "% seniorów nigdy w sieci" },
    ],
    tags: ["dostępność", "ubóstwo", "rodzina", "wykluczenie_cyfrowe"],
  },
  "nowy-sacz": {
    gap_score: 2.3,
    population: "83 tys.",
    innovations_count: 5,
    challenges: [
      { title: "Seniorzy w mieście", value: "20,9", unit: "% osób 65+" },
      { title: "Kryzys bezdomności", value: "210", unit: "osób bez domu" },
      { title: "Młodzież w kryzysie", value: "740", unit: "porad PPP rocznie" },
    ],
    tags: ["bezdomność", "młodzież", "seniorzy"],
  },
  nowosadecki: {
    gap_score: 4.7,
    population: "218 tys.",
    innovations_count: 2,
    challenges: [
      { title: "Wykluczenie cyfrowe seniorów", value: "38", unit: "% seniorów nigdy w sieci" },
      { title: "Daleko do lekarza", value: "1,2", unit: "lekarza na 1000 mieszkańców" },
      { title: "Bezrobocie ukryte na wsi", value: "9,4", unit: "% stopa bezrobocia" },
    ],
    tags: ["wykluczenie_cyfrowe", "seniorzy", "gmina_wiejska"],
  },
  gorlicki: {
    gap_score: 5.4,
    population: "107 tys.",
    innovations_count: 1,
    challenges: [
      { title: "Ubóstwo", value: "451", unit: "osób w OPS na 10 tys." },
      { title: "Bezrobocie", value: "8,9", unit: "% stopa bezrobocia" },
      { title: "Samotność seniorów w górach", value: "30,7", unit: "% seniorów mieszka samotnie" },
    ],
    tags: ["ubóstwo", "rynek_pracy", "samotność", "seniorzy"],
  },
  nowotarski: {
    gap_score: 3.8,
    population: "191 tys.",
    innovations_count: 2,
    challenges: [
      { title: "Sezonowa praca", value: "34", unit: "% pracy tylko w sezonie" },
      { title: "Uzależnienia", value: "620", unit: "osób w terapii" },
      { title: "Opieka nad dziećmi", value: "1 900", unit: "dzieci bez świetlicy" },
    ],
    tags: ["rynek_pracy", "uzależnienia", "dzieci"],
  },
  tatrzanski: {
    gap_score: 3.4,
    population: "67 tys.",
    innovations_count: 2,
    challenges: [
      { title: "Drogie mieszkania", value: "+64", unit: "% cen najmu w 5 lat" },
      { title: "Młodzież wyjeżdża", value: "−6,8", unit: "% osób 18–29" },
      { title: "Samotność seniorów", value: "28,2", unit: "% seniorów mieszka samotnie" },
    ],
    tags: ["młodzież", "samotność", "seniorzy"],
  },
};
