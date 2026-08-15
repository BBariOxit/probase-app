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
