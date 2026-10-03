import { apiFetch } from "@/lib/api";
import {
  MOCK_CHALLENGES,
  MOCK_GAP_INDEX,
  MOCK_INNOVATIONS,
  MOCK_STATS_MALOPOLSKA,
  type Challenge,
  type GapEntry,
  type InnovationCard,
  type MalopolskaStats,
} from "@/data/innovations";

// Zasobnik wiedzy (Agent 3): GET /api/innovations z wyszukiwaniem i filtrami.
// Bez backendu filtrujemy dane mock tak samo: tekst w tytule i opisie, wszystkie wybrane tagi.

export type InnovationQuery = {
  search?: string;
  tags?: string[];
  cost?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
};

export type InnovationList = { innovations: InnovationCard[]; total: number };

function localList({ search = "", tags = [], cost, includeArchived, limit = 20, offset = 0 }: InnovationQuery) {
  const needle = search.trim().toLowerCase();
  const filtered = MOCK_INNOVATIONS.filter((innovation) => {
    if (!includeArchived && innovation.status === "archived") return false;
    if (cost && innovation.cost_level !== cost) return false;
    if (tags.length && !tags.every((tag) => innovation.tags.includes(tag as never))) return false;
    if (!needle) return true;
    return `${innovation.title} ${innovation.short_desc} ${innovation.full_desc} ${innovation.target_group}`
      .toLowerCase()
      .includes(needle);
  });
  return { innovations: filtered.slice(offset, offset + limit), total: filtered.length };
}

export async function listInnovations(query: InnovationQuery = {}): Promise<InnovationList> {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.tags?.length) params.set("tags", query.tags.join(","));
  if (query.cost) params.set("cost_level", query.cost);
  params.set("limit", String(query.limit ?? 20));
  params.set("offset", String(query.offset ?? 0));

  try {
    const result = await apiFetch<InnovationList | InnovationCard[]>(`/api/innovations?${params}`);
    // Backend może zwrócić samą listę albo { innovations, total }. Filtr `status` w API to dokładne dopasowanie,
    // więc archiwalne odfiltrowujemy tutaj.
    const list = Array.isArray(result) ? result : (result.innovations ?? []);
    const innovations = query.includeArchived ? list : list.filter((item) => item.status !== "archived");
    const total = Array.isArray(result) ? list.length : (result.total ?? list.length);
    return { innovations, total: total - (list.length - innovations.length) };
  } catch {
    return localList(query);
  }
}

// ---------- Kondycja Małopolski i Indeks Luki Innowacyjnej ----------

export async function getStats(): Promise<MalopolskaStats> {
  try {
    return await apiFetch<MalopolskaStats>("/api/stats/malopolska");
  } catch {
    return MOCK_STATS_MALOPOLSKA;
  }
}

export async function getGapIndex(): Promise<GapEntry[]> {
  try {
    const result = await apiFetch<GapEntry[]>("/api/innovation-gap");
    return Array.isArray(result) && result.length ? result : MOCK_GAP_INDEX;
  } catch {
    return MOCK_GAP_INDEX;
  }
}

export type GminaPulse = { powiat: string; top_challenges: Challenge[]; matching_innovations: InnovationCard[] };

/** „Puls powiatu”: najważniejsze wyzwania i pasujące innowacje (GET /api/gmina-pulse/{powiat}). */
export async function getPulse(powiat: string, topArea: string): Promise<GminaPulse> {
  try {
    // Backend A3 zwraca `innovations`, plan API mówi `matching_innovations` — przyjmujemy oba.
    const result = await apiFetch<Partial<GminaPulse> & { innovations?: InnovationCard[] }>(
      `/api/gmina-pulse/${encodeURIComponent(powiat)}`,
    );
    return {
      powiat: result.powiat ?? powiat,
      top_challenges: result.top_challenges ?? [],
      matching_innovations: result.matching_innovations ?? result.innovations ?? [],
    };
  } catch {
    const area = topArea.toLowerCase();
    const matching = MOCK_INNOVATIONS.filter(
      (innovation) =>
        `${innovation.category} ${innovation.area} ${innovation.short_desc}`.toLowerCase().includes(area) ||
        innovation.tags.some((tag) => area.includes(tag.replace(/_/g, " "))),
    );
    return {
      powiat,
      top_challenges: MOCK_CHALLENGES.filter((challenge) => challenge.powiat === powiat).slice(0, 3),
      matching_innovations: (matching.length ? matching : MOCK_INNOVATIONS).slice(0, 3),
    };
  }
}
