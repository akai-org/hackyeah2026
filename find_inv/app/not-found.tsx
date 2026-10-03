import Link from "next/link";
import { CutoutText } from "@/components/cutout-text";
import { PageBackdrop } from "@/components/page-backdrop";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageBackdrop layout="corner-left">
      <div className="mx-auto max-w-content px-4 py-24 sm:px-6 text-center">
        <CutoutText as="h1" size="section" text="Strona nie istnieje" />
        <p className="mt-6 max-w-[50ch] mx-auto text-lg text-muted">
          Podany adres nie istnieje. Może szukasz innowacji w Bibliotece?
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            Strona główna
          </Link>
          <Link href="/biblioteka" className={buttonVariants({ variant: "secondary" })}>
            Biblioteka innowacji
          </Link>
        </div>
      </div>
    </PageBackdrop>
  );
}
