'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import {
  useRoundRequirements,
  useSetRoundRequirements,
} from '@/lib/api/master-data';
import type { RegistrationRound, SubmissionRequirement } from '@/lib/api/types';
import { DateField } from '@/components/date-field';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** One row being edited. `id` is absent until the office saves it. */
interface Row {
  id?: number;
  name: string;
  due: string;
  isRequired: boolean;
}

/**
 * The documents a faculty typically asks for, offered on an empty list.
 *
 * A suggestion and nothing more — every name is editable and any of them can be
 * removed. It exists because an empty list with only a "Thêm mục" button tells
 * the office nothing about what belongs in it, while these four say what shape
 * the answer takes in one glance.
 */
const SUGGESTED = ['Đề cương', 'Quyển báo cáo', 'Mã nguồn', 'Slide bảo vệ'];

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function toRow(requirement: SubmissionRequirement): Row {
  return {
    id: requirement.id,
    name: requirement.name,
    due: toDateInput(requirement.dueAt),
    isRequired: requirement.isRequired,
  };
}

/**
 * What one round's groups must hand in, and by when.
 *
 * Separate from the registration plan above it for a reason that is not
 * cosmetic: declaring an intake is what *creates* a round, so while that form is
 * being filled in there is no round for a requirement to belong to. This edits
 * rounds that already exist.
 *
 * Sent whole rather than row by row, like the plan itself — what the office
 * decides is "this is what Tốt nghiệp hands in", not three separate edits.
 */
export function RoundRequirementsEditor({
  round,
}: {
  round: RegistrationRound;
}) {
  const { data, isPending } = useRoundRequirements(round.id);
  const save = useSetRoundRequirements();
  const [draft, setDraft] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /*
    What the server said, until the office types something — then their draft,
    for good. Derived rather than copied into state by an effect: a refetch
    landing mid-edit would otherwise wipe what they were in the middle of
    writing.
  */
  const rows = draft ?? data?.map(toRow) ?? null;

  function edit(next: Row[]) {
    setSaved(false);
    setDraft(next);
  }

  function patch(index: number, changes: Partial<Row>) {
    edit(
      (rows ?? []).map((row, at) =>
        at === index ? { ...row, ...changes } : row,
      ),
    );
  }

  function add(name = '') {
    edit([...(rows ?? []), { name, due: '', isRequired: true }]);
  }

  function remove(index: number) {
    edit((rows ?? []).filter((_, at) => at !== index));
  }

  async function submit() {
    setError(null);
    setSaved(false);
    try {
      const next = await save.mutateAsync({
        roundId: round.id,
        requirements: (rows ?? []).map((row) => ({
          id: row.id,
          name: row.name.trim(),
          dueAt: new Date(row.due).toISOString(),
          isRequired: row.isRequired,
        })),
      });

      // Re-seeded from the answer so newly created rows pick up their ids.
      // Without it, saving twice would try to create them again and collide on
      // the name.
      setDraft(next.map(toRow));
      setSaved(true);
    } catch (err) {
      // The refusal worth reading comes from the API: a document groups have
      // already handed work in against cannot be taken off the list.
      setError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    }
  }

  if (isPending || rows === null) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const problems = rows.flatMap((row, index) => {
    if (row.name.trim() === '') return [`Mục ${index + 1}: chưa có tên.`];
    if (row.due === '') return [`"${row.name}": chưa có hạn nộp.`];

    return [];
  });

  const duplicated =
    new Set(rows.map((row) => row.name.trim().toLowerCase())).size !==
    rows.length;

  return (
    <div className="space-y-3">
      <FormError message={error} />

      {saved && (
        <p className="rounded-lg border border-status-success/30 bg-status-success-bg/40 px-3 py-2 text-sm">
          Đã lưu danh sách bài nộp.
        </p>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-3">
          <span className="text-sm text-muted-foreground">
            Chưa khai mục nào. Thường có:
          </span>
          {SUGGESTED.map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              onClick={() => add(name)}
            >
              <Plus />
              {name}
            </Button>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li
              key={row.id ?? `new-${index}`}
              className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
            >
              <div className="space-y-1.5">
                <Input
                  aria-label={`Tên mục ${index + 1}`}
                  placeholder="Đề cương"
                  value={row.name}
                  aria-invalid={row.name.trim() === ''}
                  onChange={(event) =>
                    patch(index, { name: event.target.value })
                  }
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-3.5 accent-primary"
                    checked={row.isRequired}
                    onChange={(event) =>
                      patch(index, { isRequired: event.target.checked })
                    }
                  />
                  Bắt buộc
                </label>
              </div>

              <DateField
                id={`due-${round.id}-${index}`}
                label="Hạn nộp"
                value={row.due}
                invalid={row.due === ''}
                onChange={(due) => patch(index, { due })}
              />

              <Button
                variant="ghost"
                size="icon"
                aria-label={`Xoá ${row.name || `mục ${index + 1}`}`}
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => add()}>
          <Plus />
          Thêm mục
        </Button>
      )}

      {duplicated && (
        <p className="text-sm text-destructive">
          Hai mục trùng tên — sinh viên sẽ không biết chọn cái nào.
        </p>
      )}

      {problems.map((problem) => (
        <p key={problem} className="text-sm text-destructive">
          {problem}
        </p>
      ))}

      <Button
        disabled={problems.length > 0 || duplicated || save.isPending}
        onClick={submit}
      >
        {save.isPending && <Loader2 className="animate-spin" />}
        Lưu danh sách
      </Button>
    </div>
  );
}
