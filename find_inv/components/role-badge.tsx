import { BadgeCheck, FlaskConical, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";

import { ROLE_LABELS, type Role } from "@/data/mock";
import { cn } from "@/lib/utils";

// Plakietka roli: ikona + słowo, więc rola nie jest przekazywana samym kolorem.
// Każda para tło/tekst ma kontrast ≥ 4,5:1 (DESIGN.md, sekcja 3).
const STYLES: Record<Role, { icon: LucideIcon; className: string }> = {
  user: { icon: UserRound, className: "bg-sage text-ink" },
  tester: { icon: FlaskConical, className: "bg-mint text-ink" },
  consultant: { icon: BadgeCheck, className: "bg-butter text-deep" },
  admin: { icon: ShieldCheck, className: "bg-deep text-surface" },
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const { icon: Icon, className: colors } = STYLES[role];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-deep px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        colors,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.25} />
      {ROLE_LABELS[role]}
    </span>
  );
}
