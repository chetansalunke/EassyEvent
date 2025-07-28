import { Alert } from 'react-native';
import { apiRequest } from '../config/apiConfig';
import API_CONFIG from '../config/apiConfig';

// Network connectivity test utility
export const testNetworkConnection = async () => {
  try {
    console.log('Testing network connection...');

    // First, test basic connectivity to a public API
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      timeout: 5000,
    });

    if (response.ok) {
      console.log('Basic network connectivity: OK');

      // Now test our specific API endpoint
      try {
        const testResponse = await fetch(`${API_CONFIG.BASE_URL}/`, {
          method: 'GET',
          timeout: 10000,
        });

        console.log('API server connectivity:', testResponse.status);
        return true;
      } catch (apiError) {
        console.warn('API server test failed:', apiError.message);
        Alert.alert(
          'API Connection Issue',
          'Cannot connect to the server. Please check if the server is running and try again.',
        );
        return false;
      }
    }
  } catch (error) {
    console.error('Network test failed:', error);
    Alert.alert(
      'Network Error',
      'No internet connection. Please check your network settings and try again.',
    );
    return false;
  }
};

// Enhanced error handler for API calls
export const handleApiError = error => {
  console.error('API Error Details:', error);

  if (error.message.includes('Network request failed')) {
    return 'Network error. Please check your internet connection.';
  }

  if (error.message.includes('timeout')) {
    return 'Request timeout. The server is taking too long to respond.';
  }

  if (error.message.includes('AbortError')) {
    return 'Request was cancelled due to timeout.';
  }

  if (error.message.includes('Failed to fetch')) {
    return 'Cannot connect to server. Please check your internet connection.';
  }

  return error.message || 'An unexpected error occurred.';
};

export default {
  testNetworkConnection,
  handleApiError,
};
