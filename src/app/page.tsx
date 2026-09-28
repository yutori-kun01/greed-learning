import { redirect } from 'next/navigation';
import { optionalUser } from '@/lib/session';

// Anonymous visitors used to be redirected to /courses, which then bounced
// them to /login — so the site had no reachable entry point at all. Send them
// to the public articles instead; members go straight to their dashboard.
export default async function Home() {
  const me = await optionalUser();
  redirect(me ? '/dashboard' : '/posts');
}
