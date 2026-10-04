"use client";

import { BadgeCheck, FlaskConical, Lightbulb, ShieldCheck, UserCheck, UserRound, type LucideIcon } from "lucide-react";

import { type ForumBadge } from "@/data/mock";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

// Plakietka roli: ikona + słowo, więc rola nie jest przekazywana samym kolorem.
// Każda para tło/tekst ma kontrast ≥ 4,5:1 (DESIGN.md, sekcja 3).
const STYLES: Record<ForumBadge, { icon: LucideIcon; className: string }> = {
  user: { icon: UserRound, className: "border-border bg-secondary/60 text-foreground" },
  tester: { icon: FlaskConical, className: "border-primary bg-primary/10 text-primary" },
  consultant: { icon: BadgeCheck, className: "border-accent bg-accent text-accent-foreground" },
  admin: { icon: ShieldCheck, className: "border-primary bg-primary text-primary-foreground" },
  creator: { icon: Lightbulb, className: "border-border bg-secondary text-foreground" },
  user_of: { icon: UserCheck, className: "border-success bg-success/10 text-success" },
};

export function RoleBadge({ role, className }: { role: ForumBadge; className?: string }) {
  const { icon: Icon, className: colors } = STYLES[role];
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        colors,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.25} />
      {t.roles[role]}
    </span>
  );
}
