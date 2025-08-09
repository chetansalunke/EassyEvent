// API Configuration for EaseEvent App

// Determine API base URL based on environment
const API_BASE_URL = __DEV__
  ? 'https://easeevent.echogen.online' // Use your production API for now
  : 'https://easeevent.echogen.online'; // Production

// Alternative URLs for development testing
export const DEV_URLS = {
  LOCALHOST: 'http://localhost:8000',
  ANDROID_EMULATOR: 'http://10.0.2.2:8000',
  IOS_SIMULATOR: 'http://localhost:8000',
  YOUR_LOCAL_IP: 'http://192.168.1.100:8000', // Replace with your actual IP
  PRODUCTION: 'https://easeevent.echogen.online',
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

  // Venue images
  VENUE_IMAGES_UPLOAD: `${API_BASE_URL}/venue/images/post/`,
  VENUE_IMAGES_LIST: `${API_BASE_URL}/venue/images/list/`,
  VENUE_IMAGES_DELETE: `${API_BASE_URL}/venue/images/delete/`, // + {id}/
};

export const API_CONFIG = {
  TIMEOUT: 15000, // 15 seconds (reduced from 30)
  RETRY_ATTEMPTS: 2, // Reduced from 3
  RETRY_DELAY: 1000, // 1 second
};

export default API_BASE_URL;
