// API Configuration for EassyEvent App

// Determine API base URL based on environment
const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api' // Development - your local backend
  : 'https://your-production-api.herokuapp.com/api'; // Production - replace with your deployed URL

export const API_ENDPOINTS = {
  // Authentication endpoints
  REGISTER: `${API_BASE_URL}/auth/signup`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,

  // Email verification
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  RESEND_VERIFICATION: `${API_BASE_URL}/auth/resend-verification`,

  // Password management
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,

  // User profile
  GET_PROFILE: `${API_BASE_URL}/auth/me`,
  UPDATE_PROFILE: `${API_BASE_URL}/auth/update-profile`,
  DELETE_ACCOUNT: `${API_BASE_URL}/auth/delete-account`,
};

export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export default API_BASE_URL;
