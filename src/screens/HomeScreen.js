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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

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
    { icon: 'home', label: 'Home' },
    { icon: 'calendar', label: 'Calendar' },
    { icon: 'notifications', label: 'Notifications' },
    { icon: 'settings', label: 'Settings' },
  ];

  const bookings = [
    {
      id: 1,
      venue: 'The Grand Hall',
      date: '23 June 2025',
      status: 'ACTIVE',
      amount: '₹50,000',
    },
    {
      id: 2,
      venue: 'Urban Luxe Lounge',
      date: '22 June 2025',
      status: 'PENDING',
      amount: '₹35,000',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <View style={styles.homeHeader}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeBackText}>
              Welcome back, {user?.venue_name || 'User'}!
            </Text>
            <Text style={styles.welcomeSubText}>
              Here's an overview of your relevant current booking status and
              performance.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.profileButton,
              isLoggingOut && styles.disabledButton,
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.profileInitial}>
              {isLoggingOut ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.profileInitialText}>
                  {user?.venue_name
                    ? user.venue_name.charAt(0).toUpperCase()
                    : 'U'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.homeContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Bookings This Month</Text>
              <Text style={styles.statNumber}>84</Text>
              <View style={styles.statChange}>
                <Ionicons name="trending-up" size={16} color={colors.success} />
                <Text style={styles.statChangeText}>
                  12% increase from last month
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Fully Paid</Text>
              <Text style={styles.statNumber}>50</Text>
              <View style={styles.statChange}>
                <Text style={styles.statChangeText}>
                  59% bookings are fully paid
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Pending Due</Text>
              <Text style={styles.statNumber}>10</Text>
              <View style={styles.statChange}>
                <Text style={styles.statChangeText}>due for the payment</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Available Event Hall</Text>
              <Text style={styles.statNumber}>12</Text>
              <View style={styles.statChange}>
                <Text style={styles.statChangeText}>
                  open slots for the month
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bookingsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Bookings</Text>
              <View style={styles.viewOptions}>
                <TouchableOpacity style={styles.viewButton}>
                  <Ionicons name="grid-outline" size={20} color={colors.gray} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewButton}>
                  <Ionicons name="list-outline" size={20} color={colors.gray} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewButton}>
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {bookings.map(booking => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('EditBooking')}
              >
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingVenue}>{booking.venue}</Text>
                  <Text style={styles.bookingDate}>{booking.date}</Text>
                  <View style={styles.bookingFooter}>
                    <View
                      style={[
                        styles.statusBadge,
                        booking.status === 'ACTIVE'
                          ? styles.activeBadge
                          : styles.pendingBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          booking.status === 'ACTIVE'
                            ? styles.activeText
                            : styles.pendingText,
                        ]}
                      >
                        {booking.status}
                      </Text>
                    </View>
                    <Text style={styles.bookingAmount}>{booking.amount}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tabItem,
                selectedTab === index && styles.activeTab,
              ]}
              onPress={() => setSelectedTab(index)}
            >
              <Ionicons
                name={tab.icon}
                size={24}
                color={selectedTab === index ? colors.primary : colors.gray}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 60) / 2,
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
  statTitle: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 8,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChangeText: {
    fontSize: 11,
    color: colors.gray,
    marginLeft: 4,
  },
  bookingsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  viewOptions: {
    flexDirection: 'row',
  },
  viewButton: {
    padding: 8,
    marginLeft: 8,
  },
  bookingCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingVenue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 12,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#E6F7FF',
  },
  pendingBadge: {
    backgroundColor: '#FFF7E6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#1890FF',
  },
  pendingText: {
    color: '#FA8C16',
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  editButton: {
    padding: 8,
    marginLeft: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Active tab styling handled by icon color
  },
});

export default HomeScreen;
