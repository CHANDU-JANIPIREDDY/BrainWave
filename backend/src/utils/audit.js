const AuditLog = require('../models/AuditLog');

async function writeAudit({ userId = null, action, resource, resourceId, status, request = {}, message }) {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : undefined,
      status,
      request,
      message,
    });
  } catch (_err) {
    // Audit failures must not break the request.
  }
}

module.exports = { writeAudit };
