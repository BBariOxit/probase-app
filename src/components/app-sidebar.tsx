'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from '@/lib/api/types';
import { NAV_BY_ROLE, type NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { Brand } from '@/components/brand';
import { NavUser } from '@/components/nav-user';
import { SemesterContext } from '@/components/semester-context';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

function NavEntry({ item }: { item: NavItem }) {
  const pathname = usePathname();
  // A section owns its subpages: /lecturer/topics/4 still lights up
  // "Đề tài của tôi". The landing would match every sibling by prefix, so it
  // is compared exactly.
  const active =
    item.href.split('/').length === 2
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const Icon = item.icon;

  if (!item.ready) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled
          tooltip={`${item.label} — chưa xây dựng`}
          className="h-9 cursor-not-allowed opacity-45"
        >
          <Icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.label}
        // The default active treatment is a filled row. Colouring the label
        // and icon instead marks the position without turning one menu entry
        // into the heaviest object on screen.
        className={cn(
          'h-9',
          active && 'text-sidebar-primary [&_svg]:text-sidebar-primary',
        )}
        render={<Link href={item.href} />}
      >
        <Icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      {/*
        Just the wordmark. A coloured square holding the product's first
        letter is the default badge of every generated dashboard, and it was
        doing nothing the word next to it did not already do.

        It hides entirely when collapsed rather than shrinking to an initial,
        for the same reason: the rail is a column of icons, and an icon for
        the application itself is one nobody needs.
      */}
      <SidebarHeader className="px-3 py-3 group-data-[collapsible=icon]:hidden">
        <Link
          href="/"
          className="rounded-sm focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
        >
          <Brand />
        </Link>
      </SidebarHeader>

      {/* shadcn ships gap-0 at both levels, which stacks the rows edge to
          edge. Nav is read by scanning, and scanning needs air. */}
      <SidebarContent className="gap-4 group-data-[collapsible=icon]:pt-3">
        {NAV_BY_ROLE[user.role].map((group, index) => (
          <SidebarGroup key={group.label ?? index} className="px-3 py-0">
            {group.label && (
              <SidebarGroupLabel className="mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <NavEntry key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-3 px-3 pb-3">
        <SemesterContext />
        <SidebarSeparator className="mx-0" />
        <NavUser user={user} onSignOut={onSignOut} />
      </SidebarFooter>

      {/* Drag the edge to open or close, for anyone who never finds Ctrl+B. */}
      <SidebarRail />
    </Sidebar>
  );
}
