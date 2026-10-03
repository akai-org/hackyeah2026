import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SIMPLE_MODE_SCRIPT, SimpleModeProvider } from "@/components/simple-mode";
import { AuthProvider } from "@/lib/auth";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HubMI – znajdź rozwiązanie, które już działa",
    template: "%s – HubMI",
  },
  description:
    "Opisz problem społeczny własnymi słowami. HubMI pokaże innowacje społeczne, które już działają w Małopolsce.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: skrypt trybu prostego może dodać data-simple przed hydracją.
    <html lang="pl" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SIMPLE_MODE_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col font-body antialiased">
        <SimpleModeProvider>
          <AuthProvider>
            <SiteHeader />
            <main id="tresc" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <SiteFooter />
          </AuthProvider>
        </SimpleModeProvider>
      </body>
    </html>
  );
}
