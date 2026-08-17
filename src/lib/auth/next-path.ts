/**
 * Where to send someone after they sign in, when they were already going
 * somewhere.
 *
 * Only same-site paths are honoured, and the check is stricter than "starts with
 * a slash" on purpose: `//evil.example` also starts with one, and a browser reads
 * it as a protocol-relative URL to another host. Passing that through would turn
 * the login screen into an open redirect — a link that looks like ours, asks for
 * a password, and then lands somewhere else entirely.
 *
 * A backslash is rejected for the same reason, since some browsers normalise
 * `/\evil.example` the same way.
 */
export function safeNextPath(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//') || next.startsWith('/\\')) return null;

  return next;
}

/** The query string that carries the current location through a login. */
export function nextParam(pathname: string): string {
  return `?next=${encodeURIComponent(pathname)}`;
}
