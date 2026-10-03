import { BadgeCheck, FlaskConical, Lightbulb, ShieldCheck, UserCheck, UserRound, type LucideIcon } from "lucide-react";

import { FORUM_BADGE_LABELS, type ForumBadge } from "@/data/mock";
import { cn } from "@/lib/utils";

// Plakietka roli: ikona + słowo, więc rola nie jest przekazywana samym kolorem.
// Każda para tło/tekst ma kontrast ≥ 4,5:1 (DESIGN.md, sekcja 3).
const STYLES: Record<ForumBadge, { icon: LucideIcon; className: string }> = {
  user: { icon: UserRound, className: "bg-sage text-ink" },
  tester: { icon: FlaskConical, className: "bg-forest-soft text-ink" },
  consultant: { icon: BadgeCheck, className: "bg-plum-soft text-ink" },
  admin: { icon: ShieldCheck, className: "bg-deep text-surface" },
  creator: { icon: Lightbulb, className: "bg-butter text-deep" },
  user_of: { icon: UserCheck, className: "bg-mint text-ink" },
};

export function RoleBadge({ role, className }: { role: ForumBadge; className?: string }) {
  const { icon: Icon, className: colors } = STYLES[role];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        colors,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.25} />
      {FORUM_BADGE_LABELS[role]}
    </span>
  );
}
