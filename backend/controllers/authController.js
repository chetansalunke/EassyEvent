const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Register a new user
// @route   POST /api/v1/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res, next) => {
  const {
    email,
    password,
    businessName,
    address,
    seatingCapacity,
    businessType,
    amenities,
    phoneNumber,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  const user = await User.create({
    email,
    password,
    businessName,
    address,
    seatingCapacity,
    businessType,
    amenities,
    phoneNumber,
  });

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verificationUrl = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/auth/verify-email?token=${verificationToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Email Verification - EassyEvent',
      template: 'emailVerification',
      data: {
        name: user.businessName,
        verificationUrl,
      },
    });

    res.status(201).json({
      status: 'success',
      message:
        'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          businessName: user.businessName,
          isEmailVerified: user.isEmailVerified,
        },
      },
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Error sending verification email. Please try again later.',
        500,
      ),
    );
  }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(
      new AppError(
        'Account temporarily locked due to too many failed login attempts',
        423,
      ),
    );
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    await user.incrementLoginAttempts();
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return next(
      new AppError('Please verify your email before logging in', 401),
    );
  }

  // Check if account is active
  if (!user.isActive) {
    return next(
      new AppError(
        'Your account has been deactivated. Please contact support.',
        401,
      ),
    );
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate tokens
  const token = user.generateToken();
  const refreshToken = user.generateRefreshToken();

  // Set secure cookie with refresh token
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        businessName: user.businessName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        subscriptionPlan: user.subscriptionPlan,
      },
    },
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res, next) => {
  let refreshToken;

  // Get refresh token from cookies or request body
  if (req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  } else if (req.body.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) {
    return next(new AppError('Refresh token not found', 401));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    // Generate new access token
    const newToken = user.generateToken();

    res.status(200).json({
      status: 'success',
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

// @desc    Verify email
// @route   POST /api/v1/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    return next(new AppError('Verification token is required', 400));
  }

  // Hash token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully',
  });
});

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verificationUrl = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/auth/verify-email?token=${verificationToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Email Verification - EassyEvent',
      template: 'emailVerification',
      data: {
        name: user.businessName,
        verificationUrl,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending verification email', 500));
  }
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send reset email
  try {
    const resetUrl = `${req.protocol}://${req.get(
      'host',
    )}/reset-password?token=${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset - EassyEvent',
      template: 'passwordReset',
      data: {
        name: user.businessName,
        resetUrl,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending password reset email', 500));
  }
});

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  // Hash token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = undefined;
  user.lockUntil = undefined;
  await user.save();

  // Generate new token
  const newToken = user.generateToken();

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
    data: {
      token: newToken,
    },
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/update-profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'businessName',
    'address',
    'seatingCapacity',
    'businessType',
    'amenities',
    'phoneNumber',
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = user.generateToken();

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
    data: {
      token,
    },
  });
});

// @desc    Delete user account
// @route   DELETE /api/v1/auth/delete-account
// @access  Private
const deleteAccount = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(200).json({
    status: 'success',
    message: 'Account deactivated successfully',
  });
});

module.exports = {
  signup,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
};
