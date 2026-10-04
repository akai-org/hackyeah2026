"use client";

import { useId, useState } from "react";
import { Archive, CircleAlert, CircleCheck, Loader2, MapPin, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";

import { ConfirmDeleteDialog, InnovationFormDialog, fieldClass } from "@/components/admin/dialogs";
import { CutoutText } from "@/components/cutout-text";
import {
  ErrorNote,
  LoadingRows,
  OfflineNote,
  STATUS_META,
  StatusBadge,
  useAdminData,
  useAdminI18n,
} from "@/components/admin/shared";
import { Toast, useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import type { AdminInnovation, InnovationStatus } from "@/data/admin.mock";
import { TAXONOMY_TAGS } from "@/data/mock";
import {
  deleteInnovation,
  getInnovation,
  getInnovations,
  saveInnovation,
  setInnovationStatus,
  type AdminInnovationFull,
  type InnovationAction,
  type InnovationFilters,
  type InnovationInput,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

// Etykiety akcji są w słowniku (admin.innovations.actions).
const ACTIONS: Array<{ action: InnovationAction; icon: typeof CircleCheck; hideFor: InnovationStatus }> = [
  { action: "approve", icon: CircleCheck, hideFor: "active" },
  { action: "flag-unmaintained", icon: CircleAlert, hideFor: "unmaintained" },
  { action: "archive", icon: Archive, hideFor: "archived" },
];

function Actions({
  item,
  busy,
  onAction,
  onEdit,
  onDelete,
}: {
  item: AdminInnovation;
  busy: string | null;
  onAction: (item: AdminInnovation, action: InnovationAction) => void;
  onEdit: (item: AdminInnovation) => void;
  onDelete: (item: AdminInnovation) => void;
}) {
  const { a } = useAdminI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.filter((entry) => entry.hideFor !== item.status).map(({ action, icon: Icon }) => {
        const pending = busy === `${item.id}:${action}`;
        return (
          <Button
            key={action}
            type="button"
            variant={action === "approve" ? "primary" : "secondary"}
            disabled={busy !== null}
            onClick={() => onAction(item, action)}
            className="min-h-12 px-3 text-base"
          >
            {pending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Icon aria-hidden="true" />}
            {a.innovations.actions[action].label}
            <span className="sr-only">: {item.title}</span>
          </Button>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        disabled={busy !== null}
        onClick={() => onEdit(item)}
        className="min-h-12 px-3 text-base"
      >
        {busy === `${item.id}:edit` ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Pencil aria-hidden="true" />}
        {a.innovations.edit}
        <span className="sr-only">: {item.title}</span>
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={busy !== null}
        onClick={() => onDelete(item)}
        className="min-h-12 px-3 text-base text-destructive"
      >
        <Trash2 aria-hidden="true" />
        {a.delete}
        <span className="sr-only">: {item.title}</span>
      </Button>
    </div>
  );
}

type Editing = { item: AdminInnovationFull | null } | null;

export function AdminInnovationsView({ initialStatus = "" }: { initialStatus?: string }) {
  const ids = useId();
  const [filters, setFilters] = useState<InnovationFilters>({ status: initialStatus });
  const [draftSearch, setDraftSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<AdminInnovation | null>(null);
  const toast = useToast();
  const { t, a, errorMessage, formatDate, tagLabel } = useAdminI18n();
  const ai = a.innovations;

  const { data, offline, error, loading, update } = useAdminData(() => getInnovations(filters), JSON.stringify(filters));

  function applyFilters(next: InnovationFilters) {
    setFilters(next);
  }

  async function handleAction(item: AdminInnovation, action: InnovationAction) {
    setBusy(`${item.id}:${action}`);
    setActionError(null);
    try {
      const { data: updated } = await setInnovationStatus(item.id, action);
      update((current) => ({
        ...current,
        items: current.items.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)),
      }));
      toast.show(ai.statusChanged(item.title, ai.actions[action].done));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function openEditor(item: AdminInnovation) {
    setBusy(`${item.id}:edit`);
    setActionError(null);
    try {
      const { data: full } = await getInnovation(item.id);
      setEditing({ item: full });
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleSave(input: InnovationInput) {
    const id = editing?.item?.id;
    const { data: saved } = await saveInnovation(input, id);
    update((current) =>
      id === undefined
        ? { items: [saved, ...current.items], total: current.total + 1 }
        : { ...current, items: current.items.map((row) => (row.id === saved.id ? { ...row, ...saved } : row)) },
    );
    setEditing(null);
    const index = saved.embedding === "skipped" ? ai.noEmbedding : "";
    toast.show(`${id === undefined ? ai.added(saved.title) : ai.saved(saved.title)}${index}`);
  }

  async function handleDelete(item: AdminInnovation) {
    await deleteInnovation(item.id);
    update((current) => ({ items: current.items.filter((row) => row.id !== item.id), total: current.total - 1 }));
    setDeleting(null);
    toast.show(ai.deleted(item.title));
  }

  const items = data?.items ?? [];
  const hasFilters = Boolean(filters.status || filters.tags || filters.search);

  return (
    <section aria-labelledby={`${ids}-tytul`}>
      <CutoutText as="h1" size="section" text={ai.title} id={`${ids}-tytul`} />
      <div className="mt-3 mb-8 flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-[60ch] text-lg">
          {ai.lead}
        </p>
        <Button type="button" onClick={() => setEditing({ item: null })} disabled={busy !== null}>
          <Plus aria-hidden="true" />
          {ai.add}
        </Button>
      </div>

      <form
        role="search"
        aria-label={ai.filter}
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ ...filters, search: draftSearch.trim() });
        }}
        className="mb-8 grid gap-4 border-(length:--bw) border-border bg-surface p-5 md:grid-cols-[1fr_auto_auto_auto] md:items-end"
      >
        <div>
          <label htmlFor={`${ids}-szukaj`} className="block font-bold text-foreground">
            {ai.search}
          </label>
          <input
            id={`${ids}-szukaj`}
            type="search"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder={ai.searchPlaceholder}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={`${ids}-status`} className="block font-bold text-foreground">
            {ai.status}
          </label>
          <select
            id={`${ids}-status`}
            value={filters.status ?? ""}
            onChange={(event) => applyFilters({ ...filters, status: event.target.value })}
            className={cn(fieldClass, "cursor-pointer md:w-52")}
          >
            <option value="">{ai.all}</option>
            {(Object.keys(STATUS_META) as InnovationStatus[]).map((status) => (
              <option key={status} value={status}>
                {a.status[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${ids}-tag`} className="block font-bold text-foreground">
            {ai.tag}
          </label>
          <select
            id={`${ids}-tag`}
            value={filters.tags ?? ""}
            onChange={(event) => applyFilters({ ...filters, tags: event.target.value })}
            className={cn(fieldClass, "cursor-pointer md:w-56")}
          >
            <option value="">{ai.allTags}</option>
            {TAXONOMY_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tagLabel(tag)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">
          <Search aria-hidden="true" />
          {t.common.search}
        </Button>
      </form>

      <OfflineNote offline={offline} />
      <ErrorNote message={error ?? actionError} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-bold text-foreground">
          {loading ? ai.loading : ai.found(items.length)}
        </p>
        {hasFilters && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDraftSearch("");
              applyFilters({});
            }}
          >
            <RotateCcw aria-hidden="true" />
            {ai.clearFilters}
          </Button>
        )}
      </div>

      {loading && !data ? (
        <LoadingRows label={ai.loadingList} />
      ) : items.length === 0 ? (
        <div className="border-(length:--bw) border-border bg-surface p-8">
          <CutoutText as="p" size="section" text={ai.emptyTitle} />
          <p className="mt-3">{ai.empty}</p>
        </div>
      ) : (
        <>
          {/* Szeroki ekran: tabela. */}
          <div className="hidden overflow-x-auto border-(length:--bw) border-border bg-surface lg:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{ai.caption(items.length)}</caption>
              <thead className="bg-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold text-foreground">{ai.colInnovation}</th>
                  <th scope="col" className="px-4 py-3 font-bold text-foreground">{ai.colStatus}</th>
                  <th scope="col" className="px-4 py-3 font-bold text-foreground">{ai.colAdded}</th>
                  <th scope="col" className="px-4 py-3 font-bold text-foreground">{ai.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-t-2 border-border/40 align-top",
                      item.status === "pending" && "shadow-[inset_4px_0_0_var(--color-warning)]",
                    )}
                  >
                    <th scope="row" className="max-w-md px-4 py-4 text-left font-normal">
                      <span className="block font-bold text-foreground">{item.title}</span>
                      <span className="mt-1 block text-muted">{item.short_desc}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden="true" className="size-4" />
                          {item.where_implemented || a.noData}
                        </span>
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full border border-primary bg-background px-2 text-primary">
                            {tagLabel(tag)}
                          </span>
                        ))}
                      </span>
                    </th>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap tabular-nums">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4">
                      <Actions item={item} busy={busy} onAction={handleAction} onEdit={openEditor} onDelete={setDeleting} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Wąski ekran: karty. */}
          <ul className="space-y-4 lg:hidden">
            {items.map((item) => (
              <li key={item.id} className="border-(length:--bw) border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-muted">{item.short_desc}</p>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted">
                  <MapPin aria-hidden="true" className="size-4" />
                  {item.where_implemented || a.noData} · {ai.addedOn(formatDate(item.created_at))}
                </p>
                <div className="mt-4">
                  <Actions item={item} busy={busy} onAction={handleAction} onEdit={openEditor} onDelete={setDeleting} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && <InnovationFormDialog item={editing.item} onSave={handleSave} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDeleteDialog
          title={ai.deleteTitle}
          what={deleting.title}
          consequences={ai.deleteConsequences}
          onConfirm={() => handleDelete(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
      <Toast message={toast.message} onClose={toast.hide} />
    </section>
  );
}
