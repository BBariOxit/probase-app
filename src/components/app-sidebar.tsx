'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Role } from '@/lib/api/types';
import { NAV_BY_ROLE, type NavItem } from '@/lib/nav';
import { useSidebar } from '@/lib/ui/use-sidebar';
import { cn } from '@/lib/utils';
import { Brand } from '@/components/brand';
import { SemesterContext } from '@/components/semester-context';
import { Tooltip } from '@/components/ui/tooltip';

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  // Nested routes belong to their section: /lecturer/topics/4 should still
  // light up "Đề tài của tôi".
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
        active
          ? 'bg-sidebar-primary/10 text-sidebar-primary'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  // A label the user cannot read is not a label; collapsed items borrow one
  // from the tooltip instead.
  return collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link;
}

function SidebarBody({
  role,
  collapsed,
  onNavigate,
}: {
  role: Role;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 px-2.5 py-3">
        {NAV_BY_ROLE[role].map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="px-2.5 pb-3">
        <SemesterContext collapsed={collapsed} />
      </div>
    </>
  );
}

/**
 * Two presentations of one navigation: a column that collapses to icons on
 * desktop, and a drawer on mobile. They share SidebarBody so the two cannot
 * drift apart as destinations are added.
 */
export function AppSidebar({ role }: { role: Role }) {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } =
    useSidebar();

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex',
          'transition-[width] duration-200',
          collapsed ? 'w-[4.25rem]' : 'w-60',
        )}
      >
        {/*
          The toggle sits in the header rather than at the foot of the column.
          Bottom-left is where Next puts its development indicator, which
          covered it outright — and once collapsed, the control that expands
          the sidebar again was underneath that badge with no other way back.
        */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-sidebar-border px-3',
            collapsed ? 'justify-center' : 'justify-between pl-4',
          )}
        >
          {!collapsed && <Brand />}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
            className={cn(
              'flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <SidebarBody role={role} collapsed={collapsed} />
      </aside>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn(
              'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden',
              'data-ending-style:opacity-0 data-starting-style:opacity-0',
            )}
          />
          <Dialog.Popup
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar lg:hidden',
              'transition-transform duration-200',
              'data-ending-style:-translate-x-full data-starting-style:-translate-x-full',
            )}
          >
            <Dialog.Title className="sr-only">Điều hướng</Dialog.Title>
            <div className="flex h-14 items-center border-b border-sidebar-border px-4">
              <Brand />
            </div>
            {/* The drawer never collapses: it is already a deliberate act to
                open it, and icons alone would make that act pointless. */}
            <SidebarBody
              role={role}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
