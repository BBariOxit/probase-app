'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/**
 * A single segment override: the dynamic part of a URL ("/nhom/42") normally
 * renders as the raw segment ("42"). Pages that know the human name of that ID
 * call `setSegmentLabel` to swap it in so the breadcrumb reads
 * "Nhóm hướng dẫn › Nhóm Đề tài AI..." instead of "Nhóm hướng dẫn › 42".
 *
 * The override lives in a context rather than in the URL itself because the
 * name is only known after the data fetch — we cannot put it in the path
 * without a layout data-fetching strategy that this app deliberately avoids.
 */
interface BreadcrumbContextValue {
  /** Return the override label for the given path segment, or null if none. */
  getLabel: (segment: string) => string | null;
  /** Register a human-readable label for a raw path segment (e.g. "42" → "Nhóm đề tài AI"). */
  setSegmentLabel: (segment: string, label: string) => void;
  /** Remove a previously registered label (called on unmount). */
  clearSegmentLabel: (segment: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setSegmentLabel = useCallback((segment: string, label: string) => {
    setLabels((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  }, []);

  const clearSegmentLabel = useCallback((segment: string) => {
    setLabels((prev) => {
      if (!(segment in prev)) return prev;
      const next = { ...prev };
      delete next[segment];
      return next;
    });
  }, []);

  const getLabel = useCallback(
    (segment: string) => labels[segment] ?? null,
    [labels],
  );

  return (
    <BreadcrumbContext.Provider
      value={{ getLabel, setSegmentLabel, clearSegmentLabel }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * Called by a page that knows the human name for one of its dynamic segments.
 *
 * Example — the lecturer group detail page knows the topic title once the group
 * loads; it calls this hook so the breadcrumb reads "Nhóm hướng dẫn › Nhóm
 * đề tài AI…" rather than "Nhóm hướng dẫn › 42".
 *
 * The segment is usually the raw URL segment (e.g. "42"), and the label is
 * the human-readable version (e.g. "Nhóm đề tài AI…"). Pass null/undefined to
 * clear the override (e.g. while the page is still loading).
 */
export function useBreadcrumbLabel(
  segment: string,
  label: string | null | undefined,
) {
  const ctx = useContext(BreadcrumbContext);

  useEffect(() => {
    if (!ctx || !label) return;
    ctx.setSegmentLabel(segment, label);
    return () => {
      ctx.clearSegmentLabel(segment);
    };
  }, [ctx, segment, label]);
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}
