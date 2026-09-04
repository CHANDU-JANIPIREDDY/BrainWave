export const SERVICE_PATHS = {
  people: '/services/people',
  crm: '/services/crm',
  desk: '/services/desk',
  books: '/services/books',
};

export const ROLE_SERVICES = {
  Admin: ['people', 'crm', 'desk', 'books'],
  HR: ['people'],
  Sales: ['crm'],
  Support: ['desk'],
  Finance: ['books'],
};

export function pathForService(app) {
  if (app?.service && SERVICE_PATHS[app.service]) return SERVICE_PATHS[app.service];
  if (typeof app?.path === 'string' && app.path.startsWith('/services/')) return app.path;
  return '/dashboard';
}

export function userCanAccessService(user, service) {
  if (!user || !service) return false;
  if (Array.isArray(user.services) && user.services.includes(service)) return true;
  return (user.roles || []).some((role) => (ROLE_SERVICES[role] || []).includes(service));
}
