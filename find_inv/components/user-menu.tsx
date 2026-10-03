"use client";

import { LogIn, LogOut } from "lucide-react";

import { RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  /** W wąskim pasku nagłówka: bez imienia, „Wyloguj” jako sama ikona z etykietą dla czytnika. */
  compact?: boolean;
  className?: string;
};

// Stan logowania: „Zaloguj się” albo plakietka roli z imieniem i „Wyloguj”.
export function UserMenu({ compact = false, className }: UserMenuProps) {
  const { user, status, openLogin, logout } = useAuth();

  // Do czasu sprawdzenia sesji rezerwujemy miejsce, żeby nagłówek nie skakał.
  if (status === "loading") return <div aria-hidden="true" className={cn("min-h-12 w-40", className)} />;

  if (!user) {
    return (
      <Button type="button" variant="secondary" onClick={openLogin} className={cn("whitespace-nowrap", className)}>
        <LogIn aria-hidden="true" />
        Zaloguj się
      </Button>
    );
  }

  return (
    <div className={cn("flex min-h-12 items-center gap-3", className)}>
      <p className="flex min-w-0 items-center gap-2">
        <span className="sr-only">Zalogowano jako</span>
        <span className={cn("truncate font-bold text-deep", compact ? "sr-only" : "max-w-[14ch]")}>{user.name},</span>
        <RoleBadge role={user.role} />
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={logout}
        aria-label={compact ? "Wyloguj" : undefined}
        title={compact ? "Wyloguj" : undefined}
        className={cn("whitespace-nowrap", compact ? "min-w-12 px-0" : "px-3")}
      >
        <LogOut aria-hidden="true" />
        {!compact && "Wyloguj"}
      </Button>
    </div>
  );
}
