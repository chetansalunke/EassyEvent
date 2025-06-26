import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

const DateTimePickerScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { icon: 'home', label: 'Home' },
    { icon: 'calendar', label: 'Calendar' },
    { icon: 'notifications', label: 'Notifications' },
    { icon: 'settings', label: 'Settings' },
  ];

  const timeSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
    '08:00 PM',
  ];

  const handleSaveDateTime = () => {
    Alert.alert('Success', 'Date and time updated successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.editHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Date & Time</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.editContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.datePickerContainer}>
          <Text style={styles.sectionTitleText}>Select Date</Text>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.calendarNavButton}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={colors.secondary}
                />
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>June 2025</Text>
              <TouchableOpacity style={styles.calendarNavButton}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.calendarDayHeader}>
                  {day}
                </Text>
              ))}

              {Array.from({ length: 30 }, (_, i) => i + 1).map(date => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.calendarDate,
                    date === 22 && styles.selectedDate,
                  ]}
                  onPress={() => setSelectedDate(new Date(2025, 5, date))}
                >
                  <Text
                    style={[
                      styles.calendarDateText,
                      date === 22 && styles.selectedDateText,
                    ]}
                  >
                    {date}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.timePickerContainer}>
          <Text style={styles.sectionTitleText}>Select Time</Text>
          <View style={styles.timeSlotGrid}>
            {timeSlots.map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.selectedTimeSlotText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.selectedDateTime}>
          <Text style={styles.selectedDateTimeTitle}>Selected Date & Time</Text>
          <Text style={styles.selectedDateTimeText}>
            22 June 2025 | {selectedTime}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveDateTime}
        >
          <Text style={styles.primaryButtonText}>Confirm Selection</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tabItem, selectedTab === index && styles.activeTab]}
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
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
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
  },
  headerSpacer: {
    width: 40,
  },
  editContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 16,
  },
  datePickerContainer: {
    marginBottom: 32,
  },
  calendarContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHeader: {
    width: (width - 92) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray,
    marginBottom: 12,
  },
  calendarDate: {
    width: (width - 92) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedDate: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  calendarDateText: {
    fontSize: 14,
    color: colors.secondary,
  },
  selectedDateText: {
    color: colors.background,
    fontWeight: '600',
  },
  timePickerContainer: {
    marginBottom: 32,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: (width - 60) / 3 - 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  selectedTimeSlot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    color: colors.secondary,
  },
  selectedTimeSlotText: {
    color: colors.background,
    fontWeight: '600',
  },
  selectedDateTime: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  selectedDateTimeTitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  selectedDateTimeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
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

export default DateTimePickerScreen;
