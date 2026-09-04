const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { env } = require('../config/env');
const User = require('../models/User');
const UserRole = require('../models/UserRole');
const rbacService = require('../services/rbac/rbacService');
const { writeAudit } = require('../utils/audit');

async function getUserRoles(userId) {
  const userRoles = await UserRole.find({ userId, isDeleted: false })
    .populate('roleId')
    .lean();
  return userRoles.map((ur) => ur.roleId?.name).filter(Boolean);
}

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ success: false, message: 'username and password required' });

  const user = await User.findOne({ username, isDeleted: false }).lean();
  if (!user) {
    await writeAudit({
      userId: null,
      action: 'auth:login',
      resource: 'User',
      resourceId: username,
      status: 'failed',
      message: 'User not found',
      request: { username },
    });
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    await writeAudit({
      userId: user._id,
      action: 'auth:login',
      resource: 'User',
      resourceId: user._id.toString(),
      status: 'failed',
      message: 'Invalid password',
      request: { username },
    });
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const roles = await getUserRoles(user._id.toString());
  const permissions = await rbacService.getUserPermissions(user._id.toString());
  const services = rbacService.getServicesForPermissions(permissions);

  // Include roles as authorization context; RBAC middleware still validates DB-driven permissions.
  const token = jwt.sign(
    { sub: user._id.toString(), roles },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );

  await writeAudit({
    userId: user._id,
    action: 'auth:login',
    resource: 'User',
    resourceId: user._id.toString(),
    status: 'success',
    request: { username },
  });

  return res.json({
    success: true,
    token,
    user: {
      id: user._id.toString(),
      username: user.username,
      roles,
      permissions,
      services,
    },
  });
}

async function me(req, res) {
  const userId = req.auth?.userId;
  const user = await User.findById(userId).lean();
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const roles = await getUserRoles(userId);
  const permissions = await rbacService.getUserPermissions(userId);
  const services = rbacService.getServicesForPermissions(permissions);
  return res.json({
    success: true,
    user: { id: user._id.toString(), username: user.username, roles, permissions, services },
  });
}

async function logout(req, res) {
  await writeAudit({
    userId: req.auth?.userId,
    action: 'auth:logout',
    resource: 'User',
    resourceId: req.auth?.userId,
    status: 'success',
    request: { username: req.auth?.username },
    message: 'User logged out',
  });
  return res.json({ success: true, message: 'Logged out' });
}

module.exports = { login, me, logout };

