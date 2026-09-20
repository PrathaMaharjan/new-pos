import { cookies } from 'next/headers';
import type { Role } from '@/config/roles';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId?: string;
  tenantSlug?: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  // 1. Try querying backend /api/auth/me for fresh user and tenant data
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      const rawRole = (data.role || 'staff').toLowerCase();
      const role: Role = (
        ['owner', 'manager', 'staff', 'frontdesk'].includes(rawRole)
          ? rawRole
          : 'staff'
      ) as Role;

      return {
        id: data.user.id,
        email: data.user.email,
        name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.email,
        role,
        tenantId: data.tenantId,
        tenantSlug: data.tenantSlug || undefined,
      };
    }
  } catch (error) {
    console.error('Failed to fetch /api/auth/me from backend:', error);
  }

  // 2. Fallback: decode JWT payload directly from access_token cookie
  try {
    const parts = accessToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      const rawRole = (payload.role || 'staff').toLowerCase();
      const role: Role = (
        ['owner', 'manager', 'staff', 'frontdesk'].includes(rawRole)
          ? rawRole
          : 'staff'
      ) as Role;

      return {
        id: payload.userId,
        email: '',
        name: 'User',
        role,
        tenantId: payload.tenantId,
      };
    }
  } catch {
    // ignore
  }

  return null;
}
