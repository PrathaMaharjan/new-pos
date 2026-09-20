import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect(`/t/${session.tenantSlug || 'test-org'}/dashboard`);
  }

  redirect('/login');
}
