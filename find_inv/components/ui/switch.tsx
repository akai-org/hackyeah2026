"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

// Przełącznik Radix (role="switch"). Stan „włączony" pokazuje też położenie i znak ✓,
// więc kolor nie jest jedynym nośnikiem informacji.
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        // after: powiększa obszar dotyku do 48 px wysokości bez zmiany wyglądu.
        "peer relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-(length:--bw) border-line bg-surface transition-colors after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] data-[state=checked]:bg-deep",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none flex size-5 translate-x-1 items-center justify-center rounded-full bg-deep text-[0.75rem] font-bold text-surface transition-transform data-[state=checked]:translate-x-7 data-[state=checked]:bg-surface data-[state=checked]:text-deep data-[state=checked]:before:content-['✓']" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
