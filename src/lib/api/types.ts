export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

/** The user shape POST /auth/login returns alongside the token pair. */
export interface SessionUser {
  id: number;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  user: SessionUser;
}

export interface ChangePasswordResponse extends TokenPair {
  message: string;
}

/** GET /auth/me — richer than SessionUser, and the only session source after a reload. */
export interface MeResponse {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  studentProfile: { fullName: string; studentCode: string } | null;
  lecturerProfile: { fullName: string; lecturerCode: string } | null;
}

/** Display name for the signed-in user, falling back to the address. */
export function displayName(me: MeResponse): string {
  return (
    me.studentProfile?.fullName ?? me.lecturerProfile?.fullName ?? me.email
  );
}

/**
 * The stage a semester's registration has reached.
 *
 * Read this rather than comparing the dates. The dates are what moves the phase,
 * but the office can open the gate early or hold it shut, and the phase is what
 * the API actually enforces — so a screen that decides from the dates can end up
 * offering a button the API refuses.
 */
export type SemesterPhase = 'PREP' | 'OPEN' | 'RECONCILING' | 'FINALIZED';

/** Dates arrive as ISO strings; nothing parses them into Date on the way in. */
export interface Semester {
  id: number;
  name: string;
  code: string;
  phase: SemesterPhase;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  gradeSubmissionDeadline: string | null;
  isActive: boolean;
}

export interface ProjectType {
  id: number;
  name: string;
  code: string;
}

/** Every list endpoint answers in this envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type RegistrationGroupStatus =
  'FORMING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

/**
 * The single group holding a topic, or null when nobody has taken it.
 *
 * Never a count: at most one group can be live on a topic, and rejected ones
 * are kept for the record — so counting rows would report groups that walked
 * away as though they were still there.
 */
export interface ActiveGroup {
  id: number;
  status: RegistrationGroupStatus;
  occupiedSeats: number;
  openForJoin: boolean;
  /**
   * Seats are being kept for people the leader is bringing.
   *
   * Say "taken" rather than "one seat left" while this is true: a seat with
   * somebody's name on it is not free, and offering it would be a lie the API
   * then has to refuse.
   */
  holdActive: boolean;
}

export type TopicStatus =
  'PENDING' | 'APPROVED' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

/**
 * A row in the topic list. The long text bodies are absent by design — the API
 * leaves them out of list responses, so anything needing them has to fetch the
 * detail.
 */
/**
 * What a student needs to know about their chances on a topic.
 *
 * The seat arithmetic is done server-side and sent as two booleans on purpose:
 * whether a seat is *available to this viewer* depends on the hold, the declared
 * size and the group's own door being open, and a screen that recomputes it will
 * eventually disagree with the API and offer a button that fails.
 */
export interface TopicAvailability {
  occupiedSeats: number;
  isFull: boolean;
  /** Nobody holds this topic: the first to press register takes it. */
  canRegister: boolean;
  /** A group holds it and has a seat this viewer could take right now. */
  canJoin: boolean;
  /**
   * Whether this reader's intake may take this kind of project. Null for staff,
   * to whom the question does not apply.
   *
   * Separate from the two booleans above because "not yours to take" and "someone
   * else already took it" are different facts — with only canRegister/canJoin to
   * go on, a screen would end up calling an unclaimed topic taken.
   */
  eligibleForMe: boolean | null;
}

export interface TopicListItem extends TopicAvailability {
  id: number;
  title: string;
  maxStudents: number;
  status: TopicStatus;
  createdAt: string;
  semester: { id: number; name: string; code: string };
  projectType: { id: number; name: string; code: string };
  lecturer: { id: number; fullName: string; academicTitle: string | null };
  activeGroup: ActiveGroup | null;
}

export interface TopicDetail extends TopicAvailability {
  id: number;
  title: string;
  description: string;
  expectedOutcomes: string;
  maxStudents: number;
  status: TopicStatus;
  createdAt: string;
  updatedAt: string;
  semesterId: number;
  projectTypeId: number;
  semester: {
    id: number;
    name: string;
    code: string;
    registrationStart: string;
    registrationEnd: string;
  };
  projectType: { id: number; name: string; code: string };
  lecturer: {
    id: number;
    fullName: string;
    lecturerCode: string;
    academicTitle: string | null;
  };
  activeGroup: ActiveGroup | null;
  semesterPhase: SemesterPhase;
  /** Computed server-side: the topic is OPEN *and* the semester phase is too. */
  isRegistrationOpen: boolean;
}

/** How somebody came to be in a group — self, a join link, or placed by the office. */
export type GroupJoinSource = 'SELF' | 'LINK' | 'ASSIGNED';

export interface GroupMember {
  id: number;
  joinSource: GroupJoinSource;
  joinedAt: string | null;
  isLeader: boolean;
  student: {
    id: number;
    studentCode: string;
    fullName: string;
    class: string | null;
    cohort: string | null;
    major: { id: number; name: string; code: string } | null;
    email: string;
  };
}

/** A group as its own members see it. */
export interface RegistrationGroup {
  id: number;
  topicId: number;
  semesterId: number;
  leaderId: number;
  name: string | null;
  status: RegistrationGroupStatus;
  openForJoin: boolean;
  declaredSize: number | null;
  holdUntil: string | null;
  createdAt: string;
  topic: {
    id: number;
    title: string;
    maxStudents: number;
    lecturerId: number;
    lecturer: { id: number; fullName: string; academicTitle: string | null };
    projectType: { id: number; name: string; code: string };
  };
  members: GroupMember[];
  occupiedSeats: number;
  /** Seats kept for people the leader is bringing; zero once the hold lapses. */
  heldSeats: number;
  seatsOpenToAnyone: number;
  isFull: boolean;
  holdActive: boolean;
  isLeader: boolean;
  /** Only ever sent to the group's own members. */
  joinCode: string | null;
}

/**
 * What a join link leads to, before following it commits anything.
 *
 * Joining spends a student's single registration for the whole semester, so the
 * page shows this first — a link forwarded around a group chat must not cost
 * somebody their place on one curious tap.
 */
export interface JoinPreview {
  group: {
    id: number;
    name: string | null;
    occupiedSeats: number;
    capacity: number;
    isFull: boolean;
    members: { fullName: string; isLeader: boolean }[];
  };
  topic: {
    id: number;
    title: string;
    projectType: { id: number; name: string; code: string };
    lecturer: { id: number; fullName: string; academicTitle: string | null };
  };
  alreadyMember: boolean;
  canJoin: boolean;
  /** The very message the POST would answer with, or null when it would succeed. */
  blockedReason: string | null;
}
