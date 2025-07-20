import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';
import { authAPI } from '../services/api';
import {
  INDIAN_STATES,
  INDIAN_CITIES,
  getCitiesByState,
} from '../constants/data';
import {
  validateForm,
  validationRules,
  formatValidation,
} from '../utils/validation';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: ['', '', '', '', '', ''],
    seatingCapacity: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCityModal, setShowCityModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);

  // Refs for PIN code inputs
  const pinRefs = useRef([]);
  const validateFormData = () => {
    const formRules = {
      email: validationRules.email,
      name: validationRules.name,
      addressLine1: {
        required: true,
        minLength: 5,
        message: 'Please enter a complete address',
      },
      city: { required: true, message: 'City is required' },
      state: { required: true, message: 'State is required' },
      seatingCapacity: validationRules.seatingCapacity,
      password: validationRules.password,
    };

    const { isValid, errors: formErrors } = validateForm(formData, formRules);

    // Custom validation for PIN code
    const pinCode = formData.pinCode.join('');
    if (pinCode.length !== 6 || !/^\d{6}$/.test(pinCode)) {
      formErrors.pinCode = 'PIN Code must be exactly 6 digits';
    }

    // Custom validation for confirm password
    if (!formData.confirmPassword) {
      formErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      formErrors.confirmPassword = 'Passwords do not match';
    }

    // Custom validation for seating capacity
    const capacity = parseInt(formData.seatingCapacity);
    if (!capacity || capacity < 1 || capacity > 10000) {
      formErrors.seatingCapacity =
        'Seating capacity must be between 1 and 10,000';
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateFormData()) return;

    setIsLoading(true);

    try {
      // Prepare data for API (matching your backend expected format)
      const userData = {
        email: formatValidation.formatEmail(formData.email),
        name: formData.name.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode.join(''),
        seatingCapacity: formData.seatingCapacity,
        password: formData.password,
      };

      console.log('Sending signup data:', userData); // Debug log

      // Call registration API
      const result = await authAPI.signup(userData);

      if (result.success) {
        Alert.alert(
          'Registration Successful!',
          'Your account has been created successfully. Please check your email to verify your account before logging in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ],
        );
      } else {
        // Handle specific error cases
        let errorMessage =
          result.error || 'Registration failed. Please try again.';

        if (result.errors && result.errors.length > 0) {
          errorMessage = result.errors.join('\n');
        }

        if (result.status === 409) {
          errorMessage =
            'An account with this email already exists. Please use a different email or try logging in.';
        } else if (result.status === 400) {
          errorMessage = 'Please check your information and try again.';
        }

        Alert.alert('Registration Failed', errorMessage);
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert(
        'Registration Failed',
        'Something went wrong. Please check your internet connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle PIN code input
  const handlePinChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPinCode = [...formData.pinCode];
      newPinCode[index] = value;
      setFormData(prev => ({ ...prev, pinCode: newPinCode }));

      // Auto-focus next input
      if (value && index < 5) {
        pinRefs.current[index + 1]?.focus();
      }

      // Clear PIN code error when user starts typing
      if (errors.pinCode) {
        setErrors(prev => ({ ...prev, pinCode: null }));
      }
    }
  };

  // Handle PIN code backspace
  const handlePinKeyPress = (index, key) => {
    if (key === 'Backspace' && !formData.pinCode[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  // Handle dropdown selections
  const selectCity = city => {
    setFormData(prev => ({ ...prev, city }));
    setShowCityModal(false);
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: null }));
    }
  };

  const selectState = state => {
    setFormData(prev => ({
      ...prev,
      state,
      city: '', // Reset city when state changes
    }));

    // Update available cities based on selected state
    const stateCities = getCitiesByState(state);
    setAvailableCities(stateCities.length > 0 ? stateCities : INDIAN_CITIES);

    setShowStateModal(false);
    if (errors.state) {
      setErrors(prev => ({ ...prev, state: null }));
    }
    // Clear city error as well since we reset the city
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: null }));
    }
  };

  // Render dropdown modal
  const renderDropdownModal = (visible, onClose, data, onSelect, title) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          {data && data.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => onSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                {title === 'Select City'
                  ? 'Please select a state first to see available cities'
                  : 'No data available'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')} // Update this path to your logo image
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeTitle}>Sign Up</Text>
          <Text style={styles.welcomeSubtitle}>
            Join us and start to efficiently manage your bookings.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={value => updateFormData('email', value)}
              placeholder="Please enter a valid email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={value => updateFormData('name', value)}
              placeholder="e.g., The Royal Orchid Banquets"
              autoCorrect={false}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address Line 1</Text>
            <TextInput
              style={[styles.input, errors.addressLine1 && styles.inputError]}
              value={formData.addressLine1}
              onChangeText={value => updateFormData('addressLine1', value)}
              placeholder="Building name, street, or locality"
            />
            {errors.addressLine1 && (
              <Text style={styles.errorText}>{errors.addressLine1}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address Line 2 (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.addressLine2}
              onChangeText={value => updateFormData('addressLine2', value)}
              placeholder="Landmark or additional address details"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>City</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dropdown,
                  errors.city && styles.inputError,
                  !formData.state && styles.disabledDropdown,
                ]}
                onPress={() => {
                  if (!formData.state) {
                    Alert.alert(
                      'Select State First',
                      'Please select a state before choosing a city.',
                    );
                    return;
                  }
                  setShowCityModal(true);
                }}
                disabled={!formData.state}
              >
                <Text
                  style={[
                    formData.city ? styles.inputText : styles.placeholder,
                    !formData.state && styles.disabledText,
                  ]}
                >
                  {formData.city ||
                    (formData.state ? 'Select the city' : 'Select state first')}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={!formData.state ? colors.lightGray : colors.gray}
                />
              </TouchableOpacity>
              {errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.inputLabel}>State</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dropdown,
                  errors.state && styles.inputError,
                ]}
                onPress={() => setShowStateModal(true)}
              >
                <Text
                  style={formData.state ? styles.inputText : styles.placeholder}
                >
                  {formData.state || 'Select the state'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.gray} />
              </TouchableOpacity>
              {errors.state && (
                <Text style={styles.errorText}>{errors.state}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PIN Code</Text>
            <View style={styles.pinContainer}>
              {[0, 1, 2, 3, 4, 5].map(index => (
                <TextInput
                  key={index}
                  ref={ref => (pinRefs.current[index] = ref)}
                  style={[styles.pinInput, errors.pinCode && styles.inputError]}
                  value={formData.pinCode[index]}
                  onChangeText={value => handlePinChange(index, value)}
                  onKeyPress={({ nativeEvent }) =>
                    handlePinKeyPress(index, nativeEvent.key)
                  }
                  maxLength={1}
                  keyboardType="numeric"
                  textAlign="center"
                  returnKeyType={index === 5 ? 'done' : 'next'}
                />
              ))}
            </View>
            {errors.pinCode && (
              <Text style={styles.errorText}>{errors.pinCode}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Seating Capacity</Text>
            <View style={styles.capacityContainer}>
              <TextInput
                style={[
                  styles.capacityInput,
                  errors.seatingCapacity && styles.inputError,
                ]}
                value={formData.seatingCapacity}
                onChangeText={value => updateFormData('seatingCapacity', value)}
                placeholder="e.g., 250 guests"
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.capacityButton}
                onPress={() => {
                  const currentValue = parseInt(formData.seatingCapacity) || 0;
                  updateFormData(
                    'seatingCapacity',
                    (currentValue + 50).toString(),
                  );
                }}
              >
                <Ionicons name="add" size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>
            {errors.seatingCapacity && (
              <Text style={styles.errorText}>{errors.seatingCapacity}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  errors.password && styles.inputError,
                ]}
                value={formData.password}
                onChangeText={value => updateFormData('password', value)}
                placeholder="Create a password (min. 8 characters)"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
            <Text style={styles.passwordHint}>
              Password must be at least 8 characters and contain at least one
              uppercase letter, one lowercase letter, and one number.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  errors.confirmPassword && styles.inputError,
                ]}
                value={formData.confirmPassword}
                onChangeText={value => updateFormData('confirmPassword', value)}
                placeholder="Re-enter your password for confirmation"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
            <Text style={styles.passwordHint}>
              Please enter your password for confirmation.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Already Registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signupLink}>Log in here</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={16} color={colors.success} />
            <Text style={styles.securityText}>
              Your credentials are securely encrypted
            </Text>
          </View>

          {/* Modals for dropdowns */}
          {renderDropdownModal(
            showCityModal,
            () => setShowCityModal(false),
            availableCities,
            selectCity,
            'Select City',
          )}

          {renderDropdownModal(
            showStateModal,
            () => setShowStateModal(false),
            INDIAN_STATES,
            selectState,
            'Select State',
          )}
        </View>
      </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoImage: {
    width: 120,
    height: 80,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
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
  inputError: {
    borderColor: colors.error,
  },
  inputText: {
    fontSize: 16,
    color: colors.secondary,
  },
  placeholder: {
    fontSize: 16,
    color: colors.gray,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledDropdown: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  disabledText: {
    color: colors.gray,
    opacity: 0.7,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.secondary,
  },
  eyeButton: {
    padding: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signupText: {
    fontSize: 14,
    color: colors.gray,
  },
  signupLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 12,
    color: colors.gray,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pinInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.secondary,
    marginRight: 12,
  },
  capacityButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  passwordHint: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.secondary,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SignUpScreen;
