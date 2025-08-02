// Simple API Configuration for EasyEvent
const API_CONFIG = {
  BASE_URL: 'https://easeevent.echogen.online',
  ENDPOINTS: {
    // Auth endpoints
    SIGNUP: '/auth/signup/',
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',

    // Venue endpoints
    VENUE_GET: '/venue/get/',
    VENUE_PUT: '/venue/put/',
    VENUE_IMAGES_POST: '/venue/images/post/',
    VENUE_IMAGES_LIST: '/venue/images/list/',
    VENUE_IMAGES_DELETE: '/venue/images/delete/', // + {id}/
    VENUE_GET_RATE: '/venue/get-rate/',

    // Events endpoints
    EVENTS_POST: '/events/post/',
    EVENTS_PUT: '/events/put/', // + {id}/
    EVENTS_GET: '/events/get/', // + {id}/
    EVENTS_LIST: '/events/list/', // Get all events
    EVENTS_DELETE: '/events/delete/', // + {id}/
    EVENTS_STATS: '/events/stats/get/',
  },

  // Request configuration
  TIMEOUT: 10000, // 10 seconds

  // Headers
  getHeaders: token => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  }),
};

export default API_CONFIG;
