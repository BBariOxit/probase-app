'use client';

import { useState } from 'react';
import { ChevronDown, Loader2, ScrollText } from 'lucide-react';
import { useAuditActions, useAuditLogs } from '@/lib/api/audit';
import type { AuditLogEntry } from '@/lib/api/types';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { EmptyState } from '@/components/empty-state';
import { PaginationBar } from '@/components/pagination-bar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 25;

/**
 * What each action is, in words.
 *
 * Only the ones that exist today are named; anything else falls back to the raw
 * value rather than being hidden, because a log that silently drops the entries
 * it does not recognise is worse than one that shows an ugly string. Adding a
 * new audited action to the API therefore needs no change here to keep working.
 */
const ACTION_LABEL: Record<string, string> = {
  ASSIGN_GROUP_MEMBER: 'Khoa xếp sinh viên vào đề tài',
  UNASSIGN_GROUP_MEMBER: 'Khoa bỏ xếp sinh viên',
  FINALIZE_REGISTRATION_ROUND: 'Chốt phân bổ đợt',
  EXTEND_REGISTRATION_ROUND: 'Gia hạn đợt đăng ký',
  REMOVE_GROUP_MEMBER: 'Trưởng nhóm xoá thành viên',
};

const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * The trail: who did what, and what it looked like before and after.
 *
 * Read-only, and there is nothing anywhere that edits or deletes an entry — a
 * log somebody can tidy up answers no question worth asking. Entries are written
 * by whichever service performed the action, inside the same transaction, so one
 * cannot exist without the change it describes.
 */
export default function AuditLogPage() {
  const allowed = useRequireRole('ADMIN');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('ALL');

  const { data: actions } = useAuditActions();
  const { data, isPending, error } = useAuditLogs({
    page,
    limit: PAGE_SIZE,
    action: action === 'ALL' ? undefined : action,
  });

  if (!allowed) return null;

  const entries = data?.items ?? [];

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-64" aria-label="Lọc theo hành động">
            <SelectValue>
              {(value) =>
                value === 'ALL'
                  ? 'Mọi hành động'
                  : (ACTION_LABEL[value as string] ?? (value as string))
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi hành động</SelectItem>
            {/* Asked of the server rather than listed here, so a filter never
                offers a value with nothing behind it. */}
            {actions?.map((one) => (
              <SelectItem key={one} value={one}>
                {ACTION_LABEL[one] ?? one}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {data.total} bản ghi
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">Không tải được nhật ký.</p>
      )}

      <div className="overflow-hidden rounded-xl border">
        {isPending ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={
              action === 'ALL'
                ? 'Chưa có hoạt động nào được ghi lại.'
                : 'Không có bản ghi nào cho hành động này.'
            }
          />
        ) : (
          <ul className="divide-y">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Entry entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && (
        <PaginationBar
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/**
 * One line, with the before and after folded away.
 *
 * Those two are whatever the service that wrote the entry chose to record, so
 * they have no shape this screen could render into a sentence — and pretending
 * otherwise is how a log ends up describing the wrong change. Shown as they were
 * written, behind a toggle, because the summary line answers most questions and
 * the detail answers the rest.
 */
function Entry({ entry }: { entry: AuditLogEntry }) {
  const [open, setOpen] = useState(false);
  const detail = entry.oldValue ?? entry.newValue;

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
        <span className="font-medium">
          {ACTION_LABEL[entry.action] ?? entry.action}
        </span>
        <span className="text-muted-foreground">
          · {entry.user.fullName ?? entry.user.email}
        </span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
          {dateTimeFormat.format(new Date(entry.createdAt))}
        </span>
      </div>

      <p className="mt-0.5 text-xs text-muted-foreground">
        {entry.targetTable} #{entry.targetId}
      </p>

      {detail != null && (
        <>
          <Button
            variant="ghost"
            size="xs"
            className="mt-1.5 -ml-2 text-muted-foreground"
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown
              className={
                open
                  ? 'rotate-180 transition-transform'
                  : 'transition-transform'
              }
            />
            {open ? 'Ẩn chi tiết' : 'Chi tiết'}
          </Button>

          {open && (
            <div className="mt-2 space-y-2">
              {entry.oldValue != null && (
                <Snapshot label="Trước" value={entry.oldValue} />
              )}
              {entry.newValue != null && (
                <Snapshot label="Sau" value={entry.newValue} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {/* Scrolls inside its own box: an audit payload is arbitrary JSON and a
          long one must not push the page sideways. */}
      <pre className="overflow-x-auto rounded-lg border bg-muted/40 px-3 py-2 text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
