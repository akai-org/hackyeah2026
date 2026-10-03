"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CircleHelp,
  Clock,
  MapPin,
  Tag,
  TrendingUp,
  Users,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { MiddlemanModal } from "@/components/middleman-modal";
import { BackendInnovationCard, type BackendInnovation } from "@/components/backend-innovation-card";

const COST_LABEL: Record<string, string> = {
  low: "Niski koszt",
  medium: "Średni koszt",
  high: "Wysoki koszt",
};

interface DetailInnovation extends BackendInnovation {
  full_desc?: string;
  implementation_time_months?: number;
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

  useEffect(() => {
    if (!id) return;
    apiFetch<DetailInnovation>(`/api/innovations/${id}`)
      .then((data) => {
        setItem(data);
        if (data?.title) document.title = `${data.title} – HubMI`;
        if (data?.tags?.length) {
          const tagsParam = data.tags.slice(0, 3).join(",");
          apiFetch<BackendInnovation[]>(`/api/innovations?tags=${encodeURIComponent(tagsParam)}&limit=4`)
            .then((all) => setSimilar((all ?? []).filter((i) => i.id !== id).slice(0, 3)))
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
    <>
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
              <div className="mt-6 prose prose-stone max-w-none">
                <p className="text-base leading-relaxed">{item.full_desc}</p>
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

              {item.source_url && (
                <Link
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "secondary", className: "gap-2" })}
                >
                  Źródło
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              )}
            </div>
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
    </>
  );
}
