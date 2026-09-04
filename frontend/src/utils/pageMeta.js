export const PAGE_META = {
  '/dashboard': {
    title: 'Dashboard',
    description: "Here's what's happening across your workspace.",
  },
  '/services/people': {
    title: 'Employees',
    description: 'Review employees from your Zoho People workspace.',
    crumbs: ['Zoho People', 'Employees'],
  },
  '/services/crm': {
    title: 'Leads',
    description: 'Manage and review leads from your Zoho CRM workspace.',
    crumbs: ['Zoho CRM', 'Leads'],
  },
  '/services/desk': {
    title: 'Support Tickets',
    description: 'Track customer support tickets from Zoho Desk.',
    crumbs: ['Zoho Desk', 'Tickets'],
  },
  '/services/books': {
    title: 'Invoices',
    description: 'Review invoices from your Zoho Books workspace.',
    crumbs: ['Zoho Books', 'Invoices'],
  },
  '/admin': {
    title: 'Admin',
    description: 'Manage users, roles, permissions, and audit activity.',
    crumbs: ['Administration'],
  },
};

export function metaForPath(pathname) {
  return PAGE_META[pathname] || { title: 'BrainWave', description: '' };
}
