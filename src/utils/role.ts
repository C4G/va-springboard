import { Session } from 'next-auth';

export const APP_ROLES = ['ADMIN', 'STAFF', 'READ_ONLY'];

export function isKnownRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return APP_ROLES.includes(role);
}

export function isAdminOrStaff(role: string | null | undefined) {
  if (!role) return false;
  return role === 'ADMIN' || role === 'STAFF';
}

export function isAdmin(role: string | null | undefined) {
  if (!role) return false;
  return role === 'ADMIN';
}

export function isStaff(role: string | null | undefined) {
  if (!role) return false;
  return role === 'STAFF';
}

export function isReadOnly(role: string | null | undefined) {
  if (!role) return false;
  return role === 'READ_ONLY';
}

export function getSchoolIdFilter(session: Session | null): string | null {
  if (!session?.user) return null;

  // ADMIN can see all schools
  if (isAdmin(session.user.role)) {
    return null;
  }

  // STAFF can only see their assigned school
  if (isStaff(session.user.role)) {
    return session.user.schoolId || null;
  }

  return null;
}
