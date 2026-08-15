'use client';

import Link from 'next/link';
import { KeyRound, LogOut } from 'lucide-react';
import type { SessionUser } from '@/lib/api/types';
import {
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';

const ROLE_LABELS: Record<SessionUser['role'], string> = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

/**
 * The header used to print the address as plain text with a sign-out icon
 * beside the theme toggle — two same-sized icons, one harmless and one that
 * ends the session. Both now live behind a deliberate click, and the address
 * has a reason to be shown: it says which account this is.
 */
export function UserMenu({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  return (
    <MenuRoot>
      <MenuTrigger
        aria-label="Tài khoản"
        className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {user.email.charAt(0).toUpperCase()}
      </MenuTrigger>

      <MenuContent>
        <MenuLabel>
          <span className="block truncate font-medium text-foreground">
            {user.email}
          </span>
          {ROLE_LABELS[user.role]}
        </MenuLabel>

        <MenuSeparator />

        <MenuItem render={<Link href="/change-password" />}>
          <KeyRound />
          Đổi mật khẩu
        </MenuItem>

        <MenuItem onClick={onSignOut} className="text-destructive">
          <LogOut className="text-destructive!" />
          Đăng xuất
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
