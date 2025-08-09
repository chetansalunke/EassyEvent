import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import { addEvent, updateEvent, getEventDetails } from '../utils/authUtils';
import {
  validateEventData,
  formatEventData,
  PAYMENT_STATUS_OPTIONS,
} from '../services/eventsApi';
import { getScreenSafeArea } from '../utils/safeArea';

const EditBookingScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { eventId, isEdit = false } = route.params || {};

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    from_date: '',
    from_time: '09:00:00', // Default start time 9 AM
    to_date: '',
    to_time: '17:00:00', // Default end time 5 PM
    payment_status: 'pending',
    number_of_people: '',
    amount_received: '',
    amount_pending: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] =
    useState(false);
  const [currentDateField, setCurrentDateField] = useState('');
  const [currentTimeField, setCurrentTimeField] = useState('');
  const [datePickerType, setDatePickerType] = useState(''); // 'from_date' or 'to_date'
  const [errors, setErrors] = useState({});

  // Time options for selection
  const timeOptions = [
    { label: '12:00 AM', value: '00:00:00' },
    { label: '1:00 AM', value: '01:00:00' },
    { label: '2:00 AM', value: '02:00:00' },
    { label: '3:00 AM', value: '03:00:00' },
    { label: '4:00 AM', value: '04:00:00' },
    { label: '5:00 AM', value: '05:00:00' },
    { label: '6:00 AM', value: '06:00:00' },
    { label: '7:00 AM', value: '07:00:00' },
    { label: '8:00 AM', value: '08:00:00' },
    { label: '9:00 AM', value: '09:00:00' },
    { label: '10:00 AM', value: '10:00:00' },
    { label: '11:00 AM', value: '11:00:00' },
    { label: '12:00 PM', value: '12:00:00' },
    { label: '1:00 PM', value: '13:00:00' },
    { label: '2:00 PM', value: '14:00:00' },
    { label: '3:00 PM', value: '15:00:00' },
    { label: '4:00 PM', value: '16:00:00' },
    { label: '5:00 PM', value: '17:00:00' },
    { label: '6:00 PM', value: '18:00:00' },
    { label: '7:00 PM', value: '19:00:00' },
    { label: '8:00 PM', value: '20:00:00' },
    { label: '9:00 PM', value: '21:00:00' },
    { label: '10:00 PM', value: '22:00:00' },
    { label: '11:00 PM', value: '23:00:00' },
  ];

  // Load event data if editing
  useEffect(() => {
    if (isEdit && eventId && token) {
      loadEventData();
    }
  }, [isEdit, eventId, token]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBackPress();
        return true; // Prevent default behavior
      },
    );

    return () => backHandler.remove();
  }, []);

  // Debug effect to monitor form data changes
  useEffect(() => {
    // Form data monitoring for debugging if needed
  }, [formData]);

  const loadEventData = async () => {
    setIsLoading(true);
    try {
      const result = await getEventDetails(token, eventId);
      if (result.success) {
        const event = result.data;
        setFormData({
          name: event.name || '',
          from_date: event.from_date || '',
          from_time: event.from_time || '',
          to_date: event.to_date || '',
          to_time: event.to_time || '',
          payment_status: event.payment_status || 'pending',
          number_of_people: event.number_of_people?.toString() || '',
          amount_received: event.amount_received?.toString() || '',
          amount_pending: event.amount_pending?.toString() || '',
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to load event data');
        handleBackPress();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load event data');
      handleBackPress();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If can't go back, navigate to Events screen or Home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Events' }],
      });
    }
  };

  const openDatePicker = field => {
    setCurrentDateField(field);
    setDatePickerType(field);
    setShowDatePicker(true);
  };

  const openTimePicker = field => {
    setCurrentTimeField(field);
    setShowTimePicker(true);
  };

  const handleTimeSelect = time => {
    setFormData(prev => ({ ...prev, [currentTimeField]: time.value }));

    // Clear error if it exists
    if (errors[currentTimeField]) {
      setErrors(prev => ({ ...prev, [currentTimeField]: null }));
    }

    setShowTimePicker(false);

    // Validate date order after a short delay to ensure state is updated
    setTimeout(() => {
      validateDateOrder(currentTimeField, time.value);
    }, 100);
  };

  const handleDateSelect = day => {
    const selectedDate = day.dateString;
    setFormData(prev => ({ ...prev, [currentDateField]: selectedDate }));

    // Clear error if it exists
    if (errors[currentDateField]) {
      setErrors(prev => ({ ...prev, [currentDateField]: null }));
    }

    setShowDatePicker(false);

    // Validate date order after a short delay to ensure state is updated
    setTimeout(() => {
      validateDateOrder(currentDateField, selectedDate);
    }, 100);
  };

  const validateDateOrder = (changedField, changedValue) => {
    const { from_date, to_date, from_time, to_time } = formData;
    let newFromDate = from_date;
    let newToDate = to_date;
    let newFromTime = from_time;
    let newToTime = to_time;

    // Update the changed value
    if (changedField === 'from_date') newFromDate = changedValue;
    if (changedField === 'to_date') newToDate = changedValue;
    if (changedField === 'from_time') newFromTime = changedValue;
    if (changedField === 'to_time') newToTime = changedValue;

    // Check if we have both dates
    if (newFromDate && newToDate) {
      const fromDateTime = new Date(
        `${newFromDate}T${newFromTime || '00:00:00'}`,
      );
      const toDateTime = new Date(`${newToDate}T${newToTime || '23:59:59'}`);

      if (fromDateTime >= toDateTime) {
        setErrors(prev => ({
          ...prev,
          date_validation:
            'End date and time must be after start date and time',
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.date_validation;
          return newErrors;
        });
      }
    }
  };

  const formatDisplayDate = dateString => {
    if (!dateString || dateString.trim() === '') return 'Select Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Select Date';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Select Date';
    }
  };

  const formatDisplayTime = timeString => {
    if (!timeString || timeString.trim() === '') return 'Select Time';
    const timeOption = timeOptions.find(option => option.value === timeString);
    return timeOption ? timeOption.label : 'Select Time';
  };

  // Payment status selection handler
  const selectPaymentStatus = status => {
    handleInputChange('payment_status', status.value);
    setShowPaymentStatusDropdown(false);
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
  }) => (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity
        style={[styles.input, styles.dropdown, error && styles.inputError]}
        onPress={onToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
        <View style={styles.dropdownList}>
          <ScrollView
            style={styles.dropdownScrollView}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {data.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dropdownItem,
                  index === data.length - 1 && styles.dropdownItemLast,
                ]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const handleSave = async () => {
    // Validate form data
    const validation = validateEventData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields correctly.',
      );
      return;
    }

    setIsSaving(true);
    try {
      const eventData = formatEventData(formData);
      let result;

      if (isEdit && eventId) {
        result = await updateEvent(token, eventId, eventData);
      } else {
        result = await addEvent(token, eventData);
      }

      if (result.success) {
        Alert.alert(
          'Success',
          `Event ${isEdit ? 'updated' : 'created'} successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                handleBackPress();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Error',
          result.error || `Failed to ${isEdit ? 'update' : 'create'} event`,
        );
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} event`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, getScreenSafeArea(insets)]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading event data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getScreenSafeArea(insets)]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Event' : 'Add Event'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Event Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={value => handleInputChange('name', value)}
            placeholder="Enter event name"
            placeholderTextColor={colors.gray}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Date and Time Section */}
        <Text style={styles.sectionTitle}>Event Schedule *</Text>

        {/* Date validation error */}
        {errors.date_validation && (
          <View style={styles.validationError}>
            <Ionicons name="warning" size={16} color={colors.error} />
            <Text style={styles.validationErrorText}>
              {errors.date_validation}
            </Text>
          </View>
        )}

        {/* Start Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                errors.from_date && styles.inputError,
              ]}
              onPress={() => openDatePicker('from_date')}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.dateTimeText,
                  !formData.from_date && styles.placeholderText,
                ]}
              >
                {formatDisplayDate(formData.from_date)}
              </Text>
            </TouchableOpacity>
            {errors.from_date && (
              <Text style={styles.errorText}>{errors.from_date}</Text>
            )}
          </View>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                errors.from_time && styles.inputError,
              ]}
              onPress={() => openTimePicker('from_time')}
            >
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.dateTimeText,
                  !formData.from_time && styles.placeholderText,
                ]}
              >
                {formatDisplayTime(formData.from_time)}
              </Text>
            </TouchableOpacity>
            {errors.from_time && (
              <Text style={styles.errorText}>{errors.from_time}</Text>
            )}
          </View>
        </View>

        {/* End Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.inputLabel}>End Date</Text>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                errors.to_date && styles.inputError,
              ]}
              onPress={() => openDatePicker('to_date')}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.dateTimeText,
                  !formData.to_date && styles.placeholderText,
                ]}
              >
                {formatDisplayDate(formData.to_date)}
              </Text>
            </TouchableOpacity>
            {errors.to_date && (
              <Text style={styles.errorText}>{errors.to_date}</Text>
            )}
          </View>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.inputLabel}>End Time</Text>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                errors.to_time && styles.inputError,
              ]}
              onPress={() => openTimePicker('to_time')}
            >
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.dateTimeText,
                  !formData.to_time && styles.placeholderText,
                ]}
              >
                {formatDisplayTime(formData.to_time)}
              </Text>
            </TouchableOpacity>
            {errors.to_time && (
              <Text style={styles.errorText}>{errors.to_time}</Text>
            )}
          </View>
        </View>

        {/* Event Details */}
        <Text style={styles.sectionTitle}>Event Details</Text>

        {/* Number of People */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Number of People</Text>
          <TextInput
            style={[styles.input, errors.number_of_people && styles.inputError]}
            value={formData.number_of_people}
            onChangeText={value => handleInputChange('number_of_people', value)}
            placeholder="Enter number of people"
            placeholderTextColor={colors.gray}
            keyboardType="numeric"
          />
          {errors.number_of_people && (
            <Text style={styles.errorText}>{errors.number_of_people}</Text>
          )}
        </View>

        {/* Payment Status */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Payment Status</Text>
          <SimpleDropdown
            value={
              PAYMENT_STATUS_OPTIONS.find(
                option => option.value === formData.payment_status,
              )?.label
            }
            placeholder="Select Status"
            data={PAYMENT_STATUS_OPTIONS}
            onSelect={selectPaymentStatus}
            isOpen={showPaymentStatusDropdown}
            onToggle={() =>
              setShowPaymentStatusDropdown(!showPaymentStatusDropdown)
            }
          />
        </View>

        {/* Payment Details */}
        <Text style={styles.sectionTitle}>Payment Details</Text>

        {/* Amount Received */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount Received (₹)</Text>
          <View
            style={[
              styles.amountContainer,
              errors.amount_received && styles.inputError,
            ]}
          >
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={formData.amount_received}
              onChangeText={value =>
                handleInputChange('amount_received', value)
              }
              placeholder="0"
              placeholderTextColor={colors.gray}
              keyboardType="numeric"
            />
          </View>
          {errors.amount_received && (
            <Text style={styles.errorText}>{errors.amount_received}</Text>
          )}
        </View>

        {/* Amount Pending */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount Pending (₹)</Text>
          <View
            style={[
              styles.amountContainer,
              errors.amount_pending && styles.inputError,
            ]}
          >
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={formData.amount_pending}
              onChangeText={value => handleInputChange('amount_pending', value)}
              placeholder="0"
              placeholderTextColor={colors.gray}
              keyboardType="numeric"
            />
          </View>
          {errors.amount_pending && (
            <Text style={styles.errorText}>{errors.amount_pending}</Text>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEdit ? 'Update Event' : 'Create Event'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {datePickerType === 'from_date' ? 'Start' : 'End'} Date
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <Calendar
              key={`date-picker-${datePickerType}-${showDatePicker}`}
              onDayPress={handleDateSelect}
              markingType={'simple'}
              markedDates={{
                [formData[datePickerType]]: {
                  selected: true,
                  selectedColor: colors.primary,
                  selectedTextColor: colors.background,
                },
              }}
              minimumDate={new Date().toISOString().split('T')[0]}
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
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '400',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowTimePicker(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {currentTimeField === 'from_time' ? 'Start' : 'End'} Time
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerGrid}>
              {timeOptions.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeOption,
                    formData[currentTimeField] === time.value &&
                      styles.selectedTimeOption,
                  ]}
                  onPress={() => handleTimeSelect(time)}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      formData[currentTimeField] === time.value &&
                        styles.selectedTimeOptionText,
                    ]}
                  >
                    {time.label}
                  </Text>
                  {formData[currentTimeField] === time.value && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.secondary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 24,
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateTimeContainer: {
    flex: 0.48,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.secondary,
    marginLeft: 8,
    flex: 1,
  },
  placeholderText: {
    color: colors.gray,
  },
  validationError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  validationErrorText: {
    fontSize: 14,
    color: colors.error,
    marginLeft: 8,
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.secondary,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    paddingLeft: 16,
    paddingRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    color: colors.secondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.secondary,
  },
  pickerModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    flex: 1,
    textAlign: 'center',
  },
  pickerDoneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  pickerCancelButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray,
  },
  // SimpleDropdown styles
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
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
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.secondary,
  },
  inputError: {
    borderColor: colors.error,
  },
  dateTimePicker: {
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timePickerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectedTimeOption: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  timeOptionText: {
    fontSize: 14,
    color: colors.secondary,
    flex: 1,
  },
  selectedTimeOptionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default EditBookingScreen;
