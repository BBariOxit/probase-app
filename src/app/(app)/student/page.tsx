'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Layers,
  Loader2,
  Search,
} from 'lucide-react';
import {
  useActiveSemester,
  useMyEligibleProjectTypes,
  useMyRound,
  useProjectTypes,
} from '@/lib/api/master-data';
import { useMyGroup } from '@/lib/api/registration';
import { useTopicLecturers, useTopics } from '@/lib/api/topics';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { EmptyState } from '@/components/empty-state';
import { MyGroupBanner } from '@/components/my-group-banner';
import { PaginationBar } from '@/components/pagination-bar';
import { RegistrationPhaseNotice } from '@/components/registration-phase-notice';
import { SeatBadge } from '@/components/seat-indicator';
import { TopicRegisterButton } from '@/components/topic-register-button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 12;
/** Sentinel for "no filter" — a Select needs a value, and 0 is never an id. */
const ANY = 0;
/**
 * Sentinel for the default: the project types this student's intake may take.
 *
 * Negative so it can never collide with an id. It is the starting value rather
 * than "all", because a student registering for a project type their cohort is
 * not open for is refused by the API — showing them the whole catalogue means
 * most of what they scroll past is not theirs to take.
 *
 * It is a visible, removable option and not a hidden filter, which is the part
 * that matters: filtering silently is what makes people think data is missing.
 */
const MY_COHORT = -1;

