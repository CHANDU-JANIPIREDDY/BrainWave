const rbacService = require('../services/rbac/rbacService');
const { writeAudit } = require('../utils/audit');
const { sendError } = require('../utils/httpErrors');

const SERVICE_LABEL = {
  people: 'Zoho People',
  crm: 'Zoho CRM',
  desk: 'Zoho Desk',
  books: 'Zoho Books',
};

function requireZohoService(serviceKey) {
  const permissionCode = rbacService.getPermissionForService(serviceKey);
  const label = SERVICE_LABEL[serviceKey] || serviceKey;

  return async function zohoServiceGate(req, res, next) {
    const userId = req.auth?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const permissionCodes = await rbacService.getUserPermissions(userId);
    req.authz = { userId, permissions: permissionCodes };

    if (!permissionCodes.includes(permissionCode)) {
      await writeAudit({
        userId,
        action: 'rbac:forbidden',
        resource: 'ZohoService',
        resourceId: serviceKey,
        status: 'forbidden',
        request: { service: serviceKey, required: permissionCode },
        message: `Forbidden: missing permission ${permissionCode}`,
      });
      return sendError(res, 403, `You do not have permission to access ${label}`);
    }

    return next();
  };
}

module.exports = { requireZohoService };
