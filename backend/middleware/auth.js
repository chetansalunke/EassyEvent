const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const auth = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new AppError('Access token is required', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 401));
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return next(new AppError('Email not verified', 401));
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    } else {
      return next(new AppError('Token verification failed', 401));
    }
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this route', 403));
    }
    next();
  };
};

module.exports = { auth, authorize };
