const UserRole = require('../../models/UserRole');
const RolePermission = require('../../models/RolePermission');
const Permission = require('../../models/Permission');

const SERVICES = {
  people: { permissionCode: 'zoho:people:access', displayName: 'Zoho People' },
  crm: { permissionCode: 'zoho:crm:access', displayName: 'Zoho CRM' },
  desk: { permissionCode: 'zoho:desk:access', displayName: 'Zoho Desk' },
  books: { permissionCode: 'zoho:books:access', displayName: 'Zoho Books' },
};

async function getUserPermissions(userId) {
  // user -> roles -> permissions
  const userRoles = await UserRole.find({ userId, isDeleted: false }).lean();
  const roleIds = userRoles.map((r) => r.roleId);
  if (roleIds.length === 0) return [];

  const rolePermissions = await RolePermission.find({ roleId: { $in: roleIds }, isDeleted: false }).lean();
  const permissionIds = rolePermissions.map((rp) => rp.permissionId);
  if (permissionIds.length === 0) return [];

  const perms = await Permission.find({ _id: { $in: permissionIds }, isDeleted: false }).lean();
  return perms.map((p) => p.code);
}

function getPermissionForService(serviceKey) {
  const cfg = SERVICES[serviceKey];
  return cfg?.permissionCode || null;
}

function getServiceDisplayName(serviceKey) {
  const cfg = SERVICES[serviceKey];
  return cfg?.displayName || serviceKey;
}

function getServicesForPermissions(permissionCodes) {
  const codes = Array.isArray(permissionCodes) ? permissionCodes : [];
  return Object.entries(SERVICES)
    .filter(([, cfg]) => codes.includes(cfg.permissionCode))
    .map(([key]) => key);
}

module.exports = {
  getUserPermissions,
  getPermissionForService,
  getServiceDisplayName,
  getServicesForPermissions,
  SERVICES,
};

