import Link from "next/link";
import { Smile } from "lucide-react";

const linkClass = "inline-flex min-h-12 items-center font-bold text-leaf underline underline-offset-4 hover:text-deep";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t-(length:--bw) border-deep">
      <Smile aria-hidden="true" className="simple-hidden absolute -bottom-10 -left-10 size-32 text-leaf opacity-60" />

      <div className="relative mx-auto grid max-w-content gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-deep">HubMI</p>
          <p className="mt-2 max-w-[38ch] text-muted">
            Małopolski Hub Innowacji Społecznych. Prototyp stworzony podczas HackYeah 2026.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-deep">
            Kontakt
          </h2>
          <address className="mt-2 not-italic">
            <p>ROPS Kraków — Regionalny Ośrodek Polityki Społecznej</p>
            <p className="mt-1">ul. Piastowska 32, 30-070 Kraków</p>
            <p className="mt-1">
              <a href="https://rops.krakow.pl" className={linkClass}>
                rops.krakow.pl
              </a>
            </p>
          </address>
          <nav aria-label="Nawigacja stopki" className="mt-4">
            <ul className="space-y-1">
              {[
                { href: "/biblioteka", label: "Biblioteka innowacji" },
                { href: "/forum", label: "Forum" },
                { href: "/kreator", label: "Kreator pomysłów" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div>
          <h2 className="text-lg font-bold text-deep">Dostępność</h2>
          <ul className="mt-1">
            <li>
              <Link href="/deklaracja-dostepnosci" className={linkClass}>
                Deklaracja dostępności
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
