'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleHelp, Info, Loader2, Lock } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import {
  useProjectTypes,
  useSemesterRounds,
  useSemesters,
  useSetSemesterRounds,
} from '@/lib/api/master-data';
import type {
  ProjectType,
  RegistrationRound,
  RoundPlanInput,
} from '@/lib/api/types';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { cn } from '@/lib/utils';
import { DateField } from '@/components/date-field';
import { FormError } from '@/components/form-error';
import { StatusPill, type StatusTone } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * The phases in which a round's dates are still a schedule.
 *
 * Past these, moving the closing date is not an edit but a reopening, and the
 * API sends it through Gia hạn instead — where it acquires an author and a
 * reason. So the inputs lock rather than letting somebody type a change that
 * comes back refused.
 */
const SCHEDULE_EDITABLE = ['PREP', 'OPEN'];

const PHASE: Record<string, { label: string; tone: StatusTone }> = {
  PREP: { label: 'Chưa mở', tone: 'waiting' },
  OPEN: { label: 'Đang mở', tone: 'success' },
  EXTENDED: { label: 'Đang gia hạn', tone: 'active' },
  RECONCILING: { label: 'Đang phân bổ', tone: 'active' },
  FINALIZED: { label: 'Đã chốt', tone: 'idle' },
};

interface RowState {
  enabled: boolean;
  start: string;
  end: string;
  cohorts: string;
  /** Both optional: a deadline the faculty has not announced yet is simply blank. */
  midterm: string;
  final: string;
}

function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/**
 * Which intake does which kind of project this term, and between which dates.
 *
 * One form for the whole semester rather than a page per round, because that is
 * how a faculty announces it — a single notice covering all three kinds of
 * project. It is also what the API takes: the plan is sent whole, and declaring
 * an intake is what creates a round, so there is no separate "create round" step
 * to forget.
 */
export default function SemesterRoundsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const semesterId = Number(id);
  const allowed = useRequireRole('ADMIN');

  const { data: semesters } = useSemesters();
  const { data: projectTypes } = useProjectTypes();
  const { data: rounds, isPending } = useSemesterRounds(semesterId);

  const semester = semesters?.find((one) => one.id === semesterId);

  if (!allowed) return null;

  return (
    <div className="max-w-3xl space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        render={<Link href="/admin/hoc-ky" />}
      >
        <ArrowLeft />
        Học kỳ
      </Button>

      <div className="space-y-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Đợt đăng ký · {semester?.name ?? `Học kỳ #${semesterId}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Mỗi loại đồ án là một đợt riêng, mở và đóng theo lịch của nó. Chỉ loại
          nào được bật mới có đợt trong học kỳ này.
        </p>
      </div>

      {isPending || !projectTypes || !rounds ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PlanForm
          semesterId={semesterId}
          projectTypes={projectTypes}
          rounds={rounds}
        />
      )}
    </div>
  );
}

