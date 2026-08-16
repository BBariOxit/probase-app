'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Just the pager. The total belongs beside the filters that produced it, not
 * down here — it is the answer to what the filter just did, and by the time
 * you have scrolled past the results you are no longer asking.
 *
 * Renders nothing on a single page: two disabled arrows are a promise of more
 * results that do not exist.
 */
export function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-1 pt-1 text-sm text-muted-foreground">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft />
      </Button>
      <span className="px-1.5 tabular-nums">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Trang sau"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
