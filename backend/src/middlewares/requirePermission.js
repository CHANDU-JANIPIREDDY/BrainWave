const AuditLog = require('../models/AuditLog');
const UserRole = require('../models/UserRole');
const RolePermission = require('../models/RolePermission');
const Permission = require('../models/Permission');

async function getRoleNames(userId) {
  const userRoles = await UserRole.find({ userId, isDeleted: false }).populate('roleId').lean();
  return userRoles.map((ur) => ur.roleId?.name).filter(Boolean);
}

async function getPermissionCodes(userId) {
  const userRoles = await UserRole.find({ userId, isDeleted: false }).lean();
  const roleIds = userRoles.map((r) => r.roleId).filter(Boolean);
  if (roleIds.length === 0) return [];

  const rolePerms = await RolePermission.find({ roleId: { $in: roleIds }, isDeleted: false }).lean();
  const permissionIds = rolePerms.map((rp) => rp.permissionId).filter(Boolean);
  if (permissionIds.length === 0) return [];

  const perms = await Permission.find({ _id: { $in: permissionIds }, isDeleted: false }).lean();
  return perms.map((p) => p.code);
}

function requirePermission(permissionCode) {
  return async function permissionGate(req, res, next) {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const [roleNames, permissionCodes] = await Promise.all([
      getRoleNames(userId),
      getPermissionCodes(userId),
    ]);

    req.authz = {
      userId,
      roles: roleNames,
      permissions: permissionCodes,
      permissionCodeRequired: permissionCode,
    };

    if (!permissionCodes.includes(permissionCode)) {
      await AuditLog.create({
        userId,
        action: 'rbac:forbidden',
        resource: 'Permission',
        resourceId: permissionCode,
        status: 'forbidden',
        request: { required: permissionCode },
        message: `Forbidden: missing permission ${permissionCode}`,
      });
      return res.status(403).json({ success: false, message: 'You do not have permission to access this resource' });
    }

    return next();
  };
}

module.exports = { requirePermission };

