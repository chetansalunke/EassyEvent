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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import { getVenueDetails, updateVenueDetails } from '../utils/authUtils';
import { getScreenSafeArea } from '../utils/safeArea';

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [venueDetails, setVenueDetails] = useState(null);
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
  const { user, token } = useAuth();

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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditVenue}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
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
        {/* <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Edit Details"
              icon="create-outline"
              iconColor={colors.primary}
              onPress={handleEditVenue}
              description="Update venue information"
            />
            <QuickActionCard
              title="View Events"
              icon="calendar-outline"
              iconColor={colors.success}
              onPress={() => navigation.navigate('Events')}
              description="Manage your bookings"
            />
            <QuickActionCard
              title="Add Event"
              icon="add-circle-outline"
              iconColor={colors.warning}
              onPress={() =>
                navigation.navigate('EditBooking', { isEdit: false })
              }
              description="Create new booking"
            />
            <QuickActionCard
              title="Profile"
              icon="person-outline"
              iconColor={colors.info}
              onPress={() => navigation.navigate('Profile')}
              description="Account settings"
            />
          </View>
        </View> */}

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
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Venue</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
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
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
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
    marginBottom: 24,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.secondary,
  },
});

export default ProfileScreen;
