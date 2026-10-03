import type { ReactNode } from "react";

const LAYOUTS = {
  "corner-right": () => null,
  "corner-left": () => null,
  side: () => null,
  gutters: () => null,
} as const;

type PageBackdropProps = {
  layout?: keyof typeof LAYOUTS;
  children: ReactNode;
};

export function PageBackdrop({ layout = "corner-right", children }: PageBackdropProps) {
  return (
    // overflow-clip, a nie hidden: nie tworzy kontenera przewijania, więc sticky w treści dalej działa.
    <div className="relative overflow-clip">
      <div aria-hidden="true" className="simple-hidden pointer-events-none absolute inset-0 select-none">
        {LAYOUTS[layout]()}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
