// Innowacje z find_inv_server/data/mock_data.py (+ kilka dodatkowych, fikcyjnych).
// Używane, gdy backend nie odpowiada, żeby matchmaking i Middleman działały na demo.

import type { Tag } from "@/data/mock";

export type CostLevel = "low" | "medium" | "high";
export type InnovationStatus = "active" | "archived" | "unmaintained";

/** Kształt InnovationCard z /api/match i /api/innovations (hubmi-backend-plan.md). */
export type InnovationCard = {
  id: number;
  title: string;
  short_desc: string;
  full_desc?: string;
  category?: string;
  area?: string;
  target_group?: string;
  location?: string | null;
  status?: InnovationStatus;
  cost_level?: CostLevel;
  implementation_time_months?: number;
  testers_count?: number;
  where_implemented?: string;
  source_url?: string;
  tags: string[];
  match_score?: number;
  is_unmaintained?: boolean;
};

export const COST_LABELS: Record<CostLevel, string> = {
  low: "Niski koszt",
  medium: "Średni koszt",
  high: "Wysoki koszt",
};

export const MOCK_INNOVATIONS: Array<InnovationCard & { tags: Tag[] }> = [
  {
    id: 1,
    title: "Cyfrowy Senior",
    short_desc: "Bezpłatne kursy obsługi smartfona i internetu dla osób 65+",
    full_desc:
      "Program szkoleń prowadzonych przez wolontariuszy w bibliotekach i DDP. Obejmuje obsługę smartfona, bankowość online, telemedycynę i kontakt z rodziną.",
    category: "wykluczenie cyfrowe",
    area: "edukacja",
    target_group: "seniorzy 65+",
    location: "Kraków",
    status: "active",
    cost_level: "low",
    implementation_time_months: 2,
    testers_count: 9,
    where_implemented: "Kraków, Tarnów, Nowy Sącz",
    source_url: "https://rops.krakow.pl",
    tags: ["seniorzy", "wykluczenie_cyfrowe", "edukacja", "wolontariat"],
    match_score: 0.94,
    is_unmaintained: false,
  },
  {
    id: 2,
    title: "Sąsiedzka Pomoc",
    short_desc: "Wolontariat sąsiedzki dla samotnych osób starszych",
    full_desc:
      "Sieć wolontariuszy odwiedzających samotnych seniorów w ich domach. Pomoc w zakupach, wizytach lekarskich, rozmowie. Koordynacja przez OPS.",
    category: "samotność",
    area: "wsparcie społeczne",
    target_group: "seniorzy 65+",
    location: "gmina wiejska",
    status: "active",
    cost_level: "low",
    implementation_time_months: 1,
    testers_count: 12,
    where_implemented: "gminy powiatu krakowskiego",
    source_url: "https://rops.krakow.pl",
    tags: ["seniorzy", "samotność", "wolontariat", "gmina_wiejska"],
    match_score: 0.89,
    is_unmaintained: false,
  },
  {
    id: 3,
    title: "Centrum Aktywności Lokalnej",
    short_desc: "Przestrzeń spotkań i aktywizacji dla mieszkańców zagrożonych wykluczeniem",
    full_desc:
      "Lokalne centrum oferujące warsztaty, grupy wsparcia i doradztwo. Działa przy OPS lub NGO. Łączy seniorów, osoby bezrobotne i rodziny w kryzysie.",
    category: "aktywizacja",
    area: "wsparcie społeczne",
    target_group: "mieszkańcy zagrożeni wykluczeniem",
    location: null,
    status: "active",
    cost_level: "medium",
    implementation_time_months: 4,
    testers_count: 7,
    where_implemented: "Wieliczka, Myślenice",
    source_url: "https://rops.krakow.pl",
    tags: ["wykluczenie_cyfrowe", "ubóstwo", "NGO", "OPS"],
    match_score: 0.82,
    is_unmaintained: false,
  },
  {
    id: 4,
    title: "Telemedycyna dla Wsi",
    short_desc: "Zdalne konsultacje lekarskie dla mieszkańców obszarów wiejskich",
    full_desc:
      "Platforma telemedyczna z przeszkolonymi koordynatorami w gminie. Umożliwia konsultacje ze specjalistami bez dojazdu do miasta.",
    category: "zdrowie",
    area: "dostęp do usług",
    target_group: "mieszkańcy gmin wiejskich",
    location: "gmina wiejska",
    status: "unmaintained",
    cost_level: "medium",
    implementation_time_months: 6,
    testers_count: 11,
    where_implemented: "powiat limanowski",
    source_url: "https://rops.krakow.pl",
    tags: ["gmina_wiejska", "dostępność", "transport", "seniorzy"],
    match_score: 0.76,
    is_unmaintained: true,
  },
  {
    id: 5,
    title: "Asystent Osoby z Niepełnosprawnością",
    short_desc: "Usługa asystenta wspierającego osoby z niepełnosprawnością w codziennym życiu",
    full_desc:
      "Przeszkoleni asystenci pomagają w wyjściach, urzędach, rehabilitacji i nauce. Finansowanie z PFRON i środków gminnych.",
    category: "niepełnosprawność",
    area: "wsparcie społeczne",
    target_group: "osoby z niepełnosprawnością",
    location: null,
    status: "active",
    cost_level: "high",
    implementation_time_months: 3,
    testers_count: 8,
    where_implemented: "Kraków, Bochnia, Gorlice",
    source_url: "https://rops.krakow.pl",
    tags: ["niepełnosprawność", "dostępność", "samorząd", "DPS"],
    match_score: 0.71,
    is_unmaintained: false,
  },
  {
    id: 6,
    title: "Gminny bus na telefon",
    short_desc: "Przejazdy do lekarza i urzędu zamawiane dzień wcześniej przez telefon",
    full_desc:
      "Mieszkańcy zamawiają przejazd telefonicznie w OPS. Koordynator łączy kursy w jedną trasę, więc gmina płaci mniej niż za stałą linię autobusową. Kierowcą bywa pracownik gminy lub wolontariusz z prawem jazdy kat. B.",
    category: "transport",
    area: "dostęp do usług",
    target_group: "seniorzy i osoby z niepełnosprawnościami bez własnego transportu",
    location: "gmina wiejska",
    status: "active",
    cost_level: "medium",
    implementation_time_months: 3,
    testers_count: 6,
    where_implemented: "gminy powiatu dąbrowskiego i tarnowskiego",
    source_url: "https://rops.krakow.pl",
    tags: ["transport", "seniorzy", "gmina_wiejska", "dostępność", "OPS"],
    match_score: 0.0,
    is_unmaintained: false,
  },
  {
    id: 7,
    title: "Punkt wsparcia po lekcjach",
    short_desc: "Bezpłatne rozmowy z psychologiem i pedagogiem w szkole po zajęciach",
    full_desc:
      "Raz w tygodniu po lekcjach w szkole dyżuruje psycholog z poradni lub NGO. Uczniowie przychodzą bez skierowania i bez zgody rodziców na pierwszą rozmowę. Punkt współpracuje z ośrodkiem interwencji kryzysowej.",
    category: "zdrowie psychiczne",
    area: "wsparcie społeczne",
    target_group: "młodzież 13–19 lat",
    location: null,
    status: "active",
    cost_level: "medium",
    implementation_time_months: 2,
    testers_count: 5,
    where_implemented: "Nowy Targ, Oświęcim",
    source_url: "https://rops.krakow.pl",
    tags: ["młodzież", "zdrowie_psychiczne", "edukacja", "NGO"],
    match_score: 0.0,
    is_unmaintained: false,
  },
  {
    id: 8,
    title: "Klub Rodzica w świetlicy",
    short_desc: "Spotkania i warsztaty dla rodziców małych dzieci w świetlicy wiejskiej",
    full_desc:
      "Cotygodniowe spotkania rodziców z dziećmi do 6 lat. Prowadzą je asystent rodziny i wolontariusze. W programie zabawy rozwojowe, porady położnej i wymiana ubrań dziecięcych.",
    category: "rodzina",
    area: "wsparcie rodziny",
    target_group: "rodziny z małymi dziećmi",
    location: "gmina wiejska",
    status: "active",
    cost_level: "low",
    implementation_time_months: 1,
    testers_count: 4,
    where_implemented: "gminy powiatu miechowskiego",
    source_url: "https://rops.krakow.pl",
    tags: ["rodzina", "dzieci", "gmina_wiejska", "wolontariat", "samotność"],
    match_score: 0.0,
    is_unmaintained: false,
  },
  {
    id: 9,
    title: "Mentor dla migranta",
    short_desc: "Wolontariusze pomagają nowym mieszkańcom w urzędach, szkole i pracy",
    full_desc:
      "Każda rodzina migrancka dostaje mentora z sąsiedztwa na pierwsze 3 miesiące. Mentor pomaga w załatwieniu PESEL, zapisaniu dzieci do szkoły i szukaniu pracy. Koordynacja przez CUS lub NGO.",
    category: "integracja",
    area: "włączenie społeczne",
    target_group: "migranci i uchodźcy",
    location: "Kraków",
    status: "active",
    cost_level: "low",
    implementation_time_months: 2,
    testers_count: 3,
    where_implemented: "Kraków, Wieliczka",
    source_url: "https://rops.krakow.pl",
    tags: ["migranci", "wolontariat", "rynek_pracy", "CUS", "NGO"],
    match_score: 0.0,
    is_unmaintained: false,
  },
];

