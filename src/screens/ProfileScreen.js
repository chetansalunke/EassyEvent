import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import { getVenueDetails, updateVenueDetails } from '../utils/authUtils';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const statusBarHeight = StatusBar.currentHeight || (isIOS ? 44 : 24);

const ProfileScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [venueDetails, setVenueDetails] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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
  const { user, logout, token } = useAuth();

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
  }, [token]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadVenueDetails();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    if (isLoggingOut) return;

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            const success = await logout();
            if (success) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } else {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
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

  if (isLoading && !venueDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.disabledButton]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          )}
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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(venueDetails?.venue_name || user?.venue_name || 'U')
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

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Future: Navigate to settings
              Alert.alert(
                'Coming Soon',
                'Settings feature will be available soon.',
              );
            }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.info} />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>EasyEvent v1.0.0</Text>
          <Text style={styles.appInfoText}>Venue Management System</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
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
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={handleUpdateVenue}
                disabled={isUpdating}
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
                    <TextInput
                      style={styles.formInput}
                      value={editFormData.city}
                      onChangeText={value =>
                        handleFormInputChange('city', value)
                      }
                      placeholder="City"
                      placeholderTextColor={colors.gray}
                    />
                  </View>

                  <View style={styles.formGroupHalf}>
                    <Text style={styles.formLabel}>State</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editFormData.state}
                      onChangeText={value =>
                        handleFormInputChange('state', value)
                      }
                      placeholder="State"
                      placeholderTextColor={colors.gray}
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
                    <TextInput
                      style={styles.formInput}
                      value={editFormData.rate_type}
                      onChangeText={value =>
                        handleFormInputChange('rate_type', value)
                      }
                      placeholder="per day/hour"
                      placeholderTextColor={colors.gray}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formFooter}>
                <Text style={styles.formNote}>
                  Only filled fields will be updated. Leave fields empty to keep
                  current values.
                </Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    ...Platform.select({
      ios: {
        paddingTop: 16,
      },
      android: {
        paddingTop: 16,
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },
  headerRight: {
    width: 40,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
  },
  // Modal Styles
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
    backgroundColor: colors.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  formSection: {
    marginTop: 20,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 16,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.secondary,
    backgroundColor: colors.background,
  },
  formFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  formNote: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProfileScreen;
