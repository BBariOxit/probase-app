'use client';

import Link from 'next/link';
import { KeyRound, LogOut, UserRound } from 'lucide-react';
import type { SessionUser } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/user-avatar';

const ROLE_LABELS: Record<SessionUser['role'], string> = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

/**
 * The account, in the top right corner where people look for it.
 *
 * It used to be a wide block at the foot of the sidebar. Moving it here is not
 * only convention: the sidebar block spelled the address out in full, so the
 * longest string in the product sat permanently in the narrowest column, and it
 * collapsed to an unreadable stub whenever the sidebar did. As an avatar beside
 * the theme toggle it is the same three actions in a fortieth of the space, and
 * the address is where it belongs — inside the menu, once, next to the name it
 * identifies.
 *
 * There is no "Cài đặt" entry. The only account setting this system has is the
 * password, and it is named here directly; a settings item that opens a page
 * containing one link to another page is a corridor, not a room.
 */
export function UserMenu({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tài khoản của bạn"
            className="rounded-full"
          />
        }
      >
        <UserAvatar
          name={user.fullName}
          email={user.email}
          src={user.avatarUrl}
          className="size-7"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-60">
        {/*
          Not a DropdownMenuLabel: Base UI requires labels to sit inside a
          Menu.Group, and a bare one crashes the menu outright. This is a
          heading, not a menu entry, so it is a plain block.
        */}
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">
            {user.fullName ?? ROLE_LABELS[user.role]}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/ca-nhan" />}>
          <UserRound />
          Trang cá nhân
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/change-password" />}>
          <KeyRound />
          Đổi mật khẩu
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <LogOut />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
