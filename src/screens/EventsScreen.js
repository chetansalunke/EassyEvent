import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import { deleteEvent } from '../utils/authUtils';
import axios from 'axios';
import { Calendar } from 'react-native-calendars';
import { PAYMENT_STATUS_OPTIONS } from '../services/eventsApi';

const EventsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' or 'list'
  const [filters, setFilters] = useState({
    search: '',
    fromDate: '2025-01-01',
    toDate: '2025-12-31',
    limit: 50,
  });
  const { token } = useAuth();

  // Debug token state
  useEffect(() => {
    console.log('EventsScreen - Token state:', {
      tokenExists: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'No token',
    });
  }, [token]);

  // Load events on component mount
  useEffect(() => {
    fetchEventsFromApi();
  }, [fetchEventsFromApi]);

  // Reload events when filters change
  useEffect(() => {
    if (token) {
      const timeoutId = setTimeout(() => {
        fetchEventsFromApi();
      }, 300); // Debounce API calls
      return () => clearTimeout(timeoutId);
    }
  }, [filters, token, fetchEventsFromApi]);

  // Focus listener to reload events when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEventsFromApi();
    });
    return unsubscribe;
  }, [navigation, fetchEventsFromApi]);

  // Fetch events from the provided API endpoint
  const fetchEventsFromApi = useCallback(async () => {
    if (!token) {
      console.log('No token available, skipping API call');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: filters.search,
        ordering: 'from_date',
        limit: filters.limit.toString(),
        offset: '0',
        from_date__gte: filters.fromDate,
        from_date__lte: filters.toDate,
      });

      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Token length:', token ? token.length : 0);
      console.log(
        'Fetching events with URL:',
        `https://easeevent.echogen.online/events/list/?${queryParams}`,
      );

      const response = await axios.get(
        `https://easeevent.echogen.online/events/list/?${queryParams}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('API Response:', response.data);

      if (response.data && response.data.results) {
        setEvents(response.data.results);
        // Mark booking dates on calendar
        const marks = {};
        const dateEventMap = {};

        response.data.results.forEach(event => {
          let current = new Date(event.from_date);
          const end = new Date(event.to_date);

          while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];

            // Track events per date
            if (!dateEventMap[dateStr]) {
              dateEventMap[dateStr] = [];
            }
            dateEventMap[dateStr].push(event);

            // Mark date on calendar
            marks[dateStr] = {
              marked: true,
              dotColor: '#2196F3',
              customStyles: {
                container: {
                  backgroundColor: '#e3f2fd',
                  borderRadius: 8,
                },
                text: {
                  color: '#1565c0',
                  fontWeight: 'bold',
                },
              },
            };
            current.setDate(current.getDate() + 1);
          }
        });

        setMarkedDates(marks);
        // Store the date-event mapping for quick lookup
        setEvents(response.data.results);
      } else {
        setEvents([]);
        setMarkedDates({});
      }
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to login screen or clear auth state
                navigation.navigate('Login');
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to load events: ' +
            (error.response?.data?.detail || error.message),
        );
      }
      setEvents([]);
      setMarkedDates({});
    } finally {
      setIsLoading(false);
    }
  }, [token, filters, navigation]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchEventsFromApi();
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
                fetchEventsFromApi(); // Reload events
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

  // Calendar date select handler
  const handleDayPress = day => {
    setSelectedDate(day.dateString);
    // Find all events for this date
    const eventsForDate = events.filter(event => {
      const start = new Date(event.from_date);
      const end = new Date(event.to_date);
      const selected = new Date(day.dateString);
      return selected >= start && selected <= end;
    });

    setSelectedDateEvents(eventsForDate);
    setSelectedEvent(eventsForDate.length > 0 ? eventsForDate[0] : null);
  };

  const handleEventPress = event => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleViewToggle = () => {
    setCurrentView(currentView === 'calendar' ? 'list' : 'calendar');
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchEventsFromApi();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      fromDate: '2025-01-01',
      toDate: '2025-12-31',
      limit: 50,
    });
    setShowFilters(false);
    fetchEventsFromApi();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Ionicons name="add" size={24} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Ionicons name="filter" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewToggleButton}
              onPress={handleViewToggle}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Ionicons
                name={currentView === 'calendar' ? 'list' : 'calendar'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="add" size={24} color={colors.background} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="filter" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewToggleButton}
            onPress={handleViewToggle}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons
              name={currentView === 'calendar' ? 'list' : 'calendar'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
        {currentView === 'calendar' ? (
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
            <Calendar
              style={{ borderRadius: 12, marginBottom: 16 }}
              markingType={'custom'}
              markedDates={{
                ...markedDates,
                ...(selectedDate
                  ? {
                      [selectedDate]: {
                        ...(markedDates[selectedDate] || {}),
                        selected: true,
                        selectedColor: colors.primary,
                      },
                    }
                  : {}),
              }}
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.background,
                textSectionTitleColor: colors.secondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.background,
                todayTextColor: colors.primary,
                dayTextColor: colors.secondary,
                textDisabledColor: colors.gray,
                dotColor: colors.primary,
                arrowColor: colors.primary,
                monthTextColor: colors.secondary,
                indicatorColor: colors.primary,
              }}
            />
            {/* Show event details for selected date */}
            {selectedDateEvents.length > 0 ? (
              <View>
                <Text style={styles.selectedDateTitle}>
                  Events on {formatDate(selectedDate)} (
                  {selectedDateEvents.length})
                </Text>
                {selectedDateEvents.map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => handleEventPress(event)}
                  >
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventName} numberOfLines={2}>
                        {event.name}
                      </Text>
                      <View style={styles.eventActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditEvent(event)}
                        >
                          <Ionicons
                            name="pencil"
                            size={20}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteEvent(event)}
                        >
                          <Ionicons
                            name="trash"
                            size={20}
                            color={colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.eventSummary}>
                      <Text style={styles.eventSummaryText}>
                        {formatDate(event.from_date)} -{' '}
                        {formatDate(event.to_date)}
                      </Text>
                      <Text style={styles.eventSummaryText}>
                        {event.number_of_people || 0} people • ₹
                        {(event.amount_received || 0).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.eventFooter}>
                      <View
                        style={[
                          styles.paymentStatusBadge,
                          {
                            backgroundColor:
                              getPaymentStatusColor(event.payment_status) +
                              '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.paymentStatusText,
                            {
                              color: getPaymentStatusColor(
                                event.payment_status,
                              ),
                            },
                          ]}
                        >
                          {getPaymentStatusLabel(event.payment_status)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="calendar-outline"
                  size={64}
                  color={colors.gray}
                />
                <Text style={styles.emptyTitle}>
                  {selectedDate ? 'No events on this date' : 'Select a date'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedDate
                    ? 'There are no bookings scheduled for this date'
                    : 'Tap a highlighted date to view event details'}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          // List View - Use FlatList directly without ScrollView wrapper
          <View style={styles.listView}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>All Events ({events.length})</Text>
            </View>
            <FlatList
              data={events}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              renderItem={({ item: event }) => (
                <TouchableOpacity
                  style={styles.eventListCard}
                  onPress={() => handleEventPress(event)}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventName} numberOfLines={1}>
                      {event.name}
                    </Text>
                    <View style={styles.eventActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditEvent(event)}
                      >
                        <Ionicons
                          name="pencil"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteEvent(event)}
                      >
                        <Ionicons name="trash" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.eventListDetails}>
                    <View style={styles.eventListRow}>
                      <Ionicons name="calendar" size={14} color={colors.gray} />
                      <Text style={styles.eventListText}>
                        {formatDate(event.from_date)} -{' '}
                        {formatDate(event.to_date)}
                      </Text>
                    </View>
                    <View style={styles.eventListRow}>
                      <Ionicons name="people" size={14} color={colors.gray} />
                      <Text style={styles.eventListText}>
                        {event.number_of_people || 0} people
                      </Text>
                    </View>
                    <View style={styles.eventListRow}>
                      <Ionicons name="cash" size={14} color={colors.gray} />
                      <Text style={styles.eventListText}>
                        ₹{(event.amount_received || 0).toLocaleString()}
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
                          {
                            color: getPaymentStatusColor(event.payment_status),
                          },
                        ]}
                      >
                        {getPaymentStatusLabel(event.payment_status)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.gray}
                    />
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Ionicons name="list-outline" size={64} color={colors.gray} />
                  <Text style={styles.emptyTitle}>No events found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your filters or create a new event
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Event Detail Modal */}
        <Modal
          visible={showEventDetail}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEventDetail(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEventDetail(false)}>
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEventDetail(false);
                  if (selectedEvent) {
                    handleEditEvent(selectedEvent);
                  }
                }}
              >
                <Text style={styles.modalApplyText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailEventName}>
                    {selectedEvent.name}
                  </Text>

                  <View style={styles.detailRow}>
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Date & Time</Text>
                      <Text style={styles.detailValue}>
                        From: {formatDate(selectedEvent.from_date)} at{' '}
                        {formatTime(selectedEvent.from_time)}
                      </Text>
                      <Text style={styles.detailValue}>
                        To: {formatDate(selectedEvent.to_date)} at{' '}
                        {formatTime(selectedEvent.to_time)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="people" size={20} color={colors.primary} />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Number of People</Text>
                      <Text style={styles.detailValue}>
                        {selectedEvent.number_of_people || 0} guests
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={20} color={colors.primary} />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>
                        Payment Information
                      </Text>
                      <Text style={styles.detailValue}>
                        Amount Received: ₹
                        {(selectedEvent.amount_received || 0).toLocaleString()}
                      </Text>
                      {selectedEvent.amount_pending > 0 && (
                        <Text
                          style={[
                            styles.detailValue,
                            { color: colors.warning },
                          ]}
                        >
                          Amount Pending: ₹
                          {selectedEvent.amount_pending.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={20} color={colors.primary} />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Payment Status</Text>
                      <View
                        style={[
                          styles.paymentStatusBadge,
                          styles.detailStatusBadge,
                          {
                            backgroundColor:
                              getPaymentStatusColor(
                                selectedEvent.payment_status,
                              ) + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.paymentStatusText,
                            styles.detailStatusText,
                            {
                              color: getPaymentStatusColor(
                                selectedEvent.payment_status,
                              ),
                            },
                          ]}
                        >
                          {getPaymentStatusLabel(selectedEvent.payment_status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={20} color={colors.primary} />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Created</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedEvent.created_at).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </Text>
                    </View>
                  </View>

                  {selectedEvent.description && (
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="document-text"
                        size={20}
                        color={colors.primary}
                      />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Description</Text>
                        <Text style={styles.detailValue}>
                          {selectedEvent.description}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.editButton]}
                    onPress={() => {
                      setShowEventDetail(false);
                      handleEditEvent(selectedEvent);
                    }}
                  >
                    <Ionicons
                      name="pencil"
                      size={20}
                      color={colors.background}
                    />
                    <Text style={styles.detailActionText}>Edit Event</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.deleteButton]}
                    onPress={() => {
                      setShowEventDetail(false);
                      handleDeleteEvent(selectedEvent);
                    }}
                  >
                    <Ionicons
                      name="trash"
                      size={20}
                      color={colors.background}
                    />
                    <Text style={styles.detailActionText}>Delete Event</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        {/* Filter Modal */}
        <Modal
          visible={showFilters}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFilters(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Filter Events</Text>
              <TouchableOpacity onPress={applyFilters}>
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Search</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Search events by name..."
                  value={filters.search}
                  onChangeText={text =>
                    setFilters({ ...filters, search: text })
                  }
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>From Date</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="YYYY-MM-DD"
                  value={filters.fromDate}
                  onChangeText={text =>
                    setFilters({ ...filters, fromDate: text })
                  }
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>To Date</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="YYYY-MM-DD"
                  value={filters.toDate}
                  onChangeText={text =>
                    setFilters({ ...filters, toDate: text })
                  }
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Limit</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Number of events to fetch"
                  value={filters.limit.toString()}
                  keyboardType="numeric"
                  onChangeText={text =>
                    setFilters({ ...filters, limit: parseInt(text) || 50 })
                  }
                />
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
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
    padding: 12,
    borderRadius: 25,
    backgroundColor: colors.lightGray,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
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
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
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
    fontWeight: 'bold',
    color: colors.secondary,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.gray,
  },
  modalApplyText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.secondary,
    backgroundColor: colors.background,
  },
  resetButton: {
    backgroundColor: colors.lightGray,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '600',
  },
  viewToggleButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  listView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listHeader: {
    paddingBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  eventListCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventListDetails: {
    marginTop: 8,
    marginBottom: 8,
  },
  eventListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventListText: {
    fontSize: 13,
    color: colors.secondary,
    marginLeft: 6,
  },
  eventSummary: {
    marginTop: 8,
    marginBottom: 8,
  },
  eventSummaryText: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 2,
  },
  detailSection: {
    paddingBottom: 20,
  },
  detailEventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.secondary,
    lineHeight: 20,
  },
  detailStatusBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  detailStatusText: {
    fontSize: 14,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 20,
  },
  detailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  detailActionText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventsScreen;
