import type { Metadata } from "next";

import { LoginDialog } from "@/components/login-dialog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SIMPLE_MODE_SCRIPT, SimpleModeProvider } from "@/components/simple-mode";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale, getT } from "@/lib/i18n/server";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: t.meta.title, template: "%s – HubMI" },
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    // suppressHydrationWarning: skrypt ustawień dostępności może dodać atrybuty data-* przed hydracją.
    <html lang={locale} className={fontVariables} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SIMPLE_MODE_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col font-body antialiased">
        <I18nProvider initialLocale={locale}>
        <SimpleModeProvider>
          <AuthProvider>
            <SiteHeader />
            <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <SiteFooter />
            <LoginDialog />
          </AuthProvider>
        </SimpleModeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
