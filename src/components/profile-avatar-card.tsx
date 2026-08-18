'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRemoveAvatar, useUploadAvatar } from '@/lib/api/me';
import type { MyProfile } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';

const ROLE_LABELS: Record<MyProfile['role'], string> = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

/** The API refuses anything larger; saying so here costs no upload. */
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = 'image/png,image/jpeg,image/webp';

/**
 * Who you are, and the one part of it you can change.
 *
 * The picture sits with the name rather than in the form below, because it is
 * not a field: it saves the moment it is chosen, and a picture that waited for a
 * "Lưu" button at the bottom of another card would be the only control on the
 * page whose effect you cannot see immediately.
 */
export function ProfileAvatarCard({ profile }: { profile: MyProfile }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [rejected, setRejected] = useState<string | null>(null);

  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const busy = upload.isPending || remove.isPending;
  const error = rejected ?? upload.error?.message ?? remove.error?.message;

  function choose(file: File | undefined) {
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setRejected('Ảnh nặng quá 2MB. Chọn ảnh nhỏ hơn nhé.');
      return;
    }

    setRejected(null);
    upload.mutate(file);
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <UserAvatar
            name={profile.fullName}
            email={profile.email}
            src={profile.avatarUrl}
            className="size-16 text-lg"
          />
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="font-heading truncate text-lg leading-tight font-semibold tracking-tight">
            {profile.fullName ?? ROLE_LABELS[profile.role]}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {profile.email}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/*
          The input is hidden and driven by the button rather than styled: a
          file input cannot be made to look like the rest of the buttons here,
          and "Chọn tệp — chưa chọn tệp nào" is not a sentence anybody needs.
        */}
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(event) => {
            choose(event.target.files?.[0]);
            // Cleared so that choosing the same file twice still fires a
            // change — after a failed upload, that is exactly what a person
            // does next.
            event.target.value = '';
          }}
        />

        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          {profile.avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </Button>

        {profile.avatarUrl && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => {
              setRejected(null);
              remove.mutate(undefined);
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            Xoá ảnh
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        PNG, JPEG hoặc WebP, tối đa 2MB. Ảnh sẽ được cắt vuông.
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
