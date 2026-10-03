import { cn } from "@/lib/utils";

const SIZES = {
  hero: "text-hero",
  section: "text-2xl",
  logo: "text-xl",
} as const;

type CutoutTextProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  size?: keyof typeof SIZES;
  /** Jednorazowe „przyklejanie" liter (tylko nagłówek strony głównej). */
  animate?: boolean;
  /**
   * Gdy false, element nie dostaje aria-label, bo nazwę daje rodzic
   * (np. link z logo ma własny aria-label).
   */
  labelled?: boolean;
  id?: string;
  className?: string;
};

export function CutoutText({
  text,
  as: Tag = "h2",
  size = "section",
  animate = false,
  labelled = true,
  id,
  className,
}: CutoutTextProps) {
  return (
    <Tag
      id={id}
      aria-label={labelled ? text : undefined}
      className={cn(SIZES[size], "font-bold text-deep", className)}
    >
      {text}
    </Tag>
  );
}
