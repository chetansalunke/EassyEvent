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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import { addEvent, getEventDetails } from '../utils/authUtils';

const EventsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const { token } = useAuth();

  // Sample events data (in real app, this would come from API)
  const sampleEvents = [
    {
      id: 1,
      name: "Anil's Wedding",
      from_date: '2025-07-25',
      from_time: '14:30:00',
      to_date: '2025-07-27',
      to_time: '10:00:00',
      payment_status: 'fully_paid',
      number_of_people: 150,
      amount_received: 5000,
      amount_pending: 0,
    },
    {
      id: 2,
      name: 'Corporate Meeting',
      from_date: '2025-08-01',
      from_time: '09:00:00',
      to_date: '2025-08-01',
      to_time: '17:00:00',
      payment_status: 'partially_paid',
      number_of_people: 50,
      amount_received: 2000,
      amount_pending: 1000,
    },
  ];

  useEffect(() => {
    setEvents(sampleEvents);
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    // In real app, fetch events from API
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'fully_paid':
        return colors.success;
      case 'partially_paid':
        return colors.warning;
      case 'pending':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'fully_paid':
        return 'Fully Paid';
      case 'partially_paid':
        return 'Partially Paid';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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
        {events.length === 0 ? (
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
          events.map(event => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EditBooking', { event })}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventName}>{event.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: `${getStatusColor(
                        event.payment_status,
                      )}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(event.payment_status) },
                    ]}
                  >
                    {getStatusText(event.payment_status)}
                  </Text>
                </View>
              </View>

              <View style={styles.eventDetails}>
                <View style={styles.eventRow}>
                  <Ionicons name="calendar" size={16} color={colors.gray} />
                  <Text style={styles.eventDetailText}>
                    {formatDate(event.from_date)} - {formatDate(event.to_date)}
                  </Text>
                </View>

                <View style={styles.eventRow}>
                  <Ionicons name="time" size={16} color={colors.gray} />
                  <Text style={styles.eventDetailText}>
                    {event.from_time} - {event.to_time}
                  </Text>
                </View>

                <View style={styles.eventRow}>
                  <Ionicons name="people" size={16} color={colors.gray} />
                  <Text style={styles.eventDetailText}>
                    {event.number_of_people} guests
                  </Text>
                </View>
              </View>

              <View style={styles.eventFooter}>
                <View style={styles.amountInfo}>
                  <Text style={styles.amountReceived}>
                    ₹{event.amount_received?.toLocaleString()} received
                  </Text>
                  {event.amount_pending > 0 && (
                    <Text style={styles.amountPending}>
                      ₹{event.amount_pending?.toLocaleString()} pending
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.gray}
                />
              </View>
            </TouchableOpacity>
          ))
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventRow: {
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
  amountInfo: {
    flex: 1,
  },
  amountReceived: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  amountPending: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 2,
  },
});

export default EventsScreen;
