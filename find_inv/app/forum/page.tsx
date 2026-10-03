"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button } from "@/components/ui/button";
import { MOCK_FORUM_POSTS, type ForumPost, type ForumBadge } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<ForumBadge, string> = {
  user: "bg-sage text-deep",
  tester: "bg-butter text-ink",
  consultant: "bg-mint text-deep",
  admin: "bg-deep text-surface",
};

const BADGE_LABELS: Record<ForumBadge, string> = {
  user: "Mieszkaniec",
  tester: "Tester",
  consultant: "Konsultant",
  admin: "Admin",
};

function PostItem({ post }: { post: ForumPost }) {
  return (
    <article
      aria-labelledby={`post-${post.id}`}
      className={cn(
        "border-(length:--bw) border-deep bg-surface p-5 shadow-paper",
        post.parentId !== null && "ml-8 border-l-4 border-l-leaf",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-bold text-deep">{post.authorName}</span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-deep px-2 py-0.5 text-xs font-bold",
            BADGE_STYLES[post.badge],
          )}
        >
          {BADGE_LABELS[post.badge]}
        </span>
        <time dateTime={post.createdAt} className="text-sm text-muted">
          {new Date(post.createdAt).toLocaleString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          })}
        </time>
      </div>
      <p id={`post-${post.id}`} className="mt-3">
        {post.content}
      </p>
    </article>
  );
}

export default function ForumPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>(MOCK_FORUM_POSTS);
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    document.title = "Forum dyskusyjne – HubMI";
    return () => { document.title = "HubMI – znajdź rozwiązanie, które już działa"; };
  }, []);

  function addPost() {
    const content = newContent.trim();
    if (!content) return;
    const newPost: ForumPost = {
      id: Date.now(),
      parentId: null,
      content,
      authorName: user?.name ?? "Gość",
      badge: (user?.role as ForumBadge) ?? "user",
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [...prev, newPost]);
    setNewContent("");
  }

  const topLevel = posts.filter((p) => p.parentId === null);
  const getReplies = (id: number) => posts.filter((p) => p.parentId === id);

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Forum dyskusyjne" />
      <p className="mt-4 max-w-[60ch] text-lg">
        Miejsce do wymiany doświadczeń, szukania partnerów i dzielenia się wiedzą o innowacjach społecznych.
      </p>

      {/* Nowy post */}
      <div className="mt-8 max-w-2xl border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
        <h2 className="flex items-center gap-2 font-bold text-deep">
          <MessageSquare className="size-5" aria-hidden="true" />
          Dodaj wpis
        </h2>
        <div className="mt-3 flex gap-3">
          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Podziel się doświadczeniem lub zadaj pytanie…"
            aria-label="Treść wpisu"
            className="flex-1 resize-y rounded-ui border-(length:--bw) border-deep bg-paper p-3 text-base"
          />
          <Button onClick={addPost} disabled={!newContent.trim()} className="self-end">
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only">Wyślij</span>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          {user
            ? `Postujesz jako ${user.name} (${user.role})`
            : "Zaloguj się, żeby dodawać wpisy pod swoim imieniem."}
        </p>
      </div>

      {/* Wątki */}
      <section aria-label="Wątki forum" className="mt-10 max-w-2xl space-y-6">
        {topLevel.map((post) => (
          <div key={post.id} className="space-y-3">
            <PostItem post={post} />
            {getReplies(post.id).map((reply) => (
              <PostItem key={reply.id} post={reply} />
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
