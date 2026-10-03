"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { apiFetch, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ROLE_BADGE, type Role } from "@/lib/auth";

interface AdminUser {
  id: number;
  name: string;
  role: string;
  created_at: string | null;
}

interface AdminTester {
  id: number;
  name: string;
  email: string;
  organization: string | null;
  expertise: string | null;
  approved: boolean;
  created_at: string | null;
}

export default function UzytkownicyPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [testers, setTesters] = useState<AdminTester[]>([]);

  function loadUsers() {
    apiFetch<AdminUser[]>("/api/admin/users", { headers: { "X-Dev-Admin": "true" } })
      .then(setUsers)
      .catch(() => {});
  }
  function loadTesters() {
    apiFetch<AdminTester[]>("/api/admin/testers?approved=false", { headers: { "X-Dev-Admin": "true" } })
      .then(setTesters)
      .catch(() => {});
  }

  useEffect(() => { loadUsers(); loadTesters(); }, []);

  async function changeRole(userId: number, role: Role) {
    await apiPost(`/api/admin/users/${userId}/set-role`, { role });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
  }

  async function approveTester(testerId: number) {
    await apiPost(`/api/admin/testers/${testerId}/approve`, {});
    setTesters((prev) => prev.filter((t) => t.id !== testerId));
    loadUsers();
  }

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-2xl font-bold text-deep">Użytkownicy</h1>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-deep text-left">
                <th className="py-3 pr-4 font-bold text-muted">Użytkownik</th>
                <th className="py-3 pr-4 font-bold text-muted">Rola</th>
                <th className="py-3 font-bold text-muted">Zmień rolę</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const badge = ROLE_BADGE[user.role as Role] ?? { label: user.role, className: "bg-paper text-ink" };
                return (
                  <tr key={user.id} className="border-b border-sage hover:bg-paper">
                    <td className="py-3 pr-4 font-bold text-deep">{user.name}</td>
                    <td className="py-3 pr-4">
                      <span className={cn("rounded-full border border-deep px-2 py-0.5 text-xs font-bold", badge.className)}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value as Role)}
                        aria-label={`Zmień rolę użytkownika ${user.name}`}
                        className="rounded-ui border-(length:--bw) border-deep bg-surface px-3 py-1 text-sm"
                      >
                        <option value="user">Mieszkaniec</option>
                        <option value="tester">Tester</option>
                        <option value="consultant">Konsultant</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted">Brak użytkowników</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {testers.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-deep">Oczekujące zgłoszenia testerów</h2>
          <ul className="mt-4 space-y-3">
            {testers.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 border-(length:--bw) border-deep bg-surface p-4 shadow-paper">
                <div>
                  <p className="font-bold text-deep">{t.name}</p>
                  <p className="text-sm text-muted">{t.email} · {t.organization ?? "brak org."}</p>
                  {t.expertise && <p className="text-sm text-muted">Specjalizacja: {t.expertise}</p>}
                </div>
                <button
                  onClick={() => approveTester(t.id)}
                  className="inline-flex items-center gap-2 rounded-ui border-(length:--bw) border-leaf bg-mint px-4 py-2 text-sm font-bold text-deep hover:bg-leaf hover:text-surface"
                >
                  <CheckCircle className="size-4" aria-hidden="true" />
                  Zatwierdź
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
