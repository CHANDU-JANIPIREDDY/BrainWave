const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const UserRole = require('../models/UserRole');
const RolePermission = require('../models/RolePermission');

const DEFAULT_ROLES = ['Admin', 'HR', 'Sales', 'Support', 'Finance'];

const PERMISSIONS = [
  { code: 'zoho:people:access', description: 'Access Zoho People (HR)' },
  { code: 'zoho:crm:access', description: 'Access Zoho CRM (Sales)' },
  { code: 'zoho:desk:access', description: 'Access Zoho Desk (Support)' },
  { code: 'zoho:books:access', description: 'Access Zoho Books (Finance)' },
  { code: 'admin:portal:access', description: 'Access Admin panel' },
  { code: 'admin:audit:read', description: 'Read audit logs' },
];

const ROLE_PERMISSIONS = {
  Admin: ['zoho:people:access', 'zoho:crm:access', 'zoho:desk:access', 'zoho:books:access', 'admin:portal:access', 'admin:audit:read'],
  HR: ['zoho:people:access'],
  Sales: ['zoho:crm:access'],
  Support: ['zoho:desk:access'],
  Finance: ['zoho:books:access'],
};

const DEMO_USERS = [
  { username: process.env.SEED_ADMIN_USERNAME || 'admin', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345', role: 'Admin' },
  { username: process.env.SEED_HR_USERNAME || 'hr', password: process.env.SEED_HR_PASSWORD || 'Hr@12345', role: 'HR' },
  { username: process.env.SEED_SALES_USERNAME || 'sales', password: process.env.SEED_SALES_PASSWORD || 'Sales@12345', role: 'Sales' },
  { username: process.env.SEED_SUPPORT_USERNAME || 'support', password: process.env.SEED_SUPPORT_PASSWORD || 'Support@12345', role: 'Support' },
  { username: process.env.SEED_FINANCE_USERNAME || 'finance', password: process.env.SEED_FINANCE_PASSWORD || 'Finance@12345', role: 'Finance' },
];

async function seedIfNeeded() {
  await Promise.all(
    DEFAULT_ROLES.map((name) => Role.updateOne({ name }, { name, displayName: name, isDeleted: false }, { upsert: true })),
  );

  await Promise.all(
    PERMISSIONS.map((p) => Permission.updateOne({ code: p.code }, { ...p, isDeleted: false }, { upsert: true })),
  );

  const roles = await Role.find({ isDeleted: false }).lean();
  const perms = await Permission.find({ isDeleted: false }).lean();
  const rolesByName = new Map(roles.map((r) => [r.name, r._id]));
  const permsByCode = new Map(perms.map((p) => [p.code, p._id]));

  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = rolesByName.get(roleName);
    if (!roleId) continue;
    for (const code of codes) {
      const permissionId = permsByCode.get(code);
      if (!permissionId) continue;
      await RolePermission.updateOne(
        { roleId, permissionId },
        { roleId, permissionId, isDeleted: false },
        { upsert: true },
      );
    }
  }

  for (const u of DEMO_USERS) {
    const role = await Role.findOne({ name: u.role, isDeleted: false }).lean();
    if (!role) continue;

    let user = await User.findOne({ username: u.username }).lean();
    if (!user) {
      const created = await User.create({
        username: u.username,
        passwordHash: await bcrypt.hash(u.password, 10),
        isDeleted: false,
      });
      user = created.toObject();
    } else if (user.isDeleted) {
      await User.updateOne({ _id: user._id }, { isDeleted: false });
    }

    await UserRole.updateOne(
      { userId: user._id, roleId: role._id },
      { userId: user._id, roleId: role._id, isDeleted: false },
      { upsert: true },
    );
  }
}

module.exports = { seedIfNeeded };
