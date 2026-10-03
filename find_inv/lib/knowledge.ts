import { apiFetch } from "@/lib/api";
import { MOCK_INNOVATIONS, type InnovationCard } from "@/data/innovations";

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
  if (!query.includeArchived) params.set("status", "active,unmaintained");
  params.set("limit", String(query.limit ?? 20));
  params.set("offset", String(query.offset ?? 0));

  try {
    const result = await apiFetch<InnovationList | InnovationCard[]>(`/api/innovations?${params}`);
    // Backend może zwrócić samą listę albo { innovations, total }.
    if (Array.isArray(result)) return { innovations: result, total: result.length };
    return { innovations: result.innovations ?? [], total: result.total ?? result.innovations?.length ?? 0 };
  } catch {
    return localList(query);
  }
}
