"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Info, Loader2, X } from "lucide-react";

import { RoleBadge } from "@/components/role-badge";
import { ROLES, type Role } from "@/data/mock";
import { useAuth } from "@/lib/auth";

// Okno logowania: wybór roli bez hasła. Natywny <dialog> z showModal() sam więzi focus,
// zamyka się Escape i oddaje focus elementowi, który go otworzył.

export function LoginDialog() {
  const { loginOpen, closeLogin, login } = useAuth();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const ids = useId();
  const titleId = `${ids}-tytul`;
  const nameId = `${ids}-imie`;

  const [name, setName] = useState("");
  const [pending, setPending] = useState<Role | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (loginOpen && !dialog.open) dialog.showModal();
    if (!loginOpen && dialog.open) dialog.close();
  }, [loginOpen]);

  async function choose(role: Role) {
    setPending(role);
    try {
      await login(role, name);
      closeLogin();
      if (role === "admin") router.push("/admin");
    } finally {
      setPending(null);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={closeLogin}
      // Kliknięcie w tło (poza kartką) zamyka okno.
      onClick={(event) => {
        if (event.target === event.currentTarget) closeLogin();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-ui border-(length:--bw) border-deep bg-surface p-0 text-ink shadow-paper backdrop:bg-ink/60"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-bold text-deep">
            Zaloguj się
          </h2>
          <button
            type="button"
            onClick={closeLogin}
            aria-label="Zamknij okno logowania"
            className="-mt-2 -mr-2 inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-ui hover:bg-sage"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>

        <p className="mt-3 flex items-start gap-2 text-muted">
          <Info aria-hidden="true" className="mt-1 size-5 shrink-0" />
          To prototyp. Nie potrzebujesz hasła, wybierz tylko, kim jesteś.
        </p>

        <label htmlFor={nameId} className="mt-6 block font-bold text-deep">
          Jak się do Ciebie zwracać? <span className="font-normal text-muted">(nieobowiązkowe)</span>
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Gość"
          className="mt-2 min-h-12 w-full rounded-ui border-(length:--bw) border-deep bg-surface px-4 text-base text-ink placeholder:text-muted"
        />

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
      </div>
    </dialog>
  );
}
