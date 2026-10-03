// Dane do stron bez backendu: Kreator pomysłów, Tester innowacji, Forum.
// Wzorowane na find_inv_server/data/mock_data.py. Osoby i wpisy są fikcyjne.

// ---------- Role (te same wartości co w tabeli users w backendzie) ----------

export type Role = "user" | "tester" | "consultant" | "admin";

export const ROLES: Array<{ value: Role; label: string; description: string }> = [
  { value: "user", label: "Mieszkaniec", description: "Szukasz rozwiązania problemu albo zgłaszasz pomysł." },
  { value: "tester", label: "Tester", description: "Sprawdzasz innowacje w praktyce i dajesz informację zwrotną." },
  { value: "consultant", label: "Konsultant", description: "Doradzasz na forum jako ekspert." },
  { value: "admin", label: "Admin", description: "Pracujesz w ROPS i zarządzasz Biblioteką." },
];

export const ROLE_LABELS: Record<Role, string> = {
  user: "Mieszkaniec",
  tester: "Tester",
  consultant: "Konsultant",
  admin: "Admin",
};

// ---------- Taksonomia tagów (kopia TAXONOMY_TAGS z app/utils.py) ----------

export const TAXONOMY_TAGS = [
  "seniorzy", "wykluczenie_cyfrowe", "samotność", "zdrowie_psychiczne",
  "niepełnosprawność", "ubóstwo", "dzieci", "młodzież", "rodzina",
  "bezdomność", "uzależnienia", "migranci", "wolontariat", "edukacja",
  "rynek_pracy", "dostępność", "transport", "gmina_wiejska", "gmina_miejska",
  "NGO", "samorząd", "DPS", "OPS", "CUS", "inkubator",
] as const;

export type Tag = (typeof TAXONOMY_TAGS)[number];

export const TAG_LABELS: Record<Tag, string> = {
  seniorzy: "Seniorzy",
  wykluczenie_cyfrowe: "Wykluczenie cyfrowe",
  samotność: "Samotność",
  zdrowie_psychiczne: "Zdrowie psychiczne",
  niepełnosprawność: "Niepełnosprawność",
  ubóstwo: "Ubóstwo",
  dzieci: "Dzieci",
  młodzież: "Młodzież",
  rodzina: "Rodzina",
  bezdomność: "Bezdomność",
  uzależnienia: "Uzależnienia",
  migranci: "Migranci",
  wolontariat: "Wolontariat",
  edukacja: "Edukacja",
  rynek_pracy: "Rynek pracy",
  dostępność: "Dostępność",
  transport: "Transport",
  gmina_wiejska: "Gmina wiejska",
  gmina_miejska: "Gmina miejska",
  NGO: "Organizacja pozarządowa",
  samorząd: "Samorząd",
  DPS: "Dom pomocy społecznej",
  OPS: "Ośrodek pomocy społecznej",
  CUS: "Centrum usług społecznych",
  inkubator: "Inkubator innowacji",
};

/** Grupy tagów w kreatorze, żeby 25 przycisków nie było jedną ścianą. */
export const TAG_GROUPS: Array<{ title: string; tags: Tag[] }> = [
  {
    title: "Dla kogo",
    tags: ["seniorzy", "dzieci", "młodzież", "rodzina", "niepełnosprawność", "migranci"],
  },
  {
    title: "Jaki problem",
    tags: [
      "samotność", "wykluczenie_cyfrowe", "zdrowie_psychiczne", "ubóstwo", "bezdomność",
      "uzależnienia", "transport", "rynek_pracy", "edukacja", "dostępność",
    ],
  },
  {
    title: "Gdzie i kto realizuje",
    tags: ["gmina_wiejska", "gmina_miejska", "NGO", "samorząd", "OPS", "DPS", "CUS", "wolontariat", "inkubator"],
  },
];

/** Udawany autotagger kreatora: słowa kluczowe → tagi z taksonomii. */
export const TAG_KEYWORDS: Array<[RegExp, Tag]> = [
  [/senior|starsz|emeryt/, "seniorzy"],
  [/samotn|osamotn/, "samotność"],
  [/internet|smartfon|komputer|cyfrow|online/, "wykluczenie_cyfrowe"],
  [/depresj|psychi|kryzys|stres/, "zdrowie_psychiczne"],
  [/niepełnospr|wózk|niewidom|niesłysz/, "niepełnosprawność"],
  [/ubóst|bied|głod/, "ubóstwo"],
  [/dzieci|dziecko|przedszkol/, "dzieci"],
  [/młodzież|nastolat|uczni|szkoł/, "młodzież"],
  [/rodzin|rodzic/, "rodzina"],
  [/bezdomn/, "bezdomność"],
  [/uzależn|alkohol|narkot/, "uzależnienia"],
  [/migrant|uchodź|cudzoziem/, "migranci"],
  [/wolontar|sąsiedz|sąsiad/, "wolontariat"],
  [/edukac|kurs|szkoleni|warsztat/, "edukacja"],
  [/zatrudn|bezrobot|praca|pracy/, "rynek_pracy"],
  [/dostępn|barier/, "dostępność"],
  [/transport|dojazd|dojecha|autobus|\bbus/, "transport"],
  [/\bwieś|\bwsi\b|wiejsk/, "gmina_wiejska"],
  [/miast|osiedl/, "gmina_miejska"],
  [/fundacj|stowarzysz|\bngo\b|organizacj/, "NGO"],
  [/gmin|urząd|urzęd|samorząd/, "samorząd"],
  [/\bdps\b|dom pomocy/, "DPS"],
  [/\b[mg]?ops\b|ośrodek pomocy/, "OPS"],
  [/\bcus\b|centrum usług/, "CUS"],
];

