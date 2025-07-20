import AsyncStorage from '../utils/AsyncStorage';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';

// HTTP Methods
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

// Generic API call function with timeout and retry logic
export const apiCall = async (endpoint, options = {}) => {
  let attempts = 0;
  const maxAttempts = options.retry ? API_CONFIG.RETRY_ATTEMPTS : 1;

  while (attempts < maxAttempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT,
      );

      const config = {
        method: options.method || HTTP_METHODS.GET,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      };

      // Add authorization token if available
      const token = options.token || (await getStoredToken());
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add body for POST, PUT, PATCH requests
      if (options.body && config.method !== HTTP_METHODS.GET) {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(endpoint, config);
      clearTimeout(timeoutId);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        data = { message: 'Invalid response format' };
      }

      if (response.ok) {
        return {
          success: true,
          data: data.data || data,
          message: data.message,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Request failed',
          errors: data.errors || [],
          status: response.status,
        };
      }
    } catch (error) {
      attempts++;

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout. Please check your connection and try again.',
          status: null,
        };
      }

      if (attempts >= maxAttempts) {
        return {
          success: false,
          error:
            error.message || 'Network error. Please check your connection.',
          status: null,
        };
      }

      // Wait before retry
      if (attempts < maxAttempts) {
        await new Promise(resolve =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempts),
        );
      }
    }
  }
};

// Specific API functions
export const authAPI = {
  // Register new user
  signup: async userData => {
    // Transform frontend data to match backend expected format
    const transformedData = {
      email: userData.email.toLowerCase().trim(),
      businessName: userData.name.trim(),
      address: {
        line1: userData.addressLine1.trim(),
        line2: userData.addressLine2?.trim() || '',
        city: userData.city,
        state: userData.state,
        pinCode: userData.pinCode,
      },
      seatingCapacity: parseInt(userData.seatingCapacity),
      password: userData.password,
    };

    const response = await apiCall(API_ENDPOINTS.REGISTER, {
      method: HTTP_METHODS.POST,
      body: transformedData,
      retry: true,
    });

    // Store token and user data if signup successful
    if (response.success && response.data?.token) {
      await storeToken(response.data.token);
      await storeUserData(response.data.user);
    }

    return response;
  },

  // Login user
  login: async credentials => {
    const response = await apiCall(API_ENDPOINTS.LOGIN, {
      method: HTTP_METHODS.POST,
      body: {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      },
      retry: true,
    });

    // Store token and user data if login successful
    if (response.success && response.data?.token) {
      await storeToken(response.data.token);
      await storeUserData(response.data.user);
    }

    return response;
  },

  // Logout user
  logout: async () => {
    const response = await apiCall(API_ENDPOINTS.LOGOUT, {
      method: HTTP_METHODS.POST,
    });

    // Clear stored data regardless of server response
    await removeToken();

    return response;
  },

  // Forgot password
  forgotPassword: async email => {
    return await apiCall(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: HTTP_METHODS.POST,
      body: { email: email.toLowerCase().trim() },
      retry: true,
    });
  },

  // Reset password
  resetPassword: async (token, password) => {
    return await apiCall(`${API_ENDPOINTS.RESET_PASSWORD}/${token}`, {
      method: HTTP_METHODS.POST,
      body: { password },
      retry: true,
    });
  },

  // Verify email
  verifyEmail: async token => {
    return await apiCall(`${API_ENDPOINTS.VERIFY_EMAIL}/${token}`, {
      method: HTTP_METHODS.GET,
      retry: true,
    });
  },

  // Resend verification email
  resendVerification: async () => {
    return await apiCall(API_ENDPOINTS.RESEND_VERIFICATION, {
      method: HTTP_METHODS.POST,
      retry: true,
    });
  },

  // Get user profile
  getProfile: async () => {
    return await apiCall(API_ENDPOINTS.GET_PROFILE, {
      method: HTTP_METHODS.GET,
    });
  },

  // Update user profile
  updateProfile: async profileData => {
    return await apiCall(API_ENDPOINTS.UPDATE_PROFILE, {
      method: HTTP_METHODS.PUT,
      body: profileData,
    });
  },

  // Change password
  changePassword: async passwordData => {
    return await apiCall(API_ENDPOINTS.CHANGE_PASSWORD, {
      method: HTTP_METHODS.PUT,
      body: passwordData,
    });
  },

  // Delete account
  deleteAccount: async () => {
    const response = await apiCall(API_ENDPOINTS.DELETE_ACCOUNT, {
      method: HTTP_METHODS.DELETE,
    });

    // Clear stored data if account deleted
    if (response.success) {
      await removeToken();
    }

    return response;
  },
};

// Token management functions
export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

export const storeToken = async token => {
  try {
    await AsyncStorage.setItem('authToken', token);
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
};

export const storeUserData = async userData => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.multiRemove(['authToken', 'userData']);
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

// Request timeout configuration
export const REQUEST_TIMEOUT = API_CONFIG.TIMEOUT;

// Network status checker
export const checkNetworkStatus = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const token = await getStoredToken();
  return !!token;
};

// Helper function to get auth headers
export const getAuthHeaders = async () => {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
