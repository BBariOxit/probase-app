import {
  BookOpen,
  CalendarRange,
  ChartColumn,
  ClipboardCheck,
  ClipboardPen,
  FileSearch,
  FileUp,
  Gavel,
  GraduationCap,
  Layers,
  Lightbulb,
  MessageSquareText,
  ScrollText,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/lib/api/types';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Whether the screen behind this item exists. Unbuilt destinations are shown
   * disabled rather than hidden, so the shape of each role's job is legible
   * from the first screen instead of appearing a module at a time.
   */
  ready?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  // Five destinations, no grouping: a label above a flat list of five would be
  // furniture around something already obvious.
  STUDENT: [
    {
      items: [
        { href: '/student', label: 'Đề tài', icon: BookOpen, ready: true },
        {
          href: '/student/nhom',
          label: 'Nhóm của tôi',
          icon: Users,
          ready: true,
        },
        { href: '/student/de-xuat', label: 'Đề xuất của tôi', icon: Lightbulb },
        { href: '/student/nop-bai', label: 'Nộp báo cáo', icon: FileUp },
        { href: '/student/ket-qua', label: 'Kết quả', icon: GraduationCap },
      ],
    },
  ],

  // Split because supervising and sitting on a council are two different
  // capacities of the same person. Flattened, a lecturer would confuse the
  // topics they mentor with the ones they have been assigned to review.
  LECTURER: [
    {
      label: 'Hướng dẫn',
      items: [
        {
          href: '/lecturer',
          label: 'Đề tài của tôi',
          icon: BookOpen,
          ready: true,
        },
        { href: '/lecturer/nhom', label: 'Duyệt nhóm', icon: UserCheck },
        { href: '/lecturer/de-xuat', label: 'Đề xuất từ SV', icon: Lightbulb },
        {
          href: '/lecturer/bao-cao',
          label: 'Báo cáo & nhận xét',
          icon: MessageSquareText,
        },
        { href: '/lecturer/cham-diem', label: 'Chấm điểm', icon: ClipboardPen },
      ],
    },
    {
      label: 'Hội đồng',
      items: [
        { href: '/lecturer/phan-bien', label: 'Phản biện', icon: FileSearch },
        { href: '/lecturer/hoi-dong', label: 'Hội đồng của tôi', icon: Gavel },
      ],
    },
  ],

  // Eight destinations across four unrelated concerns — this is the role that
  // makes grouping necessary rather than decorative.
  ADMIN: [
    {
      label: 'Vận hành',
      items: [
        {
          href: '/admin',
          label: 'Duyệt đề tài',
          icon: ClipboardCheck,
          ready: true,
        },
        { href: '/admin/hoi-dong', label: 'Hội đồng bảo vệ', icon: Gavel },
      ],
    },
    {
      label: 'Người dùng',
      // Importing a roster is a button inside this screen, not a destination:
      // it is something you do, not somewhere you go.
      items: [{ href: '/admin/tai-khoan', label: 'Tài khoản', icon: Users }],
    },
    {
      label: 'Danh mục',
      items: [
        { href: '/admin/hoc-ky', label: 'Học kỳ', icon: CalendarRange },
        {
          href: '/admin/chuyen-nganh',
          label: 'Chuyên ngành',
          icon: GraduationCap,
        },
        { href: '/admin/loai-do-an', label: 'Loại đồ án', icon: Layers },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        {
          href: '/admin/bao-cao',
          label: 'Báo cáo & thống kê',
          icon: ChartColumn,
        },
        {
          href: '/admin/nhat-ky',
          label: 'Nhật ký hoạt động',
          icon: ScrollText,
        },
      ],
    },
  ],
};

/** The title the header shows for a path, taken from the navigation itself. */
export function titleFor(role: Role, pathname: string): string {
  const items = NAV_BY_ROLE[role].flatMap((group) => group.items);
  const match = items
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    // The role landing is a prefix of every one of its subpages, so the
    // longest match is the specific one.
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.label ?? 'ProBase';
}
