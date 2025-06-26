import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';

const EditBookingScreen = ({ navigation }) => {
  const [bookingData, setBookingData] = useState({
    name: 'Jhon Doni',
    dateTime1: '04 June 2025 | 09:00 AM',
    dateTime2: '22 June 2025 | 11:00 AM',
    paymentStatus: 'Full Paid',
    numberOfPeople: '16',
    amountReceived: '760,000',
    amountPending: '740,000',
  });

  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { icon: 'home', label: 'Home' },
    { icon: 'calendar', label: 'Calendar' },
    { icon: 'notifications', label: 'Notifications' },
    { icon: 'settings', label: 'Settings' },
  ];

  const handleSaveChanges = () => {
    Alert.alert('Success', 'Booking updated successfully!');
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
        <Text style={styles.headerTitle}>Edit Booking</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.editContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={bookingData.name}
            onChangeText={value =>
              setBookingData(prev => ({ ...prev, name: value }))
            }
          />
        </View>

        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitleText}>Date & Time</Text>
        </View>

        <TouchableOpacity
          style={styles.dateTimeCard}
          onPress={() => navigation.navigate('DateTimePicker')}
        >
          <View style={styles.dateTimeIcon}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <Text style={styles.dateTimeText}>{bookingData.dateTime1}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateTimeCard}
          onPress={() => navigation.navigate('DateTimePicker')}
        >
          <View style={styles.dateTimeIcon}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <Text style={styles.dateTimeText}>{bookingData.dateTime2}</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Payment Status</Text>
          <TouchableOpacity style={[styles.input, styles.dropdown]}>
            <Text style={styles.inputText}>{bookingData.paymentStatus}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Number of People</Text>
          <TextInput
            style={styles.input}
            value={bookingData.numberOfPeople}
            onChangeText={value =>
              setBookingData(prev => ({ ...prev, numberOfPeople: value }))
            }
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount Received</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={bookingData.amountReceived}
              onChangeText={value =>
                setBookingData(prev => ({ ...prev, amountReceived: value }))
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount Pending</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={bookingData.amountPending}
              onChangeText={value =>
                setBookingData(prev => ({ ...prev, amountPending: value }))
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveChanges}
        >
          <Text style={styles.primaryButtonText}>Save Changes</Text>
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.secondary,
  },
  inputText: {
    fontSize: 16,
    color: colors.secondary,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    marginVertical: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 16,
  },
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dateTimeIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '500',
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
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 16,
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

export default EditBookingScreen;
