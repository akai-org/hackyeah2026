"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CircleCheck,
  CircleHelp,
  Clock,
  FlaskConical,
  Link2,
  MapPin,
  Tag,
  TrendingUp,
  Users,
  ExternalLink,
  FileText,
  PlayCircle,
  ChevronRight,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { MiddlemanModal } from "@/components/middleman-modal";
import { TesterApplyModal } from "@/components/tester-apply-modal";
import { ForumThread } from "@/components/forum-thread";
import { Toast, useToast } from "@/components/toast";
import { TestRequestBox } from "@/components/test-request";
import { PageBackdrop } from "@/components/page-backdrop";
import { BackendInnovationCard, type BackendInnovation } from "@/components/backend-innovation-card";
import { TAG_LABELS } from "@/data/mock";

const COST_LABEL: Record<string, string> = {
  low: "Niski koszt",
  medium: "Średni koszt",
  high: "Wysoki koszt",
};

interface DetailInnovation extends BackendInnovation {
  full_desc?: string;
  implementation_time_months?: number;
  // pola z Biblioteki Innowacji ROPS (A3) — mogą nie występować
  video_url?: string | null;
  materials_url?: string | null;
  authors?: string | null;
  project?: string | null;
}

interface DescSection {
  heading: string | null;
  paragraphs: string[];
}

// Opisy ROPS mają bloki "Na czym polega: …\n\nProblem: …" — rozbijamy je na sekcje z nagłówkami.
function parseDescription(text: string): DescSection[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const m = block.match(/^([^:\n]{3,40}):\s*([\s\S]*)$/);
      const body = m ? m[2] : block;
      return {
        heading: m ? m[1] : null,
        paragraphs: body.split("\n").map((p) => p.trim()).filter(Boolean),
      };
    });
}

