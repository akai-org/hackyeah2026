export type ForumBadge = "user" | "tester" | "admin" | "consultant";

export interface ForumPost {
  id: number;
  parentId: number | null;
  content: string;
  authorName: string;
  badge: ForumBadge;
  createdAt: string;
}

export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: 1,
    parentId: null,
    content: "Szukam partnera do realizacji projektu dla seniorów w powiecie krakowskim. Mamy już finansowanie, szukamy doświadczonej NGO.",
    authorName: "Anna K.",
    badge: "consultant",
    createdAt: "2026-10-03T11:00:00",
  },
  {
    id: 2,
    parentId: 1,
    content: "Jesteśmy NGO z Wieliczki, działamy z seniorami od 10 lat. Chętnie porozmawiamy!",
    authorName: "Jan W.",
    badge: "user",
    createdAt: "2026-10-03T11:15:00",
  },
  {
    id: 3,
    parentId: null,
    content: "Testowałem program Cyfrowy Senior w Nowym Sączu — wyniki są bardzo obiecujące. Mogę podzielić się raportem.",
    authorName: "Piotr M.",
    badge: "tester",
    createdAt: "2026-10-03T12:00:00",
  },
  {
    id: 4,
    parentId: 3,
    content: "Proszę o kontakt! Rozważamy wdrożenie tego programu w naszej gminie.",
    authorName: "Maria Z.",
    badge: "user",
    createdAt: "2026-10-03T12:30:00",
  },
  {
    id: 5,
    parentId: null,
    content: "Przypominam o aktualizacji wpisów w Bibliotece — kilka innowacji ma nieaktualne dane kontaktowe.",
    authorName: "Admin ROPS",
    badge: "admin",
    createdAt: "2026-10-03T13:00:00",
  },
];

export const TAXONOMY_TAGS = [
  "seniorzy", "wykluczenie_cyfrowe", "samotność", "zdrowie_psychiczne",
  "niepełnosprawność", "ubóstwo", "dzieci", "młodzież", "rodzina",
  "bezdomność", "uzależnienia", "migranci", "wolontariat", "edukacja",
  "rynek_pracy", "dostępność", "transport", "gmina_wiejska", "gmina_miejska",
  "NGO", "samorząd", "DPS", "OPS", "CUS", "inkubator",
];
