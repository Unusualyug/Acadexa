import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'consultant', 'support', 'admin', 'owner'], default: 'student', index: true },
    accountStatus: { type: String, enum: ['active', 'suspended', 'deactivated', 'pending_deletion'], default: 'active' },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    profile: {
      phone: { type: String, trim: true, maxlength: 20 },
      institution: { type: String, trim: true, maxlength: 160 },
      course: { type: String, trim: true, maxlength: 160 },
      city: { type: String, trim: true, maxlength: 80 },
      bio: { type: String, maxlength: 600 },
    },
    notificationPrefs: {
      emailQuotation: { type: Boolean, default: true },
      emailDelivery: { type: Boolean, default: true },
      emailSupport: { type: Boolean, default: true },
      emailSecurity: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    savedServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    deletionRequestedAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    accountStatus: this.accountStatus,
    emailVerified: this.emailVerified,
    profile: this.profile,
    notificationPrefs: this.notificationPrefs,
    savedServices: this.savedServices,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

export default mongoose.model('User', userSchema);
