'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    if (refreshToken) {
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: `refresh_token=${refreshToken}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  }

  cookieStore.delete('access_token');
  cookieStore.set('refresh_token', '', { path: '/api/auth', maxAge: 0 });

  redirect('/login');
}
