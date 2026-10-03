"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, CornerDownRight } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { Button } from "@/components/ui/button";
import { apiFetch, apiPost } from "@/lib/api";
import { type ForumBadge } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface ForumPost {
  id: number;
  parentId: number | null;
  content: string;
  authorName: string;
  badge: ForumBadge;
  createdAt: string | null;
}

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

function PostItem({
  post,
  onReply,
}: {
  post: ForumPost;
  onReply?: (id: number) => void;
}) {
  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    : "";

  return (
    <article
      aria-labelledby={`post-${post.id}`}
      className={cn(
        "border-(length:--bw) border-deep bg-surface p-5 shadow-paper",
        post.parentId !== null && "ml-8 border-l-4 border-l-leaf",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-bold text-deep">{post.authorName}</span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-deep px-2 py-0.5 text-xs font-bold",
            BADGE_STYLES[post.badge],
          )}
        >
          {BADGE_LABELS[post.badge]}
        </span>
        {date && (
          <time dateTime={post.createdAt ?? ""} className="text-sm text-muted">
            {date}
          </time>
        )}
      </div>
      <p id={`post-${post.id}`} className="mt-3">
        {post.content}
      </p>
      {onReply && post.parentId === null && (
        <button
          onClick={() => onReply(post.id)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-leaf hover:underline font-bold"
          aria-label={`Odpowiedz na wpis użytkownika ${post.authorName}`}
        >
          <CornerDownRight className="size-3.5" aria-hidden="true" />
          Odpowiedz
        </button>
      )}
    </article>
  );
}

export default function ForumPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newContent, setNewContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = "Forum dyskusyjne – HubMI";
    return () => { document.title = "HubMI – znajdź rozwiązanie, które już działa"; };
  }, []);

  const loadPosts = useCallback(async () => {
    const data = await apiFetch<ForumPost[]>("/api/forum").catch(() => null);
    if (data) setPosts(data);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  function handleReply(id: number) {
    setReplyTo(id);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  async function addPost() {
    const content = newContent.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const created = await apiPost<ForumPost>("/api/forum", {
        content,
        authorName: user?.name ?? "Gość",
        badge: user?.role ?? "user",
        parentId: replyTo,
      });
      if (created) {
        setPosts((prev) => [...prev, created]);
      }
      setNewContent("");
      setReplyTo(null);
    } catch {
      // optimistic fallback
      setPosts((prev) => [...prev, {
        id: Date.now(),
        parentId: replyTo,
        content,
        authorName: user?.name ?? "Gość",
        badge: (user?.role as ForumBadge) ?? "user",
        createdAt: new Date().toISOString(),
      }]);
      setNewContent("");
      setReplyTo(null);
    } finally {
      setSending(false);
    }
  }

  const topLevel = posts.filter((p) => p.parentId === null);
  const getReplies = (id: number) => posts.filter((p) => p.parentId === id);
  const replyTarget = replyTo ? posts.find((p) => p.id === replyTo) : null;

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Forum dyskusyjne" />
      <p className="mt-4 max-w-[60ch] text-lg">
        Miejsce do wymiany doświadczeń, szukania partnerów i dzielenia się wiedzą o innowacjach społecznych.
      </p>

      <div className="mt-8 max-w-2xl border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
        <h2 className="flex items-center gap-2 font-bold text-deep">
          <MessageSquare className="size-5" aria-hidden="true" />
          {replyTo ? "Odpowiedz na wpis" : "Dodaj wpis"}
        </h2>
        {replyTarget && (
          <div className="mt-3 rounded-ui border-(length:--bw) border-sage bg-paper px-4 py-2 text-sm text-muted">
            <span className="font-bold">{replyTarget.authorName}:</span>{" "}
            {replyTarget.content.slice(0, 100)}{replyTarget.content.length > 100 ? "…" : ""}
            <button
              onClick={() => setReplyTo(null)}
              className="ml-2 text-xs underline"
            >
              Anuluj
            </button>
          </div>
        )}
        <div className="mt-3 flex gap-3">
          <textarea
            ref={textareaRef}
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addPost();
            }}
            placeholder="Podziel się doświadczeniem lub zadaj pytanie…"
            aria-label="Treść wpisu"
            className="flex-1 resize-y rounded-ui border-(length:--bw) border-deep bg-paper p-3 text-base"
          />
          <Button
            onClick={addPost}
            disabled={!newContent.trim() || sending}
            className="self-end"
          >
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only">Wyślij</span>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          {user
            ? `Postujesz jako ${user.name} (${user.role})`
            : "Zaloguj się, żeby dodawać wpisy pod swoim imieniem."}{" "}
          Ctrl+Enter aby wysłać.
        </p>
      </div>

      <section aria-label="Wątki forum" className="mt-10 max-w-2xl space-y-6">
        {topLevel.length === 0 && (
          <p className="py-12 text-center text-muted">Brak wpisów — bądź pierwszy!</p>
        )}
        {topLevel.map((post) => (
          <div key={post.id} className="space-y-3">
            <PostItem post={post} onReply={handleReply} />
            {getReplies(post.id).map((reply) => (
              <PostItem key={reply.id} post={reply} />
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
