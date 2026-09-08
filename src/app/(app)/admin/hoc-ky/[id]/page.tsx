'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Info, Loader2, Lock } from 'lucide-react';
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
import { RoundRequirementsEditor } from '@/components/round-requirements-editor';
import { StatusPill, type StatusTone } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
}

function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

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
    <div className="mx-auto max-w-3xl space-y-5">
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
        <>
          <PlanForm
            semesterId={semesterId}
            projectTypes={projectTypes}
            rounds={rounds}
          />

          {rounds.length > 0 && (
            <section className="space-y-4 border-t pt-5">
              <h2 className="font-heading text-base font-semibold tracking-tight">
                Bài phải nộp
              </h2>

              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="space-y-2.5 rounded-xl border p-4"
                >
                  <h3 className="text-sm font-medium">
                    {round.projectType.name}
                  </h3>
                  <RoundRequirementsEditor round={round} />
                </div>
              ))}
            </section>
          )}
        </>
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
      }));

      await save.mutateAsync({ semesterId, rounds: plan });
      setSaved(true);
    } catch (err) {
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

  return problems;
}
