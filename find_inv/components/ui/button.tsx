import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Przyciski wg DESIGN.md, sekcja 8: ramka 2 px, min. 48 px, tekst 18 px/700.
const buttonVariants = cva(
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-ui border-(length:--bw) border-border px-5 py-2 text-base font-bold transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "focus-on-primary border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover",
        secondary: "bg-surface text-primary hover:bg-primary/10",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export { Button, buttonVariants };
