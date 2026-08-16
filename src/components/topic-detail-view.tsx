import { GraduationCap, Layers, Users } from 'lucide-react';
import type { TopicDetail } from '@/lib/api/types';
import { TopicStatusBadge } from '@/components/topic-status-badge';

function Meta({
  icon: Icon,
  children,
}: {
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
      {children}
    </span>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="space-y-1.5">
      <h2 className="text-sm font-medium">{title}</h2>
      {/* The body is free text a lecturer typed, newlines and all. */}
      <p className="text-sm whitespace-pre-line text-muted-foreground">
        {body}
      </p>
    </section>
  );
}

/**
 * One topic, read-only, shared by the student and admin views. The action bar
 * differs between them and is passed in — the same object should not become
 * two pages that drift apart.
 *
 * The lecturer's contact details are absent because the API does not send
 * them: this is readable by every signed-in student, who needs to know who
 * supervises a topic, not how to phone them.
 */
export function TopicDetailView({
  topic,
  actions,
}: {
  topic: TopicDetail;
  actions?: React.ReactNode;
}) {
  return (
    <article className="max-w-2xl space-y-6">
      <header className="space-y-2.5">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {topic.title}
          </h1>
          <TopicStatusBadge status={topic.status} className="mt-1.5" />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <Meta icon={GraduationCap}>
            {topic.lecturer.academicTitle
              ? `${topic.lecturer.academicTitle} ${topic.lecturer.fullName}`
              : topic.lecturer.fullName}
          </Meta>
          <Meta icon={Layers}>{topic.projectType.name}</Meta>
          <Meta icon={Users}>Tối đa {topic.maxStudents} sinh viên</Meta>
        </div>
      </header>

      <Section title="Mô tả" body={topic.description} />
      <Section title="Yêu cầu đầu ra" body={topic.expectedOutcomes} />

      {actions && <div className="flex items-center gap-2 pt-1">{actions}</div>}
    </article>
  );
}
