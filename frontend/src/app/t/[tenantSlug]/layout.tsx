import { Sidebar } from './components/navigation/Sidebar';
import { getNavForRole } from '@/config/navigation';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const user = {
        name: session.name,
        email: session.email,
        role: session.role,
    };
    const navItems = getNavForRole(user.role, tenantSlug);

    return (
        <div className="flex min-h-screen bg-zinc-50">
            <Sidebar
                items={navItems}
                brandName="pos"
                user={user}
            />
            <main className="flex-1 p-6 md:p-8">
                {children}
            </main>
        </div>
    );
}
