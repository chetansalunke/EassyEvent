const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
  },
});

// Validation rules
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('address.line1')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Address line 1 must be at least 5 characters'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.pinCode')
    .matches(/^\d{6}$/)
    .withMessage('PIN code must be exactly 6 digits'),
  body('seatingCapacity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Seating capacity must be between 1 and 10,000'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
];

// Routes
router.post(
  '/signup',
  authLimiter,
  signupValidation,
  validate,
  authController.signup,
);
router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  authController.login,
);
router.post('/logout', auth, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// Email verification
router.post('/verify-email', authController.verifyEmail);
router.post(
  '/resend-verification',
  authLimiter,
  authController.resendVerification,
);

// Password reset
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  validate,
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  resetPasswordValidation,
  validate,
  authController.resetPassword,
);

// Protected routes
router.get('/me', auth, authController.getMe);
router.put('/update-profile', auth, authController.updateProfile);
router.put(
  '/change-password',
  auth,
  changePasswordValidation,
  validate,
  authController.changePassword,
);
router.delete('/delete-account', auth, authController.deleteAccount);

module.exports = router;
