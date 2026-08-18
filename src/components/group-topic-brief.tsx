'use client';

import { useTopic } from '@/lib/api/topics';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The topic itself, on the group's own screen.
 *
 * The third question a student has after registering — what does this thing
 * actually ask of me — and until now the only answer was a link to another page.
 * The group panel above already names the topic and its supervisor, so this adds
 * only the two bodies of text, without a heading repeating the title a second
 * time.
 *
 * Fetched rather than taken from the group: registration responses carry a
 * topic's title and capacity, not its description, and asking for the detail is
 * cheaper than widening every group payload for one screen.
 */
export function GroupTopicBrief({ topicId }: { topicId: number }) {
  const { data: topic, isPending } = useTopic(topicId);

  if (isPending) {
    return (
      <section className="space-y-3 rounded-xl border bg-card p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </section>
    );
  }

  // Silence rather than an error box: this is supporting reading matter, and the
  // group above it — the thing the page is for — is already on screen.
  if (!topic) return null;

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5">
      <Section title="Mô tả đề tài" body={topic.description} />
      <Section title="Yêu cầu đầu ra" body={topic.expectedOutcomes} />
    </section>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-medium">{title}</h3>
      {/* The body is free text a lecturer typed, newlines and all. */}
      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
