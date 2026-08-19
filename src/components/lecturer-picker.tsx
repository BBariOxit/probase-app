'use client';

import { useState } from 'react';
import { ChevronsUpDown, Loader2, Search, UserSearch } from 'lucide-react';
import { useLecturerDirectory } from '@/lib/api/lecturers';
import type { LecturerDirectoryEntry } from '@/lib/api/types';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/empty-state';
import { StatusPill } from '@/components/status-pill';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

/** Enough to fill the panel; anything past it is found by typing, not scrolling. */
const PAGE_SIZE = 20;

/** A supervisor's name as it is said out loud. */
export function lecturerName(lecturer: {
  fullName: string;
  academicTitle: string | null;
}): string {
  return lecturer.academicTitle
    ? `${lecturer.academicTitle} ${lecturer.fullName}`
    : lecturer.fullName;
}

/**
 * Choosing who to send an idea to.
 *
 * A panel rather than a dropdown, because this is not picking a value off a
 * list — it is the decision the whole proposal rests on, and the things that
 * inform it (what somebody researches, how much they are already supervising)
 * do not fit on one line of a select. A student who picks the one name they
 * recognise is how a proposal ends up with the wrong reader.
 *
 * A lecturer already at their ceiling is shown, and is still selectable. The API
 * refuses the *acceptance*, not the asking, and a quota can be raised — so
 * greying them out would hide a supervisor who might be exactly right and could
 * say yes next week. The warning is there so the choice is made knowingly.
 */
export function LecturerPicker({
  id,
  value,
  onChange,
  invalid = false,
  disabled = false,
}: {
  id?: string;
  value: LecturerDirectoryEntry | null;
  onChange: (lecturer: LecturerDirectoryEntry) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        id={id}
        type="button"
        variant="outline"
        size="lg"
        disabled={disabled}
        aria-invalid={invalid}
        aria-haspopup="dialog"
        className="w-full justify-between font-normal"
        onClick={() => setOpen(true)}
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {value ? lecturerName(value) : 'Chọn giảng viên'}
        </span>
        <ChevronsUpDown className="text-muted-foreground" />
      </Button>

      {/* Mounted only while open: the directory query belongs to the panel, and
          a closed one on every form would fetch a page nobody asked to see. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
          {open && (
            <Panel
              selectedId={value?.id ?? null}
              onPick={(lecturer) => {
                onChange(lecturer);
                setOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Panel({
  selectedId,
  onPick,
}: {
  selectedId: number | null;
  onPick: (lecturer: LecturerDirectoryEntry) => void;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search);
  const { data, isPending, error } = useLecturerDirectory({
    q: debounced || undefined,
    limit: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  // No pager in here on purpose: a panel you page through is one you are
  // scanning, and scanning forty names is what the search box is for.
  const unlisted = data ? data.total - items.length : 0;

  return (
    <>
      <DialogHeader className="gap-1 border-b p-4">
        <DialogTitle>Chọn giảng viên hướng dẫn</DialogTitle>
        <DialogDescription>
          Đề xuất sẽ được gửi riêng cho người bạn chọn.
        </DialogDescription>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mã giảng viên…"
            className="h-9 pl-8"
            aria-label="Tìm giảng viên"
          />
        </div>
      </DialogHeader>

      <div className="max-h-[50vh] overflow-y-auto">
        {error && (
          <p className="px-4 py-6 text-sm text-destructive">
            Không tải được danh sách giảng viên.
          </p>
        )}

        {isPending && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && !error && items.length === 0 && (
          <EmptyState
            icon={UserSearch}
            title={
              debounced
                ? 'Không có giảng viên nào khớp từ khoá này.'
                : 'Chưa có giảng viên nào trong hệ thống.'
            }
          />
        )}

        <ul className="divide-y">
          {items.map((lecturer) => (
            <li key={lecturer.id}>
              <button
                type="button"
                onClick={() => onPick(lecturer)}
                aria-current={lecturer.id === selectedId}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 aria-[current=true]:bg-muted/60"
              >
                <UserAvatar
                  name={lecturer.fullName}
                  src={lecturer.avatarUrl}
                  className="mt-0.5 size-9"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">
                      {lecturerName(lecturer)}
                    </span>
                    <MentoringPill lecturer={lecturer} />
                  </div>
                  {/*
                    The one field that tells two names apart. Clamped rather
                    than truncated: a research area is a list, and the first
                    half of the first item identifies nothing.
                  */}
                  {lecturer.researchInterests && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {lecturer.researchInterests}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {unlisted > 0 && (
        <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
          Còn {unlisted} giảng viên khác — gõ tên để tìm.
        </p>
      )}
    </>
  );
}

/**
 * How much this person is already supervising, and only when it changes the
 * decision.
 *
 * Silent when the faculty set no ceiling, because "4 nhóm" against no limit is a
 * number with nothing to compare it to — and a row of them would turn the panel
 * into a table of statistics rather than a list of people.
 */
function MentoringPill({ lecturer }: { lecturer: LecturerDirectoryEntry }) {
  const { groups, reserved, quota, atQuota } = lecturer.mentoring;

  if (quota === null) return null;

  return (
    <StatusPill
      label={`${groups + reserved}/${quota} nhóm`}
      tone={atQuota ? 'waiting' : 'idle'}
    />
  );
}
