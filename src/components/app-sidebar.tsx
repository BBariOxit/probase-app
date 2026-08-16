'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from '@/lib/api/types';
import { NAV_BY_ROLE, type NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';
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
          className="cursor-not-allowed opacity-45"
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent active:bg-transparent"
              render={<Link href="/" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
                P
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight">
                Pro<span className="text-muted-foreground">Base</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_BY_ROLE[user.role].map((group, index) => (
          <SidebarGroup key={group.label ?? index}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavEntry key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SemesterContext />
        <SidebarSeparator className="mx-0" />
        <NavUser user={user} onSignOut={onSignOut} />
      </SidebarFooter>

      {/* Drag the edge to open or close, for anyone who never finds Ctrl+B. */}
      <SidebarRail />
    </Sidebar>
  );
}
