import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { ForumBoard } from "@/components/forum-board";
import { ForumThread } from "@/components/forum-thread";
import { PageBackdrop } from "@/components/page-backdrop";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.forum };
}

export default async function ForumPage({ searchParams }: PageProps<"/forum">) {
  const params = await searchParams;
  const t = await getT();
  const innowacja = Array.isArray(params.innowacja) ? params.innowacja[0] : params.innowacja;
  const innovationId = innowacja ? Number(innowacja) : null;

  if (innovationId && !Number.isNaN(innovationId)) {
    return (
      <PageBackdrop layout="corner-left">
        <ForumThread innovationId={innovationId} />
      </PageBackdrop>
    );
  }

  return (
    <PageBackdrop layout="corner-left">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text={t.pages.forum.heading} />
        <p className="mt-4 max-w-[60ch] text-lg">
          {t.pages.forum.lead}
        </p>
        <ForumBoard />
      </div>
    </PageBackdrop>
  );
}