/** Kto jest odbiorcą, gdy tag mówi o grupie osób. */
export const TARGET_GROUP_LABELS: Partial<Record<Tag, string>> = {
  seniorzy: "seniorzy 65+",
  dzieci: "dzieci",
  młodzież: "młodzież",
  rodzina: "rodziny",
  niepełnosprawność: "osoby z niepełnosprawnościami",
  migranci: "migranci i uchodźcy",
  bezdomność: "osoby w kryzysie bezdomności",
  uzależnienia: "osoby z uzależnieniami i ich bliscy",
};

// ---------- Tester innowacji ----------

export const TESTER_SPECIALIZATIONS = [
  "Pomoc społeczna",
  "Opieka nad seniorami",
  "Edukacja i praca z młodzieżą",
  "Zdrowie psychiczne",
  "Niepełnosprawność i dostępność",
  "Technologie cyfrowe",
  "Organizacja pozarządowa",
  "Administracja samorządowa",
  "Inna",
] as const;

// ---------- Forum ----------

export type ForumPost = {
  id: number;
  parent_id: number | null;
  /** Tylko wątki (parent_id === null) mają tytuł. */
  title?: string;
  content: string;
  author_name: string;
  badge: Role;
  /** Czas lokalny (Europa/Warszawa), bez strefy, jak w mock_data.py. */
  created_at: string;
};

export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: 1,
    parent_id: null,
    title: "Partner do projektu dla seniorów",
    content: "Szukam partnera do realizacji projektu dla seniorów w powiecie krakowskim.",
    author_name: "Anna K.",
    badge: "consultant",
    created_at: "2026-10-03T11:00:00",
  },
  {
    id: 2,
    parent_id: 1,
    content: "Jesteśmy NGO z Wieliczki, chętnie porozmawiamy!",
    author_name: "Jan W.",
    badge: "user",
    created_at: "2026-10-03T11:15:00",
  },
  {
    id: 3,
    parent_id: 1,
    content:
      "Warto zajrzeć do karty „Sąsiedzka Pomoc” w Bibliotece. Gminy z powiatu krakowskiego mają już gotowy regulamin dla wolontariuszy.",
    author_name: "Zespół ROPS",
    badge: "admin",
    created_at: "2026-10-03T11:40:00",
  },
  {
    id: 4,
    parent_id: null,
    title: "Jak przekonać radę gminy do busa na telefon?",
    content:
      "Mamy w gminie dużo osób starszych bez samochodu. Chcemy zaproponować bus na telefon, ale radni boją się kosztów. Czy ktoś ma wyliczenia z innej gminy?",
    author_name: "Marta P.",
    badge: "user",
    created_at: "2026-10-02T09:20:00",
  },
  {
    id: 5,
    parent_id: 4,
    content:
      "Testowałem ten model w dwóch gminach. Najlepiej działa porównanie z kosztem stałej linii: przy kilku kursach dziennie bus na telefon wychodzi taniej. Mogę podesłać arkusz.",
    author_name: "Piotr S.",
    badge: "tester",
    created_at: "2026-10-02T10:05:00",
  },
  {
    id: 6,
    parent_id: 4,
    content:
      "Dobrym argumentem jest też pilotaż na 3 miesiące. Rada głosuje wtedy nad małą kwotą, a decyzję o dalszym finansowaniu podejmuje po wynikach.",
    author_name: "Anna K.",
    badge: "consultant",
    created_at: "2026-10-02T12:30:00",
  },
  {
    id: 7,
    parent_id: null,
    title: "Kurs smartfona dla seniorów – ile osób w grupie?",
    content:
      "Startujemy z kursem w bibliotece gminnej. Ile osób przyjmować do jednej grupy, żeby prowadzący zdążył pomóc każdemu?",
    author_name: "Katarzyna L.",
    badge: "user",
    created_at: "2026-10-01T16:45:00",
  },
  {
    id: 8,
    parent_id: 7,
    content: "Z naszych testów: maksymalnie 6 osób na jednego prowadzącego i najlepiej każdy z własnym telefonem.",
    author_name: "Piotr S.",
    badge: "tester",
    created_at: "2026-10-01T18:10:00",
  },
];
