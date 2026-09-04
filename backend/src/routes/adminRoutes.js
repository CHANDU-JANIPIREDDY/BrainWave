const express = require('express');
const { requireAuthJWT } = require('../middlewares/requireAuthJWT');
const { requireAdmin } = require('../middlewares/requireAdmin');
const { requirePermission } = require('../middlewares/requirePermission');

const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  setRolePermissions,
  getRolePermissions,
  listAuditLogs,
} = require('../controllers/adminController');

const adminRoutes = express.Router();

function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

// Admin-only management area.
adminRoutes.use(requireAuthJWT(), requireAdmin());

adminRoutes.get('/users', wrap(listUsers));
adminRoutes.post('/users', wrap(createUser));
adminRoutes.put('/users/:userId', wrap(updateUser));
adminRoutes.delete('/users/:userId', wrap(deleteUser));

adminRoutes.get('/roles', wrap(listRoles));
adminRoutes.post('/roles', wrap(createRole));
adminRoutes.put('/roles/:roleId', wrap(updateRole));
adminRoutes.delete('/roles/:roleId', wrap(deleteRole));

adminRoutes.get('/permissions', wrap(listPermissions));
adminRoutes.post('/permissions', wrap(createPermission));
adminRoutes.put('/permissions/:permissionId', wrap(updatePermission));
adminRoutes.delete('/permissions/:permissionId', wrap(deletePermission));

adminRoutes.get('/roles/:roleId/permissions', wrap(getRolePermissions));
adminRoutes.post('/roles/:roleId/permissions', wrap(setRolePermissions));

// Extra permission for audit logs.
adminRoutes.get('/audit-logs', requirePermission('admin:audit:read'), wrap(listAuditLogs));

module.exports = { adminRoutes };

