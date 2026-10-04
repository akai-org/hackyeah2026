"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { apiFetch, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

interface RatingData {
  average: number;
  count: number;
  tester_average: number | null;
  tester_count: number;
}

interface Props {
  innovationId: number;
}

export function StarRating({ innovationId }: Props) {
  const { user } = useAuth();
  const r = useT().library.rating;
  const [data, setData] = useState<RatingData | null>(null);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<RatingData>(`/api/innovations/${innovationId}/rating`)
      .then(setData)
      .catch(() => {});
  }, [innovationId]);

  async function submit(rating: number) {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const result = await apiPost<RatingData>(`/api/innovations/${innovationId}/rating`, {
        rating,
        session_token: user ? undefined : undefined,
      });
      setData(result);
      setSubmitted(true);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  const displayAvg = data?.average ?? 0;
  const displayCount = data?.count ?? 0;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-foreground">{r.title}</h2>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div
          role="group"
          aria-label={r.group}
          className="flex gap-1"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={submitted || submitting}
              aria-label={r.star(star)}
              onClick={() => { void submit(star); }}
              onMouseEnter={() => setHover(star)}
              onFocus={() => setHover(star)}
              onBlur={() => setHover(0)}
              className={cn(
                "cursor-pointer rounded p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default",
                star <= (hover || (submitted ? displayAvg : 0))
                  ? "text-accent"
                  : "text-muted",
              )}
            >
              <Star
                aria-hidden="true"
                className="size-7"
                fill={star <= (hover || (submitted ? Math.round(displayAvg) : 0)) ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>

        <div className="text-sm text-muted">
          {submitted ? (
            <span className="font-bold text-foreground">{r.thanks}</span>
          ) : displayCount > 0 ? (
            r.summary(displayAvg.toFixed(1), displayCount)
          ) : (
            r.none
          )}
        </div>
      </div>

      {data?.tester_count != null && data.tester_count > 0 && data.tester_average != null && (
        <p className="mt-2 text-sm text-muted">
          {r.testers}{" "}
          <strong className="text-foreground">
            {data.tester_average.toFixed(1)} / 5
          </strong>{" "}
          ({r.testerCount(data.tester_count)})
        </p>
      )}
    </div>
  );
}
