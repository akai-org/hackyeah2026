import Link from "next/link";
import { Smile } from "lucide-react";

const linkClass = "inline-flex min-h-12 items-center font-bold text-leaf underline underline-offset-4 hover:text-deep";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t-(length:--bw) border-deep bg-sage">
      <Smile aria-hidden="true" className="simple-hidden absolute -bottom-10 -left-10 size-32 text-leaf opacity-60" />

      <div className="relative mx-auto grid max-w-content gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-deep">HubMI</p>
          <p className="mt-2 max-w-[38ch] text-muted">
            Małopolski Hub Innowacji Społecznych. Prototyp stworzony podczas HackYeah 2026.
          </p>
        </div>

        <div>
          <h2 id="kontakt" className="scroll-mt-6 text-lg font-bold text-deep">
            Kontakt
          </h2>
          <address className="mt-2 not-italic">
            <p>Regionalny Ośrodek Polityki Społecznej w Krakowie</p>
            <p className="mt-1 text-muted">Adres e-mail: do uzupełnienia</p>
            <p className="text-muted">Telefon: do uzupełnienia</p>
          </address>
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
