import API_CONFIG from '../config/apiConfig';
import { EventsAPI } from '../services/eventsApi';

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

// Events API utilities - Using EventsAPI service
export const getEventStatistics = async token => {
  return await EventsAPI.getEventsStats(token);
};

export const addEvent = async (token, eventData) => {
  return await EventsAPI.createEvent(eventData, token);
};

export const getEventDetails = async (token, eventId) => {
  return await EventsAPI.getEvent(eventId, token);
};

export const getAllEvents = async token => {
  return await EventsAPI.getAllEvents(token);
};

export const deleteEvent = async (token, eventId) => {
  return await EventsAPI.deleteEvent(eventId, token);
};

export const updateEvent = async (token, eventId, eventData) => {
  return await EventsAPI.updateEvent(eventId, eventData, token);
};

export default {
  callLogoutAPI,
  getVenueDetails,
  updateVenueDetails,
  getEventStatistics,
  addEvent,
  getEventDetails,
  getAllEvents,
  updateEvent,
  deleteEvent,
};
