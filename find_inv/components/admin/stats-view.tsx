"use client";

import Link from "next/link";
import { Clock, FlaskConical, Library, Search, Users, type LucideIcon } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { ErrorNote, LoadingRows, OfflineNote, STATUS_META, useAdminData } from "@/components/admin/shared";
import type { InnovationStatus } from "@/data/admin.mock";
import { getStats } from "@/lib/admin-api";

const NUMBER = new Intl.NumberFormat("pl-PL");

function Counter({ label, value, hint, icon: Icon }: { label: string; value: number; hint?: string; icon: LucideIcon }) {
  return (
    <div className="appear flex flex-col border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
      <dt className="flex items-center gap-2 font-bold text-muted">
        <Icon aria-hidden="true" className="size-5 shrink-0 text-leaf" />
        {label}
      </dt>
      <dd className="mt-2 text-[3.5rem] leading-none font-bold text-deep tabular-nums">{NUMBER.format(value)}</dd>
      {hint && <dd className="mt-3 text-muted">{hint}</dd>}
    </div>
  );
}

export function AdminStatsView() {
  const { data, offline, error, loading } = useAdminData(getStats);

  return (
    <section aria-labelledby="statystyki-tytul">
      <CutoutText as="h1" size="section" text="Stan Biblioteki" id="statystyki-tytul" />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">Najważniejsze liczby w jednym miejscu. Dane odświeżają się przy każdym wejściu.</p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error} />

      {loading && !data ? (
        <LoadingRows label="Wczytuję statystyki" />
      ) : data ? (
        <>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Counter icon={Library} label="Innowacje" value={data.innovations} hint={`${data.innovations_by_status.active} aktywnych`} />
            <Counter icon={Users} label="Użytkownicy" value={data.users} />
            <Counter icon={FlaskConical} label="Aktywni testerzy" value={data.testers} hint={`${data.pending_testers} czeka na zatwierdzenie`} />
            <Counter icon={Search} label="Wyszukiwania" value={data.searches} hint={`dziś: ${data.searches_today}`} />
          </dl>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="border-(length:--bw) border-deep bg-surface p-6">
              <h2 className="text-xl font-bold text-deep">Innowacje według statusu</h2>
              <ul className="mt-4 space-y-3">
                {(Object.keys(STATUS_META) as InnovationStatus[]).map((status) => {
                  const count = data.innovations_by_status[status] ?? 0;
                  const share = data.innovations ? (count / data.innovations) * 100 : 0;
                  const Icon = STATUS_META[status].icon;
                  return (
                    <li key={status}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 font-bold">
                          <Icon aria-hidden="true" className="size-5 text-leaf" />
                          {STATUS_META[status].label}
                        </span>
                        <span className="font-bold tabular-nums">{count}</span>
                      </div>
                      <div aria-hidden="true" className="mt-1.5 h-3 rounded-full bg-sage">
                        <div className="h-3 rounded-full bg-leaf" style={{ width: `${share}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-(length:--bw) border-deep bg-surface p-6">
              <h2 className="text-xl font-bold text-deep">Do zrobienia</h2>
              <ul className="mt-4 space-y-4">
                <li className="flex items-start gap-3">
                  <Clock aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
                  <p>
                    <strong className="tabular-nums">{data.innovations_by_status.pending}</strong> zgłoszonych innowacji czeka na weryfikację.{" "}
                    <Link href="/admin/innowacje?status=pending" className="font-bold text-leaf underline underline-offset-4">
                      Przejrzyj zgłoszenia
                    </Link>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <FlaskConical aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
                  <p>
                    <strong className="tabular-nums">{data.pending_testers}</strong> osób chce zostać testerem.{" "}
                    <Link href="/admin/uzytkownicy" className="font-bold text-leaf underline underline-offset-4">
                      Zatwierdź testerów
                    </Link>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <Search aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
                  <p>
                    Sprawdź, czego mieszkańcy szukają, a czego brakuje w Bibliotece.{" "}
                    <Link href="/admin/trendy" className="font-bold text-leaf underline underline-offset-4">
                      Zobacz trendy
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