function PlanForm({
  semesterId,
  projectTypes,
  rounds,
}: {
  semesterId: number;
  projectTypes: ProjectType[];
  rounds: RegistrationRound[];
}) {
  const save = useSetSemesterRounds();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const byType = new Map(rounds.map((round) => [round.projectTypeId, round]));

  const [state, setState] = useState<Record<number, RowState>>(() =>
    Object.fromEntries(
      projectTypes.map((type) => {
        const round = byType.get(type.id);

        return [
          type.id,
          {
            enabled: round !== undefined,
            start: toDateInput(round?.registrationStart),
            end: toDateInput(round?.registrationEnd),
            cohorts: round?.cohorts.join(', ') ?? '',
            midterm: toDateInput(round?.midtermDueAt),
            final: toDateInput(round?.finalDueAt),
          } satisfies RowState,
        ];
      }),
    ),
  );

  function patch(typeId: number, changes: Partial<RowState>) {
    setSaved(false);
    setState((current) => ({
      ...current,
      [typeId]: { ...current[typeId], ...changes },
    }));
  }

  const rows = projectTypes.map((type) => {
    const row = state[type.id];
    const round = byType.get(type.id);
    const cohorts = parseCohorts(row.cohorts);
    const locked =
      round !== undefined && !SCHEDULE_EDITABLE.includes(round.phase);

    return { type, row, round, cohorts, locked };
  });

  const enabled = rows.filter((entry) => entry.row.enabled);
  const problems = enabled.flatMap((entry) => describeProblems(entry));
  const ready = enabled.length > 0 && problems.length === 0;

  async function submit() {
    setError(null);
    setSaved(false);
    try {
      const plan: RoundPlanInput[] = enabled.map((entry) => ({
        projectTypeId: entry.type.id,
        registrationStart: new Date(entry.row.start).toISOString(),
        registrationEnd: new Date(entry.row.end).toISOString(),
        cohorts: entry.cohorts.values,
        // Null rather than omitted: the payload replaces the term's whole
        // arrangement, so a box cleared here is a deadline taken back.
        midtermDueAt: toIsoOrNull(entry.row.midterm),
        finalDueAt: toIsoOrNull(entry.row.final),
      }));

      await save.mutateAsync({ semesterId, rounds: plan });
      setSaved(true);
    } catch (err) {
      // The refusals worth reading come from the API and name the round: a
      // round already carrying topics cannot be removed, and a closed one
      // cannot have its dates moved except through Gia hạn.
      setError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    }
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />

      {saved && (
        <p className="rounded-xl border border-status-success/30 bg-status-success-bg/40 px-4 py-3 text-sm">
          Đã lưu kế hoạch đợt đăng ký.
        </p>
      )}

      {/*
        Said once, above the list, rather than under each round. Three identical
        sentences on one screen is three times the reading for the same fact, and
        it teaches people that the small grey text is safe to skip.
      */}
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Khóa là năm nhập học gồm bốn chữ số — 2022, không phải K46. Nhiều khóa
        thì cách nhau bằng dấu phẩy.
      </p>

      <div className="space-y-3">
        {rows.map(({ type, row, round, cohorts, locked }) => (
          <section
            key={type.id}
            className={cn(
              'space-y-3 rounded-xl border p-4 transition-colors',
              !row.enabled && 'bg-muted/30',
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={row.enabled}
                  onChange={(event) =>
                    patch(type.id, { enabled: event.target.checked })
                  }
                />
                {type.name}
              </label>

              {round && <StatusPill {...PHASE[round.phase]} />}

              {locked && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="size-3.5" />
                  Đợt đã đóng cổng — đổi hạn phải dùng Gia hạn
                </span>
              )}
            </div>

            {row.enabled && (
              <div className="grid gap-3 sm:grid-cols-3">
                <DateField
                  id={`start-${type.id}`}
                  label="Mở đăng ký"
                  disabled={locked}
                  value={row.start}
                  onChange={(start) => patch(type.id, { start })}
                />
                <DateField
                  id={`end-${type.id}`}
                  label="Hạn đăng ký"
                  disabled={locked}
                  value={row.end}
                  invalid={
                    row.start !== '' && row.end !== '' && row.end <= row.start
                  }
                  onChange={(end) => patch(type.id, { end })}
                />
                <div className="space-y-1.5">
                  <Label htmlFor={`cohorts-${type.id}`} className="text-xs">
                    Khóa được đăng ký
                  </Label>
                  <Input
                    id={`cohorts-${type.id}`}
                    placeholder="2022, 2023"
                    value={row.cohorts}
                    aria-invalid={!cohorts.valid}
                    onChange={(event) =>
                      patch(type.id, { cohorts: event.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/*
              Below the registration window and never locked with it. Moving the
              gate after it has closed decides a race that is already over, which
              is why that needs Gia hạn; a report deadline only says when work is
              expected, and a faculty granting an extra week should not need a
              second mechanism to say so.
            */}
            {row.enabled && (
              <div className="space-y-2.5 border-t pt-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-medium">Hạn nộp báo cáo</h3>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          aria-label="Hạn nộp báo cáo dùng để làm gì?"
                          className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                      }
                    >
                      <CircleHelp className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-pretty">
                      Để trống nếu khoa chưa công bố. Nhóm chưa nộp được nhắc
                      trước 3 ngày; nộp muộn vẫn nhận nhưng bị đánh dấu. Mã
                      nguồn tính theo hạn cuối kỳ.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DateField
                    id={`midterm-${type.id}`}
                    label="Hạn nộp giữa kỳ"
                    value={row.midterm}
                    invalid={row.midterm !== '' && row.midterm <= row.end}
                    onChange={(midterm) => patch(type.id, { midterm })}
                  />
                  <DateField
                    id={`final-${type.id}`}
                    label="Hạn nộp cuối kỳ"
                    value={row.final}
                    invalid={
                      row.final !== '' &&
                      (row.final <= row.end ||
                        (row.midterm !== '' && row.final <= row.midterm))
                    }
                    onChange={(final) => patch(type.id, { final })}
                  />
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {problems.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button disabled={!ready || save.isPending} onClick={submit}>
          {save.isPending && <Loader2 className="animate-spin" />}
          Lưu kế hoạch
        </Button>
        {enabled.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Bật ít nhất một loại đồ án.
          </span>
        )}
      </div>
    </div>
  );
}

/** A blank box means "no deadline", which the API spells as null. */
function toIsoOrNull(value: string): string | null {
  return value === '' ? null : new Date(value).toISOString();
}

/** "2022, 2023" as the API wants it: four-digit intake years, at least one. */
function parseCohorts(raw: string): { values: string[]; valid: boolean } {
  const values = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');

  return {
    values,
    valid: values.length > 0 && values.every((part) => /^\d{4}$/.test(part)),
  };
}

function describeProblems({
  type,
  row,
  cohorts,
}: {
  type: ProjectType;
  row: RowState;
  cohorts: { valid: boolean };
}): string[] {
  const problems: string[] = [];

  if (row.start === '' || row.end === '') {
    problems.push(`${type.name}: chưa nhập đủ ngày mở và hạn đăng ký.`);
  } else if (row.end <= row.start) {
    problems.push(`${type.name}: hạn đăng ký phải sau ngày mở.`);
  }

  if (!cohorts.valid) {
    problems.push(
      `${type.name}: khóa phải là năm nhập học bốn chữ số, ít nhất một khóa.`,
    );
  }

  // Both are typos rather than decisions — a year mistyped, or the two boxes
  // filled the wrong way round — and the API refuses them too. Saying so here
  // saves a round trip to be told the same thing.
  if (row.end !== '' && row.midterm !== '' && row.midterm <= row.end) {
    problems.push(`${type.name}: hạn nộp giữa kỳ phải sau hạn đăng ký.`);
  }

  if (row.end !== '' && row.final !== '' && row.final <= row.end) {
    problems.push(`${type.name}: hạn nộp cuối kỳ phải sau hạn đăng ký.`);
  }

  if (row.midterm !== '' && row.final !== '' && row.final <= row.midterm) {
    problems.push(`${type.name}: hạn nộp cuối kỳ phải sau hạn nộp giữa kỳ.`);
  }

  return problems;
}
