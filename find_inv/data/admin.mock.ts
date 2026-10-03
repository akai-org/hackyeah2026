// Kopia zapasowa danych panelu admina, gdy backend nie odpowiada (demo nie może stanąć).
// Kształt jak w find_inv_server/app/admin_store.py. Osoby i instytucje są fikcyjne.

import type { Role } from "@/data/mock";

export type InnovationStatus = "pending" | "active" | "archived" | "unmaintained";

export type AdminInnovation = {
  id: number;
  title: string;
  short_desc: string;
  category: string;
  target_group: string;
  location: string | null;
  status: InnovationStatus;
  cost_level: "low" | "medium" | "high";
  where_implemented: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type AdminUser = {
  id: number;
  name: string;
  role: Role;
  created_at: string;
  tester_pending?: boolean;
};

export type AdminTester = {
  id: number;
  user_id: number;
  name: string;
  email: string;
  organization: string;
  expertise: string;
  approved: boolean;
  created_at: string;
};

export type AdminTrends = {
  top_tags: Array<{ tag: string; count: number }>;
  top_queries: Array<{ query: string; count: number }>;
  zero_result_queries: Array<{ query: string; count: number }>;
  by_day: Array<{ date: string; count: number }>;
  total: number;
  change_pct: number | null;
};

export type AdminStats = {
  innovations: number;
  innovations_by_status: Record<InnovationStatus, number>;
  users: number;
  testers: number;
  pending_testers: number;
  searches: number;
  searches_today: number;
};

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 19);
}

export function seedInnovations(): AdminInnovation[] {
  const rows: Array<Omit<AdminInnovation, "created_at" | "updated_at"> & { age: number }> = [
    { id: 6, title: "Gminny bus na telefon", short_desc: "Przejazdy do lekarza zamawiane dzień wcześniej, łączone w jedną trasę", category: "transport", target_group: "seniorzy i osoby z niepełnosprawnościami", location: "gmina wiejska", status: "pending", cost_level: "medium", where_implemented: "gmina Pcim", tags: ["transport", "seniorzy", "gmina_wiejska"], age: 2 },
    { id: 7, title: "Punkt wsparcia po lekcjach", short_desc: "Dyżur psychologa w szkole bez zapisów, dwa razy w tygodniu", category: "zdrowie psychiczne", target_group: "młodzież 13–18 lat", location: "Nowy Targ", status: "pending", cost_level: "medium", where_implemented: "pilotaż w 2 szkołach", tags: ["młodzież", "zdrowie_psychiczne", "edukacja"], age: 3 },
    { id: 8, title: "Wspólna kuchnia w świetlicy", short_desc: "Cotygodniowe wspólne gotowanie, posiłki dowożone sąsiadom", category: "samotność", target_group: "mieszkańcy wsi, seniorzy", location: "gmina wiejska", status: "pending", cost_level: "low", where_implemented: "KGW w powiecie limanowskim", tags: ["samotność", "seniorzy", "wolontariat"], age: 4 },
    { id: 1, title: "Cyfrowy Senior", short_desc: "Bezpłatne kursy obsługi smartfona i internetu dla osób 65+", category: "wykluczenie cyfrowe", target_group: "seniorzy 65+", location: "Kraków", status: "active", cost_level: "low", where_implemented: "Kraków, Tarnów, Nowy Sącz", tags: ["seniorzy", "wykluczenie_cyfrowe", "edukacja"], age: 60 },
    { id: 2, title: "Sąsiedzka Pomoc", short_desc: "Wolontariat sąsiedzki dla samotnych osób starszych", category: "samotność", target_group: "seniorzy 65+", location: "gmina wiejska", status: "active", cost_level: "low", where_implemented: "gminy powiatu krakowskiego", tags: ["seniorzy", "samotność", "wolontariat"], age: 57 },
    { id: 3, title: "Centrum Aktywności Lokalnej", short_desc: "Przestrzeń spotkań i aktywizacji dla mieszkańców zagrożonych wykluczeniem", category: "aktywizacja", target_group: "mieszkańcy zagrożeni wykluczeniem", location: null, status: "active", cost_level: "medium", where_implemented: "Wieliczka, Myślenice", tags: ["ubóstwo", "NGO", "OPS"], age: 54 },
    { id: 4, title: "Telemedycyna dla Wsi", short_desc: "Konsultacje lekarskie online w punktach przy OPS", category: "zdrowie", target_group: "mieszkańcy wsi", location: "gmina wiejska", status: "unmaintained", cost_level: "medium", where_implemented: "powiat miechowski", tags: ["gmina_wiejska", "dostępność", "seniorzy"], age: 51 },
    { id: 5, title: "Asystent Osoby z Niepełnosprawnością", short_desc: "Wsparcie asystenta w codziennych czynnościach i dojazdach", category: "niepełnosprawność", target_group: "osoby z niepełnosprawnościami", location: null, status: "active", cost_level: "high", where_implemented: "Kraków, Tarnów", tags: ["niepełnosprawność", "dostępność", "DPS"], age: 48 },
    { id: 11, title: "Kawiarenka integracyjna", short_desc: "Zatrudnienie wspomagane osób z niepełnosprawnościami w lokalu gastronomicznym", category: "rynek pracy", target_group: "osoby z niepełnosprawnościami", location: "Kraków", status: "archived", cost_level: "high", where_implemented: "Kraków (projekt zakończony 2023)", tags: ["rynek_pracy", "niepełnosprawność", "NGO"], age: 20 },
  ];
  return rows.map(({ age, ...row }) => ({ ...row, created_at: daysAgo(age), updated_at: daysAgo(age) }));
}

