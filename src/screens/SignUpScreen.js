import React, { useState } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../utils/colors';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: '',
    seatingCapacity: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.addressLine1) newErrors.addressLine1 = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.pinCode) newErrors.pinCode = 'PIN Code is required';
    if (!formData.seatingCapacity)
      newErrors.seatingCapacity = 'Seating capacity is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    }, 1500);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

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
            <View style={styles.logoIcon}>
              <View style={styles.logoPattern}>
                <View
                  style={[
                    styles.logoDiamond,
                    { transform: [{ rotate: '45deg' }] },
                  ]}
                />
                <View
                  style={[
                    styles.logoDiamond,
                    {
                      transform: [{ rotate: '45deg' }],
                      position: 'absolute',
                      top: 8,
                      left: 8,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.logoText}>ENCALM</Text>
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
                ]}
              >
                <Text
                  style={formData.city ? styles.inputText : styles.placeholder}
                >
                  {formData.city || 'Select the city'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.gray} />
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
                  style={[styles.pinInput, errors.pinCode && styles.inputError]}
                  maxLength={1}
                  keyboardType="numeric"
                  textAlign="center"
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
              <TouchableOpacity style={styles.capacityButton}>
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
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoPattern: {
    position: 'relative',
  },
  logoDiamond: {
    width: 20,
    height: 20,
    backgroundColor: colors.background,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: 2,
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
});

export default SignUpScreen;
