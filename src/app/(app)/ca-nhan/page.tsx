'use client';

import Link from 'next/link';
import { KeyRound, Loader2 } from 'lucide-react';
import { useMyProfile } from '@/lib/api/me';
import { ProfileAvatarCard } from '@/components/profile-avatar-card';
import { ProfileDetailsForm } from '@/components/profile-details-form';
import { ProfileFacultyFacts } from '@/components/profile-faculty-facts';
import { Button } from '@/components/ui/button';

/**
 * One screen for all three roles.
 *
 * The role decides which block appears, not which page you land on: an admin, a
 * lecturer and a student all arrive here from the same menu entry and all read
 * the same three headings in the same order — who you are, what the faculty
 * holds, what you may change — which is what makes it explainable in one
 * sentence to somebody on the phone.
 */
export default function ProfilePage() {
  const { data: profile, isPending, error } = useMyProfile();

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <p className="text-sm text-destructive">Không tải được hồ sơ của bạn.</p>
    );
  }

  const editable = profile.student !== null || profile.lecturer !== null;

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      {/*
        Identity and the password sit together in the narrow column, and what
        the faculty holds sits beside them. Splitting it the other way left the
        left-hand column a short card with three hundred pixels of nothing under
        it — and on a phone, where the columns stack, this order still reads as
        a sentence: this is you, this is how you get in, this is what the office
        has, this is what you may change.
      */}
      <div className="space-y-4">
        <ProfileAvatarCard profile={profile} />

        {/*
          One heading and one button. "Đặt lại mật khẩu" is a different thing
          and does not belong on a screen you reached by being signed in — a
          reset is for somebody who cannot get in, and it lives on the login
          page and in the admin's hands — but saying so here was explaining an
          absence to people who had not noticed one.
        */}
        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-medium">Bảo mật</h2>

          <Button variant="outline" render={<Link href="/change-password" />}>
            <KeyRound />
            Đổi mật khẩu
          </Button>
        </section>
      </div>

      <div className="space-y-4">
        <ProfileFacultyFacts profile={profile} />
        {editable && <ProfileDetailsForm profile={profile} />}
      </div>
    </div>
  );
}