export function seedUsers(): AdminUser[] {
  const rows: Array<[string, Role]> = [
    ["Anna Kowalczyk", "admin"],
    ["Marek Zieliński", "consultant"],
    ["Katarzyna Nowak", "tester"],
    ["Piotr Wiśniewski", "user"],
    ["Fundacja Wspólna Gmina", "user"],
    ["Ewa Mazur", "tester"],
    ["Tomasz Lis", "user"],
    ["Magdalena Wójcik", "user"],
    ["GOPS Słomniki", "user"],
  ];
  return rows.map(([name, role], index) => ({
    id: index + 1,
    name,
    role,
    created_at: daysAgo(30 - index * 2),
    tester_pending: index === 6 || index === 7,
  }));
}

export function seedTesters(): AdminTester[] {
  return [
    { id: 3, user_id: 7, name: "Tomasz Lis", email: "tomasz.lis@example.pl", organization: "Koło Gospodyń Wiejskich Racławice", expertise: "aktywizacja lokalna", approved: false, created_at: daysAgo(8) },
    { id: 4, user_id: 8, name: "Magdalena Wójcik", email: "magdalena.wojcik@example.pl", organization: "Uniwersytet Trzeciego Wieku Tarnów", expertise: "edukacja dorosłych", approved: false, created_at: daysAgo(6) },
    { id: 1, user_id: 3, name: "Katarzyna Nowak", email: "katarzyna.nowak@example.pl", organization: "Stowarzyszenie Seniorzy w Akcji", expertise: "usługi dla seniorów", approved: true, created_at: daysAgo(12) },
    { id: 2, user_id: 6, name: "Ewa Mazur", email: "ewa.mazur@example.pl", organization: "OPS Bochnia", expertise: "pomoc społeczna", approved: true, created_at: daysAgo(10) },
  ];
}

export function seedTrends(): AdminTrends {
  const counts = [4, 6, 5, 7, 6, 8, 7, 9, 8, 11, 10, 12, 13, 15];
  return {
    top_tags: [
      { tag: "seniorzy", count: 58 },
      { tag: "samotność", count: 31 },
      { tag: "transport", count: 24 },
      { tag: "wykluczenie_cyfrowe", count: 22 },
      { tag: "gmina_wiejska", count: 20 },
      { tag: "dostępność", count: 17 },
      { tag: "zdrowie_psychiczne", count: 12 },
      { tag: "młodzież", count: 12 },
      { tag: "edukacja", count: 11 },
      { tag: "dzieci", count: 9 },
    ],
    top_queries: [
      { query: "samotny senior na wsi, nikt go nie odwiedza", count: 26 },
      { query: "brak transportu do lekarza", count: 21 },
      { query: "babcia nie umie obsługiwać telefonu", count: 19 },
      { query: "młodzież w kryzysie psychicznym", count: 12 },
      { query: "dzieci po lekcjach nie mają gdzie iść", count: 9 },
    ],
    zero_result_queries: [
      { query: "uzależnienie od alkoholu w gminie", count: 5 },
      { query: "bezdomność zimą", count: 4 },
    ],
    by_day: counts.map((count, index) => ({ date: daysAgo(13 - index).slice(0, 10), count })),
    total: counts.reduce((sum, value) => sum + value, 0),
    change_pct: 52.4,
  };
}
