const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const UserRole = require('../models/UserRole');
const RolePermission = require('../models/RolePermission');
const AuditLog = require('../models/AuditLog');

async function listUsers(_req, res) {
  const users = await User.find({ isDeleted: false }).lean();
  const userIds = users.map((u) => u._id);
  const userRoles = await UserRole.find({ userId: { $in: userIds }, isDeleted: false }).populate('roleId').lean();

  const rolesByUserId = new Map();
  for (const ur of userRoles) {
    const key = ur.userId.toString();
    if (!rolesByUserId.has(key)) rolesByUserId.set(key, []);
    if (ur.roleId?.name) rolesByUserId.get(key).push(ur.roleId.name);
  }

  return res.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      roles: rolesByUserId.get(u._id.toString()) || [],
    })),
  });
}

async function createUser(req, res) {
  const { username, password, email, roleNames } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });

  const existing = await User.findOne({ username }).lean();
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const user = await User.create({
    username,
    email: email || undefined,
    passwordHash: await bcrypt.hash(password, 10),
  });

  if (Array.isArray(roleNames) && roleNames.length > 0) {
    const roles = await Role.find({ name: { $in: roleNames }, isDeleted: false }).lean();
    await Promise.all(
      roles.map((r) => UserRole.create({ userId: user._id, roleId: r._id, isDeleted: false })),
    );
  }

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:user:create',
    resource: 'User',
    resourceId: user._id.toString(),
    status: 'success',
    request: { username, email: email || null, roleNames: Array.isArray(roleNames) ? roleNames : [] },
  });

  return res.status(201).json({
    user: { id: user._id.toString(), username: user.username, email: user.email },
  });
}

async function updateUser(req, res) {
  const { userId } = req.params;
  const { username, password, email, roleNames, isDeleted } = req.body || {};

  const user = await User.findById(userId);
  if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

  if (typeof username === 'string' && username.trim()) user.username = username.trim();
  if (typeof email === 'string') user.email = email.trim();
  if (typeof isDeleted === 'boolean') user.isDeleted = isDeleted;
  if (typeof password === 'string' && password.length > 0) user.passwordHash = await bcrypt.hash(password, 10);

  await user.save();

  if (Array.isArray(roleNames)) {
    await UserRole.updateMany({ userId: user._id, isDeleted: false }, { $set: { isDeleted: true } });
    const roles = await Role.find({ name: { $in: roleNames }, isDeleted: false }).lean();
    await Promise.all(
      roles.map((r) =>
        UserRole.updateOne(
          { userId: user._id, roleId: r._id },
          { userId: user._id, roleId: r._id, isDeleted: false },
          { upsert: true },
        ),
      ),
    );
  }

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:user:update',
    resource: 'User',
    resourceId: user._id.toString(),
    status: 'success',
    request: {
      username: typeof username === 'string' ? username : undefined,
      email: typeof email === 'string' ? email : undefined,
      roleNames: Array.isArray(roleNames) ? roleNames : undefined,
      passwordChanged: typeof password === 'string' && password.length > 0,
    },
  });

  return res.json({ ok: true });
}

async function deleteUser(req, res) {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

  user.isDeleted = true;
  await user.save();
  await UserRole.updateMany({ userId: user._id, isDeleted: false }, { $set: { isDeleted: true } });

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:user:delete',
    resource: 'User',
    resourceId: user._id.toString(),
    status: 'success',
    request: { username: user.username },
  });

  return res.json({ ok: true });
}

async function listRoles(_req, res) {
  const roles = await Role.find({ isDeleted: false }).lean();
  return res.json({ roles: roles.map((r) => ({ id: r._id.toString(), name: r.name, displayName: r.displayName })) });
}

async function createRole(req, res) {
  const { name, displayName } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name required' });

  const existing = await Role.findOne({ name, isDeleted: false }).lean();
  if (existing) return res.status(409).json({ message: 'Role already exists' });

  const role = await Role.create({ name: name.trim(), displayName: displayName || undefined });

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:role:create',
    resource: 'Role',
    resourceId: role._id.toString(),
    status: 'success',
    request: { name: role.name, displayName: role.displayName || null },
  });

  return res.status(201).json({ role: { id: role._id.toString(), name: role.name, displayName: role.displayName } });
}

async function updateRole(req, res) {
  const { roleId } = req.params;
  const { name, displayName } = req.body || {};

  const role = await Role.findById(roleId);
  if (!role || role.isDeleted) return res.status(404).json({ message: 'Role not found' });

  if (typeof name === 'string' && name.trim()) role.name = name.trim();
  if (typeof displayName === 'string') role.displayName = displayName.trim();
  await role.save();

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:role:update',
    resource: 'Role',
    resourceId: role._id.toString(),
    status: 'success',
    request: { name: role.name, displayName: role.displayName || null },
  });

  return res.json({ ok: true });
}

