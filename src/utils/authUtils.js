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
          Authorization: `Token ${token}`,
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

// Venue API utilities
export const getVenueDetails = async token => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENUE_GET}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
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
        error:
          errorData.message || errorData.error || 'Failed to get venue details',
      };
    }
  } catch (error) {
    console.error('Get venue details error:', error);
    return {
      success: false,
      error: error.message.includes('Network request failed')
        ? 'Network error. Please check your connection.'
        : 'Failed to get venue details',
    };
  }
};

export const updateVenueDetails = async (token, venueData) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VENUE_PUT}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(venueData),
      },
    );

    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.message ||
          errorData.error ||
          'Failed to update venue details',
      };
    }
  } catch (error) {
    console.error('Update venue details error:', error);
    return {
      success: false,
      error: error.message.includes('Network request failed')
        ? 'Network error. Please check your connection.'
        : 'Failed to update venue details',
    };
  }
};

// Events API utilities
export const getEventStatistics = async token => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_STATS}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
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
        error:
          errorData.message || errorData.error || 'Failed to get statistics',
      };
    }
  } catch (error) {
    console.error('Get event statistics error:', error);
    return {
      success: false,
      error: error.message.includes('Network request failed')
        ? 'Network error. Please check your connection.'
        : 'Failed to get statistics',
    };
  }
};

export const addEvent = async (token, eventData) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_POST}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(eventData),
      },
    );

    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || 'Failed to add event',
      };
    }
  } catch (error) {
    console.error('Add event error:', error);
    return {
      success: false,
      error: error.message.includes('Network request failed')
        ? 'Network error. Please check your connection.'
        : 'Failed to add event',
    };
  }
};

export const getEventDetails = async (token, eventId) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_GET}${eventId}/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
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
        error:
          errorData.message || errorData.error || 'Failed to get event details',
      };
    }
  } catch (error) {
    console.error('Get event details error:', error);
    return {
      success: false,
      error: error.message.includes('Network request failed')
        ? 'Network error. Please check your connection.'
        : 'Failed to get event details',
    };
  }
};

export const updateEvent = async (token, eventId, eventData) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_PUT}${eventId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(eventData),
      },
    );

    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || 'Failed to update event',
      };
    }
  } catch (error) {
    console.error('Update event error:', error);
    return {
      success: false,
      error: error.message.includes('Network request failed')
        ? 'Network error. Please check your connection.'
        : 'Failed to update event',
    };
  }
};

export default {
  callLogoutAPI,
  getVenueDetails,
  updateVenueDetails,
  getEventStatistics,
  addEvent,
  getEventDetails,
  updateEvent,
};
