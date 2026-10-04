"use client";

import { useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/admin/dialogs";
import { ErrorNote, LoadingRows, OfflineNote, useAdminData, useAdminI18n } from "@/components/admin/shared";
import { CutoutText } from "@/components/cutout-text";
import { RoleBadge } from "@/components/role-badge";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import type { Role } from "@/data/mock";
import { deleteForumPost, getForumPosts, type AdminForumPost } from "@/lib/admin-api";

const ROLES = new Set<string>(["user", "tester", "consultant", "admin"]);

function excerpt(text: string, length = 80) {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

export function AdminForumView() {
  const { data, offline, error, loading, update } = useAdminData(getForumPosts);
  const [deleting, setDeleting] = useState<AdminForumPost | null>(null);
  const toast = useToast();
  const { t, a, formatDate } = useAdminI18n();
  const f = a.forum;

  async function remove(post: AdminForumPost) {
    const { data: result } = await deleteForumPost(post.id);
    update((posts) => posts.filter((p) => p.id !== post.id && p.parent_id !== post.id));
    setDeleting(null);
    toast.show(result.replies_deleted ? f.deletedWithReplies(result.replies_deleted) : f.deleted);
  }

  const posts = data ?? [];
  const replies = (id: number) => posts.filter((p) => p.parent_id === id).length;

  return (
    <div>
      <CutoutText as="h1" size="section" text={t.admin.nav.forum} />
      <p className="mt-3 mb-8 max-w-[60ch] text-lg">
        {f.lead}
      </p>

      <OfflineNote offline={offline} />
      <ErrorNote message={error} />

      {loading && !data ? (
        <LoadingRows label={f.loading} />
      ) : posts.length === 0 ? (
        <p className="flex items-center gap-2 border-(length:--bw) border-border bg-surface p-6">
          <MessageSquare aria-hidden="true" className="size-5 text-muted" />
          {f.empty}
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => {
            const count = post.parent_id === null ? replies(post.id) : 0;
            return (
              <li key={post.id} className="border-(length:--bw) border-border bg-surface p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-bold text-foreground">{post.author_name}</span>
                  {ROLES.has(post.badge) && <RoleBadge role={post.badge as Role} />}
                  <span className="text-sm text-muted">{formatDate(post.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {post.parent_id !== null
                    ? f.reply
                    : post.innovation_title
                      ? f.commentUnder(post.innovation_title)
                      : f.thread}
                  {count > 0 && f.replies(count)}
                </p>
                <p className="mt-3 whitespace-pre-line">{post.content}</p>
                <Button type="button" variant="secondary" onClick={() => setDeleting(post)} className="mt-4 px-3 text-destructive">
                  <Trash2 aria-hidden="true" />
                  {f.deletePost}<span className="sr-only">: {excerpt(post.content, 40)}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {deleting && (
        <ConfirmDeleteDialog
          title={f.deleteTitle}
          what={`${deleting.author_name}: „${excerpt(deleting.content)}”`}
          consequences={
            replies(deleting.id) > 0
              ? f.withReplies(replies(deleting.id))
              : f.disappears
          }
          onConfirm={() => remove(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
      <Toast message={toast.message} onClose={toast.hide} />
    </div>
  );
}
