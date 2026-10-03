// Klient API Biblioteki (find_inv_server/app/routers/knowledge.py, A3). Działa też w komponentach serwerowych.

import type { InnovationSummary } from "@/components/rops-innovation-card";
import { API_URL } from "@/lib/matchmaking-api";

export type InnovationPage = {
  innovations: InnovationSummary[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchInnovations(params: {
  search?: string;
  tags?: string[];
  limit: number;
  offset: number;
}): Promise<InnovationPage> {
  const query = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  if (params.search) query.set("search", params.search);
  if (params.tags?.length) query.set("tags", params.tags.join(","));

  const response = await fetch(`${API_URL}/api/innovations?${query}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as { data: InnovationPage | null; error: string | null };
  if (body.error || !body.data) throw new Error(body.error ?? "Pusta odpowiedź");
  return body.data;
}
