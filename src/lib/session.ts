import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'SUSPENDED';
};

async function currentUser(): Promise<SessionUser | null> {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });
  return session ? (session.user as unknown as SessionUser) : null;
}

/**
 * The single entry point for "is this request allowed to act".
 *
 * Suspension used to be enforced only by the proxy and the member layout, so
 * a suspended member was merely kept out of the UI — every Server Action
 * still ran for them. Checking it here means suspension actually takes
 * effect everywhere, because actions have no other way in.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');
  if (user.status === 'SUSPENDED') throw new Error('このアカウントは停止されています');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('Unauthorized');
  return user;
}

/** For reads that vary by sign-in state but are not gated on it. */
export async function optionalUser(): Promise<SessionUser | null> {
  const user = await currentUser();
  return user && user.status !== 'SUSPENDED' ? user : null;
}
