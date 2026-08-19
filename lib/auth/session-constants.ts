export type UserRole = 'admin' | 'gestor' | 'membro';
export type UserStatus = 'pendente' | 'ativo' | 'inativo';

export interface ImpersonationInfo {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
}

export interface UserSessionPayload {
  userId: string;
  email: string;
  name?: string | null;
  role: string; // 'admin', 'gestor', 'membro'
  status: string; // 'pendente', 'ativo', 'inativo'
  avatarUrl?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  managedDepartments?: string[];
  managedTeams?: string[];
  memberDepartments?: string[];
  memberTeams?: string[];
  impersonatedFrom?: ImpersonationInfo | null;
  exp: number;
}

export const SESSION_COOKIE_NAME = '5w2h_session';

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export const CLEAR_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
  maxAge: 0,
  expires: new Date(0),
};

/**
 * Normalizes role string to canonical 'admin' | 'gestor' | 'membro'
 */
export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'membro';
  const r = role.toLowerCase().trim();
  if (r === 'admin' || r === 'administrador') return 'admin';
  if (r === 'gestor' || r === 'manager') return 'gestor';
  return 'membro';
}

/**
 * Normalizes status string to canonical 'pendente' | 'ativo' | 'inativo'
 */
export function normalizeStatus(status?: string | null): UserStatus {
  if (!status) return 'pendente';
  const s = status.toLowerCase().trim();
  if (s === 'ativo' || s === 'active') return 'ativo';
  if (s === 'inativo' || s === 'inactive') return 'inativo';
  return 'pendente';
}
