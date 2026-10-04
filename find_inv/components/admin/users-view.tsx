"use client";

import { useId, useState } from "react";
import { Building2, CircleCheck, Loader2, Mail, Sparkles, Trash2 } from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/admin/dialogs";
import { CutoutText } from "@/components/cutout-text";
import { ErrorNote, LoadingRows, OfflineNote, useAdminData, useAdminI18n } from "@/components/admin/shared";
import { RoleBadge } from "@/components/role-badge";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import type { AdminTester, AdminUser } from "@/data/admin.mock";
import { type Role } from "@/data/mock";
import { approveTester, deleteUser, getTesters, getUsers, setUserRole } from "@/lib/admin-api";

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
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const toast = useToast();
  const { t, a, errorMessage, formatDate } = useAdminI18n();
  const au = a.users;

  async function changeRole(user: AdminUser, role: Exclude<Role, "admin">) {
    setBusy(`role:${user.id}`);
    setActionError(null);
    try {
      const { data: updated } = await setUserRole(user.id, role);
      update((current) => ({ ...current, users: current.users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)) }));
      toast.show(au.newRole(user.name, t.roles[role]));
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
      toast.show(au.nowTester(tester.name));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(user: AdminUser) {
    await deleteUser(user.id);
    update((current) => ({
      users: current.users.filter((u) => u.id !== user.id),
      testers: current.testers.filter((t) => t.user_id !== user.id),
    }));
    setDeleting(null);
    toast.show(au.deleted(user.name));
  }

  const pending = data?.testers.filter((t) => !t.approved) ?? [];

  return (
    <div>
      <CutoutText as="h1" size="section" text={au.title} />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">{au.lead}</p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error ?? actionError} />

      {loading && !data ? (
        <LoadingRows label={au.loading} />
      ) : data ? (
        <>
          <section aria-labelledby={`${ids}-testerzy`} className="mb-12">
            <h2 id={`${ids}-testerzy`} className="text-xl font-bold text-foreground">
              {au.testerApplications} <span className="tabular-nums">({pending.length})</span>
            </h2>
            {pending.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 rounded-ui border-2 border-success bg-success/10 px-4 py-3 font-bold text-success">
                <CircleCheck aria-hidden="true" className="size-5" />
                {au.allReviewed}
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
                          <span className="sr-only">{au.organization}</span>
                        </dt>
                        <dd>{tester.organization}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt>
                          <Sparkles aria-hidden="true" className="size-4 text-primary" />
                          <span className="sr-only">{au.expertise}</span>
                        </dt>
                        <dd>{tester.expertise}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt>
                          <Mail aria-hidden="true" className="size-4 text-primary" />
                          <span className="sr-only">{au.email}</span>
                        </dt>
                        <dd className="break-all">{tester.email}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-sm text-muted">{au.appliedOn(formatDate(tester.created_at))}</p>
                    <div className="mt-auto pt-4">
                      <Button type="button" onClick={() => approve(tester)} disabled={busy !== null}>
                        {busy === `tester:${tester.id}` ? (
                          <Loader2 aria-hidden="true" className="animate-spin" />
                        ) : (
                          <CircleCheck aria-hidden="true" />
                        )}
                        {au.approveTester}<span className="sr-only">: {tester.name}</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby={`${ids}-lista`}>
            <h2 id={`${ids}-lista`} className="text-xl font-bold text-foreground">
              {au.allUsers} <span className="tabular-nums">({data.users.length})</span>
            </h2>
            <div className="relative mt-4 overflow-x-auto border-(length:--bw) border-border bg-surface">
              <table className="w-full min-w-[44rem] border-collapse text-left">
                <caption className="sr-only">{au.caption}</caption>
                <thead className="bg-secondary">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">{au.colPerson}</th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">{au.colRole}</th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">{au.colChange}</th>
                    <th scope="col" className="px-4 py-3 font-bold text-foreground">
                      <span className="sr-only">{au.colDelete}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => {
                    const selectId = `${ids}-rola-${user.id}`;
                    return (
                      <tr key={user.id} className="border-t-2 border-border/40">
                        <th scope="row" className="px-4 py-3 text-left font-normal">
                          <span className="block font-bold text-foreground">{user.name}</span>
                          <span className="text-sm text-muted">{au.since(formatDate(user.created_at))}</span>
                          {user.tester_pending && (
                            <span className="ml-2 rounded-full border border-accent bg-accent px-2 text-sm font-bold text-accent-foreground">
                              {au.wantsTester}
                            </span>
                          )}
                        </th>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3">
                          {user.role === "admin" ? (
                            <span className="text-muted">{au.noChange}</span>
                          ) : (
                            <>
                              <label htmlFor={selectId} className="sr-only">
                                {au.roleFor(user.name)}
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
                                      {t.roles[role]}
                                    </option>
                                  ))}
                                </select>
                                {busy === `role:${user.id}` && (
                                  <Loader2 aria-label={au.saving} className="size-5 animate-spin text-primary" />
                                )}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {user.role !== "admin" && (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busy !== null}
                              onClick={() => setDeleting(user)}
                              className="px-3 text-destructive"
                            >
                              <Trash2 aria-hidden="true" />
                              {a.delete}<span className="sr-only">{au.deleteAccount(user.name)}</span>
                            </Button>
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

      {deleting && (
        <ConfirmDeleteDialog
          title={au.deleteTitle}
          what={deleting.name}
          consequences={au.deleteConsequences}
          onConfirm={() => remove(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
      <Toast message={toast.message} onClose={toast.hide} />
    </div>
  );
}
