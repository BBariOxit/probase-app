'use client';

import { useState } from 'react';
import { CircleCheck, Loader2 } from 'lucide-react';
import { useJoinTopic, useRegisterTopic } from '@/lib/api/registration';
import type { RegistrationGroup, TopicAvailability } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GroupSeatClaim } from '@/components/group-seat-claim';
import { JoinLinkField } from '@/components/join-link-field';
import { SeatDots } from '@/components/seat-indicator';

interface TopicLike extends TopicAvailability {
  id: number;
  title: string;
  maxStudents: number;
}

/**
 * Take a topic, or take a seat in the group that already has it.
 *
 * One button, and which one it is comes from the server's own answer rather than
 * from arithmetic here — the same call the API will make when the button is
 * pressed.
 *
 * Registration claims every remaining seat for 24 hours and asks nothing first.
 * That is deliberate: the moment the gate opens is when topics are contested, and
 * a dialog asking about group size while the topic sits unclaimed is a hurdle
 * placed at the worst possible second. The two mistakes are not symmetric —
 * holding seats a solo student did not need lapses by itself and can be undone in
 * one tap, while a seat lost to a stranger because their leader was reading a
 * dialog cannot be undone at all without evicting somebody. So the protective
 * option is the default and the correction comes straight after, in the dialog
 * below.
 */
export function TopicRegisterButton({
  topic,
  className,
}: {
  topic: TopicLike;
  className?: string;
}) {
  const register = useRegisterTopic();
  const join = useJoinTopic();
  const [group, setGroup] = useState<RegistrationGroup | null>(null);

  const pending = register.isPending || join.isPending;
  const error = register.error ?? join.error;

  if (!topic.canRegister && !topic.canJoin) return null;

  const registering = topic.canRegister;

  function act() {
    if (registering) {
      register.mutate(
        // Every seat, so nothing is exposed while the leader decides.
        { topicId: topic.id, declaredSize: topic.maxStudents },
        { onSuccess: setGroup },
      );
      return;
    }

    join.mutate(topic.id, { onSuccess: setGroup });
  }

  return (
    <>
      {/* z-10 lifts this above the link overlay stretched across the card. */}
      <div className={className}>
        <Button
          type="button"
          size="sm"
          onClick={act}
          disabled={pending}
          className="relative z-10"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {registering ? 'Đăng ký' : 'Tham gia'}
        </Button>

        {/*
          The refused message is the useful part of a failure here — "Đề tài vừa
          có nhóm khác nhận" is exactly what someone needs to read, and the
          mutation has already invalidated the list, so the badge beside it
          corrects itself at the same time.
        */}
        {error && (
          <p className="relative z-10 mt-1.5 text-xs text-destructive">
            {error.message}
          </p>
        )}
      </div>

      <Dialog
        open={group !== null}
        onOpenChange={(open) => {
          if (!open) setGroup(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {group && <Result group={group} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * What the student sees the instant it worked.
 *
 * The reassurance comes first and the controls after. Under first-come
 * allocation the topic is theirs from the moment the request returns, and the
 * anxiety the old model created came entirely from nobody saying so — so this
 * says it before anything else, and before asking them for anything.
 */
function Result({ group }: { group: RegistrationGroup }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CircleCheck className="size-4.5 text-status-success" />
          {group.isLeader ? 'Đề tài này giờ là của bạn' : 'Bạn đã vào nhóm'}
        </DialogTitle>
        <DialogDescription>{group.topic.title}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <SeatDots
            occupied={group.occupiedSeats}
            capacity={group.topic.maxStudents}
            held={group.heldSeats}
          />
          <span className="text-muted-foreground">
            {group.occupiedSeats}/{group.topic.maxStudents}
          </span>
        </div>

        {group.isLeader && <GroupSeatClaim group={group} />}

        {group.isLeader && group.joinCode && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Mời bạn vào nhóm</p>
            <JoinLinkField code={group.joinCode} />
          </div>
        )}
      </div>

      {/* Just closes: the group panel is already on the page behind this. */}
      <DialogFooter>
        <DialogClose render={<Button />}>Xong</DialogClose>
      </DialogFooter>
    </>
  );
}
