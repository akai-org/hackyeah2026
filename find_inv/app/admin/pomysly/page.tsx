"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Download, Paperclip, Tag, X } from "lucide-react";
import { API_URL, apiFetch, apiPost, readSessionCookie } from "@/lib/api";
import { formatSize } from "@/lib/ideas";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import { LOCALE_TAGS } from "@/lib/i18n/config";

interface Attachment {
  id: number;
  filename: string;
  size: number;
}

/** Pobranie przez fetch z nagłówkiem admina — zwykły link nie wysłałby autoryzacji do API. */
async function downloadAttachment(ideaId: number, attachment: Attachment) {
  const headers = new Headers({ "X-Dev-Admin": "true" });
  const session = readSessionCookie();
  if (session) headers.set("X-Session-Token", session);
  const response = await fetch(`${API_URL}/api/admin/ideas/${ideaId}/attachments/${attachment.id}`, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface Idea {
  id: number;
  title: string;
  essence: string;
  for_whom: string | null;
  short_desc?: string | null;
  place?: string | null;
  stage?: string | null;
  budget?: string | null;
  partners?: string | null;
  attachments?: Attachment[];
  tags: string[];
  author_name: string | null;
  author_email: string | null;
  status: "pending" | "reviewed" | "rejected";
  created_at: string | null;
}

const STATUS_CLASS: Record<string, string> = {
  pending: "border-accent bg-accent text-accent-foreground",
  reviewed: "border-success bg-success/10 text-success",
  rejected: "border-border bg-background text-muted",
};

export default function PomyslyPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filter, setFilter] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const { locale, t } = useI18n();
  const ai = t.admin.ideas;

  function load() {
    const params = filter ? `?status=${filter}` : "";
    apiFetch<Idea[]>(`/api/admin/ideas${params}`, { headers: { "X-Dev-Admin": "true" } })
      .then((d) => setIdeas(d ?? []))
      .catch(() => {});
  }

  useEffect(load, [filter]);

  async function setStatus(id: number, status: "reviewed" | "rejected") {
    setPending(id);
    try {
      await apiPost(`/api/admin/ideas/${id}/status`, { status });
      setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    } finally {
      setPending(null);
    }
  }

  const counts = {
    all: ideas.length,
    pending: ideas.filter((i) => i.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary">{ai.title}</h1>
        <p className="text-sm text-muted">{ai.newCount(counts.pending)}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { value: "", label: ai.filters.all },
          { value: "pending", label: ai.filters.pending },
          { value: "reviewed", label: ai.filters.reviewed },
          { value: "rejected", label: ai.filters.rejected },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-ui border-(length:--bw) border-border px-4 py-2 text-sm font-bold",
              filter === value ? "bg-primary text-primary-foreground" : "bg-surface text-primary hover:bg-primary/10",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {ideas.length === 0 ? (
        <p className="py-12 text-center text-muted">{ai.empty}</p>
      ) : (
        <ul className="space-y-4">
          {ideas.map((idea) => {
            const badge = { label: ai.status[idea.status], className: STATUS_CLASS[idea.status] };
            const date = idea.created_at
              ? new Date(idea.created_at).toLocaleDateString(LOCALE_TAGS[locale], { day: "numeric", month: "short", year: "numeric" })
              : "—";
            return (
              <li key={idea.id} className="rounded-ui border-(length:--bw) border-border bg-surface p-5 shadow-raised">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border border-border px-2 py-0.5 text-xs font-bold", badge.className)}>
                        {badge.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="size-3" aria-hidden="true" />
                        {date}
                      </span>
                    </div>
                    <h2 className="mt-2 font-bold text-primary">{idea.title}</h2>
                    {idea.short_desc && <p className="mt-1 text-sm font-bold">{idea.short_desc}</p>}
                    <p className="mt-1 whitespace-pre-line text-sm">{idea.essence}</p>
                    <dl className="mt-2 grid gap-x-3 gap-y-0.5 text-sm sm:grid-cols-[8rem_1fr]">
                      {([
                        [ai.fields.forWhom, idea.for_whom],
                        [ai.fields.place, idea.place],
                        [ai.fields.stage, idea.stage],
                        [ai.fields.budget, idea.budget],
                        [ai.fields.partners, idea.partners],
                      ] as const)
                        .filter(([, value]) => value)
                        .map(([label, value]) => (
                          <div key={label} className="contents">
                            <dt className="text-muted">{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                    </dl>
                    {idea.attachments && idea.attachments.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2" aria-label={ai.attachments(idea.title)}>
                        {idea.attachments.map((attachment) => (
                          <li key={attachment.id}>
                            <button
                              type="button"
                              onClick={() => downloadAttachment(idea.id, attachment).catch(() => alert(ai.downloadFailed))}
                              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-ui border-2 border-border bg-background px-3 text-sm hover:bg-secondary/60"
                            >
                              <Paperclip className="size-4" aria-hidden="true" />
                              {attachment.filename}
                              <span className="text-muted">({formatSize(attachment.size)})</span>
                              <Download className="size-4" aria-hidden="true" />
                              <span className="sr-only">{ai.download}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {idea.tags.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={ai.tags}>
                        {idea.tags.map((tag) => (
                          <li key={tag} className="inline-flex items-center gap-1 rounded-full border border-primary bg-background px-2 py-0.5 text-xs text-primary">
                            <Tag className="size-2.5" aria-hidden="true" />
                            {t.tags[tag] ?? tag}
                          </li>
                        ))}
                      </ul>
                    )}
                    {idea.author_name && (
                      <p className="mt-2 text-xs text-muted">
                        {ai.submittedBy(idea.author_name)}{idea.author_email ? ` (${idea.author_email})` : ""}
                      </p>
                    )}
                  </div>
                  {idea.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setStatus(idea.id, "reviewed")}
                        disabled={pending === idea.id}
                        aria-label={ai.markReviewed(idea.title)}
                        title={ai.reviewed}
                        className="inline-flex size-9 items-center justify-center rounded-ui border-(length:--bw) border-border bg-surface text-success hover:bg-success/10 disabled:opacity-40"
                      >
                        <CheckCircle className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setStatus(idea.id, "rejected")}
                        disabled={pending === idea.id}
                        aria-label={ai.rejectLabel(idea.title)}
                        title={ai.reject}
                        className="inline-flex size-9 items-center justify-center rounded-ui border-(length:--bw) border-border bg-surface text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
