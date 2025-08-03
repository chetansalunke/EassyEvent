import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Upload venue images - Simple version using fetch
export const uploadVenueImagesSimple = async (token, images) => {
  try {
    console.log('Simple upload starting with images:', images);

    if (!images || images.length === 0) {
      throw new Error('No images provided');
    }

    const formData = new FormData();

    // Add each image to FormData
    images.forEach((image, index) => {
      console.log(`Adding image ${index}:`, {
        uri: image.uri,
        type: image.type,
        name: image.fileName || image.name,
      });

      formData.append('images', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name:
          image.fileName || image.name || `image_${Date.now()}_${index}.jpg`,
      });
    });

    console.log('Making fetch request...');

    const response = await fetch(API_ENDPOINTS.VENUE_IMAGES_UPLOAD, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    console.log('Response status:', response.status);

    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { message: responseText };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error('Simple upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
};

// Upload venue images
export const uploadVenueImages = async (token, images) => {
  try {
    console.log('Starting upload with images:', images);

    // Create FormData for multipart upload
    const formData = new FormData();

    // Add each image to FormData - simplified approach
    images.forEach((image, index) => {
      console.log(`Processing image ${index}:`, image);

      const imageFile = {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name:
          image.fileName ||
          image.name ||
          `venue_image_${Date.now()}_${index}.jpg`,
      };

      console.log('Adding image to FormData:', imageFile);
      formData.append('images', imageFile);
    });

    console.log('FormData prepared, making API call...');

    const response = await axios.post(
      API_ENDPOINTS.VENUE_IMAGES_UPLOAD,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Increased timeout to 60 seconds
        transformRequest: (data, headers) => {
          // Let axios handle the FormData transformation
          return data;
        },
      },
    );

    console.log('Upload successful:', response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Upload error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config,
    });

    if (error.response) {
      const errorMessage =
        error.response.data?.detail ||
        error.response.data?.error ||
        error.response.data?.message ||
        `Server error: ${error.response.status}`;

      return {
        success: false,
        error: errorMessage,
        status: error.response.status,
        details: error.response.data,
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
      };
    } else {
      return {
        success: false,
        error: error.message || 'Failed to upload images. Please try again.',
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
