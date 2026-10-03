"use client";

import { useId, useState } from "react";
import { Building2, CircleCheck, Loader2, Mail, Sparkles } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { ErrorNote, LoadingRows, OfflineNote, errorMessage, formatDate, useAdminData } from "@/components/admin/shared";
import { RoleBadge } from "@/components/role-badge";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import type { AdminTester, AdminUser } from "@/data/admin.mock";
import { ROLE_LABELS, type Role } from "@/data/mock";
import { approveTester, getTesters, getUsers, setUserRole } from "@/lib/admin-api";

const ASSIGNABLE: Array<Exclude<Role, "admin">> = ["user", "tester", "consultant"];

async function loadAll() {
  const [users, testers] = await Promise.all([getUsers(), getTesters()]);
  return { data: { users: users.data, testers: testers.data }, offline: users.offline || testers.offline };
}

export function AdminUsersView() {
  const ids = useId();
  const { data, offline, error, loading, update } = useAdminData(loadAll);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const toast = useToast();

  async function changeRole(user: AdminUser, role: Exclude<Role, "admin">) {
    setBusy(`role:${user.id}`);
    setActionError(null);
    try {
      const { data: updated } = await setUserRole(user.id, role);
      update((current) => ({ ...current, users: current.users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)) }));
      toast.show(`${user.name}: nowa rola ${ROLE_LABELS[role]}.`);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function approve(tester: AdminTester) {
    setBusy(`tester:${tester.id}`);
    setActionError(null);
    try {
      await approveTester(tester.id);
      update((current) => ({
        testers: current.testers.map((t) => (t.id === tester.id ? { ...t, approved: true } : t)),
        users: current.users.map((u) =>
          u.id === tester.user_id ? { ...u, role: u.role === "admin" ? u.role : "tester", tester_pending: false } : u,
        ),
      }));
      toast.show(`${tester.name} jest teraz testerem.`);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const pending = data?.testers.filter((t) => !t.approved) ?? [];

  return (
    <div>
      <CutoutText as="h1" size="section" text="Użytkownicy" />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">Zatwierdzaj zgłoszenia testerów i nadawaj role konsultantom.</p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error ?? actionError} />

      {loading && !data ? (
        <LoadingRows label="Wczytuję użytkowników" />
      ) : data ? (
        <>
          <section aria-labelledby={`${ids}-testerzy`} className="mb-12">
            <h2 id={`${ids}-testerzy`} className="text-xl font-bold text-foreground">
              Zgłoszenia testerów <span className="tabular-nums">({pending.length})</span>
            </h2>
            {pending.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 rounded-ui border-2 border-success bg-success/10 px-4 py-3 font-bold text-success">
                <CircleCheck aria-hidden="true" className="size-5" />
                Wszystkie zgłoszenia rozpatrzone.
              </p>
            ) : (
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {pending.map((tester) => (
                  <li key={tester.id} className="appear flex flex-col border-(length:--bw) border-border bg-surface p-5 shadow-raised">
                    <h3 className="text-lg font-bold text-foreground">{tester.name}</h3>
                    <dl className="mt-2 space-y-1 text-base">
                      <div className="flex items-center gap-2">
                        <dt>
                          <Building2 aria-hidden="true" className="size-4 text-primary" />
                          <span className="sr-only">Organizacja</span>
                        </dt>
                        <dd>{tester.organization}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt>
                          <Sparkles aria-hidden="true" className="size-4 text-primary" />
                          <span className="sr-only">Specjalizacja</span>
                        </dt>
                        <dd>{tester.expertise}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt>
                          <Mail aria-hidden="true" className="size-4 text-primary" />
                          <span className="sr-only">E-mail</span>
                        </dt>
                        <dd className="break-all">{tester.email}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-sm text-muted">Zgłoszenie z {formatDate(tester.created_at)}</p>
                    <div className="mt-auto pt-4">
                      <Button type="button" onClick={() => approve(tester)} disabled={busy !== null}>
                        {busy === `tester:${tester.id}` ? (
                          <Loader2 aria-hidden="true" className="animate-spin" />
                        ) : (
                          <CircleCheck aria-hidden="true" />
                        )}
                        Zatwierdź testera<span className="sr-only">: {tester.name}</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby={`${ids}-lista`}>
            <h2 id={`${ids}-lista`} className="text-xl font-bold text-foreground">
              Wszyscy użytkownicy <span className="tabular-nums">({data.users.length})</span>
            </h2>
            <div className="mt-4 overflow-x-auto border-(length:--bw) border-border bg-surface">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <caption className="sr-only">Użytkownicy platformy i ich role</caption>
                <thead className="bg-secondary">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">Osoba lub instytucja</th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">Rola</th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">Zmień rolę</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => {
                    const selectId = `${ids}-rola-${user.id}`;
                    return (
                      <tr key={user.id} className="border-t-2 border-border/40">
                        <th scope="row" className="px-4 py-3 text-left font-normal">
                          <span className="block font-bold text-foreground">{user.name}</span>
                          <span className="text-sm text-muted">od {formatDate(user.created_at)}</span>
                          {user.tester_pending && (
                            <span className="ml-2 rounded-full border border-accent bg-accent px-2 text-sm font-bold text-accent-foreground">
                              chce zostać testerem
                            </span>
                          )}
                        </th>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3">
                          {user.role === "admin" ? (
                            <span className="text-muted">Bez zmian z panelu</span>
                          ) : (
                            <>
                              <label htmlFor={selectId} className="sr-only">
                                Rola dla: {user.name}
                              </label>
                              <span className="flex items-center gap-2">
                                <select
                                  id={selectId}
                                  value={user.role}
                                  disabled={busy !== null}
                                  onChange={(event) => changeRole(user, event.target.value as Exclude<Role, "admin">)}
                                  className="min-h-12 cursor-pointer rounded-ui border-(length:--bw) border-border bg-surface px-3 text-base"
                                >
                                  {ASSIGNABLE.map((role) => (
                                    <option key={role} value={role}>
                                      {ROLE_LABELS[role]}
                                    </option>
                                  ))}
                                </select>
                                {busy === `role:${user.id}` && (
                                  <Loader2 aria-label="Zapisuję" className="size-5 animate-spin text-primary" />
                                )}
                              </span>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      <Toast message={toast.message} onClose={toast.hide} />
    </div>
  );
}
