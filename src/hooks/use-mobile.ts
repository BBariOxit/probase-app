import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * Rewritten from the version shadcn ships, which seeded its state by calling
 * setState inside an effect — the project's lint rules reject that, and it
 * costs an extra render on every mount besides.
 *
 * A media query is external state that React does not own, so this is what
 * useSyncExternalStore is for: it reads the current match during render and
 * subscribes for changes, with no intermediate `undefined` pass.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    // There is no viewport on the server. Desktop is the safer guess: the
    // sidebar then renders as a column rather than briefly as an overlay.
    () => false,
  );
}
