// Generator wniosków grantowych: wzory naborów (GET /api/grants) i wypełnianie z fiszki (POST /api/grants/fill).
// Fiszka z kreatora czeka w sessionStorage, żeby „Napisz wniosek” w kreatorze przeniósł ją na /wnioski.

import { apiFetch, apiPost } from "@/lib/api";
import type { IdeaDraft } from "@/lib/ideas";

export type GrantSection = { id: string; label: string; hint: string; max_chars: number };

export type Grant = {
  id: string;
  name: string;
  organizer: string;
  description: string;
  source_url: string | null;
  sections: GrantSection[];
};

export type GrantFill = {
  grant_id: string;
  sections: Record<string, string>;
  missing: string[];
  source: "llm" | "rules";
};

export const getGrants = () => apiFetch<Grant[]>("/api/grants");

/** `idea` to fiszka z kreatora albo wklejony opis pomysłu. */
export function fillGrant(grantId: string, idea: IdeaDraft | string) {
  const payload =
    typeof idea === "string"
      ? idea
      : {
          title: idea.title,
          short_desc: idea.shortDesc,
          essence: idea.essence,
          problem: idea.problem,
          for_whom: idea.forWhom,
          place: idea.place,
          stage: idea.stage,
          budget: idea.budget,
          partners: idea.partners,
          tags: idea.tags,
        };
  return apiPost<GrantFill>("/api/grants/fill", { grant_id: grantId, idea: payload });
}

export const STORED_IDEA = "hubmi:fiszka";

export function storeIdea(draft: IdeaDraft) {
  try {
    sessionStorage.setItem(STORED_IDEA, JSON.stringify(draft));
  } catch {
    // Prywatne okno albo zablokowany storage — wniosek da się uzupełnić z wklejonego tekstu.
  }
}

export function readStoredRaw(): string | null {
  try {
    return sessionStorage.getItem(STORED_IDEA);
  } catch {
    return null;
  }
}

export function parseStoredIdea(raw: string | null): IdeaDraft | null {
  try {
    const parsed = raw ? (JSON.parse(raw) as IdeaDraft) : null;
    return parsed && typeof parsed.title === "string" && typeof parsed.essence === "string" ? parsed : null;
  } catch {
    return null;
  }
}
