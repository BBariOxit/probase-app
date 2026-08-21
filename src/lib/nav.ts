import {
  BookOpen,
  BookUser,
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
  Shuffle,
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
        {
          href: '/student/de-xuat',
          label: 'Đề xuất của tôi',
          icon: Lightbulb,
          ready: true,
        },
        {
          href: '/student/nop-bai',
          label: 'Nộp báo cáo',
          icon: FileUp,
          ready: true,
        },
        {
          href: '/giang-vien',
          label: 'Giảng viên',
          icon: GraduationCap,
          ready: true,
        },
        { href: '/student/ket-qua', label: 'Kết quả', icon: ClipboardPen },
      ],
    },
  ],

  // Split because supervising and sitting on a council are two different
  // capacities of the same person. Flattened, a lecturer would confuse the
  // topics they mentor with the ones they have been assigned to review.
  //
  // "Duyệt nhóm" used to be the second entry here and has been removed rather
  // than left disabled: per-group approval is gone from the design entirely —
  // a group that fills up is simply done, and the faculty office settles the
  // whole semester at once — so the item was promising a screen that is never
  // going to be built.
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
        {
          href: '/lecturer/de-xuat',
          label: 'Đề xuất từ SV',
          icon: Lightbulb,
          ready: true,
        },
        {
          href: '/lecturer/bao-cao',
          label: 'Báo cáo & nhận xét',
          icon: MessageSquareText,
          ready: true,
        },
        {
          href: '/giang-vien',
          label: 'Giảng viên',
          icon: GraduationCap,
          ready: true,
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
        // Between approving topics and running councils, which is where it sits
        // in the term as well: it is the work that turns a closed registration
        // window into the list everything afterwards is built on.
        {
          href: '/admin/phan-bo',
          label: 'Phân bổ đề tài',
          icon: Shuffle,
          ready: true,
        },
        { href: '/admin/hoi-dong', label: 'Hội đồng bảo vệ', icon: Gavel },
      ],
    },
    {
      label: 'Người dùng',
      // Importing a roster is a button inside a screen, not a destination: it is
      // something you do, not somewhere you go.
      //
      // Two entries rather than one, because they answer different questions.
      // Tài khoản is about logins — who may sign in, in which role. Sinh viên is
      // about the term — who has a topic, under whom, and who is still waiting.
      // The office opens the second one daily and the first one twice a year.
      items: [
        {
          href: '/admin/sinh-vien',
          label: 'Sinh viên',
          // Not the graduation cap: Chuyên ngành two groups below already wears
          // it, and two entries in one sidebar with the same glyph are two
          // entries nobody can tell apart at a glance.
          icon: BookUser,
          ready: true,
        },
        {
          href: '/admin/tai-khoan',
          label: 'Tài khoản',
          icon: Users,
          ready: true,
        },
      ],
    },
    {
      label: 'Danh mục',
      items: [
        {
          href: '/admin/hoc-ky',
          label: 'Học kỳ',
          icon: CalendarRange,
          ready: true,
        },
        // One destination for both flat lists. They were a page each and each
        // page was a six-row table holding a third of a monitor, while the
        // office declares both in the same sitting at the start of a term.
        {
          href: '/admin/danh-muc',
          label: 'Ngành & loại đồ án',
          icon: Layers,
          ready: true,
        },
      ],
    },
    {
      label: 'Hệ thống',
      items: [
        {
          href: '/admin/bao-cao',
          label: 'Báo cáo & thống kê',
          icon: ChartColumn,
          ready: true,
        },
        {
          href: '/admin/nhat-ky',
          label: 'Nhật ký hoạt động',
          icon: ScrollText,
          ready: true,
        },
      ],
    },
  ],
};

/** The title the header shows for a path, taken from the navigation itself. */
/**
 * Screens reachable without being a destination in the sidebar.
 *
 * A join link is followed from a chat message, so it has no nav entry to take a
 * title from — and falling through to the product name told the reader nothing
 * about the page they had just been sent to.
 */
const TITLE_BY_PREFIX: { prefix: string; label: string }[] = [
  { prefix: '/join/', label: 'Tham gia nhóm' },
  // Reached from the bell rather than the sidebar, so it needs a title here or
  // the header would fall back to the product name on a real screen.
  { prefix: '/thong-bao', label: 'Thông báo' },
  // Same again for the two screens the account menu opens. Not "/tai-khoan":
  // the admin's user-management screen is already called that, and two
  // different pages answering to the same word is how a support question
  // becomes unanswerable.
  { prefix: '/ca-nhan', label: 'Trang cá nhân' },
  // The directory itself and any profile within it share the same heading:
  // "/giang-vien" (the list) and "/giang-vien/42" (one person) both say
  // "Giảng viên" because the sub-page is the person, not a new section.
  { prefix: '/giang-vien', label: 'Giảng viên' },
];

/**
 * Where a topic is read, for the person reading it.
 *
 * The same topic has three screens — a student registers on it, its supervisor
 * edits it, an admin moderates it — and each one is guarded by role, so a link
 * built without knowing who is following it lands somebody on a page that
 * bounces them straight back out.
 */
export function topicHref(role: Role, topicId: number): string {
  switch (role) {
    case 'STUDENT':
      return `/student/topics/${topicId}`;
    case 'LECTURER':
      return `/lecturer/topics/${topicId}`;
    case 'ADMIN':
      return `/admin/topics/${topicId}`;
  }
}

export function titleFor(role: Role, pathname: string): string {
  const items = NAV_BY_ROLE[role].flatMap((group) => group.items);
  const match = items
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    // The role landing is a prefix of every one of its subpages, so the
    // longest match is the specific one.
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (match) return match.label;

  const offNav = TITLE_BY_PREFIX.find((entry) =>
    pathname.startsWith(entry.prefix),
  );

  return offNav?.label ?? 'ProBase';
}
