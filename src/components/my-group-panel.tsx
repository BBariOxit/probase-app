'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EllipsisVertical, GraduationCap, Layers, X } from 'lucide-react';
import {
  useDisbandGroup,
  useLeaveGroup,
  useRemoveMember,
  useUpdateGroup,
} from '@/lib/api/registration';
import type { GroupMember, RegistrationGroup } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { GroupSeatClaim } from '@/components/group-seat-claim';
import { JoinLinkField } from '@/components/join-link-field';

/**
 * The group a student belongs to, and everything they can do to it.
 *
 * Ordered by how often each thing is wanted: the seat count and the join link
 * come first because a leader returns for those, and the ways to break the group
 * up sit behind a menu. Putting "giải tán" beside "copy link" would be putting
 * the most destructive control next to the most used one.
 *
 * `canEdit` is false once the gate has closed. Every control here is refused by
 * the API from that point on, and showing a live button in front of a certain
 * refusal is worse than showing none — the group is still worth reading, so it is
 * the controls that go rather than the panel.
 */
export function MyGroupPanel({
  group,
  canEdit = true,
}: {
  group: RegistrationGroup;
  canEdit?: boolean;
}) {
  const [confirming, setConfirming] = useState<'disband' | 'leave' | null>(
    null,
  );
  const update = useUpdateGroup(group.id);
  const disband = useDisbandGroup(group.id);
  const leave = useLeaveGroup(group.id);
  const removeMember = useRemoveMember(group.id);

  const { topic } = group;

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Nhóm của bạn</p>
            <h2 className="font-heading text-lg leading-tight font-semibold tracking-tight">
              <Link
                href={`/student/topics/${topic.id}`}
                className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {topic.title}
              </Link>
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/*
              The number alone. Dots beside "1/3" were the same fact drawn
              twice, and their green was the only second accent left in a card
              whose roster sits three lines below saying exactly who is in it.
            */}
            <span className="text-sm text-muted-foreground tabular-nums">
              {group.occupiedSeats}/{topic.maxStudents}
            </span>

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Thao tác với nhóm"
                    />
                  }
                >
                  <EllipsisVertical />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {group.isLeader ? (
                    <>
                      <DropdownMenuItem
                        onClick={() =>
                          update.mutate({ openForJoin: !group.openForJoin })
                        }
                      >
                        {group.openForJoin
                          ? 'Đóng nhóm, không nhận thêm'
                          : 'Mở lại cho người khác vào'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setConfirming('disband')}
                      >
                        Giải tán nhóm
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setConfirming('leave')}
                    >
                      Rời nhóm
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-3.5 shrink-0" />
            {topic.lecturer.academicTitle
              ? `${topic.lecturer.academicTitle} ${topic.lecturer.fullName}`
              : topic.lecturer.fullName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5 shrink-0" />
            {topic.projectType.name}
          </span>
        </div>
      </header>

      <ul className="divide-y rounded-lg border">
        {group.members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            canRemove={canEdit && group.isLeader && !member.isLeader}
            onRemove={() => removeMember.mutate(member.student.id)}
            removing={removeMember.isPending}
          />
        ))}
      </ul>

      {removeMember.error && (
        <p className="text-xs text-destructive">{removeMember.error.message}</p>
      )}

      {canEdit && group.isLeader && !group.isFull && (
        <GroupSeatClaim group={group} />
      )}

      {canEdit && group.isLeader && group.joinCode && !group.isFull && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Link mời</p>
          <JoinLinkField code={group.joinCode} />
        </div>
      )}

      {update.error && (
        <p className="text-xs text-destructive">{update.error.message}</p>
      )}

      <ConfirmDialog
        open={confirming === 'disband'}
        onOpenChange={(open) => setConfirming(open ? 'disband' : null)}
        title="Giải tán nhóm?"
        description={`Đề tài "${topic.title}" sẽ trở lại danh sách cho sinh viên khác đăng ký, và cả nhóm sẽ không còn đề tài nào.`}
        confirmLabel="Giải tán"
        onConfirm={() => disband.mutateAsync()}
      />

      <ConfirmDialog
        open={confirming === 'leave'}
        onOpenChange={(open) => setConfirming(open ? 'leave' : null)}
        title="Rời nhóm?"
        description="Bạn sẽ không còn đề tài nào trong học kỳ này, và chỗ của bạn được nhả lại cho người khác."
        confirmLabel="Rời nhóm"
        onConfirm={() => leave.mutateAsync()}
      />
    </section>
  );
}

/**
 * `joinSource` is only shown for ASSIGNED. That somebody joined by link rather
 * than by pressing the button is invisible to how the group works, whereas
 * having been placed by the faculty office is something the group can see for
 * itself — and the person concerned did not choose to be here.
 */
function MemberRow({
  member,
  canRemove,
  onRemove,
  removing,
}: {
  member: GroupMember;
  canRemove: boolean;
  onRemove: () => void;
  removing: boolean;
}) {
  const { student } = member;

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
          <span className="truncate">{student.fullName}</span>
          {member.isLeader && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
              Trưởng nhóm
            </span>
          )}
          {member.joinSource === 'ASSIGNED' && (
            <span className="rounded-md bg-status-waiting-bg px-1.5 py-0.5 text-xs font-normal text-status-waiting">
              Khoa xếp vào
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[student.studentCode, student.class, student.major?.name]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {canRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={removing}
          onClick={onRemove}
          aria-label={`Xoá ${student.fullName} khỏi nhóm`}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X />
        </Button>
      )}
    </li>
  );
}
