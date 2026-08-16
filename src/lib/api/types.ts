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

/** Dates arrive as ISO strings; nothing parses them into Date on the way in. */
export interface Semester {
  id: number;
  name: string;
  code: string;
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
  /** ACCEPTED members plus outstanding invitations, which hold their seat. */
  occupiedSeats: number;
}

export type TopicStatus =
  'PENDING' | 'APPROVED' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

/**
 * A row in the topic list. The long text bodies are absent by design — the API
 * leaves them out of list responses, so anything needing them has to fetch the
 * detail.
 */
export interface TopicListItem {
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

export interface TopicDetail {
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
  /** Computed server-side: the topic is OPEN *and* the window is current. */
  isRegistrationOpen: boolean;
}
