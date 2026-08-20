'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api, download } from '@/lib/api/client';
import type { FacultyReport } from '@/lib/api/types';

/**
 * The term's numbers, in one read.
 *
 * One request for the whole screen rather than one per section, because the
 * sections are counted from a single snapshot on the server — split into three
 * calls they could each land on a different moment and report a different number
 * of students on the same page.
 */
export function useFacultyReport(semesterId: number | undefined) {
  return useQuery({
    queryKey: ['reports', semesterId ?? 'active'],
    queryFn: () =>
      api<FacultyReport>(
        semesterId ? `/reports?semesterId=${semesterId}` : '/reports',
      ),
    placeholderData: (previous) => previous,
  });
}

/**
 * The same numbers as a workbook.
 *
 * A mutation rather than a query: pressing it produces a file, and asking twice
 * should produce the file twice.
 */
export function useExportReport() {
  return useMutation({
    mutationFn: (semesterId: number | undefined) =>
      download(
        semesterId
          ? `/reports/export?semesterId=${semesterId}`
          : '/reports/export',
        'bao-cao-thong-ke.xlsx',
      ),
  });
}
