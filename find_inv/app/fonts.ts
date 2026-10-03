import { Atkinson_Hyperlegible } from "next/font/google";

// Krój podstawowy: cała treść, formularze, przyciski.
export const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-atkinson",
  display: "swap",
});

export const fontVariables = atkinson.variable;
