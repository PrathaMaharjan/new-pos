import { getSession } from '@/lib/auth/session';
import { ROLE_LABELS, type Role } from '@/config/roles';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await getSession();
  const role: Role = session?.role || 'staff';
  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              This is the dashboard for {roleLabel}
            </h1>

          </div>
        </div>
      </div>

    </div>
  );
}
