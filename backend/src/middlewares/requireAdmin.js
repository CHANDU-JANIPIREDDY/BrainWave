const { requirePermission } = require('./requirePermission');

function requireAdmin() {
  // Admin panel access permission (Admin role is the one that gets this permission via seed).
  return requirePermission('admin:portal:access');
}

module.exports = { requireAdmin };

