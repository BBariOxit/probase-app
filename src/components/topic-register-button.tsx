'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  useJoinTopic,
  useMyGroup,
  useRegisterTopic,
} from '@/lib/api/registration';
import type { TopicAvailability } from '@/lib/api/types';
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
  idle,
  className,
}: {
  topic: TopicLike;
  /**
   * What occupies this spot when there is nothing to press.
   *
   * Passed in rather than decided by the caller, because the caller choosing
   * between this component and something else would unmount it — and with it the
   * dialog that is mid-conversation with the student.
   */
  idle?: React.ReactNode;
  className?: string;
}) {
  const register = useRegisterTopic();
  const join = useJoinTopic();
  const [confirming, setConfirming] = useState(false);

  const pending = register.isPending || join.isPending;
  const error = register.error ?? join.error;
  const registering = topic.canRegister;

  /**
   * The button goes when there is nothing to press, but the component stays.
   *
   * Returning null on unavailability would unmount the dialog at the worst
   * moment: success invalidates the topic list, the refetched row reports the
   * topic as taken — correctly, by this very caller — and the confirmation the
   * student is reading would vanish along with the button that produced it.
   */
  const showButton = topic.canRegister || topic.canJoin;

  function act() {
    if (registering) {
      register.mutate(
        // Every seat, so nothing is exposed while the leader decides.
        { topicId: topic.id, declaredSize: topic.maxStudents },
        { onSuccess: () => setConfirming(true) },
      );
      return;
    }

    join.mutate(topic.id, { onSuccess: () => setConfirming(true) });
  }

  return (
    <>
      {!showButton && !error && idle}

      {/* z-10 lifts this above the link overlay stretched across the card. */}
      {(showButton || error) && (
        <div className={className}>
          {showButton && (
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
          )}

          {/*
            The refused message is the useful part of a failure here — "Đề tài
            vừa có nhóm khác nhận" is exactly what someone needs to read, and the
            mutation has already invalidated the list, so the badge beside it
            corrects itself at the same time.
          */}
          {error && (
            <p className="relative z-10 mt-1.5 text-xs text-destructive">
              {error.message}
            </p>
          )}
        </div>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          {/*
            Mounted only while open. Result reads the group, and a closed dialog
            on every card in the list would each subscribe to that query for a
            confirmation nobody has asked to see.
          */}
          {confirming && <Result />}
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
 *
 * The group is read from the query rather than from the mutation's response.
 * Adjusting the seat claim from in here changes the group, and a snapshot taken
 * at the moment of success would keep reporting the seats it held back then —
 * the one number this dialog exists to let them change.
 */
function Result() {
  const { data: group, isPending } = useMyGroup();

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only reachable if the group vanished between succeeding and being read,
  // which in practice means another tab left or disbanded it.
  if (!group) {
    return (
      <DialogHeader>
        <DialogTitle>Không tìm thấy nhóm của bạn</DialogTitle>
        <DialogDescription>
          Có thể nhóm vừa bị thay đổi ở nơi khác. Mở lại trang nhóm để xem.
        </DialogDescription>
      </DialogHeader>
    );
  }

  return (
    <>
      {/*
        No success tick. The title already says it happened, and a third accent
        colour in a box this small only competes with the one control worth
        pressing. The topic is named underneath because it is what was just
        claimed — and because a group belongs to a topic, which "đề tài này giờ
        là của bạn" quietly got wrong: it belongs to the group, not the person.
      */}
      <DialogHeader>
        <DialogTitle>
          {group.isLeader ? 'Đăng ký thành công' : 'Đã vào nhóm'}
        </DialogTitle>
        <DialogDescription>{group.topic.title}</DialogDescription>
      </DialogHeader>

      {/*
        Two steps, in the order they are done: say how many are coming, then
        send the link. The seat count that used to sit on top said the same
        thing as the control below it — on a group one minute old it could only
        ever read "1 of N" — so it was a row of dots restating its own heading.
      */}
      <div className="space-y-4">
        {group.isLeader && <GroupSeatClaim group={group} />}

        {/*
          A topic for one student can never take a second, so an invite link
          there leads only to a refusal. `GroupSeatClaim` already bows out at
          that capacity; this block used not to.
        */}
        {group.isLeader && group.joinCode && group.topic.maxStudents > 1 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Link mời</p>
            <JoinLinkField code={group.joinCode} />
          </div>
        )}
      </div>

      {/* Just closes: the group panel is already on the page behind this. */}
      <DialogFooter className="pt-2">
        <DialogClose render={<Button variant="outline" />}>Xong</DialogClose>
      </DialogFooter>
    </>
  );
}
