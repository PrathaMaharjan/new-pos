export type Role = 'owner' | 'manager' | 'staff' | 'frontdesk';

export const ROLE_LABELS: Record<Role, string> = {
    owner: 'Owner',
    manager: 'Manager',
    staff: 'Staff',
    frontdesk: 'Front Desk',
};
