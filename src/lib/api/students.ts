'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api, download } from '@/lib/api/client';
import type { Paginated, StudentRosterRow } from '@/lib/api/types';

/**
 * Every filter the faculty office actually uses, and they compose.
 *
 * `roundId` rather than a project type: a đợt is a semester crossed with a kind
 * of project, and which intakes it covers is declared on the round — asking by
 * project type alone would leave the API guessing which term was meant.
 */
export interface StudentQuery {
  semesterId?: number;
  roundId?: number;
  cohort?: string;
  majorId?: number;
  class?: string;
  lecturerId?: number;
  /** Unset means everybody; the office opens this screen for `false`. */
  hasGroup?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}

function toSearch(query: StudentQuery): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

/**
 * The faculty's students, with the topic and supervisor each is working under.
 *
 * The same list the allocation desk reads, asked with different filters — one
 * definition of "has a topic this term" behind both, so the two screens cannot
 * end up reporting different numbers about the same student.
 */
export function useStudents(query: StudentQuery) {
  return useQuery({
    queryKey: ['students', query],
    queryFn: () =>
      api<Paginated<StudentRosterRow>>(`/students${toSearch(query)}`),
    placeholderData: (previous) => previous,
  });
}

/**
 * The same list as a spreadsheet, filtered exactly as the screen is.
 *
 * A mutation rather than a query because it is an action with no cached result:
 * pressing it produces a file, and asking twice should produce the file twice.
 */
export function useExportStudents() {
  return useMutation({
    mutationFn: (query: StudentQuery) =>
      download(
        `/students/export${toSearch({ ...query, page: undefined, limit: undefined })}`,
        'danh-sach-sinh-vien.xlsx',
      ),
  });
}
