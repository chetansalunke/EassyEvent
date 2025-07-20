// API Configuration for EassyEvent App

// Determine API base URL based on environment
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000/api' // Development - Android emulator localhost (port 5000)
  : 'https://your-production-api.herokuapp.com/api'; // Production - replace with your deployed URL

// Alternative URLs for development testing
export const DEV_URLS = {
  LOCALHOST: 'http://localhost:5000/api',
  ANDROID_EMULATOR: 'http://10.0.2.2:5000/api',
  IOS_SIMULATOR: 'http://localhost:5000/api',
  YOUR_LOCAL_IP: 'http://192.168.1.100:5000/api', // Replace with your actual IP
};

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
  TIMEOUT: 15000, // 15 seconds (reduced from 30)
  RETRY_ATTEMPTS: 2, // Reduced from 3
  RETRY_DELAY: 1000, // 1 second
};

export default API_BASE_URL;
