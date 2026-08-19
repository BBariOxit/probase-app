'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** The address a join code resolves to, as the friend will receive it. */
export function joinUrl(code: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  return `${origin}/join/${encodeURIComponent(code)}`;
}

/**
 * The link a leader sends their group.
 *
 * Shown as a read-only field rather than a bare button, because the thing being
 * copied is going into a chat message and people want to see what they are about
 * to paste. It stays selectable for the browsers where the clipboard API is
 * blocked — in an in-app webview, a copy button that silently does nothing is
 * worse than no button.
 */
export function JoinLinkField({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = joinUrl(code);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard refused — the field is selectable, so there is still a way.
    }
  }

  return (
    <div className="flex gap-2">
      {/*
        Muted and borderless: this is a value to be taken, not a field to be
        filled in, and an input-shaped box invites people to type into it. It
        stays a real input so the text is still selectable where the clipboard
        is blocked.
      */}
      <Input
        value={url}
        readOnly
        onFocus={(event) => event.currentTarget.select()}
        aria-label="Link mời vào nhóm"
        className="border-transparent bg-muted font-mono text-xs shadow-none"
      />
      {/*
        The one filled button wherever this appears. Sending the link is the
        whole reason a leader is on this screen, so it gets the accent — the
        control that merely closes a dialog does not.
      */}
      <Button type="button" onClick={copy} className="shrink-0">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? 'Đã sao chép' : 'Sao chép'}
      </Button>
    </div>
  );
}
