const User = require('../models/User');
const rbacService = require('../services/rbac/rbacService');
const { writeAudit } = require('../utils/audit');

const APP_META = {
  people: { path: '/services/people', description: 'Employee directory' },
  crm: { path: '/services/crm', description: 'Sales leads' },
  desk: { path: '/services/desk', description: 'Support tickets' },
  books: { path: '/services/books', description: 'Finance invoices' },
};

async function listAuthorizedApps(req, res) {
  const userId = req.auth?.userId;
  const user = await User.findById(userId).lean();
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const permissionCodes = await rbacService.getUserPermissions(userId);
  req.authz = { userId, permissions: permissionCodes };

  const apps = [];
  for (const [service, cfg] of Object.entries(rbacService.SERVICES)) {
    if (!permissionCodes.includes(cfg.permissionCode)) continue;
    apps.push({
      service,
      displayName: rbacService.getServiceDisplayName(service),
      path: APP_META[service].path,
      description: APP_META[service].description,
    });
  }

  await writeAudit({
    userId,
    action: 'zoho:applications:view',
    resource: 'ZohoApplications',
    resourceId: userId,
    status: 'success',
    request: { services: apps.map((a) => a.service) },
  });

  return res.json({ success: true, apps });
}

module.exports = { listAuthorizedApps };