export default function InnovationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [item, setItem] = useState<DetailInnovation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [middlemanOpen, setMiddlemanOpen] = useState(false);
  const [similar, setSimilar] = useState<BackendInnovation[]>([]);
  const [copied, setCopied] = useState(false);

  const toast = useToast();
  const [testerModalOpen, setTesterModalOpen] = useState(false);
  const [testerStatus, setTesterStatus] = useState<"none" | "pending">("none");
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestSaved, setInterestSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    try {
      const saved = localStorage.getItem(`hubmi-tester-${id}`);
      if (saved) setTesterStatus("pending");
      const interest = localStorage.getItem(`hubmi-interest-${id}`);
      if (interest) setInterestSaved(true);
    } catch {
      // localStorage unavailable
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    apiFetch<DetailInnovation>(`/api/innovations/${id}`)
      .then((data) => {
        setItem(data);
        if (data?.title) document.title = `${data.title} – HubMI`;
        if (data?.tags?.length) {
          const tagsParam = data.tags.slice(0, 3).join(",");
          // API zwraca { innovations, total }; goła lista ze starszego backendu też działa.
          apiFetch<BackendInnovation[] | { innovations: BackendInnovation[] }>(
            `/api/innovations?tags=${encodeURIComponent(tagsParam)}&limit=4`,
          )
            .then((result) => {
              const all = Array.isArray(result) ? result : (result?.innovations ?? []);
              setSimilar(all.filter((i) => i.id !== id).slice(0, 3));
            })
            .catch(() => {});
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => { document.title = "HubMI – znajdź rozwiązanie, które już działa"; };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-ui bg-sage" />
        <div className="mt-8 h-96 animate-pulse rounded-ui bg-sage" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <p className="text-lg text-alert">Nie znaleziono innowacji.</p>
        <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
          <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
          Wróć do biblioteki
        </Link>
      </div>
    );
  }

  return (
    <PageBackdrop layout="gutters">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
        <Link
          href="/biblioteka"
          className="inline-flex items-center gap-2 text-sm font-bold text-leaf underline underline-offset-4 hover:text-deep"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Biblioteka innowacji
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main */}
          <article>
            {item.is_unmaintained && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-ui border-2 border-muted bg-paper px-3 py-1.5 text-sm text-muted">
                <CircleHelp className="size-4" aria-hidden="true" />
                Nieaktualna innowacja — może wymagać aktualizacji
              </div>
            )}

            <h1 className="text-3xl font-bold text-deep">{item.title}</h1>

            {item.short_desc && (
              <p className="mt-4 text-lg">{item.short_desc}</p>
            )}

            {item.full_desc && item.full_desc !== item.short_desc && (
              <div className="mt-8 space-y-6">
                {parseDescription(item.full_desc).map((section, i) => (
                  <section key={i}>
                    {section.heading && (
                      <h2 className="text-xl font-bold text-deep">{section.heading}</h2>
                    )}
                    {section.paragraphs.map((para, j) => (
                      <p key={j} className="mt-2 max-w-[70ch] text-base leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            )}

            {item.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tagi innowacji">
                {item.tags.map((tag) => (
                  <li
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-leaf bg-paper px-3 py-1 text-sm text-leaf"
                  >
                    <Tag className="size-3" aria-hidden="true" />
                    {tag}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setMiddlemanOpen(true)}
                className={buttonVariants({ variant: "primary", className: "gap-2" })}
              >
                <TrendingUp className="size-4" aria-hidden="true" />
                Jak to wdrożyć?
              </button>

              {item.video_url && (
                <a
                  href={item.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary", className: "gap-2" })}
                >
                  <PlayCircle className="size-4" aria-hidden="true" />
                  Zobacz film
                  <span className="sr-only">(otwiera się w nowej karcie)</span>
                </a>
              )}

              {item.materials_url && (
                <a
                  href={item.materials_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary", className: "gap-2" })}
                >
                  <FileText className="size-4" aria-hidden="true" />
                  Materiały (PDF)
                  <span className="sr-only">(otwiera się w nowej karcie)</span>
                </a>
              )}

              {item.source_url && (
                <Link
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary", className: "gap-2" })}
                >
                  Źródło
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span className="sr-only">(otwiera się w nowej karcie)</span>
                </Link>
              )}

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }).catch(() => {});
                }}
                className={buttonVariants({ variant: "secondary", className: "gap-2 print:hidden" })}
                aria-label="Skopiuj link do innowacji"
              >
                <Link2 className="size-4" aria-hidden="true" />
                {copied ? "Skopiowano!" : "Kopiuj link"}
              </button>

              <button
                onClick={() => window.print()}
                className={buttonVariants({ variant: "secondary", className: "gap-2 print:hidden" })}
                aria-label="Drukuj fiszkę innowacji"
              >
                <ChevronRight className="size-4 rotate-90" aria-hidden="true" />
                Drukuj
              </button>
            </div>

            <TestRequestBox innovation={item} />
          </article>

          {/* Sidebar */}
          <aside aria-label="Szczegóły innowacji">
            <dl className="divide-y divide-sage rounded-ui border-(length:--bw) border-deep bg-surface shadow-paper">
              {item.category && (
                <div className="px-5 py-4">
                  <dt className="text-sm text-muted">Kategoria</dt>
                  <dd className="mt-0.5 font-bold text-deep capitalize">{item.category}</dd>
                </div>
              )}
              {item.area && (
                <div className="px-5 py-4">
                  <dt className="text-sm text-muted">Obszar</dt>
                  <dd className="mt-0.5 font-bold text-deep">{item.area}</dd>
                </div>
              )}
              {item.target_group && (
                <div className="px-5 py-4">
                  <dt className="text-sm text-muted">Dla kogo</dt>
                  <dd className="mt-0.5 font-bold text-deep">{item.target_group}</dd>
                </div>
              )}
              {item.where_implemented && (
                <div className="px-5 py-4">
                  <dt className="flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    Gdzie wdrożono
                  </dt>
                  <dd className="mt-0.5 text-deep">{item.where_implemented}</dd>
                </div>
              )}
              {item.cost_level && (
                <div className="px-5 py-4">
                  <dt className="text-sm text-muted">Koszt wdrożenia</dt>
                  <dd className="mt-0.5 font-bold text-deep">{COST_LABEL[item.cost_level] ?? item.cost_level}</dd>
                </div>
              )}
              {item.implementation_time_months && (
                <div className="px-5 py-4">
                  <dt className="flex items-center gap-1.5 text-sm text-muted">
                    <Clock className="size-3.5" aria-hidden="true" />
                    Czas wdrożenia
                  </dt>
                  <dd className="mt-0.5 font-bold text-deep">{item.implementation_time_months} mies.</dd>
                </div>
              )}
              {item.testers_count !== undefined && item.testers_count > 0 && (
                <div className="px-5 py-4">
                  <dt className="flex items-center gap-1.5 text-sm text-muted">
                    <Users className="size-3.5" aria-hidden="true" />
                    Testerów
                  </dt>
                  <dd className="mt-0.5 font-bold text-deep">{item.testers_count}</dd>
                </div>
              )}
              {item.authors && (
                <div className="px-5 py-4">
                  <dt className="text-sm text-muted">Autorzy</dt>
                  <dd className="mt-0.5 text-deep whitespace-pre-line">{item.authors.replace(/^-\s*/gm, "")}</dd>
                </div>
              )}
              {item.project && (
                <div className="px-5 py-4">
                  <dt className="text-sm text-muted">Projekt ROPS</dt>
                  <dd className="mt-0.5 text-deep">{item.project}</dd>
                </div>
              )}
              {item.status && (
                <div className="px-5 py-4">
                  <dt className="text-sm text-muted">Status</dt>
                  <dd className="mt-0.5 font-bold text-deep capitalize">
                    {item.status === "active" ? "Aktywna" : item.status === "archived" ? "Archiwum" : "Nieaktualna"}
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </div>
      </div>

      {/* Community action cards */}
      <div className="mx-auto max-w-content border-t-2 border-sage px-4 pt-10 pb-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">

          {/* Testowanie */}
          <div className="border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
            <div className="flex items-center gap-3">
              <FlaskConical className="size-6 shrink-0 text-leaf" aria-hidden="true" />
              <h2 className="text-lg font-bold text-deep">Testowanie</h2>
            </div>
            <p className="mt-3 text-base text-ink">
              Przetestuj innowację i podziel się opinią z twórcami.
            </p>
            {testerStatus === "pending" ? (
              <div className="mt-5 flex items-center gap-2 rounded-ui border-2 border-leaf bg-paper px-4 py-3 text-base font-bold text-leaf">
                <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
                Zgłoszenie wysłane — oczekuje na akceptację
              </div>
            ) : (
              <Button
                variant="primary"
                className="mt-5 w-full gap-2"
                onClick={() => setTesterModalOpen(true)}
              >
                <FlaskConical className="size-4" aria-hidden="true" />
                Zgłoś się jako tester
              </Button>
            )}
          </div>

          {/* Zainteresowanie */}
          <div className="border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
            <div className="flex items-center gap-3">
              <Bell className="size-6 shrink-0 text-leaf" aria-hidden="true" />
              <h2 className="text-lg font-bold text-deep">Podobne innowacje</h2>
            </div>
            <p className="mt-3 text-base text-ink">
              Interesuje Cię ta tematyka? Dowiaduj się o nowych innowacjach.
            </p>

            {interestSaved ? (
              <div className="mt-5 flex items-center gap-2 rounded-ui border-2 border-leaf bg-paper px-4 py-3 text-base font-bold text-leaf">
                <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
                Zainteresowanie zapisane
              </div>
            ) : interestOpen ? (
              <div className="mt-4">
                {item.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label="Tagi tej innowacji">
                    {item.tags.map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-leaf bg-paper px-2.5 py-1 text-sm text-leaf"
                      >
                        <Tag className="size-3" aria-hidden="true" />
                        {(TAG_LABELS as Record<string, string>)[tag] ?? tag}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1 gap-2"
                    onClick={() => {
                      try {
                        localStorage.setItem(`hubmi-interest-${item.id}`, JSON.stringify(item.tags));
                      } catch {
                        // silent
                      }
                      setInterestSaved(true);
                      setInterestOpen(false);
                      toast.show("Zapisano zainteresowanie. Poinformujemy Cię o podobnych innowacjach.");
                    }}
                  >
                    <Bell className="size-4" aria-hidden="true" />
                    Zapisz zainteresowanie
                  </Button>
                  <Button variant="secondary" onClick={() => setInterestOpen(false)}>
                    Anuluj
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="mt-5 w-full gap-2"
                onClick={() => setInterestOpen(true)}
              >
                <Bell className="size-4" aria-hidden="true" />
                Interesują mnie podobne
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* Embedded forum thread */}
      <section
        aria-labelledby="dyskusja-tytul"
        className="mx-auto max-w-content border-t-2 border-sage px-4 py-12 sm:px-6"
      >
        <h2 id="dyskusja-tytul" className="text-xl font-bold text-deep">
          Dyskusja społeczności
        </h2>
        <p className="mt-1 text-muted">
          Komentarze twórców, testerów i użytkowników tej innowacji.
        </p>
        <div className="mt-8">
          <ForumThread
            innovationId={item.id}
            embedded
            innovation={{ title: item.title, tags: item.tags }}
          />
        </div>
      </section>

      {similar.length > 0 && (
        <section aria-labelledby="podobne-tytul" className="mx-auto max-w-content border-t-2 border-sage px-4 py-12 sm:px-6">
          <h2 id="podobne-tytul" className="text-xl font-bold text-deep">Podobne innowacje</h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {similar.map((inn) => (
              <li key={inn.id} className="flex">
                <BackendInnovationCard innovation={inn} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {middlemanOpen && (
        <MiddlemanModal
          innovationId={item.id}
          innovationTitle={item.title}
          onClose={() => setMiddlemanOpen(false)}
        />
      )}

      {testerModalOpen && (
        <TesterApplyModal
          innovationId={item.id}
          innovationTitle={item.title}
          onClose={() => setTesterModalOpen(false)}
          onSuccess={() => {
            setTesterStatus("pending");
            toast.show("Zgłoszenie wysłane — oczekuje na akceptację twórcy.");
          }}
        />
      )}

      <Toast message={toast.message} onClose={toast.hide} />
    </PageBackdrop>
  );
}
