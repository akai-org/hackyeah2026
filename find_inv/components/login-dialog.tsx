"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info, Loader2 } from "lucide-react";

import { RoleBadge } from "@/components/role-badge";
import { Dialog } from "@/components/ui/dialog";
import { ROLES, type Role } from "@/data/mock";
import { useAuth } from "@/lib/auth";

// Okno logowania: wybór roli bez hasła. Focus trap, Esc, klik w tło i powrót focusu daje <Dialog>.

export function LoginDialog() {
  const { loginOpen, closeLogin, login } = useAuth();
  const router = useRouter();

  const [pending, setPending] = useState<Role | null>(null);

  async function choose(role: Role) {
    setPending(role);
    try {
      await login(role);
      closeLogin();
      if (role === "admin") router.push("/admin");
    } finally {
      setPending(null);
    }
  }

  return (
    <Dialog open={loginOpen} onClose={closeLogin} title="Zaloguj się" closeLabel="Zamknij okno logowania">
      <p className="mt-3 flex items-start gap-2 text-muted">
        <Info aria-hidden="true" className="mt-1 size-5 shrink-0" />
        To prototyp. Nie potrzebujesz hasła, wybierz tylko, kim jesteś.
      </p>

      <fieldset className="mt-6">
        <legend className="font-bold text-deep">Wybierz rolę</legend>
        <ul className="mt-2 grid gap-3">
          {ROLES.map((role) => (
            <li key={role.value}>
              <button
                type="button"
                onClick={() => choose(role.value)}
                disabled={pending !== null}
                className="flex min-h-12 w-full cursor-pointer items-center gap-4 rounded-ui border-(length:--bw) border-deep bg-surface px-4 py-3 text-left hover:bg-mint disabled:cursor-wait disabled:opacity-70"
              >
                <RoleBadge role={role.value} className="w-36 shrink-0 justify-center" />
                <span className="flex-1 text-base">{role.description}</span>
                {pending === role.value && (
                  <Loader2 aria-label="Loguję" className="size-5 shrink-0 animate-spin text-deep" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
    </Dialog>
  );
}
