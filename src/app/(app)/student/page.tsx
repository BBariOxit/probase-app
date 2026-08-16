'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Loader2, Search, Users } from 'lucide-react';
import { useActiveSemester, useProjectTypes } from '@/lib/api/master-data';
import { useTopics } from '@/lib/api/topics';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { EmptyState } from '@/components/empty-state';
import { PageHeading } from '@/components/page-heading';
import { PaginationBar } from '@/components/pagination-bar';
import { TopicStatusBadge } from '@/components/topic-status-badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 12;
const ALL_TYPES = 0;

export default function StudentTopicsPage() {
  const allowed = useRequireRole('STUDENT');
  const activeSemester = useActiveSemester();
  const { data: projectTypes } = useProjectTypes();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [projectTypeId, setProjectTypeId] = useState<number>(ALL_TYPES);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isPending, error } = useTopics({
    status: 'OPEN',
    semesterId: activeSemester?.id,
    projectTypeId: projectTypeId === ALL_TYPES ? undefined : projectTypeId,
    q: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  if (!allowed) return null;

  const topics = data?.items ?? [];
  const filtering = debouncedSearch !== '' || projectTypeId !== ALL_TYPES;

  return (
    <div className="space-y-5">
      <PageHeading
        title="Đề tài"
        description={
          activeSemester
            ? `Đề tài đang mở đăng ký trong ${activeSemester.name.toLowerCase()}.`
            : 'Đề tài đang mở đăng ký.'
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm đề tài…"
            className="pl-8"
            aria-label="Tìm đề tài"
          />
        </div>

        <Select
          value={projectTypeId}
          onValueChange={(value) => {
            setProjectTypeId(value as number);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48" aria-label="Lọc theo loại đồ án">
            <SelectValue>
              {(value) =>
                value === ALL_TYPES
                  ? 'Mọi loại đồ án'
                  : projectTypes?.find((type) => type.id === value)?.name
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES}>Mọi loại đồ án</SelectItem>
            {projectTypes?.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Không tải được danh sách đề tài.
        </p>
      )}

      {isPending && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && topics.length === 0 && (
        <div className="rounded-xl border">
          <EmptyState
            icon={BookOpen}
            title={
              filtering
                ? 'Không có đề tài nào khớp bộ lọc.'
                : 'Chưa có đề tài nào được mở đăng ký.'
            }
          />
        </div>
      )}

      {/* Cards rather than a table: titles run long, students compare rather
          than scan, and this is the screen they are most likely to open on a
          phone. */}
      {topics.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/student/topics/${topic.id}`}
                className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-medium">
                    {topic.title}
                  </h2>
                  <TopicStatusBadge status={topic.status} />
                </div>

                <div className="mt-auto space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {topic.lecturer.academicTitle
                        ? `${topic.lecturer.academicTitle} ${topic.lecturer.fullName}`
                        : topic.lecturer.fullName}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="size-3.5 shrink-0" />
                    {topic.projectType.name} · tối đa {topic.maxStudents} SV
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && data.total > 0 && (
        <PaginationBar
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          unit="đề tài"
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
