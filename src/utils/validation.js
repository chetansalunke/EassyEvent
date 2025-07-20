// Validation utility functions
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message:
      'Password must be at least 8 characters with uppercase, lowercase, and number',
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Name must be between 2 and 100 characters',
  },
  pinCode: {
    required: true,
    pattern: /^\d{6}$/,
    message: 'PIN Code must be exactly 6 digits',
  },
  phone: {
    required: true,
    pattern: /^[6-9]\d{9}$/,
    message: 'Please enter a valid 10-digit mobile number',
  },
  seatingCapacity: {
    required: true,
    min: 1,
    max: 10000,
    message: 'Seating capacity must be between 1 and 10,000',
  },
};

// Generic validation function
export const validateField = (value, fieldRules) => {
  if (fieldRules.required && (!value || value.toString().trim() === '')) {
    return 'This field is required';
  }

  if (
    value &&
    fieldRules.minLength &&
    value.toString().length < fieldRules.minLength
  ) {
    return `Minimum ${fieldRules.minLength} characters required`;
  }

  if (
    value &&
    fieldRules.maxLength &&
    value.toString().length > fieldRules.maxLength
  ) {
    return `Maximum ${fieldRules.maxLength} characters allowed`;
  }

  if (
    value &&
    fieldRules.pattern &&
    !fieldRules.pattern.test(value.toString())
  ) {
    return fieldRules.message || 'Invalid format';
  }

  if (value && fieldRules.min && parseFloat(value) < fieldRules.min) {
    return `Minimum value is ${fieldRules.min}`;
  }

  if (value && fieldRules.max && parseFloat(value) > fieldRules.max) {
    return `Maximum value is ${fieldRules.max}`;
  }

  return null;
};

// Form validation function
export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const error = validateField(formData[field], rules[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Specific validation functions
export const validateEmail = email => {
  return validateField(email, validationRules.email);
};

export const validatePassword = password => {
  return validateField(password, validationRules.password);
};

export const validatePinCode = pinCode => {
  const pinString = Array.isArray(pinCode) ? pinCode.join('') : pinCode;
  return validateField(pinString, validationRules.pinCode);
};

export const validateSeatingCapacity = capacity => {
  return validateField(capacity, validationRules.seatingCapacity);
};

// Password strength checker
export const getPasswordStrength = password => {
  let strength = 0;
  let feedback = [];

  if (password.length >= 8) strength += 1;
  else feedback.push('At least 8 characters');

  if (/[a-z]/.test(password)) strength += 1;
  else feedback.push('One lowercase letter');

  if (/[A-Z]/.test(password)) strength += 1;
  else feedback.push('One uppercase letter');

  if (/\d/.test(password)) strength += 1;
  else feedback.push('One number');

  if (/[@$!%*?&]/.test(password)) strength += 1;
  else feedback.push('One special character');

  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return {
    score: strength,
    level: levels[Math.min(strength, 4)],
    feedback,
  };
};

// Format validation
export const formatValidation = {
  // Remove all non-numeric characters and limit to specific length
  formatPhoneNumber: input => {
    return input.replace(/\D/g, '').slice(0, 10);
  },

  // Format pin code (6 digits only)
  formatPinCode: input => {
    return input.replace(/\D/g, '').slice(0, 6);
  },

  // Format seating capacity (numbers only)
  formatSeatingCapacity: input => {
    return input.replace(/\D/g, '');
  },

  // Format name (remove numbers and special characters except spaces, hyphens, apostrophes)
  formatName: input => {
    return input.replace(/[^a-zA-Z\s\-']/g, '').slice(0, 100);
  },

  // Format email (lowercase, no spaces)
  formatEmail: input => {
    return input.toLowerCase().replace(/\s/g, '');
  },
};
