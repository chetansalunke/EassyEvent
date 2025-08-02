import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, deleteEvent } from '../utils/authUtils';
import { PAYMENT_STATUS_OPTIONS } from '../services/eventsApi';

const EventsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const { token } = useAuth();

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Focus listener to reload events when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadEvents();
    });

    return unsubscribe;
  }, [navigation]);

  const loadEvents = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const result = await getAllEvents(token);

      if (result.success) {
        setEvents(result.data || []);
      } else {
        Alert.alert('Error', result.error || 'Failed to load events');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  const handleEditEvent = event => {
    navigation.navigate('EditBooking', {
      isEdit: true,
      eventId: event.id,
    });
  };

  const handleDeleteEvent = event => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteEvent(token, event.id);
              if (result.success) {
                Alert.alert('Success', 'Event deleted successfully');
                loadEvents(); // Reload events
              } else {
                Alert.alert('Error', result.error || 'Failed to delete event');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ],
    );
  };

  const getPaymentStatusLabel = status => {
    const option = PAYMENT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getPaymentStatusColor = status => {
    switch (status) {
      case 'fully_paid':
        return colors.success;
      case 'partially_paid':
        return colors.warning;
      case 'pending':
        return colors.info;
      case 'overdue':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = timeString => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Remove seconds
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Events</Text>
            <Text style={styles.headerSubtitle}>
              Manage your venue bookings
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('EditBooking')}
          >
            <Ionicons name="add" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Events</Text>
          <Text style={styles.headerSubtitle}>Manage your venue bookings</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('EditBooking')}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start by adding your first event booking
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('EditBooking')}
            >
              <Text style={styles.emptyButtonText}>Add Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item: event }) => (
              <TouchableOpacity
                style={styles.eventCard}
                onPress={() =>
                  navigation.navigate('EditBooking', {
                    isEdit: true,
                    eventId: event.id,
                    event,
                  })
                }
              >
                <View style={styles.eventHeader}>
                  <Text style={styles.eventName} numberOfLines={2}>
                    {event.name}
                  </Text>
                  <View style={styles.eventActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={e => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                    >
                      <Ionicons
                        name="pencil"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={e => {
                        e.stopPropagation();
                        handleDeleteEvent(event);
                      }}
                    >
                      <Ionicons name="trash" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.eventDetails}>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="calendar" size={16} color={colors.gray} />
                    <Text style={styles.eventDetailText}>
                      {formatDate(event.from_date)} at{' '}
                      {formatTime(event.from_time)}
                    </Text>
                  </View>

                  <View style={styles.eventDetailRow}>
                    <Ionicons name="time" size={16} color={colors.gray} />
                    <Text style={styles.eventDetailText}>
                      Until {formatDate(event.to_date)} at{' '}
                      {formatTime(event.to_time)}
                    </Text>
                  </View>

                  <View style={styles.eventDetailRow}>
                    <Ionicons name="people" size={16} color={colors.gray} />
                    <Text style={styles.eventDetailText}>
                      {event.number_of_people || 0} people
                    </Text>
                  </View>

                  <View style={styles.eventDetailRow}>
                    <Ionicons name="cash" size={16} color={colors.gray} />
                    <Text style={styles.eventDetailText}>
                      ₹{(event.amount_received || 0).toLocaleString()} received
                      {event.amount_pending > 0 &&
                        `, ₹${event.amount_pending.toLocaleString()} pending`}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventFooter}>
                  <View
                    style={[
                      styles.paymentStatusBadge,
                      {
                        backgroundColor:
                          getPaymentStatusColor(event.payment_status) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.paymentStatusText,
                        { color: getPaymentStatusColor(event.payment_status) },
                      ]}
                    >
                      {getPaymentStatusLabel(event.payment_status)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    flex: 1,
    marginRight: 12,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.secondary,
    marginLeft: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EventsScreen;
