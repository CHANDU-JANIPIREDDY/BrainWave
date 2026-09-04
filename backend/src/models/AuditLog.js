const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, trim: true }, // e.g. "auth:login", "admin:user:create"
    resource: { type: String, trim: true }, // e.g. "User", "Zoho", etc.
    resourceId: { type: String, trim: true },
    status: {
      type: String,
      enum: ['success', 'failed', 'forbidden', 'unauthorized'],
      required: true,
    },
    request: { type: Object, default: {} }, // metadata such as body/params (no secrets)
    message: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);

