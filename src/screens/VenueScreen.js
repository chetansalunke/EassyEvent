import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Image,
  FlatList,
  Dimensions,
  PermissionsAndroid,
  Linking,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import { getVenueDetails, updateVenueDetails } from '../utils/authUtils';
import {
  uploadVenueImages,
  uploadVenueImagesSimple,
  getVenueImages,
  deleteVenueImage,
} from '../services/venueImagesApi';
import { getScreenSafeArea } from '../utils/safeArea';

const { width } = Dimensions.get('window');

const VenueScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [venueDetails, setVenueDetails] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Image gallery states
  const [venueImages, setVenueImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Dropdown states
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showRateTypeDropdown, setShowRateTypeDropdown] = useState(false);

  const [editFormData, setEditFormData] = useState({
    venue_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pin: '',
    seating_capacity: '',
    rate: '',
    rate_type: '',
  });
  const { user, token } = useAuth();

  // Dropdown options
  const CITY_OPTIONS = [
    'Mumbai',
    'Pune',
    'Bengaluru',
    'Delhi',
    'Kolkata',
    'Chennai',
    'Hyderabad',
    'Ahmedabad',
    'Nashik',
    'Aurangabad',
  ];

  const STATE_OPTIONS = [
    'Maharashtra',
    'Delhi',
    'West Bengal',
    'Tamil Nadu',
    'Telangana',
    'Gujarat',
  ];

  const RATE_TYPE_OPTIONS = ['per day', 'per hour'];

  // Load venue details
  const loadVenueDetails = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const result = await getVenueDetails(token);

      if (result.success) {
        setVenueDetails(result.data);
      } else {
        console.warn('Failed to load venue details:', result.error);
      }
    } catch (error) {
      console.error('Error loading venue details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVenueDetails();
    loadVenueImages();
  }, [token]);

  // Handle Android hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showImageGallery) {
          setShowImageGallery(false);
          return true;
        }
        if (showEditModal) {
          setShowEditModal(false);
          return true;
        }
        navigation.goBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, showImageGallery, showEditModal]),
  );

  // Load venue images
  const loadVenueImages = async () => {
    if (!token) return;

    try {
      setIsLoadingImages(true);
      const result = await getVenueImages(token);

      console.log('Load venue images result:', result);

      if (result.success) {
        console.log('Venue images data:', result.data);
        console.log('Number of images:', result.data?.length || 0);
        setVenueImages(result.data || []);
      } else {
        console.warn('Failed to load venue images:', result.error);
        // Show user-friendly error
        Alert.alert('Error', 'Failed to load venue images: ' + result.error);
      }
    } catch (error) {
      console.error('Error loading venue images:', error);
      Alert.alert('Error', 'Failed to load venue images');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadVenueDetails(), loadVenueImages()]);
    setIsRefreshing(false);
  };

  // Check if permissions are already granted using react-native-permissions
  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        let storagePermission;

        if (androidVersion >= 33) {
          storagePermission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          storagePermission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }

        const storageStatus = await check(storagePermission);
        const cameraStatus = await check(PERMISSIONS.ANDROID.CAMERA);

        console.log('Storage permission status:', storageStatus);
        console.log('Camera permission status:', cameraStatus);

        return {
          storage: storageStatus === RESULTS.GRANTED,
          camera: cameraStatus === RESULTS.GRANTED,
          storageStatus,
          cameraStatus,
        };
      } catch (err) {
        console.warn('Permission check error:', err);
        return {
          storage: false,
          camera: false,
          storageStatus: 'error',
          cameraStatus: 'error',
        };
      }
    } else {
      // iOS
      const cameraStatus = await check(PERMISSIONS.IOS.CAMERA);
      const photoStatus = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);

      return {
        storage: photoStatus === RESULTS.GRANTED,
        camera: cameraStatus === RESULTS.GRANTED,
        storageStatus: photoStatus,
        cameraStatus,
      };
    }
  };

  // Request camera/gallery permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        let storagePermission;

        if (androidVersion >= 33) {
          storagePermission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          storagePermission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }

        const storageStatus = await check(storagePermission);

        if (storageStatus === RESULTS.GRANTED) {
          return true;
        }

        if (storageStatus === RESULTS.BLOCKED) {
          Alert.alert(
            'Permission Required',
            'Gallery permission is required to select photos. Please enable it in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => openSettings(),
              },
            ],
          );
          return false;
        }

        const requestResult = await request(storagePermission);
        return requestResult === RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    } else {
      // iOS
      const photoStatus = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);

      if (photoStatus === RESULTS.GRANTED) {
        return true;
      }

      if (photoStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Photo library access is required to select photos. Please enable it in app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => openSettings(),
            },
          ],
        );
        return false;
      }

      const requestResult = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      return requestResult === RESULTS.GRANTED;
    }
  };

  // Handle image selection from gallery
  const handleSelectImages = async () => {
    Alert.alert('Select Images', 'Choose an option', [
      {
        text: 'Camera',
        onPress: () => openCamera(),
      },
      {
        text: 'Gallery',
        onPress: () => openGallery(),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  // Open camera
  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Please grant camera permission to take photos',
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.7, // Reduced quality for smaller file size
      maxWidth: 1024, // Limit image width
      maxHeight: 1024, // Limit image height
      includeBase64: false,
    };

    launchCamera(options, response => {
      console.log('Camera response:', response);

      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
        Alert.alert('Error', 'Failed to take photo: ' + response.error);
      } else if (response.assets && response.assets.length > 0) {
        console.log('Camera captured image:', response.assets[0]);
        uploadImages(response.assets);
      } else {
        Alert.alert('Error', 'No image captured');
      }
    });
  };

  // Open gallery
  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Please grant gallery permission to select images',
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.7, // Reduced quality for smaller file size
      maxWidth: 1024, // Limit image width
      maxHeight: 1024, // Limit image height
      selectionLimit: 3, // Reduced from 5 to avoid large uploads
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      console.log('Gallery response:', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select images: ' + response.error);
      } else if (response.assets && response.assets.length > 0) {
        console.log('Gallery selected images:', response.assets);
        uploadImages(response.assets);
      } else {
        Alert.alert('Error', 'No images selected');
      }
    });
  };

  // Debug function to check current permission status
  const debugPermissions = async () => {
    const permissions = await checkPermissions();
    const platform = Platform.OS;
    const version = Platform.Version;

    let statusText = `Platform: ${platform}\nVersion: ${version}\n\n`;
    statusText += `Storage/Photos Permission: ${
      permissions.storage ? 'Granted' : 'Denied'
    }\n`;
    statusText += `Storage Status: ${permissions.storageStatus}\n\n`;
    statusText += `Camera Permission: ${
      permissions.camera ? 'Granted' : 'Denied'
    }\n`;
    statusText += `Camera Status: ${permissions.cameraStatus}\n\n`;

    if (platform === 'android' && version >= 33) {
      statusText += 'Using: READ_MEDIA_IMAGES (Android 13+)';
    } else if (platform === 'android') {
      statusText += 'Using: READ_EXTERNAL_STORAGE';
    } else {
      statusText += 'Using: iOS Photo Library & Camera';
    }

    const hasBlockedPermissions =
      permissions.storageStatus === RESULTS.BLOCKED ||
      permissions.cameraStatus === RESULTS.BLOCKED;

    Alert.alert('Permission Status', statusText, [
      ...(hasBlockedPermissions
        ? [
            {
              text: 'Open Settings',
              onPress: () => openSettings(),
            },
          ]
        : []),
      {
        text: 'Test Gallery',
        onPress: () => openGallery(),
      },
      {
        text: 'Test Camera',
        onPress: () => openCamera(),
      },
      { text: 'OK', style: 'cancel' },
    ]);
  };

  // Debug function to check image data
  const debugImageData = () => {
    console.log('Current venue images:', venueImages);
    console.log('Number of images:', venueImages.length);

    let debugText = `Images loaded: ${venueImages.length}\n\n`;

    if (venueImages.length > 0) {
      venueImages.forEach((image, index) => {
        debugText += `Image ${index + 1}:\n`;
        debugText += `ID: ${image.id}\n`;
        debugText += `URL: ${image.image || 'No URL'}\n`;
        debugText += `Created: ${image.created_at || 'No date'}\n\n`;
      });
    } else {
      debugText += 'No images found.\n\n';
      debugText += 'Possible issues:\n';
      debugText += '• Images not uploaded correctly\n';
      debugText += '• API response format changed\n';
      debugText += '• Network connection issues\n';
      debugText += '• Authentication problems';
    }

    Alert.alert('Image Debug Info', debugText, [
      {
        text: 'Test Upload',
        onPress: () => testImageUpload(),
      },
      {
        text: 'Reload Images',
        onPress: () => loadVenueImages(),
      },
      { text: 'OK', style: 'cancel' },
    ]);
  };

  // Test function to check upload API
  const testImageUpload = async () => {
    if (!token) {
      Alert.alert('Error', 'No authentication token');
      return;
    }

    Alert.alert(
      'Test Upload',
      'This will test the upload API with a dummy request',
      [
        {
          text: 'Test API Connection',
          onPress: async () => {
            try {
              console.log('Testing API connection...');
              const testFormData = new FormData();
              testFormData.append('test', 'connection');

              const response = await fetch(
                'https://easeevent.echogen.online/venue/images/post/',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Token ${token}`,
                  },
                  body: testFormData,
                },
              );

              console.log('Test response status:', response.status);
              const responseText = await response.text();
              console.log('Test response:', responseText);

              Alert.alert(
                'API Test Result',
                `Status: ${response.status}\nResponse: ${responseText.substring(
                  0,
                  200,
                )}...`,
              );
            } catch (error) {
              console.error('Test API error:', error);
              Alert.alert('API Test Failed', error.message);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };
  // Request camera permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const cameraStatus = await check(PERMISSIONS.ANDROID.CAMERA);

        if (cameraStatus === RESULTS.GRANTED) {
          return true;
        }

        if (cameraStatus === RESULTS.BLOCKED) {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to take photos. Please enable it in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => openSettings(),
              },
            ],
          );
          return false;
        }

        const requestResult = await request(PERMISSIONS.ANDROID.CAMERA);
        return requestResult === RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission request error:', err);
        return false;
      }
    } else {
      // iOS
      const cameraStatus = await check(PERMISSIONS.IOS.CAMERA);

      if (cameraStatus === RESULTS.GRANTED) {
        return true;
      }

      if (cameraStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Camera access is required to take photos. Please enable it in app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => openSettings(),
            },
          ],
        );
        return false;
      }

      const requestResult = await request(PERMISSIONS.IOS.CAMERA);
      return requestResult === RESULTS.GRANTED;
    }
  };

  // Upload selected images
  const uploadImages = async selectedImages => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    if (!selectedImages || selectedImages.length === 0) {
      Alert.alert('Error', 'No images selected');
      return;
    }

    console.log('Starting image upload...', selectedImages);
    console.log(
      'Selected images details:',
      selectedImages.map(img => ({
        uri: img.uri,
        fileName: img.fileName,
        type: img.type,
        fileSize: img.fileSize,
      })),
    );

    setIsUploadingImages(true);
    try {
      const result = await uploadVenueImages(token, selectedImages);

      console.log('Upload result:', result);

      if (result.success) {
        Alert.alert(
          'Success',
          `${selectedImages.length} image(s) uploaded successfully!`,
          [
            {
              text: 'OK',
              onPress: async () => {
                console.log('Refreshing images after upload...');
                await loadVenueImages();
                console.log('Images refreshed after upload');
              },
            },
          ],
        );
      } else {
        console.error('Upload failed:', result);
        let errorMessage = result.error || 'Failed to upload images';

        // Add more specific error messages
        if (result.status === 413) {
          errorMessage = 'Images are too large. Please select smaller images.';
        } else if (result.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (result.status === 400) {
          errorMessage =
            'Invalid image format. Please select JPG or PNG images.';
        }

        Alert.alert('Upload Failed', errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload images. Please try again.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Delete image
  const handleDeleteImage = (imageId, imageIndex) => {
    Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteImage(imageId, imageIndex),
      },
    ]);
  };

  const deleteImage = async (imageId, imageIndex) => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      const result = await deleteVenueImage(token, imageId);

      if (result.success) {
        Alert.alert('Success', 'Image deleted successfully!');
        await loadVenueImages(); // Refresh images list
        setShowImageGallery(false); // Close gallery if open
      } else {
        Alert.alert('Error', result.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete image');
    }
  };

  // Open image gallery modal
  const openImageGallery = index => {
    setSelectedImageIndex(index);
    setShowImageGallery(true);
  };

  const handleEditVenue = () => {
    if (venueDetails) {
      setEditFormData({
        venue_name: venueDetails.venue_name || '',
        phone: venueDetails.phone || '',
        address_line1: venueDetails.address_line1 || '',
        address_line2: venueDetails.address_line2 || '',
        city: venueDetails.city || '',
        state: venueDetails.state || '',
        pin: venueDetails.pin?.toString() || '',
        seating_capacity: venueDetails.seating_capacity || '',
        rate: venueDetails.rate?.toString() || '',
        rate_type: venueDetails.rate_type || '',
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateVenue = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setIsUpdating(true);
    try {
      // Prepare data for API - only send non-empty fields
      const updateData = {};
      Object.keys(editFormData).forEach(key => {
        const value = editFormData[key];
        if (value && value.trim() !== '') {
          if (key === 'pin' || key === 'rate') {
            // Convert to number for numeric fields
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue)) {
              updateData[key] = numValue;
            }
          } else {
            updateData[key] = value.trim();
          }
        }
      });

      console.log('Updating venue with data:', updateData);

      const result = await updateVenueDetails(token, updateData);

      if (result.success) {
        setVenueDetails(result.data);
        setShowEditModal(false);
        Alert.alert('Success', 'Venue details updated successfully!');
        // Refresh venue details
        await loadVenueDetails();
      } else {
        Alert.alert('Error', result.error || 'Failed to update venue details');
      }
    } catch (error) {
      console.error('Update venue error:', error);
      Alert.alert('Error', 'Failed to update venue details');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFormInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Dropdown selection handlers
  const selectCity = city => {
    handleFormInputChange('city', city);
    setShowCityDropdown(false);
    setShowStateDropdown(false);
    setShowRateTypeDropdown(false);
  };

  const selectState = state => {
    handleFormInputChange('state', state);
    setShowStateDropdown(false);
    setShowCityDropdown(false);
    setShowRateTypeDropdown(false);
  };

  const selectRateType = rateType => {
    handleFormInputChange('rate_type', rateType.toLowerCase());
    setShowRateTypeDropdown(false);
    setShowCityDropdown(false);
    setShowStateDropdown(false);
  };

  // Close all dropdowns when scrolling
  const closeAllDropdowns = () => {
    setShowCityDropdown(false);
    setShowStateDropdown(false);
    setShowRateTypeDropdown(false);
  };

  // Simple dropdown component
  const SimpleDropdown = ({
    value,
    placeholder,
    data,
    onSelect,
    isOpen,
    onToggle,
    error,
    priority = false,
  }) => (
    <View
      style={[
        styles.dropdownWrapper,
        priority && styles.dropdownWrapperPriority,
      ]}
    >
      <TouchableOpacity
        style={[styles.formInput, styles.dropdown, error && styles.inputError]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.inputText : styles.placeholder}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.gray}
        />
      </TouchableOpacity>

      {isOpen && (
        <View
          style={[styles.dropdownList, priority && styles.dropdownListPriority]}
        >
          <ScrollView
            style={styles.dropdownScrollView}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            indicatorStyle="black"
            scrollIndicatorInsets={{ right: 1 }}
            bounces={true}
            scrollEventThrottle={16}
            removeClippedSubviews={false}
          >
            {data.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  value === item && styles.selectedDropdownItem,
                  index === data.length - 1 && styles.dropdownItemLast,
                ]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === item && styles.selectedDropdownItemText,
                  ]}
                >
                  {item}
                </Text>
                {value === item && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primary}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const InfoCard = ({ title, children, icon }) => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={16} color={colors.gray} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
    </View>
  );

  const QuickActionCard = ({
    title,
    icon,
    iconColor,
    onPress,
    description,
  }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionDescription}>{description}</Text>
    </TouchableOpacity>
  );

  // Image gallery component
  const renderImageItem = ({ item, index }) => {
    console.log('Rendering image item:', item);

    // Handle different URL formats
    let imageUri = '';
    if (item.image) {
      if (item.image.startsWith('http')) {
        imageUri = item.image;
      } else if (item.image.startsWith('/')) {
        imageUri = `https://easeevent.echogen.online${item.image}`;
      } else {
        imageUri = `https://easeevent.echogen.online/${item.image}`;
      }
    }

    console.log('Image URI:', imageUri);

    return (
      <TouchableOpacity
        style={styles.imageItem}
        onPress={() => openImageGallery(index)}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.imageItemPhoto}
          resizeMode="cover"
          onError={error => {
            console.error('Image load error:', error);
            console.error('Failed image URI:', imageUri);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageUri);
          }}
          onLoadStart={() => {
            console.log('Image loading started:', imageUri);
          }}
        />
        <TouchableOpacity
          style={styles.deleteImageButton}
          onPress={() => handleDeleteImage(item.id, index)}
        >
          <Ionicons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const ImageGallerySection = () => (
    <View style={styles.imageGallerySection}>
      <View style={styles.galleryHeader}>
        <Text style={styles.sectionTitle}>Venue Photos</Text>
        <View style={styles.galleryButtons}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={debugPermissions}
          >
            <Ionicons name="information-circle" size={16} color={colors.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={handleSelectImages}
            disabled={isUploadingImages}
          >
            {isUploadingImages ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="camera" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isLoadingImages ? (
        <View style={styles.loadingImagesContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      ) : venueImages.length > 0 ? (
        <FlatList
          data={venueImages}
          renderItem={renderImageItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.imageGrid}
        />
      ) : (
        <View style={styles.emptyImageState}>
          <Ionicons name="image-outline" size={64} color={colors.gray} />
          <Text style={styles.emptyImageText}>No photos yet</Text>
          <Text style={styles.emptyImageSubtext}>
            Add photos to showcase your venue
          </Text>
          <TouchableOpacity
            style={styles.addFirstImageButton}
            onPress={handleSelectImages}
            disabled={isUploadingImages}
          >
            <Text style={styles.addFirstImageButtonText}>
              {isUploadingImages ? 'Uploading...' : 'Add Photos'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading && !venueDetails) {
    return (
      <SafeAreaView style={[styles.container, getScreenSafeArea(insets)]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Venue Management</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading venue details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getScreenSafeArea(insets)]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Venue Management</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditVenue}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Venue Header */}
        <View style={styles.venueHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(venueDetails?.venue_name || user?.venue_name || 'V')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.venueName}>
            {venueDetails?.venue_name || user?.venue_name || 'Venue Name'}
          </Text>
          <Text style={styles.venueEmail}>
            {venueDetails?.email || user?.email || 'email@example.com'}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Add Photos"
              icon="camera-outline"
              iconColor={colors.primary}
              onPress={handleSelectImages}
              description="Upload venue photos"
            />
            <QuickActionCard
              title="Edit Details"
              icon="create-outline"
              iconColor={colors.success}
              onPress={handleEditVenue}
              description="Update venue information"
            />
            <QuickActionCard
              title="View Events"
              icon="calendar-outline"
              iconColor={colors.warning}
              onPress={() => navigation.navigate('Events')}
              description="Manage your bookings"
            />
            <QuickActionCard
              title="Add Event"
              icon="add-circle-outline"
              iconColor={colors.info}
              onPress={() =>
                navigation.navigate('EditBooking', { isEdit: false })
              }
              description="Create new booking"
            />
          </View>
        </View>

        {/* Image Gallery Section */}
        <ImageGallerySection />

        {/* Venue Information */}
        <InfoCard title="Venue Information" icon="business">
          <InfoRow
            label="Venue Name"
            value={venueDetails?.venue_name}
            icon="home-outline"
          />
          <InfoRow
            label="Phone"
            value={venueDetails?.phone}
            icon="call-outline"
          />
          <InfoRow
            label="Email"
            value={venueDetails?.email}
            icon="mail-outline"
          />
        </InfoCard>

        {/* Address Information */}
        <InfoCard title="Address" icon="location">
          <InfoRow
            label="Address Line 1"
            value={venueDetails?.address_line1}
            icon="location-outline"
          />
          {venueDetails?.address_line2 && (
            <InfoRow
              label="Address Line 2"
              value={venueDetails?.address_line2}
              icon="location-outline"
            />
          )}
          <InfoRow
            label="City"
            value={venueDetails?.city}
            icon="business-outline"
          />
          <InfoRow
            label="State"
            value={venueDetails?.state}
            icon="map-outline"
          />
          <InfoRow
            label="PIN Code"
            value={venueDetails?.pin?.toString()}
            icon="pin-outline"
          />
        </InfoCard>

        {/* Venue Details */}
        <InfoCard title="Venue Details" icon="information-circle">
          <InfoRow
            label="Seating Capacity"
            value={venueDetails?.seating_capacity?.toString() + ' guests'}
            icon="people-outline"
          />
          <InfoRow
            label="Rate"
            value={
              venueDetails?.rate
                ? `₹${venueDetails.rate?.toLocaleString()}`
                : undefined
            }
            icon="cash-outline"
          />
          <InfoRow
            label="Rate Type"
            value={venueDetails?.rate_type}
            icon="time-outline"
          />
        </InfoCard>
      </ScrollView>

      {/* Image Gallery Modal */}
      <Modal
        visible={showImageGallery}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowImageGallery(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.galleryModalHeader}>
            <TouchableOpacity
              onPress={() => setShowImageGallery(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedImageIndex + 1} of {venueImages.length}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (venueImages[selectedImageIndex]) {
                  handleDeleteImage(
                    venueImages[selectedImageIndex].id,
                    selectedImageIndex,
                  );
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>

          {venueImages.length > 0 && venueImages[selectedImageIndex] && (
            <View style={styles.fullScreenImageContainer}>
              {(() => {
                const currentImage = venueImages[selectedImageIndex];
                let imageUri = '';
                if (currentImage.image) {
                  if (currentImage.image.startsWith('http')) {
                    imageUri = currentImage.image;
                  } else if (currentImage.image.startsWith('/')) {
                    imageUri = `https://easeevent.echogen.online${currentImage.image}`;
                  } else {
                    imageUri = `https://easeevent.echogen.online/${currentImage.image}`;
                  }
                }

                return (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                    onError={error => {
                      console.error('Full screen image load error:', error);
                      console.error('Failed full screen image URI:', imageUri);
                    }}
                    onLoad={() => {
                      console.log(
                        'Full screen image loaded successfully:',
                        imageUri,
                      );
                    }}
                  />
                );
              })()}

              {/* Navigation arrows */}
              {venueImages.length > 1 && (
                <>
                  {selectedImageIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.imageNavButton, styles.prevButton]}
                      onPress={() =>
                        setSelectedImageIndex(selectedImageIndex - 1)
                      }
                    >
                      <Ionicons
                        name="chevron-back"
                        size={30}
                        color={colors.background}
                      />
                    </TouchableOpacity>
                  )}

                  {selectedImageIndex < venueImages.length - 1 && (
                    <TouchableOpacity
                      style={[styles.imageNavButton, styles.nextButton]}
                      onPress={() =>
                        setSelectedImageIndex(selectedImageIndex + 1)
                      }
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={30}
                        color={colors.background}
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Venue</Text>
              <TouchableOpacity
                onPress={handleUpdateVenue}
                disabled={isUpdating}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={closeAllDropdowns}
              keyboardShouldPersistTaps="handled"
            >
              {/* Venue Information */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Venue Information</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Venue Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.venue_name}
                    onChangeText={value =>
                      handleFormInputChange('venue_name', value)
                    }
                    placeholder="Enter venue name"
                    placeholderTextColor={colors.gray}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.phone}
                    onChangeText={value =>
                      handleFormInputChange('phone', value)
                    }
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.gray}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Address Information */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Address</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address Line 1</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.address_line1}
                    onChangeText={value =>
                      handleFormInputChange('address_line1', value)
                    }
                    placeholder="Enter address line 1"
                    placeholderTextColor={colors.gray}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address Line 2</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.address_line2}
                    onChangeText={value =>
                      handleFormInputChange('address_line2', value)
                    }
                    placeholder="Enter address line 2 (optional)"
                    placeholderTextColor={colors.gray}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>City</Text>
                    <SimpleDropdown
                      value={editFormData.city}
                      placeholder="Select City"
                      data={CITY_OPTIONS}
                      onSelect={selectCity}
                      isOpen={showCityDropdown}
                      onToggle={() => setShowCityDropdown(!showCityDropdown)}
                    />
                  </View>

                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>State</Text>
                    <SimpleDropdown
                      value={editFormData.state}
                      placeholder="Select State"
                      data={STATE_OPTIONS}
                      onSelect={selectState}
                      isOpen={showStateDropdown}
                      onToggle={() => setShowStateDropdown(!showStateDropdown)}
                      priority={true}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>PIN Code</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.pin}
                    onChangeText={value => handleFormInputChange('pin', value)}
                    placeholder="Enter PIN code"
                    placeholderTextColor={colors.gray}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Venue Details */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Venue Details</Text>
                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Rate (₹)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editFormData.rate}
                      onChangeText={value =>
                        handleFormInputChange('rate', value)
                      }
                      placeholder="5000"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>Rate Type</Text>
                    <SimpleDropdown
                      value={
                        editFormData.rate_type
                          ? RATE_TYPE_OPTIONS.find(
                              option =>
                                option.toLowerCase() ===
                                editFormData.rate_type.toLowerCase(),
                            ) || editFormData.rate_type
                          : ''
                      }
                      placeholder="Select Rate Type"
                      data={RATE_TYPE_OPTIONS}
                      onSelect={selectRateType}
                      isOpen={showRateTypeDropdown}
                      onToggle={() =>
                        setShowRateTypeDropdown(!showRateTypeDropdown)
                      }
                      priority={true}
                    />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Seating Capacity</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editFormData.seating_capacity}
                    onChangeText={value =>
                      handleFormInputChange('seating_capacity', value)
                    }
                    placeholder="e.g., 100-200"
                    placeholderTextColor={colors.gray}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    flex: 1,
    textAlign: 'center',
    marginLeft: -40, // Compensate for back button
  },
  headerSpacer: {
    width: 40,
  },
  editButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  venueHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.background,
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  venueEmail: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 16,
    marginTop: 8,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray,
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.gray,
  },
  modalSaveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formSection: {
    marginBottom: 32,
    paddingBottom: 16,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
    position: 'relative',
    zIndex: 1,
  },
  formGroupHalf: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.secondary,
  },

  // SimpleDropdown styles
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1000,
    elevation: 1000,
  },
  dropdownWrapperPriority: {
    zIndex: 2000,
    elevation: 2000,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: {
    color: colors.gray,
    fontSize: 16,
  },
  inputText: {
    color: colors.secondary,
    fontSize: 16,
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 10000,
    elevation: 15,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    paddingRight: 2, // Add padding for scrollbar space
  },
  dropdownListPriority: {
    zIndex: 20000,
    elevation: 25,
  },
  dropdownScrollView: {
    flexGrow: 1,
    maxHeight: 200,
    paddingRight: 4, // Additional padding for scrollbar
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    minHeight: 36,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 20,
    flex: 1,
  },
  selectedDropdownItem: {
    backgroundColor: colors.primary + '10',
  },
  selectedDropdownItemText: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  inputError: {
    borderColor: colors.error,
  },

  // Image Gallery Styles
  imageGallerySection: {
    marginBottom: 24,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  galleryButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
  },
  addImageButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },
  loadingImagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  imageGrid: {
    gap: 12,
  },
  imageItem: {
    width: (width - 64) / 2, // Account for padding and gap
    height: (width - 64) / 2,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imageItemPhoto: {
    width: '100%',
    height: '100%',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  emptyImageState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyImageText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyImageSubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstImageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstImageButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },

  // Gallery Modal Styles
  galleryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: colors.black,
    position: 'relative',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: colors.primary + '80',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
});

export default VenueScreen;
