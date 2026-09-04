const mongoose = require('mongoose');

const UserRoleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

UserRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

module.exports = mongoose.model('UserRole', UserRoleSchema);