// ---------- Zasobnik wiedzy: statystyki, wyzwania, Indeks Luki Innowacyjnej ----------

export type Challenge = {
  id: number;
  title: string;
  area: string;
  description: string;
  indicator_value: number;
  indicator_unit: string;
  source: string;
  data_year: number;
  powiat: string;
};

export type GapEntry = { powiat: string; gap_score: number; top_area: string; innovations_count: number };

export type MalopolskaStats = {
  aging_pct: number;
  loneliness_pct: number;
  digital_exclusion_pct: number;
  poverty_per_10k: number;
  mental_health_facilities: number;
  disability_count?: number;
  source_year: number;
  source?: string;
};

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: "Starzenie się społeczeństwa",
    area: "starzenie",
    description: "Rosnący odsetek osób 65+ przy malejącej liczbie opiekunów",
    indicator_value: 22.4,
    indicator_unit: "% osób 65+ w populacji",
    source: "GUS 2024",
    data_year: 2024,
    powiat: "krakowski",
  },
  {
    id: 2,
    title: "Wykluczenie cyfrowe seniorów",
    area: "wykluczenie cyfrowe",
    description: "Brak kompetencji cyfrowych wśród osób starszych",
    indicator_value: 68.0,
    indicator_unit: "% osób 65+ bez umiejętności cyfrowych",
    source: "GUS Społeczeństwo informacyjne 2023",
    data_year: 2023,
    powiat: "krakowski",
  },
  {
    id: 3,
    title: "Samotność osób starszych",
    area: "samotność",
    description: "Wzrost liczby jednoosobowych gospodarstw domowych osób 65+",
    indicator_value: 31.2,
    indicator_unit: "% jednoosobowych gosp. wśród 65+",
    source: "NSP 2021",
    data_year: 2021,
    powiat: "nowosądecki",
  },
];

export const MOCK_GAP_INDEX: GapEntry[] = [
  { powiat: "krakowski", gap_score: 1.2, top_area: "starzenie", innovations_count: 8 },
  { powiat: "nowosądecki", gap_score: 4.7, top_area: "wykluczenie cyfrowe", innovations_count: 2 },
  { powiat: "tarnowski", gap_score: 3.1, top_area: "samotność", innovations_count: 3 },
  { powiat: "limanowski", gap_score: 5.9, top_area: "dostęp do usług", innovations_count: 1 },
  { powiat: "myślenicki", gap_score: 2.4, top_area: "zdrowie psychiczne", innovations_count: 4 },
];

export const MOCK_STATS_MALOPOLSKA: MalopolskaStats = {
  aging_pct: 22.4,
  loneliness_pct: 18.1,
  digital_exclusion_pct: 31.0,
  poverty_per_10k: 145,
  mental_health_facilities: 23,
  disability_count: 187400,
  source_year: 2024,
  source: "GUS BDL, NSP 2021, ROPS Kraków",
};
