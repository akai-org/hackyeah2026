"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, Info, Loader2, MessageSquareReply, Send } from "lucide-react";

import { RoleBadge } from "@/components/role-badge";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { type ForumPost } from "@/data/mock";
import { apiFetch, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import { formatDateTime } from "@/lib/i18n/format";

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

function nowLocalIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
}

const fieldClass =
  "mt-2 w-full rounded-ui border-(length:--bw) bg-surface px-4 text-base text-foreground placeholder:text-muted";

function PostBody({ post }: { post: ForumPost }) {
  const { locale } = useI18n();
  return (
    <>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold text-foreground">{post.author_name}</span>
        <RoleBadge role={post.badge} />
        <time dateTime={post.created_at} className="text-sm text-muted">
          {formatDateTime(post.created_at, locale)}
        </time>
      </p>
      <p className="mt-2 max-w-[70ch] whitespace-pre-line">{post.content}</p>
    </>
  );
}

export function ForumBoard() {
  const { user, openLogin } = useAuth();
  const { t } = useI18n();
  const f = t.forum;
  const cancel = t.common.cancel;
  const ids = useId();
  const toast = useToast();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [threadError, setThreadError] = useState<"title" | "content" | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState(false);
  const [focusPost, setFocusPost] = useState<number | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const author = { author_name: user?.name ?? f.guest, badge: user?.role ?? ("user" as const) };

  useEffect(() => {
    apiFetch<ApiForumPost[]>("/api/forum")
      .then((data) => setPosts(data.map(fromApi)))
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, []);

  const threads = posts
    .filter((post) => post.parent_id === null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Nowy wpis dostaje focus, żeby klawiatura i czytnik ekranu od razu do niego trafiły.
  useEffect(() => {
    if (focusPost === null) return;
    document.getElementById(`${ids}-wpis-${focusPost}`)?.focus();
  }, [focusPost, ids]);

  useEffect(() => {
    if (replyingTo !== null) replyRef.current?.focus();
  }, [replyingTo]);

  function nextId() {
    return Math.max(0, ...posts.map((post) => post.id)) + 1;
  }

  async function savePost(content: string, parentId: number | null, title?: string): Promise<ForumPost> {
    try {
      const saved = await apiPost<ApiForumPost>("/api/forum", {
        content: title ? `${title}\n\n${content}` : content,
        parentId,
        authorName: author.author_name,
        badge: author.badge,
      });
      return { ...fromApi(saved), title: title };
    } catch {
      return { id: nextId(), parent_id: parentId, title, content, created_at: nowLocalIso(), ...author };
    }
  }

  async function addThread(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setThreadError("title");
      titleRef.current?.focus();
      return;
    }
    if (!content.trim()) {
      setThreadError("content");
      contentRef.current?.focus();
      return;
    }
    const post = await savePost(content.trim(), null, title.trim());
    setPosts((current) => [...current, post]);
    setTitle("");
    setContent("");
    setThreadError(null);
    setFocusPost(post.id);
    toast.show(f.threadAdded);
  }

  async function addReply(event: React.FormEvent<HTMLFormElement>, parentId: number) {
    event.preventDefault();
    if (!reply.trim()) {
      setReplyError(true);
      replyRef.current?.focus();
      return;
    }
    const post = await savePost(reply.trim(), parentId);
    setPosts((current) => [...current, post]);
    setReply("");
    setReplyError(false);
    setReplyingTo(null);
    setFocusPost(post.id);
    toast.show(f.replyAdded);
  }

  function startReply(threadId: number) {
    setReplyingTo((current) => (current === threadId ? null : threadId));
    setReply("");
    setReplyError(false);
  }

  if (loadingPosts) {
    return (
      <div className="mt-10 flex items-center gap-2 text-muted" role="status">
        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        {f.loading}
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <aside aria-labelledby={`${ids}-nowy`} className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:col-start-2 lg:row-start-1">
        <form onSubmit={(e) => { void addThread(e); }} noValidate className="border-(length:--bw) border-border bg-secondary p-5 sm:p-6">
          <h2 id={`${ids}-nowy`} className="text-xl font-bold text-foreground">
            {f.ask}
          </h2>

          <p className="mt-3 flex flex-wrap items-center gap-2">
            <span>{f.writingAs}</span>
            <span className="font-bold text-foreground">{author.author_name}</span>
            <RoleBadge role={author.badge} />
          </p>
          {!user && (
            <p className="mt-2 flex items-start gap-2 text-muted">
              <Info aria-hidden="true" className="mt-1 size-5 shrink-0" />
              <span>
                <button
                  type="button"
                  onClick={openLogin}
                  className="cursor-pointer font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
                >
                  {f.login}
                </button>
                {f.loginHint}
              </span>
            </p>
          )}

          <label htmlFor={`${ids}-tytul`} className="mt-5 block font-bold text-foreground">
            {f.topic}
          </label>
          <input
            ref={titleRef}
            id={`${ids}-tytul`}
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (threadError === "title" && event.target.value.trim()) setThreadError(null);
            }}
            aria-invalid={threadError === "title" || undefined}
            aria-describedby={threadError === "title" ? `${ids}-blad` : undefined}
            placeholder={f.topicPlaceholder}
            className={cn(fieldClass, "min-h-12", threadError === "title" ? "border-destructive" : "border-border")}
          />

          <label htmlFor={`${ids}-tresc`} className="mt-5 block font-bold text-foreground">
            {f.content}
          </label>
          <textarea
            ref={contentRef}
            id={`${ids}-tresc`}
            rows={4}
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (threadError === "content" && event.target.value.trim()) setThreadError(null);
            }}
            aria-invalid={threadError === "content" || undefined}
            aria-describedby={threadError === "content" ? `${ids}-blad` : undefined}
            className={cn(fieldClass, "min-h-28 py-3", threadError === "content" ? "border-destructive" : "border-border")}
          />

          {threadError && (
            <p id={`${ids}-blad`} className="mt-3 flex items-start gap-2 font-bold text-destructive">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              {threadError === "title" ? f.topicError : f.contentError}
            </p>
          )}

          <Button type="submit" className="mt-5 w-full">
            <Send aria-hidden="true" />
            {f.addThread}
          </Button>
        </form>
      </aside>

      <section aria-labelledby={`${ids}-watki`} className="lg:col-start-1 lg:row-start-1">
        <h2 id={`${ids}-watki`} className="sr-only">
          {f.threads}
        </h2>
        <ul className="grid gap-8">
          {threads.map((thread) => {
            const replies = posts
              .filter((post) => post.parent_id === thread.id)
              .sort((a, b) => a.created_at.localeCompare(b.created_at));
            const replyFieldId = `${ids}-odpowiedz-${thread.id}`;

            return (
              <li key={thread.id}>
                <article
                  aria-labelledby={`${ids}-wpis-${thread.id}`}
                  className={cn(
                    "border-(length:--bw) border-border bg-surface p-5 shadow-raised sm:p-6",
                    focusPost === thread.id && "appear",
                  )}
                >
                  <h3 id={`${ids}-wpis-${thread.id}`} tabIndex={-1} className="text-xl font-bold text-foreground">
                    {thread.title}
                  </h3>
                  <div className="mt-3">
                    <PostBody post={thread} />
                  </div>

                  <p className="mt-5 text-sm font-bold text-muted">{f.replies(replies.length)}</p>
                  {replies.length > 0 && (
                    <ul aria-label={f.repliesIn(thread.title ?? "")} className="mt-3 grid gap-4">
                      {replies.map((post) => (
                        <li
                          key={post.id}
                          id={`${ids}-wpis-${post.id}`}
                          tabIndex={-1}
                          className={cn(
                            "border-l-4 border-secondary bg-background py-3 pr-3 pl-4",
                            focusPost === post.id && "appear",
                          )}
                        >
                          <PostBody post={post} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {replyingTo === thread.id ? (
                    <form onSubmit={(event) => { void addReply(event, thread.id); }} noValidate className="mt-5">
                      <label htmlFor={replyFieldId} className="block font-bold text-foreground">
                        {f.yourReply}
                      </label>
                      <textarea
                        ref={replyRef}
                        id={replyFieldId}
                        rows={3}
                        value={reply}
                        onChange={(event) => {
                          setReply(event.target.value);
                          if (event.target.value.trim()) setReplyError(false);
                        }}
                        aria-invalid={replyError || undefined}
                        aria-describedby={replyError ? `${replyFieldId}-blad` : undefined}
                        className={cn(fieldClass, "min-h-24 py-3", replyError ? "border-destructive" : "border-border")}
                      />
                      {replyError && (
                        <p id={`${replyFieldId}-blad`} className="mt-2 flex items-start gap-2 font-bold text-destructive">
                          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                          {f.replyError}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Button type="submit">
                          <Send aria-hidden="true" />
                          {f.addReply}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setReplyingTo(null)}>
                          {cancel}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button type="button" variant="secondary" onClick={() => startReply(thread.id)} className="mt-5">
                      <MessageSquareReply aria-hidden="true" />
                      {f.reply}<span className="sr-only">{f.replyIn(thread.title ?? "")}</span>
                    </Button>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      <Toast message={toast.message} onClose={toast.hide} />
    </div>
  );
}
