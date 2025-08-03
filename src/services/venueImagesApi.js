import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Upload venue images
export const uploadVenueImages = async (token, images) => {
  try {
    const formData = new FormData();

    // Add each image to FormData
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || `image_${index}.jpg`,
      });
    });

    console.log('Uploading venue images...', images.length, 'images');

    const response = await axios.post(
      API_ENDPOINTS.VENUE_IMAGES_UPLOAD,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for image upload
      },
    );

    console.log('Upload response:', response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error uploading venue images:', error);

    if (error.response) {
      return {
        success: false,
        error:
          error.response.data?.detail ||
          error.response.data?.message ||
          'Failed to upload images',
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
      };
    } else {
      return {
        success: false,
        error: 'Failed to upload images. Please try again.',
      };
    }
  }
};

// Get venue images list
export const getVenueImages = async token => {
  try {
    console.log('Fetching venue images...');

    const response = await axios.get(API_ENDPOINTS.VENUE_IMAGES_LIST, {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Venue images response:', response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching venue images:', error);

    if (error.response) {
      return {
        success: false,
        error:
          error.response.data?.detail ||
          error.response.data?.message ||
          'Failed to fetch images',
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
      };
    } else {
      return {
        success: false,
        error: 'Failed to fetch images. Please try again.',
      };
    }
  }
};

// Delete venue image
export const deleteVenueImage = async (token, imageId) => {
  try {
    console.log('Deleting venue image with ID:', imageId);

    const response = await axios.delete(
      `${API_ENDPOINTS.VENUE_IMAGES_DELETE}${imageId}/`,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('Delete response:', response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error deleting venue image:', error);

    if (error.response) {
      return {
        success: false,
        error:
          error.response.data?.detail ||
          error.response.data?.message ||
          'Failed to delete image',
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
      };
    } else {
      return {
        success: false,
        error: 'Failed to delete image. Please try again.',
      };
    }
  }
};
