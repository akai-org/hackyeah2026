"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, Info, MessageSquareReply, Send } from "lucide-react";

import { RoleBadge } from "@/components/role-badge";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { MOCK_FORUM_POSTS, type ForumPost } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Forum (mock): wpisy żyją w stanie komponentu, nic nie idzie do backendu.

const MONTHS = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];

/** „2026-10-03T11:00:00” → „3 października 2026, 11:00”. Bez Intl, żeby serwer i przeglądarka dały ten sam tekst. */
function formatDate(iso: string): string {
  const [date, time = ""] = iso.split("T");
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}, ${time.slice(0, 5)}`;
}

function nowLocalIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
}

function repliesLabel(count: number): string {
  if (count === 0) return "Brak odpowiedzi";
  return count === 1 ? "1 odpowiedź" : `${count} odpowiedzi`;
}

const fieldClass =
  "mt-2 w-full rounded-ui border-(length:--bw) bg-surface px-4 text-base text-ink placeholder:text-muted";

function PostBody({ post }: { post: ForumPost }) {
  return (
    <>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold text-deep">{post.author_name}</span>
        <RoleBadge role={post.badge} />
        <time dateTime={post.created_at} className="text-sm text-muted">
          {formatDate(post.created_at)}
        </time>
      </p>
      <p className="mt-2 max-w-[70ch] whitespace-pre-line">{post.content}</p>
    </>
  );
}

export function ForumBoard() {
  const { user, openLogin } = useAuth();
  const ids = useId();
  const toast = useToast();

  const [posts, setPosts] = useState<ForumPost[]>(MOCK_FORUM_POSTS);
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

  const author = { author_name: user?.name ?? "Gość", badge: user?.role ?? ("user" as const) };

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

  function addThread(event: React.FormEvent<HTMLFormElement>) {
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
    const id = nextId();
    setPosts((current) => [
      ...current,
      { id, parent_id: null, title: title.trim(), content: content.trim(), created_at: nowLocalIso(), ...author },
    ]);
    setTitle("");
    setContent("");
    setThreadError(null);
    setFocusPost(id);
    toast.show("Wątek dodany na górze listy.");
  }

  function addReply(event: React.FormEvent<HTMLFormElement>, parentId: number) {
    event.preventDefault();
    if (!reply.trim()) {
      setReplyError(true);
      replyRef.current?.focus();
      return;
    }
    const id = nextId();
    setPosts((current) => [
      ...current,
      { id, parent_id: parentId, content: reply.trim(), created_at: nowLocalIso(), ...author },
    ]);
    setReply("");
    setReplyError(false);
    setReplyingTo(null);
    setFocusPost(id);
    toast.show("Odpowiedź dodana.");
  }

  function startReply(threadId: number) {
    setReplyingTo((current) => (current === threadId ? null : threadId));
    setReply("");
    setReplyError(false);
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <aside aria-labelledby={`${ids}-nowy`} className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:col-start-2 lg:row-start-1">
        <form onSubmit={addThread} noValidate className="border-(length:--bw) border-deep bg-sage p-5 sm:p-6">
          <h2 id={`${ids}-nowy`} className="text-xl font-bold text-deep">
            Zadaj pytanie
          </h2>

          <p className="mt-3 flex flex-wrap items-center gap-2">
            <span>Piszesz jako</span>
            <span className="font-bold text-deep">{author.author_name}</span>
            <RoleBadge role={author.badge} />
          </p>
          {!user && (
            <p className="mt-2 flex items-start gap-2 text-muted">
              <Info aria-hidden="true" className="mt-1 size-5 shrink-0" />
              <span>
                <button
                  type="button"
                  onClick={openLogin}
                  className="cursor-pointer font-bold text-leaf underline underline-offset-4 hover:text-deep"
                >
                  Zaloguj się
                </button>
                , żeby pisać jako tester albo konsultant.
              </span>
            </p>
          )}

          <label htmlFor={`${ids}-tytul`} className="mt-5 block font-bold text-deep">
            Temat
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
            placeholder="Na przykład: jak znaleźć wolontariuszy na wsi?"
            className={cn(fieldClass, "min-h-12", threadError === "title" ? "border-alert" : "border-deep")}
          />

          <label htmlFor={`${ids}-tresc`} className="mt-5 block font-bold text-deep">
            Treść
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
            className={cn(fieldClass, "min-h-28 py-3", threadError === "content" ? "border-alert" : "border-deep")}
          />

          {threadError && (
            <p id={`${ids}-blad`} className="mt-3 flex items-start gap-2 font-bold text-alert">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              {threadError === "title" ? "Wpisz temat wątku." : "Wpisz treść pytania."}
            </p>
          )}

          <Button type="submit" className="mt-5 w-full">
            <Send aria-hidden="true" />
            Dodaj wątek
          </Button>
        </form>
      </aside>

      <section aria-labelledby={`${ids}-watki`} className="lg:col-start-1 lg:row-start-1">
        <h2 id={`${ids}-watki`} className="sr-only">
          Wątki
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
                    "border-(length:--bw) border-deep bg-surface p-5 shadow-paper sm:p-6",
                    focusPost === thread.id && "appear",
                  )}
                >
                  <h3 id={`${ids}-wpis-${thread.id}`} tabIndex={-1} className="text-xl font-bold text-deep">
                    {thread.title}
                  </h3>
                  <div className="mt-3">
                    <PostBody post={thread} />
                  </div>

                  <p className="mt-5 text-sm font-bold text-muted">{repliesLabel(replies.length)}</p>
                  {replies.length > 0 && (
                    <ul aria-label={`Odpowiedzi w wątku ${thread.title}`} className="mt-3 grid gap-4">
                      {replies.map((post) => (
                        <li
                          key={post.id}
                          id={`${ids}-wpis-${post.id}`}
                          tabIndex={-1}
                          className={cn(
                            "border-l-4 border-leaf bg-paper py-3 pr-3 pl-4",
                            focusPost === post.id && "appear",
                          )}
                        >
                          <PostBody post={post} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {replyingTo === thread.id ? (
                    <form onSubmit={(event) => addReply(event, thread.id)} noValidate className="mt-5">
                      <label htmlFor={replyFieldId} className="block font-bold text-deep">
                        Twoja odpowiedź
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
                        className={cn(fieldClass, "min-h-24 py-3", replyError ? "border-alert" : "border-deep")}
                      />
                      {replyError && (
                        <p id={`${replyFieldId}-blad`} className="mt-2 flex items-start gap-2 font-bold text-alert">
                          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                          Wpisz treść odpowiedzi.
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Button type="submit">
                          <Send aria-hidden="true" />
                          Dodaj odpowiedź
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setReplyingTo(null)}>
                          Anuluj
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button type="button" variant="secondary" onClick={() => startReply(thread.id)} className="mt-5">
                      <MessageSquareReply aria-hidden="true" />
                      Odpowiedz<span className="sr-only"> w wątku {thread.title}</span>
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
