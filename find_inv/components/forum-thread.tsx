"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, CircleAlert, MessageSquareReply, Send, Tag } from "lucide-react";

import { RoleBadge } from "@/components/role-badge";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { type ForumPost } from "@/data/mock";
import { apiFetch, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import { formatDateTime } from "@/lib/i18n/format";

function nowLocalIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
}

/** Post z backendu (/api/forum, camelCase, czas UTC bez strefy). */
interface ApiForumPost {
  id: number;
  parentId: number | null;
  content: string;
  authorName: string;
  badge: ForumPost["badge"];
  createdAt: string | null;
}

function fromApi(post: ApiForumPost): ForumPost {
  const utc = post.createdAt ? new Date(`${post.createdAt}Z`) : new Date();
  const local = new Date(utc.getTime() - utc.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
  return {
    id: post.id,
    parent_id: post.parentId,
    content: post.content,
    author_name: post.authorName,
    badge: post.badge,
    created_at: local,
  };
}

const fieldClass =
  "mt-2 w-full rounded-ui border-(length:--bw) bg-surface px-4 text-base text-foreground placeholder:text-muted";

interface Innovation {
  title: string;
  tags: string[];
}

interface Props {
  innovationId: number;
  /** Gdy true: bez back-linku i tytułu, montowany wewnątrz strony innowacji. */
  embedded?: boolean;
  /** Przekazana z zewnątrz (embedded) — nie trzeba fetch-ować. */
  innovation?: Innovation;
}

export function ForumThread({ innovationId, embedded, innovation: innovationProp }: Props) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const f = t.forum;
  const ids = useId();
  const toast = useToast();

  const [innovation, setInnovation] = useState<Innovation | null>(innovationProp ?? null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [nickname, setNickname] = useState(user?.name ?? "");
  const [usedInnovation, setUsedInnovation] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const [isAssignedTester, setIsAssignedTester] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState(false);
  const [focusPost, setFocusPost] = useState<number | null>(null);

  const commentRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (innovationProp) return;
    apiFetch<Innovation>(`/api/innovations/${innovationId}`)
      .then((data) => {
        if (data) {
          setInnovation(data);
          if (!embedded) document.title = f.discussionTitle(data.title);
        }
      })
      .catch(() => {});
    return () => {
      if (!embedded) document.title = t.meta.title;
    };
  }, [innovationId, innovationProp, embedded, f, t.meta.title]);

  useEffect(() => {
    apiFetch<ApiForumPost[]>(`/api/forum?innovation_id=${innovationId}`)
      .then((saved) => setPosts(saved.map(fromApi)))
      .catch(() => {});
  }, [innovationId]);

  useEffect(() => {
    if (!user || (user.role !== "tester" && user.role !== "admin")) return;
    apiFetch<{ assigned: boolean }>(`/api/innovations/${innovationId}/tester-status`)
      .then((data) => setIsAssignedTester(data.assigned))
      .catch(() => {});
  }, [innovationId, user]);

  useEffect(() => {
    if (focusPost === null) return;
    document.getElementById(`${ids}-post-${focusPost}`)?.focus();
  }, [focusPost, ids]);

  useEffect(() => {
    if (replyingTo !== null) replyRef.current?.focus();
  }, [replyingTo]);

  function nextId() {
    return Math.max(0, ...posts.map((p) => p.id)) + 1;
  }

  const authorName = nickname.trim() || user?.name || f.guest;
  // Badge "tester" pokazuje się tylko, gdy tester jest przypisany do tej innowacji.
  const effectiveRole = user?.role === "tester" && !isAssignedTester ? "user" : user?.role;
  const authorBadge = effectiveRole ?? ("user" as const);

  /** Zapis w bazie; bez backendu post zostaje tylko lokalnie. */
  async function savePost(content: string, parentId: number | null): Promise<ForumPost> {
    try {
      const saved = await apiPost<ApiForumPost>("/api/forum", {
        content,
        parentId,
        innovationId,
        authorName,
        badge: authorBadge,
      });
      return fromApi(saved);
    } catch {
      return { id: nextId(), parent_id: parentId, content, author_name: authorName, badge: authorBadge, created_at: nowLocalIso() };
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      setCommentError(true);
      commentRef.current?.focus();
      return;
    }
    const post = await savePost(comment.trim(), null);
    const id = post.id;
    setPosts((prev) => [...prev, post]);
    setComment("");
    setCommentError(false);
    setFocusPost(id);
    toast.show(f.commentAdded);
  }

  async function addReply(e: React.FormEvent, parentId: number) {
    e.preventDefault();
    if (!reply.trim()) {
      setReplyError(true);
      replyRef.current?.focus();
      return;
    }
    const post = await savePost(reply.trim(), parentId);
    const id = post.id;
    setPosts((prev) => [...prev, post]);
    setReply("");
    setReplyError(false);
    setReplyingTo(null);
    setFocusPost(id);
    toast.show(f.replyAdded);
  }

  const threads = posts
    .filter((p) => p.parent_id === null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const wrapperClass = embedded
    ? ""
    : "mx-auto max-w-content px-4 py-12 sm:px-6";

  return (
    <div className={wrapperClass}>
      {/* Back link — tylko w widoku pełnoekranowym */}
      {!embedded && (
        <Link
          href={`/innowacje/${innovationId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {innovation ? f.backTo(innovation.title) : f.backToInnovation}
        </Link>
      )}

      {/* Header — tylko w widoku pełnoekranowym */}
      {!embedded && (
        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-widest text-muted">{f.discussion}</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">
            {innovation?.title ?? f.loadingShort}
          </h1>
        </div>
      )}

      {/* Tags + link — tylko w widoku pełnoekranowym */}
      {!embedded && innovation && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {innovation.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label={f.innovationTags}>
              {innovation.tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-primary bg-background px-3 py-1 text-sm text-primary"
                >
                  <Tag className="size-3" aria-hidden="true" />
                  {t.tags[tag] ?? tag}
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/innowacje/${innovationId}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-ui border-2 border-border bg-surface px-4 py-2 text-sm font-bold text-foreground shadow-raised hover:bg-primary/10"
          >
            {f.innovationDetails}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* Comment form (sidebar) */}
        <aside aria-labelledby={`${ids}-nowy`} className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:col-start-2 lg:row-start-1">
          <form onSubmit={addComment} noValidate className="border-(length:--bw) border-border bg-secondary p-5 sm:p-6">
            <h2 id={`${ids}-nowy`} className="text-xl font-bold text-foreground">
              {f.join}
            </h2>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-base">
              <span>{f.writingAs}</span>
              <span className="font-bold text-foreground">{authorName}</span>
              <RoleBadge role={authorBadge} />
            </p>

            <label htmlFor={`${ids}-nick`} className="mt-5 block font-bold text-foreground">
              {f.nick}
            </label>
            <input
              id={`${ids}-nick`}
              type="text"
              autoComplete="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder={f.nickPlaceholder}
              className={fieldClass}
            />

            <div className="mt-4">
              {usedInnovation ? (
                <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-foreground">
                  {f.confirmed(usedCount)}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => { setUsedInnovation(true); setUsedCount((c) => c + 1); }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-ui border-(length:--bw) border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-primary/10"
                >
                  {f.usedIt}
                </button>
              )}
            </div>

            <label htmlFor={`${ids}-komentarz`} className="mt-5 block font-bold text-foreground">
              {f.yourComment}
            </label>
            <textarea
              ref={commentRef}
              id={`${ids}-komentarz`}
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (e.target.value.trim()) setCommentError(false);
              }}
              aria-invalid={commentError || undefined}
              aria-describedby={commentError ? `${ids}-blad` : undefined}
              placeholder={f.commentPlaceholder}
              className={cn(fieldClass, "min-h-28 py-3", commentError ? "border-destructive" : "border-border")}
            />
            {commentError && (
              <p id={`${ids}-blad`} className="mt-3 flex items-start gap-2 font-bold text-destructive">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                {f.commentError}
              </p>
            )}
            <Button type="submit" className="mt-5 w-full">
              <Send aria-hidden="true" />
              {f.addComment}
            </Button>
          </form>
        </aside>

        {/* Thread posts */}
        <section aria-labelledby={`${ids}-watki`} className="lg:col-start-1 lg:row-start-1">
          <h2 id={`${ids}-watki`} className="sr-only">{f.comments}</h2>

          {threads.length === 0 && (
            <p className="text-muted">{f.noComments}</p>
          )}

          <ul className="grid gap-6">
            {threads.map((post) => {
              const replies = posts
                .filter((p) => p.parent_id === post.id)
                .sort((a, b) => a.created_at.localeCompare(b.created_at));
              const replyFieldId = `${ids}-odpowiedz-${post.id}`;

              return (
                <li key={post.id}>
                  <article
                    id={`${ids}-post-${post.id}`}
                    tabIndex={-1}
                    aria-label={f.commentFrom(post.author_name)}
                    className={cn(
                      "border-(length:--bw) border-border bg-surface p-5 shadow-raised sm:p-6",
                      focusPost === post.id && "appear",
                    )}
                  >
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold text-foreground">{post.author_name}</span>
                      {post.badge !== "user" && <RoleBadge role={post.badge} />}
                      <time dateTime={post.created_at} className="text-sm text-muted">
                        {formatDateTime(post.created_at, locale)}
                      </time>
                    </p>
                    <p className="mt-2 max-w-[70ch] whitespace-pre-line">{post.content}</p>

                    {replies.length > 0 && (
                      <ul aria-label={f.repliesLabel} className="mt-4 grid gap-4">
                        {replies.map((r) => (
                          <li
                            key={r.id}
                            id={`${ids}-post-${r.id}`}
                            tabIndex={-1}
                            className={cn(
                              "border-l-4 border-secondary bg-background py-3 pr-3 pl-4",
                              focusPost === r.id && "appear",
                            )}
                          >
                            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-bold text-foreground">{r.author_name}</span>
                              {r.badge !== "user" && <RoleBadge role={r.badge} />}
                              <time dateTime={r.created_at} className="text-sm text-muted">
                                {formatDateTime(r.created_at, locale)}
                              </time>
                            </p>
                            <p className="mt-2 max-w-[70ch] whitespace-pre-line">{r.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}

                    {replyingTo === post.id ? (
                      <form onSubmit={(e) => addReply(e, post.id)} noValidate className="mt-5">
                        <label htmlFor={replyFieldId} className="block font-bold text-foreground">
                          {f.yourReply}
                        </label>
                        <textarea
                          ref={replyRef}
                          id={replyFieldId}
                          rows={3}
                          value={reply}
                          onChange={(e) => {
                            setReply(e.target.value);
                            if (e.target.value.trim()) setReplyError(false);
                          }}
                          aria-invalid={replyError || undefined}
                          className={cn(fieldClass, "min-h-24 py-3", replyError ? "border-destructive" : "border-border")}
                        />
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Button type="submit">
                            <Send aria-hidden="true" />
                            {f.reply}
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => setReplyingTo(null)}>
                            {t.common.cancel}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setReplyingTo((cur) => (cur === post.id ? null : post.id))}
                        className="mt-4"
                      >
                        <MessageSquareReply aria-hidden="true" />
                        {f.reply}
                      </Button>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <Toast message={toast.message} onClose={toast.hide} />
    </div>
  );
}
