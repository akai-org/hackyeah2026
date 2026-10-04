"use client";

import Link from "next/link";
import { Clock, FlaskConical, Library, Search, Users, type LucideIcon } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { ErrorNote, LoadingRows, OfflineNote, STATUS_META, useAdminData, useAdminI18n } from "@/components/admin/shared";
import type { InnovationStatus } from "@/data/admin.mock";
import { getStats } from "@/lib/admin-api";

function Counter({ label, value, hint, icon: Icon }: { label: string; value: number; hint?: string; icon: LucideIcon }) {
  const { number } = useAdminI18n();
  return (
    <div className="appear flex flex-col border-(length:--bw) border-border bg-surface p-6 shadow-raised">
      <dt className="flex items-center gap-2 font-bold text-muted">
        <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
        {label}
      </dt>
      <dd className="mt-2 text-[3.5rem] leading-none font-bold text-foreground tabular-nums">{number(value)}</dd>
      {hint && <dd className="mt-3 text-muted">{hint}</dd>}
    </div>
  );
}

export function AdminStatsView() {
  const { data, offline, error, loading } = useAdminData(getStats);
  const { a } = useAdminI18n();
  const s = a.stats;

  return (
    <section aria-labelledby="statystyki-tytul">
      <CutoutText as="h1" size="section" text={s.title} id="statystyki-tytul" />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">{s.lead}</p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error} />

      {loading && !data ? (
        <LoadingRows label={s.loading} />
      ) : data ? (
        <>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Counter icon={Library} label={s.innovations} value={data.innovations} hint={s.active(data.innovations_by_status.active)} />
            <Counter icon={Users} label={s.users} value={data.users} />
            <Counter icon={FlaskConical} label={s.testers} value={data.testers} hint={s.pendingTesters(data.pending_testers)} />
            <Counter icon={Search} label={s.searches} value={data.searches} hint={s.today(data.searches_today)} />
          </dl>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="border-(length:--bw) border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-foreground">{s.byStatus}</h2>
              <ul className="mt-4 space-y-3">
                {(Object.keys(STATUS_META) as InnovationStatus[]).map((status) => {
                  const count = data.innovations_by_status[status] ?? 0;
                  const share = data.innovations ? (count / data.innovations) * 100 : 0;
                  const Icon = STATUS_META[status].icon;
                  return (
                    <li key={status}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 font-bold">
                          <Icon aria-hidden="true" className="size-5 text-primary" />
                          {a.status[status]}
                        </span>
                        <span className="font-bold tabular-nums">{count}</span>
                      </div>
                      <div aria-hidden="true" className="mt-1.5 h-3 rounded-full bg-secondary">
                        <div className="h-3 rounded-full bg-primary" style={{ width: `${share}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-(length:--bw) border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-foreground">{s.todo}</h2>
              <ul className="mt-4 space-y-4">
                <li className="flex items-start gap-3">
                  <Clock aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                  <p>
                    <strong className="tabular-nums">{data.innovations_by_status.pending}</strong>
                    {s.pendingInnovations(data.innovations_by_status.pending)}{" "}
                    <Link href="/admin/innowacje?status=pending" className="font-bold text-primary underline underline-offset-4">
                      {s.review}
                    </Link>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <FlaskConical aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                  <p>
                    <strong className="tabular-nums">{data.pending_testers}</strong>
                    {s.wantTester(data.pending_testers)}{" "}
                    <Link href="/admin/uzytkownicy" className="font-bold text-primary underline underline-offset-4">
                      {s.approveTesters}
                    </Link>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <Search aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
                  <p>
                    {s.checkSearches}{" "}
                    <Link href="/admin/trendy" className="font-bold text-primary underline underline-offset-4">
                      {s.seeTrends}
                    </Link>
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
