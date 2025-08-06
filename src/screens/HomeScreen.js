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
  BackHandler,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import { getVenueDetails } from '../utils/authUtils';

// Import API configuration
import API_CONFIG from '../config/apiConfig';

const { width, height } = Dimensions.get('window');

// Device size detection for adaptive UI
const isTablet = width >= 768;
const isSmallDevice = width < 375;
const isLargeDevice = width > 414;
const isAndroid = Platform.OS === 'android';
const statusBarHeight =
  StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 24);

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [venueDetails, setVenueDetails] = useState(null);
  const [bookingStats, setBookingStats] = useState(null); // State for booking stats
  const [statsLoading, setStatsLoading] = useState(false); // Loading state for stats
  const [eventDetails, setEventDetails] = useState(null); // State for event details
  // Fetch event details from API (for event id 1)
  const fetchEventDetails = async () => {
    if (!token) return;
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_GET}1`,
        {
          headers: {
            ...API_CONFIG.getHeaders(token),
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setEventDetails(data);
      } else {
        console.warn('Failed to fetch event details:', response.status);
      }
    } catch (error) {
      console.warn('Failed to fetch event details:', error?.message || error);
    }
  };
  const { user, logout, isAuthenticated, token } = useAuth();
  // Print token once on mount for debugging
  useEffect(() => {
    console.log('Auth token:', token);
  }, [token]);

  // Fetch dashboard statistics from API using proper fetch logic
  const fetchBookingStats = async () => {
    if (!token) {
      console.warn('No token available for booking stats request');
      return;
    }

    setStatsLoading(true);

    // List of possible API endpoints to try
    const endpoints = [
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_STATS}`,
      `${API_CONFIG.BASE_URL}/dashboard/stats`,
      `${API_CONFIG.BASE_URL}/events/stats/get/`,
    ];

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];

      try {
        console.log(`Trying endpoint ${i + 1}/${endpoints.length}:`, endpoint);
        console.log('Using token:', token.substring(0, 20) + '...');

        // Try both Token and Bearer authentication headers
        const authHeaders = [
          { Authorization: `Token ${token}` },
          { Authorization: `Bearer ${token}` },
        ];

        for (const authHeader of authHeaders) {
          console.log(
            'Trying auth header:',
            Object.keys(authHeader)[0],
            Object.values(authHeader)[0].substring(0, 20) + '...',
          );

          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...authHeader,
            },
            timeout: API_CONFIG.TIMEOUT,
          });

          console.log('Response status:', response.status);

          if (response.ok) {
            const result = await response.json();
            console.log('Booking stats response:', result);

            // Check if result has the expected structure
            if (result && typeof result === 'object') {
              // Set the booking stats even if some fields are missing
              setBookingStats({
                bookings_this_month: result.bookings_this_month ?? 0,
                fully_paid_bookings: result.fully_paid_bookings ?? 0,
                partially_paid_bookings: result.partially_paid_bookings ?? 0,
                available_dates_left: result.available_dates_left ?? 0,
              });
              console.log('Booking stats set successfully from:', endpoint);
              setStatsLoading(false);
              return; // Success, exit the function
            }
          } else {
            const errorText = await response.text();
            console.error(
              `Auth header failed for ${endpoint}:`,
              response.status,
              errorText,
            );
          }
        }

        // If we get here, both auth headers failed for this endpoint
        console.error(`All auth methods failed for endpoint: ${endpoint}`);
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error.message);
      }
    }

    // If all endpoints failed
    console.error(
      'All endpoints and auth methods failed. Setting default values.',
    );

    // Set default values on final error
    setBookingStats({
      bookings_this_month: 0,
      fully_paid_bookings: 0,
      partially_paid_bookings: 0,
      available_dates_left: 0,
    });

    setStatsLoading(false);
  };
  // Auth protection - redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [isAuthenticated, navigation]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Exit App', 'Are you sure you want to exit?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {
          text: 'YES',
          onPress: () => BackHandler.exitApp(),
        },
      ]);
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  // Load venue details data
  const loadVenueData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      // Load venue details
      const venueResult = await getVenueDetails(token);

      if (venueResult.success) {
        setVenueDetails(venueResult.data);
      } else {
        console.warn('Failed to load venue details:', venueResult.error);
      }
    } catch (error) {
      console.error('Error loading venue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated && token) {
      loadVenueData();
      fetchBookingStats();
      fetchEventDetails();
    }
  }, [isAuthenticated, token]);

  // Refresh data
  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadVenueData(),
      fetchBookingStats(),
      fetchEventDetails(),
    ]);
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

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
              // Reset navigation stack to prevent back navigation to authenticated screens
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

  const tabs = [
    {
      icon: 'home-outline',
      activeIcon: 'home',
      label: 'Dashboard',
      route: 'Home',
    },
    {
      icon: 'calendar-outline',
      activeIcon: 'calendar',
      label: 'Events',
      route: 'Events',
    },
    {
      icon: 'person-outline',
      activeIcon: 'person',
      label: 'Profile',
      route: 'Profile',
    },
    {
      icon: 'business-outline',
      activeIcon: 'business',
      label: 'Venue',
      route: 'Venue',
    },
    {
      icon: 'settings-outline',
      activeIcon: 'settings',
      label: 'Settings',
      route: 'Settings',
    },
  ];

  // Render loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Adaptive Top Navigation Header */}
      <View
        style={[
          styles.header,
          isTablet && styles.headerTablet,
          { paddingTop: Math.max(insets.top * 0.3, 8) }, // Add some top padding based on safe area
        ]}
      >
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.venueNameText,
              isTablet && styles.venueNameTextTablet,
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {venueDetails?.venue_name || user?.venue_name || 'Your Venue'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerButton, isTablet && styles.headerButtonTablet]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons
              name="person-circle-outline"
              size={isTablet ? 32 : 28}
              color={colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, isTablet && styles.headerButtonTablet]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons
                name="log-out-outline"
                size={isTablet ? 32 : 28}
                color={colors.error}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.screen}>
        <ScrollView
          style={[
            styles.homeContent,
            // Add horizontal padding for devices with curved edges
            {
              paddingHorizontal: Math.max(
                20,
                insets.left + 20,
                insets.right + 20,
              ),
            },
          ]}
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
          {/* Venue Info Card */}
          {venueDetails && (
            <View style={styles.venueCard}>
              <View style={styles.venueHeader}>
                <Ionicons name="business" size={24} color={colors.primary} />
                <Text style={styles.venueTitle}>Venue Information</Text>
              </View>
              <View style={styles.venueInfo}>
                <Text style={styles.venueInfoText} numberOfLines={2}>
                  <Text style={styles.venueInfoLabel}>Rate: </Text>₹
                  {venueDetails.rate?.toLocaleString() || '0'} per{' '}
                  {venueDetails.rate_type || 'day'}
                </Text>
                <Text style={styles.venueInfoText} numberOfLines={2}>
                  <Text style={styles.venueInfoLabel}>Capacity: </Text>
                  {venueDetails.seating_capacity || 'N/A'} guests
                </Text>
                <Text style={styles.venueInfoText} numberOfLines={2}>
                  <Text style={styles.venueInfoLabel}>Location: </Text>
                  {venueDetails.city || 'N/A'}, {venueDetails.state || 'N/A'}
                </Text>
              </View>
            </View>
          )}
          {/* Dashboard Statistics Section - API Data Only */}
          <View style={styles.bookingStatsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Dashboard Statistics</Text>
            </View>

            {statsLoading ? (
              <View style={styles.statsLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.statsLoadingText}>
                  Loading statistics...
                </Text>
              </View>
            ) : bookingStats ? (
              <View style={styles.bookingStatsGrid}>
                <View style={styles.bookingStatCard}>
                  <Ionicons name="calendar" size={20} color={colors.success} />
                  <Text style={styles.bookingStatLabel}>
                    Bookings This Month
                  </Text>
                  <Text style={styles.bookingStatValue}>
                    {bookingStats.bookings_this_month ?? 0}
                  </Text>
                </View>
                <View style={styles.bookingStatCard}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.bookingStatLabel}>
                    Fully Paid Bookings
                  </Text>
                  <Text style={styles.bookingStatValue}>
                    {bookingStats.fully_paid_bookings ?? 0}
                  </Text>
                </View>
                <View style={styles.bookingStatCard}>
                  <Ionicons name="time" size={20} color={colors.warning} />
                  <Text style={styles.bookingStatLabel}>
                    Partially Paid Bookings
                  </Text>
                  <Text style={styles.bookingStatValue}>
                    {bookingStats.partially_paid_bookings ?? 0}
                  </Text>
                </View>
                <View style={styles.bookingStatCard}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.info}
                  />
                  <Text style={styles.bookingStatLabel}>
                    Available Dates Left
                  </Text>
                  <Text style={styles.bookingStatValue}>
                    {bookingStats.available_dates_left ?? 0}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.statsEmptyContainer}>
                <Ionicons
                  name="analytics-outline"
                  size={32}
                  color={colors.gray}
                />
                <Text style={styles.statsEmptyText}>
                  Unable to load statistics
                </Text>
                <Text style={styles.statsEmptySubtext}>
                  Check your internet connection and try again
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchBookingStats}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { marginTop: 8, backgroundColor: colors.info },
                  ]}
                  onPress={async () => {
                    console.log('=== API DEBUG INFO ===');
                    console.log('Token exists:', !!token);
                    console.log('Token length:', token ? token.length : 0);
                    console.log('Base URL:', API_CONFIG.BASE_URL);
                    console.log(
                      'Stats endpoint:',
                      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVENTS_STATS}`,
                    );
                    console.log('Is authenticated:', isAuthenticated);
                    console.log('User:', user);

                    // Test a simple API call
                    try {
                      const testResponse = await fetch(
                        `${API_CONFIG.BASE_URL}/venue/get/`,
                        {
                          headers: API_CONFIG.getHeaders(token),
                        },
                      );
                      console.log('Test API call status:', testResponse.status);
                      console.log(
                        'Test API call headers work:',
                        testResponse.ok,
                      );
                    } catch (error) {
                      console.log('Test API call failed:', error.message);
                    }

                    Alert.alert(
                      'Debug',
                      'Check console logs for API debug info',
                    );
                  }}
                >
                  <Text style={styles.retryButtonText}>Debug API</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* Event Details Section */}
          {eventDetails && (
            <View style={styles.eventDetailsSection}>
              <Text style={styles.quickActionsSectionTitle}>Event Details</Text>
              <View style={styles.eventDetailsGrid}>
                <Text style={styles.eventDetailLabel}>Name:</Text>
                <Text style={styles.eventDetailValue}>{eventDetails.name}</Text>
                <Text style={styles.eventDetailLabel}>From:</Text>
                <Text style={styles.eventDetailValue}>
                  {eventDetails.from_date} {eventDetails.from_time}
                </Text>
                <Text style={styles.eventDetailLabel}>To:</Text>
                <Text style={styles.eventDetailValue}>
                  {eventDetails.to_date} {eventDetails.to_time}
                </Text>
                <Text style={styles.eventDetailLabel}>Payment Status:</Text>
                <Text style={styles.eventDetailValue}>
                  {eventDetails.payment_status}
                </Text>
                <Text style={styles.eventDetailLabel}>People:</Text>
                <Text style={styles.eventDetailValue}>
                  {eventDetails.number_of_people}
                </Text>
                <Text style={styles.eventDetailLabel}>Amount Received:</Text>
                <Text style={styles.eventDetailValue}>
                  ₹{eventDetails.amount_received}
                </Text>
                <Text style={styles.eventDetailLabel}>Amount Pending:</Text>
                <Text style={styles.eventDetailValue}>
                  ₹{eventDetails.amount_pending}
                </Text>
              </View>
            </View>
          )}
          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsSectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() =>
                  navigation.navigate('EditBooking', {
                    isEdit: false,
                  })
                }
              >
                <Ionicons name="add-circle" size={32} color={colors.primary} />
                <Text style={styles.quickActionText} numberOfLines={2}>
                  Add Event
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Venue')}
              >
                <Ionicons name="business" size={32} color={colors.success} />
                <Text style={styles.quickActionText} numberOfLines={2}>
                  Venue Management
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('Events')}
              >
                <Ionicons name="calendar" size={32} color={colors.warning} />
                <Text style={styles.quickActionText} numberOfLines={2}>
                  View Events
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => onRefresh()}
              >
                <Ionicons name="refresh" size={32} color={colors.info} />
                <Text style={styles.quickActionText} numberOfLines={2}>
                  Refresh Data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Device-Adaptive Bottom Navigation */}
        <View
          style={[
            styles.tabBar,
            isTablet && styles.tabBarTablet,
            isSmallDevice && styles.tabBarSmall,
            {
              paddingBottom: Math.max(
                insets.bottom + (isSmallDevice ? 8 : 12),
                isSmallDevice ? 16 : 20, // Minimum bottom padding
              ),
            },
          ]}
        >
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tabItem,
                isTablet && styles.tabItemTablet,
                isSmallDevice && styles.tabItemSmall,
                selectedTab === index && styles.activeTab,
              ]}
              onPress={() => {
                setSelectedTab(index);

                // Navigation logic with haptic feedback
                if (Platform.OS === 'ios') {
                  // Add haptic feedback for iOS
                  // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }

                switch (index) {
                  case 0:
                    // Dashboard - stay on current screen
                    break;
                  case 1:
                    navigation.navigate('Events');
                    break;
                  case 2:
                    navigation.navigate('Profile');
                    break;
                  case 3:
                    navigation.navigate('Venue');
                    break;
                  case 4:
                    Alert.alert(
                      'Coming Soon',
                      'Settings feature will be available soon.',
                    );
                    break;
                  default:
                    break;
                }
              }}
            >
              <Ionicons
                name={selectedTab === index ? tab.activeIcon : tab.icon}
                size={isTablet ? 28 : isSmallDevice ? 20 : 24}
                color={selectedTab === index ? colors.primary : colors.gray}
              />
              {(!isSmallDevice || isTablet) && (
                <Text
                  style={[
                    styles.tabLabel,
                    isTablet && styles.tabLabelTablet,
                    selectedTab === index && styles.activeTabLabel,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Booking Stats Styles
  bookingStatsSection: {
    marginBottom: 20,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 8,
    flex: 1,
  },
  bookingStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookingStatCard: {
    width: '48%',
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  statsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.gray,
  },
  statsEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statsEmptyText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  statsEmptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  bookingStatLabel: {
    fontSize: 12,
    color: colors.secondary,
    marginVertical: 6,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },

  bookingStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },

  // Event details styles
  eventDetailsSection: {
    marginBottom: 20,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  eventDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eventDetailLabel: {
    width: '48%',
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventDetailValue: {
    width: '48%',
    fontSize: 13,
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'right',
  },

  // Adaptive Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 16 : 20,
    paddingVertical: isSmallDevice ? 12 : 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60, // Ensure minimum header height
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTablet: {
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: colors.gray,
    fontWeight: '500',
  },
  welcomeTextTablet: {
    fontSize: 18,
  },
  venueNameText: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 2,
  },
  venueNameTextTablet: {
    fontSize: 24,
  },
  headerButton: {
    padding: isSmallDevice ? 8 : 10,
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },
  headerButtonTablet: {
    padding: 12,
    marginLeft: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeBackText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  welcomeSubText: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
  profileButton: {
    marginLeft: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  profileInitial: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitialText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  homeContent: {
    flex: 1,
    paddingTop: 8, // Add some top padding for better spacing
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
    minHeight: 32, // Ensure consistent height for text
    maxWidth: '100%', // Ensure text doesn't overflow
  },

  quickActionsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 16,
  },

  // Venue Card Styles
  venueCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginTop: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 8,
    flex: 1,
  },
  venueInfo: {
    gap: 10,
  },
  venueInfoText: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  venueInfoLabel: {
    fontWeight: '600',
    color: colors.secondary,
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
    minHeight: 32, // Ensure consistent height for text
    maxWidth: '100%', // Ensure text doesn't overflow
  },

  quickActionsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 16,
  },

  // Device-Adaptive Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: isSmallDevice ? 8 : 12,
    paddingHorizontal: isSmallDevice ? 8 : 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarTablet: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  tabBarSmall: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 6 : 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    minHeight: isSmallDevice ? 36 : 44, // Ensure touch target meets accessibility guidelines
  },
  tabItemTablet: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  tabItemSmall: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    minHeight: 32,
  },
  activeTab: {
    backgroundColor: colors.lightGray,
  },
  tabLabel: {
    fontSize: isSmallDevice ? 10 : 12,
    color: colors.gray,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabLabelTablet: {
    fontSize: 14,
    marginTop: 4,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;
