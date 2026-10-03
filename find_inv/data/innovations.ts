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
