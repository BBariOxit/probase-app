'use client';

import { useState } from 'react';
import { CircleHelp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import type { CatalogueInput } from '@/lib/api/master-data';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LucideIcon } from 'lucide-react';

/** Anything with a name and a code, which is both catalogues the office keeps. */
export interface CatalogueItem {
  id: number;
  name: string;
  code: string;
}

/**
 * Chuyên ngành and Loại đồ án are the same screen twice.
 *
 * Both are a name, a code, and a count of what depends on them; both refuse
 * deletion while anything still does. Writing them separately would have been
 * two copies of one table that drift the first time either is touched — so what
 * differs is passed in, and what differs is only the words and where the count
 * comes from.
 */
export function CatalogueManager<T extends CatalogueItem>({
  icon,
  title,
  noun,
  codeHint,
  items,
  isPending,
  error,
  usage,
  onCreate,
  onUpdate,
  onDelete,
}: {
  icon: LucideIcon;
  /** The heading over this block — both catalogues share one screen. */
  title: string;
  /** Lower case, used mid-sentence: "Thêm chuyên ngành", "Xoá loại đồ án?" */
  noun: string;
  /** What the code is for, shown on demand rather than printed above the table. */
  codeHint: string;
  items: T[] | undefined;
  isPending: boolean;
  error: unknown;
  /**
   * What is already using this row, and therefore whether it can go. Returning
   * a count of zero is what enables the delete button — the API enforces the
   * same rule, so a screen that guessed would offer a button that fails.
   */
  usage: (item: T) => { count: number; label: string };
  onCreate: (input: CatalogueInput) => Promise<unknown>;
  onUpdate: (input: CatalogueInput & { id: number }) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  return (
    /* No width of its own: two of these share a screen, and how much room each
       gets is the page's decision rather than the block's. */
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold tracking-tight">
          {title}
        </h2>
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus />
          Thêm {noun}
        </Button>
      </div>

      {error != null && (
        <p className="text-sm text-destructive">Không tải được danh sách.</p>
      )}

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Tên</TableHead>
                <TableHead className="w-28">
                  {/*
                    What the code is for used to be a line of grey text above
                    the table, permanently, for everyone who had already read
                    it. It belongs to this column and to the moment somebody
                    wonders about it.
                  */}
                  <span className="inline-flex items-center gap-1">
                    Mã
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            aria-label={`Mã ${noun} dùng để làm gì?`}
                            className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          />
                        }
                      >
                        <CircleHelp className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-xs text-pretty"
                      >
                        {codeHint} Dùng để đối chiếu khi nhập danh sách, nên đặt
                        ngắn và không đổi về sau.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                </TableHead>
                <TableHead className="w-32">Đang dùng</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => {
                const used = usage(item);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {item.code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {used.count > 0 ? used.label : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Sửa ${item.name}`}
                          onClick={() => setEditing(item)}
                        >
                          <Pencil />
                        </Button>
                        {/*
                          Hidden rather than disabled once something depends on
                          it: a greyed button invites hunting for the trick that
                          enables it, and the count in the column beside it has
                          already given the reason.
                        */}
                        {used.count === 0 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Xoá ${item.name}`}
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {isPending && (
          <div className="flex justify-center py-14">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && items?.length === 0 && (
          <EmptyState
            icon={icon}
            title={`Chưa có ${noun} nào.`}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing('new')}
              >
                <Plus />
                Thêm {noun} đầu tiên
              </Button>
            }
          />
        )}
      </div>

      {editing && (
        <CatalogueDialog
          noun={noun}
          codeHint={codeHint}
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) =>
            editing === 'new'
              ? onCreate(input)
              : onUpdate({ ...input, id: editing.id })
          }
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Xoá ${noun}?`}
        description={`"${deleting?.name}" sẽ bị xoá khỏi danh mục. Không thể hoàn tác.`}
        confirmLabel="Xoá"
        onConfirm={() => onDelete(deleting!.id)}
      />
    </section>
  );
}

/**
 * One dialog for adding and for renaming.
 *
 * The code is editable on an existing row even though changing it is a bigger
 * deal than changing a name — a roster import matches on it. The screen says so
 * rather than locking the field: the office is the only caller, and a code
 * genuinely typed wrong on the day it was created has to be fixable.
 */
function CatalogueDialog({
  noun,
  codeHint,
  item,
  onClose,
  onSubmit,
}: {
  noun: string;
  codeHint: string;
  item: CatalogueItem | null;
  onClose: () => void;
  onSubmit: (input: CatalogueInput) => Promise<unknown>;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [code, setCode] = useState(item?.code ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const ready = name.trim() !== '' && code.trim() !== '';

  async function submit() {
    setPending(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), code: code.trim() });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? `Sửa ${noun}` : `Thêm ${noun}`}</DialogTitle>
          <DialogDescription>
            {item
              ? 'Đổi mã sẽ ảnh hưởng tới các file nhập danh sách đang dùng mã cũ.'
              : `Mã sẽ được viết hoa tự động.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormError message={error} />

          <div className="space-y-2">
            <Label htmlFor="catalogue-name">Tên</Label>
            <Input
              id="catalogue-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalogue-code">Mã</Label>
            <p className="-mt-1 text-xs text-muted-foreground">{codeHint}</p>
            <Input
              id="catalogue-code"
              className="w-40 uppercase"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={!ready || pending} onClick={submit}>
            {pending && <Loader2 className="animate-spin" />}
            {item ? 'Lưu' : 'Thêm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
