const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },

    // Business Information
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [100, 'Business name cannot exceed 100 characters'],
    },

    // Address Information
    address: {
      line1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true,
      },
      line2: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      pinCode: {
        type: String,
        required: [true, 'PIN code is required'],
        match: [/^\d{6}$/, 'PIN code must be 6 digits'],
      },
    },

    // Business Details
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Seating capacity must be at least 1'],
      max: [10000, 'Seating capacity cannot exceed 10,000'],
    },

    // Account Status
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['venue_owner', 'admin'],
      default: 'venue_owner',
    },

    // Verification Tokens
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Profile Information
    profileImage: String,
    phoneNumber: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian mobile number'],
    },

    // Business Settings
    businessType: {
      type: String,
      enum: [
        'Banquet Hall',
        'Wedding Hall',
        'Conference Center',
        'Hotel',
        'Resort',
        'Community Center',
        'Restaurant',
        'Outdoor Venue',
        'Auditorium',
        'Convention Center',
        'Farm House',
        'Palace',
        'Heritage Venue',
        'Rooftop',
        'Garden',
        'Beach Resort',
        'Hill Station Resort',
        'Corporate Office Space',
        'Educational Institution',
        'Religious Center',
      ],
    },

    // Amenities
    amenities: [
      {
        type: String,
        enum: [
          'Air Conditioning',
          'Parking',
          'Catering Service',
          'Sound System',
          'Lighting',
          'Stage',
          'Dance Floor',
          'Bridal Room',
          'Guest Rooms',
          'Valet Parking',
          'Security',
          'WiFi',
          'Generator Backup',
          'Garden Area',
          'Swimming Pool',
          'Spa Services',
          'Transportation',
          'Decoration Services',
          'Photography Services',
          'DJ Services',
        ],
      },
    ],

    // Subscription Information
    subscriptionPlan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free',
    },
    subscriptionExpires: Date,

    // Login Information
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for better performance
// Note: email index is automatically created by 'unique: true' in schema
userSchema.index({ 'address.city': 1, 'address.state': 1 });
userSchema.index({ businessName: 'text' });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' },
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return token;
};

// Handle login attempts
userSchema.methods.incrementLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1,
    },
    $set: {
      lastLogin: new Date(),
    },
  });
};

// Hide sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.loginAttempts;
  delete user.lockUntil;
  return user;
};

module.exports = mongoose.model('User', userSchema);
