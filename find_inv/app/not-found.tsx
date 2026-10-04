import Link from "next/link";
import { CutoutText } from "@/components/cutout-text";
import { PageBackdrop } from "@/components/page-backdrop";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <PageBackdrop layout="corner-left">
      <div className="mx-auto max-w-content px-4 py-24 sm:px-6 text-center">
        <CutoutText as="h1" size="section" text={t.notFound.title} />
        <p className="mt-6 max-w-[50ch] mx-auto text-lg text-muted">
          {t.notFound.lead}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className={buttonVariants({ variant: "primary" })}>
            {t.common.homepage}
          </Link>
          <Link href="/biblioteka" className={buttonVariants({ variant: "secondary" })}>
            {t.notFound.library}
          </Link>
        </div>
      </div>
    </PageBackdrop>
  );
}