export default function StudentTopicsPage() {
  const allowed = useRequireRole('STUDENT');
  const activeSemester = useActiveSemester();
  const round = useMyRound(activeSemester?.id);
  const { data: projectTypes } = useProjectTypes();
  const { data: myTypes } = useMyEligibleProjectTypes(activeSemester?.id);
  const { data: lecturers } = useTopicLecturers(activeSemester?.id);
  const { data: myGroup } = useMyGroup();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [projectTypeId, setProjectTypeId] = useState(MY_COHORT);
  const [lecturerId, setLecturerId] = useState(ANY);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isPending, error } = useTopics(
    {
      status: 'OPEN',
      semesterId: activeSemester?.id,
      forMyCohort: projectTypeId === MY_COHORT,
      projectTypeId:
        projectTypeId === ANY || projectTypeId === MY_COHORT
          ? undefined
          : projectTypeId,
      lecturerId: lecturerId === ANY ? undefined : lecturerId,
      q: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
    },
    // Every filter on this screen is scoped to the active semester, so asking
    // before it is known fetches a page that is about to be thrown away.
    { enabled: activeSemester !== undefined },
  );

  if (!allowed) return null;

  const topics = data?.items ?? [];
  // The default filter does not count as filtering: an empty page under it means
  // the faculty has opened nothing for this intake, not that the student narrowed
  // too far, and telling them to loosen a filter they never set is misleading.
  const filtering =
    debouncedSearch !== '' ||
    (projectTypeId !== ANY && projectTypeId !== MY_COHORT) ||
    lecturerId !== ANY;

  /**
   * What the default resolves to, as a second line rather than a parenthetical.
   *
   * Select items do not wrap — the primitive sets whitespace-nowrap so an option
   * cannot break mid-phrase — so "Dành cho khóa của bạn (Đồ án Tốt nghiệp)" ran
   * past the edge of the popup and was clipped. Two short lines fit, and the
   * resolved project type is worth showing: it answers what this student is meant
   * to be doing this semester.
   */
  const myCohortTypes = myTypes?.map((type) => type.name).join(', ');

  /** Every filter change invalidates the current page number. */
  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/*
        No page heading. The app header already names this screen and the
        sidebar already names the semester, so an <h1> here repeated both and
        pushed the list a hundred pixels down the page — on the one screen
        where the list is the whole point.
      */}
      {myGroup && <MyGroupBanner group={myGroup} />}

      {round && (
        <RegistrationPhaseNotice
          phase={round.phase}
          registrationStart={round.registrationStart}
          registrationEnd={round.registrationEnd}
          hasGroup={myGroup != null}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder="Tìm đề tài…"
            className="pl-8"
            aria-label="Tìm đề tài"
          />
        </div>

        <Select
          value={projectTypeId}
          onValueChange={(value) => {
            setProjectTypeId(value as number);
            resetPage();
          }}
        >
          <SelectTrigger className="w-56" aria-label="Lọc theo loại đồ án">
            <SelectValue>
              {(value) => {
                if (value === MY_COHORT) return 'Khóa của bạn';
                return (
                  projectTypes?.find((type) => type.id === value)?.name ??
                  'Mọi loại đồ án'
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MY_COHORT}>
              <span className="flex flex-col items-start">
                <span>Dành cho khóa của bạn</span>
                {myCohortTypes && (
                  <span className="text-xs text-muted-foreground">
                    {myCohortTypes}
                  </span>
                )}
              </span>
            </SelectItem>
            <SelectItem value={ANY}>Mọi loại đồ án</SelectItem>
            {projectTypes?.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Students go looking for the supervisors they know, so this is a
            primary filter rather than a refinement. */}
        <Select
          value={lecturerId}
          onValueChange={(value) => {
            setLecturerId(value as number);
            resetPage();
          }}
        >
          <SelectTrigger className="w-52" aria-label="Lọc theo giảng viên">
            <SelectValue>
              {(value) => {
                const lecturer = lecturers?.find((one) => one.id === value);
                if (!lecturer) return 'Mọi giảng viên';
                return lecturer.academicTitle
                  ? `${lecturer.academicTitle} ${lecturer.fullName}`
                  : lecturer.fullName;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Mọi giảng viên</SelectItem>
            {lecturers?.map((lecturer) => (
              <SelectItem key={lecturer.id} value={lecturer.id}>
                {lecturer.academicTitle
                  ? `${lecturer.academicTitle} ${lecturer.fullName}`
                  : lecturer.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Beside the filters rather than orphaned under the grid: the count
            is the answer to what the filters just did. */}
        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {data.total} đề tài
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Không tải được danh sách đề tài.
        </p>
      )}

      {isPending && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isPending && topics.length === 0 && (
        <div className="rounded-xl border">
          <EmptyState
            icon={BookOpen}
            title={
              filtering
                ? 'Không có đề tài nào khớp bộ lọc.'
                : projectTypeId === MY_COHORT
                  ? 'Chưa có đề tài nào mở cho khóa của bạn. Chọn "Mọi loại đồ án" để xem toàn bộ.'
                  : 'Chưa có đề tài nào được mở đăng ký.'
            }
          />
        </div>
      )}

      {/* Cards rather than a table: titles run long, students compare rather
          than scan, and this is the screen most likely to be opened on a
          phone. Three columns only from xl — at lg the sidebar leaves about
          720px, and three Vietnamese titles in that width wrap badly. */}
      {topics.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => (
            <li key={topic.id}>
              {/*
                The card is a container rather than one big <Link>, because it
                now holds a button as well. The link is stretched over the card
                with an ::after overlay instead: the whole surface still
                navigates, the button sits above it, and neither ends up nested
                inside the other.
              */}
              <div className="group relative flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-medium">
                    <Link
                      href={`/student/topics/${topic.id}`}
                      className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                    >
                      {topic.title}
                    </Link>
                  </h2>
                  {/* Not the topic status: this list is already filtered to
                      OPEN, so a status badge read "Đang mở" on every card and
                      answered nothing. Whether a seat is left is the question
                      actually being asked. */}
                  <SeatBadge topic={topic} />
                </div>

                <div className="mt-auto flex items-end justify-between gap-2">
                  <div className="min-w-0 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <GraduationCap className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {topic.lecturer.academicTitle
                          ? `${topic.lecturer.academicTitle} ${topic.lecturer.fullName}`
                          : topic.lecturer.fullName}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Layers className="size-3.5 shrink-0" />
                      {topic.projectType.name} · tối đa {topic.maxStudents} SV
                    </p>
                  </div>

                  {/* The action if there is one, the "this is a link"
                      affordance if there is not. Chosen inside the component
                      rather than here: picking between the two at this level
                      would unmount it the moment a registration succeeds, and
                      take the confirmation dialog with it. */}
                  <TopicRegisterButton
                    topic={topic}
                    idle={
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && (
        <PaginationBar
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
