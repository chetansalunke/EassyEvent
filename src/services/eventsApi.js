import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

/**
 * Events API Service
 * Handles all event-related API calls
 */
export class EventsAPI {
  /**
   * Create a new event
   * @param {Object} eventData - Event data object
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Response data
   */
  static async createEvent(eventData, token) {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.EVENTS_POST,
        eventData,
        {
          headers: API_CONFIG.getHeaders(token),
        },
      );
      return {
        success: true,
        data: response.data,
        message: 'Event created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.message ||
          'Failed to create event',
        status: error.response?.status,
      };
    }
  }

  /**
   * Get all events
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Response data
   */
  static async getAllEvents(token) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.EVENTS_LIST, {
        headers: API_CONFIG.getHeaders(token),
      });
      return {
        success: true,
        data: response.data,
        message: 'Events fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.message ||
          'Failed to fetch events',
        status: error.response?.status,
      };
    }
  }

  /**
   * Get a specific event by ID
   * @param {number} eventId - Event ID
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Response data
   */
  static async getEvent(eventId, token) {
    try {
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.EVENTS_GET}${eventId}/`,
        {
          headers: API_CONFIG.getHeaders(token),
        },
      );
      return {
        success: true,
        data: response.data,
        message: 'Event fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.message ||
          'Failed to fetch event',
        status: error.response?.status,
      };
    }
  }

  /**
   * Update an existing event
   * @param {number} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Response data
   */
  static async updateEvent(eventId, eventData, token) {
    try {
      const response = await apiClient.put(
        `${API_CONFIG.ENDPOINTS.EVENTS_PUT}${eventId}/`,
        eventData,
        {
          headers: API_CONFIG.getHeaders(token),
        },
      );
      return {
        success: true,
        data: response.data,
        message: 'Event updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.message ||
          'Failed to update event',
        status: error.response?.status,
      };
    }
  }

  /**
   * Delete an event
   * @param {number} eventId - Event ID
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Response data
   */
  static async deleteEvent(eventId, token) {
    try {
      await apiClient.delete(
        `${API_CONFIG.ENDPOINTS.EVENTS_DELETE}${eventId}/`,
        {
          headers: API_CONFIG.getHeaders(token),
        },
      );
      return {
        success: true,
        message: 'Event deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.message ||
          'Failed to delete event',
        status: error.response?.status,
      };
    }
  }

  /**
   * Get events statistics
   * @param {string} token - Auth token
   * @returns {Promise<Object>} Response data
   */
  static async getEventsStats(token) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.EVENTS_STATS, {
        headers: API_CONFIG.getHeaders(token),
      });
      return {
        success: true,
        data: response.data,
        message: 'Events statistics fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.message ||
          'Failed to fetch events statistics',
        status: error.response?.status,
      };
    }
  }
}

/**
 * Event data validation
 */
export const validateEventData = eventData => {
  const errors = {};

  if (!eventData.name || eventData.name.trim() === '') {
    errors.name = 'Event name is required';
  }

  if (!eventData.from_date) {
    errors.from_date = 'Start date is required';
  }

  if (!eventData.from_time) {
    errors.from_time = 'Start time is required';
  }

  if (!eventData.to_date) {
    errors.to_date = 'End date is required';
  }

  if (!eventData.to_time) {
    errors.to_time = 'End time is required';
  }

  if (eventData.number_of_people && eventData.number_of_people < 1) {
    errors.number_of_people = 'Number of people must be at least 1';
  }

  if (eventData.amount_received && eventData.amount_received < 0) {
    errors.amount_received = 'Amount received cannot be negative';
  }

  if (eventData.amount_pending && eventData.amount_pending < 0) {
    errors.amount_pending = 'Amount pending cannot be negative';
  }

  // Validate date and time range
  if (eventData.from_date && eventData.to_date) {
    const fromDateTime = new Date(
      `${eventData.from_date}T${eventData.from_time || '00:00:00'}`,
    );
    const toDateTime = new Date(
      `${eventData.to_date}T${eventData.to_time || '23:59:59'}`,
    );

    if (fromDateTime >= toDateTime) {
      errors.date_validation =
        'End date and time must be after start date and time';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Format event data for API request
 */
export const formatEventData = formData => {
  return {
    name: formData.name?.trim(),
    from_date: formData.from_date,
    from_time: formData.from_time,
    to_date: formData.to_date,
    to_time: formData.to_time,
    payment_status: formData.payment_status || 'pending',
    number_of_people: parseInt(formData.number_of_people) || 0,
    amount_received: parseFloat(formData.amount_received) || 0,
    amount_pending: parseFloat(formData.amount_pending) || 0,
  };
};

/**
 * Payment status options
 */
export const PAYMENT_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Partially Paid', value: 'partially_paid' },
  { label: 'Fully Paid', value: 'fully_paid' },
  { label: 'Overdue', value: 'overdue' },
];

export default EventsAPI;
