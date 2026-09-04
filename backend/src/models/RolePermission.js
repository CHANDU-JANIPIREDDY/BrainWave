const mongoose = require('mongoose');

const RolePermissionSchema = new mongoose.Schema(
  {
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

module.exports = mongoose.model('RolePermission', RolePermissionSchema);

