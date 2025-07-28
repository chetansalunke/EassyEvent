// API Configuration for EasyEvent
const API_CONFIG = {
  BASE_URL: 'https://easeevent.echogen.online',
  ENDPOINTS: {
    SIGNUP: '/auth/signup/',
    LOGIN: '/auth/login/',
  },
  TIMEOUT: 15000, // 15 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

// Enhanced fetch function with better error handling
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const config = {
    method: 'GET',
    headers: API_CONFIG.HEADERS,
    timeout: API_CONFIG.TIMEOUT,
    ...options,
  };

  console.log('API Request:', url, config);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('API Response Status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response Data:', data);

    return { response, data };
  } catch (error) {
    console.error('API Error:', error);

    if (error.name === 'AbortError') {
      throw new Error(
        'Request timeout. Please check your internet connection.',
      );
    }

    if (error.message.includes('Network request failed')) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

export default API_CONFIG;
