import API_CONFIG from '../config/apiConfig';

// Simple logout API call utility
export const callLogoutAPI = async token => {
  try {
    if (!token) {
      console.warn('No token provided for logout API call');
      return { success: false, error: 'No token' };
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || 'Logout API failed',
      };
    }
  } catch (error) {
    console.error('Logout API error:', error);
    return {
      success: false,
      error: error.message.includes('Network request failed')
        ? 'Network error. Logout will continue locally.'
        : 'Logout API failed',
    };
  }
};

export default {
  callLogoutAPI,
};
