'use client';

import Link from 'next/link';
import { ChevronsUpDown, KeyRound, LogOut } from 'lucide-react';
import type { SessionUser } from '@/lib/api/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const ROLE_LABELS: Record<SessionUser['role'], string> = {
  ADMIN: 'Quản trị viên',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

/**
 * The account block at the foot of the sidebar.
 *
 * It sits here rather than in the header so the header is left carrying only
 * what belongs to the page in view. The address is shown because it answers
 * "which account am I signed in as" — the one question the avatar alone
 * cannot.
 */
export function NavUser({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                    {user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">
                    {user.email}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            }
          />

          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/change-password" />}>
              <KeyRound />
              Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onSignOut}>
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
