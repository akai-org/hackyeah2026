// Kreator pomysłów: analiza opisu na pola fiszki, zapis fiszki i załączniki.
// POST /api/ideas/analyze (LLM albo reguły na backendzie) → fiszka do poprawienia → POST /api/ideas → pliki.

import { API_URL, apiPost, readSessionCookie } from "@/lib/api";
import { TAG_KEYWORDS, TARGET_GROUP_LABELS, TAXONOMY_TAGS, type Tag } from "@/data/mock";

export const STAGES = [
  "Pomysł, przed pilotażem",
  "Przygotowanie do wdrożenia",
  "Pilotaż",
  "Działa, szukamy rozszerzenia",
] as const;

export type IdeaDraft = {
  title: string;
  shortDesc: string;
  essence: string;
  /** Tylko z asystenta krok po kroku — w opisie swobodnym zostaje pusty. */
  problem: string;
  forWhom: string;
  place: string;
  stage: string;
  budget: string;
  partners: string;
  tags: Tag[];
  suggestedTags: Tag[];
};

type AnalysisResponse = {
  title: string;
  short_desc: string;
  essence: string;
  for_whom: string;
  place: string;
  stage: string;
  budget: string;
  partners: string;
  tags: string[];
  suggested_tags: string[];
};

const KNOWN_TAGS = new Set<string>(TAXONOMY_TAGS);
const onlyTags = (tags: string[]) => tags.filter((tag): tag is Tag => KNOWN_TAGS.has(tag));

export async function analyzeIdea(text: string, chosen: Tag[]): Promise<IdeaDraft> {
  try {
    const result = await apiPost<AnalysisResponse>("/api/ideas/analyze", { text, tags: chosen });
    return {
      title: result.title,
      shortDesc: result.short_desc,
      essence: result.essence,
      problem: "",
      forWhom: result.for_whom,
      place: result.place,
      stage: result.stage,
      budget: result.budget,
      partners: result.partners,
      tags: onlyTags(result.tags),
      suggestedTags: onlyTags(result.suggested_tags),
    };
  } catch (error) {
    console.error(error);
    return analyzeLocally(text, chosen);
  }
}

/** Zapas bez backendu: słowa kluczowe i pierwsze zdanie, jak w pierwszej wersji Kreatora. */
function analyzeLocally(text: string, chosen: Tag[]): IdeaDraft {
  const clean = text.replace(/\s+/g, " ").trim();
  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0] ?? clean;
  const words = firstSentence.replace(/[.!?]+$/, "").split(" ");
  const title = words.slice(0, 9).join(" ");
  const suggested = TAG_KEYWORDS.filter(([pattern]) => pattern.test(clean.toLowerCase()))
    .map(([, tag]) => tag)
    .filter((tag) => !chosen.includes(tag));
  const tags = [...chosen, ...suggested];
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1) + (words.length > 9 ? "…" : ""),
    shortDesc: firstSentence.slice(0, 160),
    essence: clean.slice(0, 700),
    problem: "",
    forWhom: [...new Set(tags.map((tag) => TARGET_GROUP_LABELS[tag]).filter(Boolean))].join(", "),
    place: tags.includes("gmina_wiejska") ? "gmina wiejska" : tags.includes("gmina_miejska") ? "miasto" : "",
    stage: STAGES[0],
    budget: "",
    partners: "",
    tags,
    suggestedTags: suggested,
  };
}

export async function saveIdea(draft: IdeaDraft, authorName: string | null) {
  const essence = draft.problem.trim() ? `${draft.essence.trim()}\n\nProblem: ${draft.problem.trim()}` : draft.essence;
  return apiPost<{ id: number | null; upload_token?: string; message: string }>("/api/ideas", {
    title: draft.title.trim(),
    essence: essence.trim(),
    for_whom: draft.forWhom.trim() || null,
    short_desc: draft.shortDesc.trim() || null,
    place: draft.place.trim() || null,
    stage: draft.stage || null,
    budget: draft.budget.trim() || null,
    partners: draft.partners.trim() || null,
    tags: draft.tags,
    author_name: authorName,
  });
}

// ---------- Załączniki ----------

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".odt", ".rtf", ".txt",
  ".xls", ".xlsx", ".ods", ".ppt", ".pptx", ".odp",
  ".jpg", ".jpeg", ".png", ".webp",
]; // prettier-ignore

/** Komunikat, jeśli plik nie przejdzie walidacji backendu — sprawdzamy przed wysłaniem. */
/** Kod problemu z plikiem (type, empty, size) — tekst dla użytkownika daje słownik i18n. */
export function fileProblem(file: File): "type" | "empty" | "size" | null {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) return "type";
  if (file.size === 0) return "empty";
  if (file.size > MAX_FILE_BYTES) return "size";
  return null;
}

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export async function uploadAttachment(ideaId: number, uploadToken: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  const headers = new Headers({ "X-Upload-Token": uploadToken });
  const session = readSessionCookie();
  if (session) headers.set("X-Session-Token", session);
  const response = await fetch(`${API_URL}/api/ideas/${ideaId}/attachments`, { method: "POST", body, headers });
  if (!response.ok) {
    const detail = await response.json().then((json) => json?.detail as string | undefined).catch(() => undefined);
    throw new Error(detail ?? `HTTP ${response.status}`);
  }
}

// ---------- Opis z PDF-u ----------

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export type PdfText = { text: string; pages: number; truncated: boolean };

/** Tekst z PDF-u (POST /api/ideas/extract-pdf). Rzuca Error z kodem (pdf_type, pdf_size, offline, read_failed — tłumaczy UI) albo komunikatem z backendu. */
export async function extractPdfText(file: File): Promise<PdfText> {
  if (!file.name.toLowerCase().endsWith(".pdf")) throw new Error("pdf_type");
  if (file.size > MAX_PDF_BYTES) throw new Error("pdf_size");
  const body = new FormData();
  body.append("file", file);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/ideas/extract-pdf`, { method: "POST", body });
  } catch {
    throw new Error("offline");
  }
  const json = (await response.json().catch(() => null)) as { data: PdfText | null; error: string | null } | null;
  if (!response.ok || !json?.data) throw new Error(json?.error ?? "read_failed");
  return json.data;
}
