export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

/** The user shape POST /auth/login returns alongside the token pair. */
export interface SessionUser {
  id: number;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  /** Null for an admin, who has neither profile row to carry a name. */
  fullName: string | null;
  avatarUrl: string | null;
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
  avatarUrl: string | null;
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
export type RoundPhase =
  'PREP' | 'OPEN' | 'RECONCILING' | 'EXTENDED' | 'FINALIZED';

/**
 * Dates arrive as ISO strings; nothing parses them into Date on the way in.
 *
 * A semester carries no registration state. It runs one round per kind of
 * project — Cơ sở, Chuyên ngành, Tốt nghiệp — and they open, close and settle on
 * their own schedules, so there is no single phase or deadline at this level to
 * report. Ask `/rounds` for those.
 */
export interface Semester {
  id: number;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  gradeSubmissionDeadline: string | null;
  isActive: boolean;
}

/**
 * One registration round: a semester crossed with a kind of project.
 *
 * The unit the faculty announces — "đợt Đồ án Cơ sở HK1" — and the unit every
 * registration question has an answer in. `cohorts` are intake years (`"2022"`),
 * not K-numbers.
 */
export interface RegistrationRound {
  id: number;
  semesterId: number;
  projectTypeId: number;
  phase: RoundPhase;
  registrationStart: string;
  registrationEnd: string;
  allocationMode: 'FIRST_COME' | 'PREFERENCE_ROUND';
  finalisedAt: string | null;
  semester: { id: number; name: string; code: string };
  projectType: ProjectType;
  cohorts: string[];
}

/** As much of a topic's round as a topic response carries. */
export interface TopicRound {
  id: number;
  phase: RoundPhase;
  registrationStart: string;
  registrationEnd: string;
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
  /**
   * Whether this reader already holds a place this semester. Null for staff.
   *
   * The other reason `canRegister` can be false while a topic sits there
   * plainly unclaimed — and without it a screen can only grey the button out
   * and say nothing, which reads as a fault rather than as the reader already
   * having what the button offers.
   */
  alreadyInAGroup: boolean | null;
  /**
   * The topic exists because a student proposed it and a lecturer said yes.
   *
   * True for every reader, because it is a fact about the topic. Such a topic is
   * held for its proposer while the gate is open, which is why the reader's own
   * side of it is a separate field rather than the same one read two ways.
   */
  fromProposal: boolean;
  /**
   * Whether the reader is that proposer — null for staff, and null for anybody
   * looking at a topic that came out of no proposal at all.
   *
   * The difference between "đề tài bạn đề xuất" and "do sinh viên khác đề xuất",
   * which is the difference between a reservation held *for* you and one held
   * *against* you. Collapsing them into `fromProposal` alone would leave a screen
   * describing both in the same words.
   */
  proposedByMe: boolean | null;
}

/** What a notice is about, so the reader can be sent somewhere useful. */
export type NotificationType =
  /** The only one addressed to a lecturer: a student is waiting on their answer. */
  | 'PROPOSAL_SUBMITTED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REJECTED'
  | 'GROUP_MEMBER_JOINED'
  | 'GROUP_MEMBER_REMOVED'
  | 'GROUP_DISBANDED'
  | 'ROUND_EXTENDED'
  /** The office placed somebody into a group — the reader, or somebody they now share a topic with. */
  | 'GROUP_MEMBER_ASSIGNED'
  /** The second one addressed to a lecturer: a student was put onto their topic. */
  | 'TOPIC_STUDENT_ASSIGNED'
  /** Allocation for a round is settled, including for the students it found nothing for. */
  | 'ROUND_FINALIZED'
  | 'SUBMISSION_FEEDBACK'
  | 'GRADE_PUBLISHED'
  | 'DEADLINE_REMINDER';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  /** Primary key of the record this is about, read together with `type`. */
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  items: AppNotification[];
  total: number;
  /** Unread across the whole inbox, not just this page — it is the badge. */
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TopicListItem extends TopicAvailability {
  id: number;
  title: string;
  maxStudents: number;
  status: TopicStatus;
  createdAt: string;
  semester: { id: number; name: string; code: string };
  round: TopicRound;
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
  semester: { id: number; name: string; code: string };
  /** The window and the phase live here — they are the round's, not the term's. */
  round: TopicRound;
  projectType: { id: number; name: string; code: string };
  lecturer: {
    id: number;
    fullName: string;
    lecturerCode: string;
    academicTitle: string | null;
  };
  activeGroup: ActiveGroup | null;
  roundPhase: RoundPhase;
  /**
   * Computed server-side: the topic is OPEN *and* its round's gate is too. An
   * extension counts as open — somebody may still walk through it, even though
   * not everybody.
   */
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
    avatarUrl: string | null;
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

/**
 * GET /me/profile — the account and the one role block that belongs to it.
 *
 * Split rather than flattened: identity is the same for all three roles and is
 * what every screen greeting somebody wants, while the rest differs entirely by
 * role. The block for the other role is null rather than missing, so a client
 * can tell "this account has no lecturer profile" from "the API did not send
 * one".
 *
 * Almost everything here is read-only to its owner — see UpdateMyProfileInput
 * for the short list that is not, and why.
 */
export interface MyProfile {
  id: number;
  email: string;
  role: Role;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  createdAt: string;
  fullName: string | null;
  student: {
    studentCode: string;
    fullName: string;
    class: string | null;
    cohort: string | null;
    phone: string | null;
    bio: string | null;
    major: { id: number; name: string; code: string } | null;
  } | null;
  lecturer: {
    id: number;
    lecturerCode: string;
    fullName: string;
    academicTitle: string | null;
    phone: string | null;
    bio: string | null;
    researchInterests: string | null;
    mentoring: MentoringLoad;
  } | null;
}

/**
 * How much supervising a lecturer has taken on this term, against the ceiling
 * the faculty set them.
 *
 * `groups` is what they would count by hand. `reserved` is the part they would
 * forget: a proposal they accepted becomes a topic held for one student who has
 * not registered yet — no group exists, but the promise does, and the API counts
 * both when it decides whether they may accept another.
 */
export interface MentoringLoad {
  groups: number;
  reserved: number;
  /** Null when the faculty set none, in which case `atQuota` is always false. */
  quota: number | null;
  atQuota: boolean;
}

/**
 * The whole of what a person may change about themselves.
 *
 * Name, student code, class, cohort and major are absent because the faculty
 * office owns them and the system reasons with them — cohort decides which
 * round an intake may enter. `academicTitle` is here and the mentoring quota is
 * not: a title is a fact about the person, a quota is the faculty's policy about
 * how much work they may be given.
 */
export interface UpdateMyProfileInput {
  phone?: string | null;
  bio?: string | null;
  /** Lecturers only — the API refuses these from a student rather than ignoring them. */
  academicTitle?: string | null;
  researchInterests?: string | null;
}

/**
 * GET /lecturers/:id — a supervisor as the rest of the faculty may see them.
 *
 * `email` and `phone` are null unless the reader is staff or is in a group on
 * one of this lecturer's topics. A student browsing topics has no business
 * ringing anyone; a student they actually supervise does.
 */
export interface PublicLecturer extends LecturerDirectoryEntry {
  bio: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * GET /lecturers — a row in the staff directory the proposal form picks from.
 *
 * Deliberately not the same set as `/topics/lecturers`, which lists only people
 * who already published a topic. A student writes their own idea precisely when
 * the catalogue has nothing they want, and the person who would guide it is often
 * the one with nothing in it.
 */
export interface LecturerDirectoryEntry {
  id: number;
  fullName: string;
  academicTitle: string | null;
  researchInterests: string | null;
  avatarUrl: string | null;
  mentoring: MentoringLoad;
}

/**
 * GET /rounds/:id/allocation — the faculty office's desk for one round.
 *
 * Three lists rather than two. The students with nowhere to be and the topics
 * with room are the working pair; `placements` is what the desk has already
 * done, and it exists because both of the others hide their own results — a
 * placed student leaves the first list and a filled topic leaves the second, so
 * without it a misclick would become invisible the moment it was made.
 */
export interface AllocationDesk {
  round: {
    id: number;
    phase: RoundPhase;
    semester: { id: number; name: string; code: string };
    projectType: ProjectType;
    /** Intake years this round is declared for, e.g. `["2022"]`. */
    cohorts: string[];
  };
  /** Whether placing anybody is possible at all — true only in RECONCILING. */
  canPlace: boolean;
  /** Why it is not, in words for the person reading. Null while it is. */
  blockedReason: string | null;
  summary: {
    unplacedCount: number;
    openSeats: number;
    /**
     * Students there is provably nowhere to put. The number that decides
     * whether this is an afternoon of clicking or a morning of phone calls.
     */
    shortfall: number;
    /**
     * Approved topics whose supervisor never opened them — the only slack left
     * when the seats run out. Reported, never used: opening a topic belongs to
     * the person who has to supervise it.
     */
    unopenedTopics: number;
    unopenedSeats: number;
  };
  students: UnplacedStudent[];
  topics: AllocationTopic[];
  placements: Placement[];
}

export interface UnplacedStudent {
  id: number;
  studentCode: string;
  fullName: string;
  class: string | null;
  cohort: string | null;
  major: { id: number; name: string; code: string } | null;
  userId: number;
  email: string;
  avatarUrl: string | null;
}

export interface AllocationTopic {
  id: number;
  title: string;
  maxStudents: number;
  status: TopicStatus;
  lecturer: { id: number; fullName: string; academicTitle: string | null };
  occupiedSeats: number;
  freeSeats: number;
  /** The group already on it, or null when this student would start one. */
  group: { id: number; name: string | null } | null;
}

export interface Placement {
  student: {
    id: number;
    studentCode: string;
    fullName: string;
    class: string | null;
  };
  groupId: number;
  topicId: number;
  topicTitle: string;
  assignedAt: string | null;
}

/** Where a proposal has got to. */
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

/**
 * One proposal, as both sides read it.
 *
 * The same shape serves the student's outbox and the lecturer's inbox — which of
 * the two a caller gets is decided by their token, not by a parameter — so the
 * student block is present even on a student's own row. A screen showing your own
 * name back to you is a small waste; two payload shapes that drift apart is not.
 */
export interface TopicProposal {
  id: number;
  status: ProposalStatus;
  title: string;
  description: string;
  expectedOutcomes: string;
  /** Why it was turned down. Only ever set on a REJECTED one. */
  lecturerFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  semester: { id: number; name: string; code: string };
  projectType: ProjectType;
  student: {
    id: number;
    fullName: string;
    studentCode: string;
    class: string | null;
    avatarUrl: string | null;
  };
  requestedLecturer: {
    id: number;
    fullName: string;
    academicTitle: string | null;
  };
  /** Who actually said yes — the same person, or null while nobody has. */
  acceptedByLecturer: {
    id: number;
    fullName: string;
    academicTitle: string | null;
  } | null;
  /**
   * What the yes turned into, and how far it has got.
   *
   * The status matters as much as the id: a topic the lecturer accepted still
   * waits on the faculty office, and a student looking for a register button that
   * is not there deserves to know which of the two is holding it up.
   */
  convertedTopic: { id: number; title: string; status: TopicStatus } | null;
}