async function deleteRole(req, res) {
  const { roleId } = req.params;
  const role = await Role.findById(roleId);
  if (!role || role.isDeleted) return res.status(404).json({ message: 'Role not found' });

  role.isDeleted = true;
  await role.save();
  await UserRole.updateMany({ roleId: role._id, isDeleted: false }, { $set: { isDeleted: true } });
  await RolePermission.updateMany({ roleId: role._id, isDeleted: false }, { $set: { isDeleted: true } });

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:role:delete',
    resource: 'Role',
    resourceId: role._id.toString(),
    status: 'success',
    request: { name: role.name },
  });

  return res.json({ ok: true });
}

async function listPermissions(_req, res) {
  const permissions = await Permission.find({ isDeleted: false }).lean();
  return res.json({
    permissions: permissions.map((p) => ({ id: p._id.toString(), code: p.code, description: p.description })),
  });
}

async function createPermission(req, res) {
  const { code, description } = req.body || {};
  if (!code) return res.status(400).json({ message: 'code required' });

  const existing = await Permission.findOne({ code, isDeleted: false }).lean();
  if (existing) return res.status(409).json({ message: 'Permission already exists' });

  const permission = await Permission.create({ code: code.trim(), description: description || undefined });

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:permission:create',
    resource: 'Permission',
    resourceId: permission._id.toString(),
    status: 'success',
    request: { code: permission.code, description: permission.description || null },
  });

  return res.status(201).json({
    permission: { id: permission._id.toString(), code: permission.code, description: permission.description },
  });
}

async function updatePermission(req, res) {
  const { permissionId } = req.params;
  const { code, description } = req.body || {};

  const permission = await Permission.findById(permissionId);
  if (!permission || permission.isDeleted) return res.status(404).json({ message: 'Permission not found' });

  if (typeof code === 'string' && code.trim()) permission.code = code.trim();
  if (typeof description === 'string') permission.description = description.trim();
  await permission.save();

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:permission:update',
    resource: 'Permission',
    resourceId: permission._id.toString(),
    status: 'success',
    request: { code: permission.code, description: permission.description || null },
  });

  return res.json({ ok: true });
}

async function deletePermission(req, res) {
  const { permissionId } = req.params;
  const permission = await Permission.findById(permissionId);
  if (!permission || permission.isDeleted) return res.status(404).json({ message: 'Permission not found' });

  permission.isDeleted = true;
  await permission.save();
  await RolePermission.updateMany({ permissionId: permission._id, isDeleted: false }, { $set: { isDeleted: true } });

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:permission:delete',
    resource: 'Permission',
    resourceId: permission._id.toString(),
    status: 'success',
    request: { code: permission.code },
  });

  return res.json({ ok: true });
}

async function setRolePermissions(req, res) {
  const { roleId } = req.params;
  const { permissionCodes } = req.body || {};
  if (!Array.isArray(permissionCodes)) return res.status(400).json({ message: 'permissionCodes array required' });

  const role = await Role.findById(roleId);
  if (!role || role.isDeleted) return res.status(404).json({ message: 'Role not found' });

  await RolePermission.updateMany({ roleId: role._id, isDeleted: false }, { $set: { isDeleted: true } });

  const perms = await Permission.find({ code: { $in: permissionCodes }, isDeleted: false }).lean();

  await Promise.all(
    perms.map((p) =>
      RolePermission.updateOne(
        { roleId: role._id, permissionId: p._id },
        { roleId: role._id, permissionId: p._id, isDeleted: false },
        { upsert: true },
      ),
    ),
  );

  await AuditLog.create({
    userId: req.auth?.userId,
    action: 'admin:role:permissions:set',
    resource: 'Role',
    resourceId: role._id.toString(),
    status: 'success',
    request: { roleName: role.name, permissionCodes },
  });

  return res.json({ ok: true });
}

async function getRolePermissions(req, res) {
  const { roleId } = req.params;
  const role = await Role.findById(roleId).lean();
  if (!role || role.isDeleted) return res.status(404).json({ message: 'Role not found' });

  const rolePerms = await RolePermission.find({ roleId, isDeleted: false }).lean();
  const permissionIds = rolePerms.map((rp) => rp.permissionId);
  const perms = await Permission.find({ _id: { $in: permissionIds }, isDeleted: false }).lean();

  return res.json({ role: { id: role._id.toString(), name: role.name }, permissionCodes: perms.map((p) => p.code) });
}

async function listAuditLogs(req, res) {
  const { limit } = req.query || {};
  const n = Math.min(parseInt(limit || '100', 10), 500);

  const logs = await AuditLog.find({})
    .populate('userId', 'username')
    .sort({ createdAt: -1 })
    .limit(n)
    .lean();

  return res.json({
    auditLogs: logs.map((l) => ({
      id: l._id.toString(),
      userId: l.userId?._id ? l.userId._id.toString() : l.userId ? String(l.userId) : null,
      username: l.userId?.username || l.request?.username || '—',
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      status: l.status,
      message: l.message || null,
      request: l.request || {},
      createdAt: l.createdAt,
    })),
  });
}

module.exports = {
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
};

