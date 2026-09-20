import { Role } from './roles';

export type IconKey =
  | 'dashboard'
  | 'catalog'
  | 'inventory'
  | 'booking'
  | 'billing'
  | 'customers'
  | 'staff'
  | 'settings';

export type NavItem = {
  label: string;
  href: string;
  match: string;
  icon: IconKey;
  roles: Role[];
  children?: { label: string; href: string }[];
};

export function getNavForRole(role: Role, tenantSlug: string): NavItem[] {
  const base = `/t/${tenantSlug}`;

  const allNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: `${base}/dashboard`,
      match: `${base}/dashboard`,
      icon: 'dashboard',
      roles: ['owner', 'manager', 'staff', 'frontdesk'],
    },
    {
      label: 'Catalog',
      href: `${base}/catalog`,
      match: `${base}/catalog`,
      icon: 'catalog',
      roles: ['owner', 'manager'],
    },
    {
      label: 'Inventory',
      href: `${base}/inventory`,
      match: `${base}/inventory`,
      icon: 'inventory',
      roles: ['owner', 'manager', 'staff'],
    },
    {
      label: 'Bookings',
      href: `${base}/booking`,
      match: `${base}/booking`,
      icon: 'booking',
      roles: ['owner', 'manager', 'staff', 'frontdesk'],
    },
    {
      label: 'Billing',
      href: `${base}/billing`,
      match: `${base}/billing`,
      icon: 'billing',
      roles: ['owner', 'manager', 'frontdesk'],
    },
    {
      label: 'Customers',
      href: `${base}/customers`,
      match: `${base}/customers`,
      icon: 'customers',
      roles: ['owner', 'manager', 'frontdesk'],
    },
    {
      label: 'Staff',
      href: `${base}/staff`,
      match: `${base}/staff`,
      icon: 'staff',
      roles: ['owner', 'manager'],
    },
    {
      label: 'Settings',
      href: `${base}/settings`,
      match: `${base}/settings`,
      icon: 'settings',
      roles: ['owner'],
    },
  ];

  return allNavItems.filter((item) => item.roles.includes(role));
}
