'use client';

import { useEffect, useState } from 'react';

/**
 * Holds a value back until it stops changing.
 *
 * Search boxes drive a network request, and one request per keystroke is both
 * wasteful and racy. useDeferredValue would keep typing smooth but still fire
 * every request; only a timer actually collapses them.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
