import { BookOpen, ClipboardCheck, type LucideIcon } from 'lucide-react';
import type { Role } from '@/lib/api/types';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Only destinations that exist.
 *
 * The finished system gives each role five or six of them — groups,
 * submissions, grades, councils — but an item leading to a page that says
 * "coming soon" spends a click to tell the user nothing. This map grows as
 * screens land rather than being written ahead of them.
 */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  STUDENT: [{ href: '/student', label: 'Đề tài', icon: BookOpen }],
  LECTURER: [{ href: '/lecturer', label: 'Đề tài của tôi', icon: BookOpen }],
  ADMIN: [{ href: '/admin', label: 'Duyệt đề tài', icon: ClipboardCheck }],
};
