"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Building2, CircleCheck, Loader2, Mail, UserMinus, X } from "lucide-react";

import { ErrorNote, LoadingRows, OfflineNote, useAdminData, useAdminI18n } from "@/components/admin/shared";
import { CutoutText } from "@/components/cutout-text";
import { TestStatusBadge } from "@/components/test-request";
import { Stars } from "@/components/tester-panel";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { decideTestRequest, getTestRequests, type TestReport } from "@/lib/tester-api";

// Testy innowacji: admin ROPS przypisuje testerów do innowacji, o które się zgłosili, i czyta ich oceny.

export function AdminTestRequestsView() {
  const ids = useId();
  const { data, offline, error, loading, update } = useAdminData(() => getTestRequests());
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const toast = useToast();
  const { t, a, errorMessage, formatDate } = useAdminI18n();
  const ts = a.tests;
  const tp = t.tester;

  async function decide(report: TestReport, decision: "assign" | "reject" | "unassign") {
    setBusy(`${decision}:${report.id}`);
    setActionError(null);
    try {
      const { data: updated } = await decideTestRequest(report.id, decision);
      update((current) => current.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
      toast.show(
        decision === "assign"
          ? ts.assigned(report.tester_name ?? "", report.innovation_title ?? "")
          : decision === "unassign"
            ? ts.unassigned(report.tester_name ?? "", report.innovation_title ?? "")
            : ts.rejected(report.tester_name ?? ""),
      );
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const requested = data?.filter((row) => row.status === "requested") ?? [];
  const assigned = data?.filter((row) => row.status === "assigned") ?? [];
  const submitted = data?.filter((row) => row.status === "submitted") ?? [];

  const innovationLink = (report: TestReport) => (
    <Link href={`/innowacje/${report.innovation_id}`} className="font-bold text-foreground underline underline-offset-4">
      {report.innovation_title ?? tp.innovationNo(report.innovation_id)}
    </Link>
  );

  return (
    <div>
      <CutoutText as="h1" size="section" text={ts.title} />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">
        {ts.lead}
      </p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error ?? actionError} />

      {loading && !data ? (
        <LoadingRows label={ts.loading} />
      ) : data ? (
        <>
          <section aria-labelledby={`${ids}-zgloszenia`} className="mb-12">
            <h2 id={`${ids}-zgloszenia`} className="text-xl font-bold text-foreground">
              {ts.requests} <span className="tabular-nums">({requested.length})</span>
            </h2>
            {requested.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 rounded-ui border-2 border-success bg-success/10 px-4 py-3 font-bold text-success">
                <CircleCheck aria-hidden="true" className="size-5" />
                {ts.allReviewed}
              </p>
            ) : (
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {requested.map((report) => (
                  <li key={report.id} className="appear flex flex-col border-(length:--bw) border-border bg-surface p-5 shadow-raised">
                    <h3 className="text-lg font-bold text-foreground">{report.tester_name}</h3>
                    <p className="mt-1">
                      {ts.wantsToTest} {innovationLink(report)}
                    </p>
                    <dl className="mt-2 space-y-1 text-base">
                      {report.tester_organization && (
                        <div className="flex items-center gap-2">
                          <dt>
                            <Building2 aria-hidden="true" className="size-4 text-primary" />
                            <span className="sr-only">{a.users.organization}</span>
                          </dt>
                          <dd>{report.tester_organization}</dd>
                        </div>
                      )}
                      {report.tester_email && (
                        <div className="flex items-center gap-2">
                          <dt>
                            <Mail aria-hidden="true" className="size-4 text-primary" />
                            <span className="sr-only">{a.users.email}</span>
                          </dt>
                          <dd className="break-all">{report.tester_email}</dd>
                        </div>
                      )}
                    </dl>
                    {report.motivation && (
                      <blockquote className="mt-3 border-l-4 border-secondary pl-3">
                        <span className="sr-only">{ts.motivation}</span>
                        {report.motivation}
                      </blockquote>
                    )}
                    {report.created_at && (
                      <p className="mt-2 text-sm text-muted">{a.users.appliedOn(formatDate(report.created_at))}</p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-3 pt-4">
                      <Button type="button" onClick={() => decide(report, "assign")} disabled={busy !== null}>
                        {busy === `assign:${report.id}` ? (
                          <Loader2 aria-hidden="true" className="animate-spin" />
                        ) : (
                          <CircleCheck aria-hidden="true" />
                        )}
                        {ts.assign}<span className="sr-only">: {report.tester_name}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => decide(report, "reject")}
                        disabled={busy !== null}
                      >
                        {busy === `reject:${report.id}` ? (
                          <Loader2 aria-hidden="true" className="animate-spin" />
                        ) : (
                          <X aria-hidden="true" />
                        )}
                        {ts.reject}<span className="sr-only">: {report.tester_name}</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby={`${ids}-przypisane`} className="mb-12">
            <h2 id={`${ids}-przypisane`} className="text-xl font-bold text-foreground">
              {ts.ongoing} <span className="tabular-nums">({assigned.length})</span>
            </h2>
            {assigned.length === 0 ? (
              <p className="mt-4 text-muted">{ts.noneOngoing}</p>
            ) : (
              <div className="mt-4 overflow-x-auto border-(length:--bw) border-border bg-surface">
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <caption className="sr-only">{ts.ongoingCaption}</caption>
                  <thead className="bg-secondary">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{ts.colTester}</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{ts.colInnovation}</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{ts.colStatus}</th>
                      <th scope="col" className="px-4 py-3 font-bold text-foreground">{ts.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assigned.map((report) => (
                      <tr key={report.id} className="border-t-2 border-border/40">
                        <th scope="row" className="px-4 py-3 text-left font-bold text-foreground">
                          {report.tester_name}
                        </th>
                        <td className="px-4 py-3">{innovationLink(report)}</td>
                        <td className="px-4 py-3">
                          <TestStatusBadge status={report.status} />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => decide(report, "unassign")}
                            disabled={busy !== null}
                          >
                            {busy === `unassign:${report.id}` ? (
                              <Loader2 aria-hidden="true" className="animate-spin" />
                            ) : (
                              <UserMinus aria-hidden="true" />
                            )}
                            {ts.unassign}<span className="sr-only">: {report.tester_name}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby={`${ids}-oceny`}>
            <h2 id={`${ids}-oceny`} className="text-xl font-bold text-foreground">
              {ts.reviews} <span className="tabular-nums">({submitted.length})</span>
            </h2>
            {submitted.length === 0 ? (
              <p className="mt-4 text-muted">{ts.noReviews}</p>
            ) : (
              <ul className="mt-4 grid gap-4">
                {submitted.map((report) => (
                  <li key={report.id} className="border-(length:--bw) border-border bg-surface p-5 shadow-raised">
                    <h3 className="text-lg">{innovationLink(report)}</h3>
                    <p className="mt-1 text-muted">
                      {report.tester_name}
                      {report.submitted_at && ` · ${formatDate(report.submitted_at)}`}
                    </p>
                    <div className="mt-3 grid gap-2">
                      {report.rating && <Stars rating={report.rating} />}
                      {report.what_worked && (
                        <p>
                          <span className="font-bold">{tp.whatWorked}</span> {report.what_worked}
                        </p>
                      )}
                      {report.improvements && (
                        <p>
                          <span className="font-bold">{tp.improvements}</span> {report.improvements}
                        </p>
                      )}
                      {report.cost_note && (
                        <p>
                          <span className="font-bold">{tp.costs}</span> {report.cost_note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      <Toast message={toast.message} onClose={toast.hide} />
    </div>
  );
}
