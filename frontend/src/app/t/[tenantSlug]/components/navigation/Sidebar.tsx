'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronLeft, ChevronRight, LogOut, Menu, X,
    LayoutDashboard, Tags, Boxes, CalendarDays, Receipt, Users, UserCog, Settings,
    type LucideIcon,
} from 'lucide-react';
import { logout } from '@/lib/actions/logout';
import type { IconKey, NavItem } from '@/config/navigation';
import { ROLE_LABELS, type Role } from '@/config/roles';

const iconMap: Record<IconKey, LucideIcon> = {
    dashboard: LayoutDashboard,
    catalog: Tags,
    inventory: Boxes,
    booking: CalendarDays,
    billing: Receipt,
    customers: Users,
    staff: UserCog,
    settings: Settings,
};

type SidebarUser = { name: string; email?: string; role: Role };

type SidebarProps = {
    items: NavItem[];
    brandName: string;
    logoUrl?: string;
    user: SidebarUser;
};

/* ----------------------------- pieces ----------------------------- */

function Brand({
    brandName,
    logoUrl,
    collapsed,
}: {
    brandName: string;
    logoUrl?: string;
    collapsed: boolean;
}) {
    return (
        <div className={`flex items-center pt-7 pb-5 ${collapsed ? 'justify-center' : 'gap-3.5 px-5'}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6b5dd3] shadow-sm">
                {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={brandName} className="h-full w-full object-cover" />
                ) : (
                    <span className="text-lg font-bold text-white">
                        {brandName.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            {!collapsed && (
                <span className="truncate text-base font-bold text-zinc-900">{brandName}</span>
            )}
        </div>
    );
}

function NavList({
    items,
    collapsed,
    onNavigate,
}: {
    items: NavItem[];
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const isUnder = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <nav aria-label="Main" className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
            {items.map((item) => {
                const active = isUnder(item.match);
                const Icon = iconMap[item.icon];

                return (
                    <div key={item.match}>
                        <Link
                            href={item.href}
                            onClick={onNavigate}
                            title={collapsed ? item.label : undefined}
                            aria-current={active && !item.children ? 'page' : undefined}
                            className={`flex items-center gap-3.5 rounded-full py-3.5 text-sm font-semibold transition-all ${collapsed ? 'justify-center' : 'px-4'
                                } ${active
                                    ? 'bg-[#6b5dd3] text-white shadow-md shadow-indigo-100'
                                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                                }`}
                        >
                            <Icon size={20} className="shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>

                        {/* sub-pages, only while the parent section is open */}
                        {active && !collapsed && item.children && (
                            <ul className="ml-[1.65rem] mt-1.5 space-y-1 border-l border-[#6b5dd3]/15 pl-3">
                                {item.children.map((child) => {
                                    const childActive = isUnder(child.href);
                                    return (
                                        <li key={child.href}>
                                            <Link
                                                href={child.href}
                                                onClick={onNavigate}
                                                aria-current={childActive ? 'page' : undefined}
                                                className={`block rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${childActive
                                                    ? 'bg-[#6b5dd3]/10 text-[#6b5dd3]'
                                                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                                                    }`}
                                            >
                                                {child.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

function UserFooter({ user, collapsed }: { user: SidebarUser; collapsed: boolean }) {
    const initials = user.name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="space-y-2 border-t border-zinc-100 px-3 py-4">
            <div
                className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-3'}`}
                title={collapsed ? `${user.name} · ${ROLE_LABELS[user.role]}` : undefined}
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6b5dd3]/10 text-sm font-bold text-[#6b5dd3]">
                    {initials}
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">{user.name}</p>
                        <span className="mt-0.5 inline-block rounded-full bg-[#6b5dd3]/10 px-2 py-0.5 text-[11px] font-semibold text-[#6b5dd3]">
                            {ROLE_LABELS[user.role]}
                        </span>
                    </div>
                )}
            </div>

            <form action={logout}>
                <button
                    type="submit"
                    title={collapsed ? 'Log out' : undefined}
                    className={`flex w-full items-center gap-3.5 rounded-full py-3.5 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-red-600 ${collapsed ? 'justify-center' : 'px-4'
                        }`}
                >
                    <LogOut size={20} className="shrink-0" />
                    {!collapsed && <span>Log out</span>}
                </button>
            </form>
        </div>
    );
}

/* ----------------------------- sidebar ----------------------------- */

export function Sidebar({ items, brandName, logoUrl, user }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop */}
            <aside
                className={`sticky top-3 m-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 self-start flex-col rounded-3xl border border-zinc-100 bg-white shadow-sm transition-[width] duration-300 md:flex ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3.5 top-8 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-800"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <Brand brandName={brandName} logoUrl={logoUrl} collapsed={collapsed} />
                <NavList items={items} collapsed={collapsed} />
                <UserFooter user={user} collapsed={collapsed} />
            </aside>

            {/* Mobile top bar */}
            <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-100 bg-white px-4 md:hidden">
                <button
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                    className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-50"
                >
                    <Menu size={20} />
                </button>
                <span className="truncate text-sm font-bold text-zinc-900">{brandName}</span>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
                    <div className="absolute inset-0 bg-zinc-900/40" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col rounded-r-3xl bg-white shadow-xl">
                        <button
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close menu"
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-50"
                        >
                            <X size={18} />
                        </button>
                        <Brand brandName={brandName} logoUrl={logoUrl} collapsed={false} />
                        <NavList items={items} collapsed={false} onNavigate={() => setMobileOpen(false)} />
                        <UserFooter user={user} collapsed={false} />
                    </aside>
                </div>
            )}
        </>
    );
}