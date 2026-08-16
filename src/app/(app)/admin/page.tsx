'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ClipboardCheck, Loader2, Search } from 'lucide-react';
import { useTopicTransition, useTopics } from '@/lib/api/topics';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { EmptyState } from '@/components/empty-state';
import { PageHeading } from '@/components/page-heading';
import { PaginationBar } from '@/components/pagination-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 10;

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export default function AdminTopicQueuePage() {
  const allowed = useRequireRole('ADMIN');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const transition = useTopicTransition();

  const { data, isPending, error } = useTopics({
    status: 'PENDING',
    page,
    limit: PAGE_SIZE,
    q: debouncedSearch || undefined,
  });

  if (!allowed) return null;

  const topics = data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeading
        title="Duyệt đề tài"
        description="Đề tài giảng viên gửi lên, chờ khoa xét duyệt."
      />

      <div className="relative min-w-56 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên đề tài…"
          className="pl-8"
          aria-label="Tìm đề tài"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">Không tải được hàng chờ.</p>
      )}

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">Tiêu đề</TableHead>
                <TableHead className="w-48">Giảng viên</TableHead>
                <TableHead className="w-36">Loại đồ án</TableHead>
                <TableHead className="w-28">Ngày gửi</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/topics/${topic.id}`}
                      className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {topic.title}
                    </Link>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {topic.semester.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {topic.lecturer.fullName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {topic.projectType.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {dateFormat.format(new Date(topic.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={transition.isPending}
                      onClick={() =>
                        transition.mutate({ id: topic.id, to: 'approve' })
                      }
                    >
                      {transition.isPending &&
                      transition.variables?.id === topic.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Check />
                      )}
                      Duyệt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {isPending && (
          <div className="flex justify-center py-14">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && topics.length === 0 && (
          <EmptyState
            icon={ClipboardCheck}
            title={
              debouncedSearch
                ? 'Không có đề tài nào khớp từ khoá.'
                : 'Không còn đề tài nào chờ duyệt.'
            }
          />
        )}
      </div>

      {data && data.total > 0 && (
        <PaginationBar
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          unit="đề tài chờ duyệt"
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
